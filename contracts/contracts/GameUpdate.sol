// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/security/Pausable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/structs/EnumerableSet.sol";
import "./CustomEnumerableMap.sol";
import "./Resource.sol";

contract Game2 is Ownable, ERC1155Holder, Pausable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using CustomEnumerableMap for CustomEnumerableMap.AddressToUintMap;

    struct GamePlayer {
        address addr;
        uint256[3] placedCards;
        uint256 boostValue;
        uint256 boostUsedRound;
    }

    struct GameInfo {
        uint256 gameId;
        GamePlayer[2] player;
        bool started;
        bool finished;
        uint8 turn;
        address winner;
        uint8 round;
        uint256 lastAction;
        uint256 bank;
    }

    struct LeaderboardItem {
        address player;
        uint256 wins;
    }

    Counters.Counter internal _gameIds;
    mapping (uint256 => GameInfo) _games;
    uint256 public boostPrice = 1 ether;
    uint256 public abortTimeout = 5 * 60;  // seconds
    uint256 public joinPrice;
    uint256 public minWeight;
    uint256 public maxWeight;
    uint256 public epoch = 30 * 60;
    uint256 public fee = 50000;  // 1e6
    CustomEnumerableMap.AddressToUintMap _playerWins;
    mapping (address => EnumerableSet.UintSet) internal _playerGames;
    mapping (address => uint256) public lastGameTimestamps;
    mapping (address => uint256) public currentGames;

    Resource internal immutable _resource;
    IERC20 internal immutable _phi;

    event PlayerEntered(uint256 indexed gameId, address indexed player);
    event PlayerLeft(uint256 indexed gameId, address indexed player);
    event GameStarted(uint256 indexed gameId);
    event PlayerPlacedCard(uint256 indexed gameId, address indexed player, uint256 tokenId);
    event GameFinished(uint256 indexed gameId, address indexed winner);
    event GameAborted(uint256 indexed gameId, address indexed winner);
    event BoostUsed(uint256 indexed gameId, address indexed player, uint256 round, uint256 value);

    event JoinPriceUpdated(uint256 newValue);
    event MinWeightUpdated(uint256 newValue);
    event MaxWeightUpdated(uint256 newValue);
    event AbortTimeoutUpdated(uint256 newValue);
    event BoostPriceUpdated(uint256 newValue);
    event EpochUpdated(uint256 newValue);

    constructor(Resource resource, IERC20 phi, uint256 joinPrice_, uint256 minWeight_, uint256 maxWeight_) {
        _resource = resource;
        _phi = phi;
        joinPrice = joinPrice_;
        minWeight = minWeight_;
        maxWeight = maxWeight_;
        _createGame();

        emit JoinPriceUpdated(joinPrice_);
        emit MinWeightUpdated(minWeight_);
        emit MaxWeightUpdated(maxWeight_);
        emit AbortTimeoutUpdated(abortTimeout);
        emit BoostPriceUpdated(boostPrice);
        emit EpochUpdated(epoch);
    }

    function _createGame() private {
        _gameIds.increment();
        uint256 gameId = _gameIds.current();
        GameInfo storage game_ = _games[gameId];
        game_.gameId = gameId;
        game_.player[0].boostUsedRound = 0xFF;
        game_.player[1].boostUsedRound = 0xFF;
    }

    function game(uint256 gameId) external view returns (GameInfo memory) {
        return _games[gameId];
    }

    function playerWins(address player) external view returns (uint256) {
        return _playerWins.get(player);
    }

    function playerGames(address player) external view returns (uint256[] memory) {
        return _playerGames[player].values();
    }

    function joinGame() external whenNotPaused {
        require(currentGames[msg.sender] == 0, "you are playing already");
        require(block.timestamp - lastGameTimestamps[msg.sender] >= epoch, "wait for join timeout");
        uint256 gameId = _gameIds.current();
        GameInfo storage game_ = _games[gameId];

        // check if total owned cards weight is in range
        uint256 accumulatedWeight = 0;
        uint256 cardsCount = 0;
        uint256[] memory ownedTokens = _resource.ownedTokens(msg.sender);
        for (uint256 i=0; i < ownedTokens.length; i++) {
            // skip element cards
            if (ownedTokens[i] > 4) {
                uint256 balance = _resource.balanceOf(msg.sender, ownedTokens[i]);
                accumulatedWeight += _resource.getResourceWeight(ownedTokens[i]) * balance;
                cardsCount += balance;
                require(accumulatedWeight <= maxWeight, "you have too much cards weight");
            }
        }
        require(accumulatedWeight >= minWeight, "you don't have enough cards weight");
        require(cardsCount >= 3, "you don't have 3 cards");

        if (joinPrice > 0) {
            _phi.safeTransferFrom(msg.sender, address(this), joinPrice);
            game_.bank += joinPrice;
        }

        if (game_.player[0].addr == address(0)) {
            game_.player[0].addr = msg.sender;
        } else {
            game_.player[1].addr = msg.sender;

            game_.started = true;
            emit GameStarted(gameId);
            _createGame();
        }
        emit PlayerEntered(gameId, msg.sender);

        _playerGames[msg.sender].add(gameId);
        game_.lastAction = block.timestamp;
        currentGames[msg.sender] = gameId;
        lastGameTimestamps[msg.sender] = block.timestamp;
    }

    function leaveGame() external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not in a game");
        GameInfo storage game_ = _games[gameId];
        require(!game_.started, "game is started already");
        game_.player[0].addr = address(0);
        _phi.safeTransfer(msg.sender, game_.bank);
        game_.bank = 0;
        _playerGames[msg.sender].remove(gameId);
        currentGames[msg.sender] = 0;
        emit PlayerLeft(gameId, msg.sender);
    }

    function placeCard(uint256 tokenId) external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not playing a game");
        GameInfo storage game_ = _games[gameId];
        require(game_.started, "game has not started");
        bool turn0 = game_.turn == 0;
        require(turn0 && game_.player[0].addr == msg.sender || !turn0 && game_.player[1].addr == msg.sender, "not your turn");
        _resource.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");
        game_.player[game_.turn].placedCards[game_.round] = tokenId;
        if (game_.round == 1 && turn0 || game_.round != 1 && !turn0)
            game_.round++;
        else
            game_.turn = turn0 ? 1 : 0;
        emit PlayerPlacedCard(gameId, msg.sender, tokenId);
        game_.lastAction = block.timestamp;
        if (game_.round == 3)
            _finishGame(game_);
    }

    function _finishGame(GameInfo storage game_) private {
        game_.finished = true;
        uint256[2] memory weights;
        uint256 multiplier = 1;
        int8 balance = 0;
        for (uint8 r=0; r < 3; r++) {
            for (uint8 p=0; p < 2; p++) {
                multiplier = game_.player[p].boostUsedRound == r ? game_.player[p].boostValue : 1;
                weights[p] = _resource.getResourceWeight(game_.player[p].placedCards[r]) * multiplier;
                _resource.safeTransferFrom(address(this), game_.player[p].addr, game_.player[p].placedCards[r], 1, "");
            }
            if (weights[0] > weights[1])
                balance++;
            else if (weights[1] > weights[0])
                balance--;
        }
        if (balance > 0)
            game_.winner = game_.player[0].addr;
        else if (balance < 0)
            game_.winner = game_.player[1].addr;
        if (balance != 0) {
            uint256 prevWins = 0;
            if (_playerWins.contains(game_.winner))
                prevWins = _playerWins.get(game_.winner);
            _playerWins.set(game_.winner, prevWins + 1);
            if (game_.bank > 0)
                _phi.safeTransfer(game_.winner, game_.bank * (1e6 - fee) / 1e6);
        } else {
            if (game_.bank > 0) {
                _phi.safeTransfer(game_.player[0].addr, game_.bank / 2);
                _phi.safeTransfer(game_.player[1].addr, game_.bank / 2);
            }
        }

        currentGames[game_.player[0].addr] = 0;
        currentGames[game_.player[1].addr] = 0;

        emit GameFinished(game_.gameId, game_.winner);
    }

    function boost() external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not playing a game");
        GameInfo storage game_ = _games[gameId];
        require(game_.started, "game is not running");
        bool turn0 = game_.turn == 0;
        require(turn0 && game_.player[0].addr == msg.sender || !turn0 && game_.player[1].addr == msg.sender, "not your turn");
        require(turn0 && game_.player[0].boostUsedRound == 0xFF || !turn0 && game_.player[1].boostUsedRound == 0xFF, "boost already used");
        require(_phi.balanceOf(msg.sender) >= boostPrice, "insufficient funds");

        _phi.safeTransferFrom(msg.sender, address(this), boostPrice);
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1)))) % 6 + 1;
        game_.player[game_.turn].boostValue = rand;
        game_.player[game_.turn].boostUsedRound = game_.round;
        emit BoostUsed(game_.gameId, msg.sender, game_.round, rand);
    }

    function abort() external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not playing a game");
        GameInfo storage game_ = _games[gameId];
        require(game_.started, "game is not running");
        require(block.timestamp - game_.lastAction >= abortTimeout, "timeout has not passed");
        bool turn0 = game_.turn == 0;
        require(turn0 && game_.player[1].addr == msg.sender || !turn0 && game_.player[0].addr == msg.sender, "now is your turn");
        _abort(game_, msg.sender);
    }

    function ownerAbort(uint256 gameId) external onlyOwner {
        GameInfo storage game_ = _games[gameId];
        require(game_.started && !game_.finished, "game is not running");
        _abort(game_, address(0));
    }

    function _abort(GameInfo storage game_, address winner) private {
        game_.finished = true;
        game_.winner = winner;
        if (winner == address(0)) {
            if (game_.bank > 0) {
                _phi.safeTransfer(game_.player[0].addr, game_.bank / 2);
                _phi.safeTransfer(game_.player[1].addr, game_.bank / 2);
            }
        } else {
            if (game_.bank > 0)
                _phi.safeTransfer(winner, game_.bank * (1e6 - fee) / 1e6);
            uint256 prevWins = 0;
            if (_playerWins.contains(winner))
                prevWins = _playerWins.get(winner);
            _playerWins.set(winner, prevWins + 1);
        }

        for (uint8 r=0; r < 3; r++) {
            for (uint8 p=0; p < 2; p++) {
                uint256 tokenId = game_.player[p].placedCards[r];
                if (tokenId != 0) {
                    _resource.safeTransferFrom(address(this), game_.player[p].addr, tokenId, 1, "");
                }
            }
        }

        currentGames[game_.player[0].addr] = 0;
        currentGames[game_.player[1].addr] = 0;

        emit GameAborted(game_.gameId, winner);
    }

    function updateJoinPrice(uint256 newValue) external onlyOwner {
        require(newValue != joinPrice, "no change");
        joinPrice = newValue;
        emit JoinPriceUpdated(newValue);
    }

    function updateMinWeight(uint256 newValue) external onlyOwner {
        require(newValue != minWeight, "no change");
        minWeight = newValue;
        emit MinWeightUpdated(newValue);
    }

    function updateMaxWeight(uint256 newValue) external onlyOwner {
        require(newValue != maxWeight, "no change");
        maxWeight = newValue;
        emit MaxWeightUpdated(newValue);
    }

    function updateAbortTimeout(uint256 newValue) external onlyOwner {
        require(newValue != abortTimeout, "no change");
        abortTimeout = newValue;
        emit AbortTimeoutUpdated(newValue);
    }

    function updateBoostPrice(uint256 newValue) external onlyOwner {
        require(newValue != boostPrice, "no change");
        boostPrice = newValue;
        emit BoostPriceUpdated(newValue);
    }

    function updateEpoch(uint256 newValue) external onlyOwner {
        require(newValue != epoch, "no change");
        epoch = newValue;
        emit EpochUpdated(newValue);
    }

    function withdrawFee(address to) external onlyOwner {
        uint256 balance = _phi.balanceOf(address(this));
        require(balance > 0, "nothing to withdraw");
        _phi.safeTransfer(to, balance);
    }

    function togglePause() external onlyOwner {
        if (paused())
            _unpause();
        else
            _pause();
    }

    function leaderboard() external view returns (LeaderboardItem[] memory) {
        LeaderboardItem[] memory result = new LeaderboardItem[](_playerWins.length());
        for (uint256 i=0; i < _playerWins.length(); i++) {
            (address player, uint256 wins) = _playerWins.at(i);
            result[i] = LeaderboardItem(player, wins);
        }
        return result;
    }

    function leaderboardPaginated(uint256 offset, uint256 count) external view returns (LeaderboardItem[] memory) {
        uint256 totalLength = _playerWins.length();
        uint256 length = count;
        if (offset + length > totalLength)
            length = totalLength - offset;
        LeaderboardItem[] memory result = new LeaderboardItem[](length);
        for (uint256 i=0; i < length; i++) {
            (address player, uint256 wins) = _playerWins.at(offset + i);
            result[i] = LeaderboardItem(player, wins);
        }
        return result;
    }

    function emergencyWithdraw(uint256[] memory tokenId, uint256[] memory amount) external onlyOwner {
        _resource.safeBatchTransferFrom(address(this), msg.sender, tokenId, amount, "");
    }
}
