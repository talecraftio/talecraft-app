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
import "./GameLending.sol";

contract Game2 is Ownable, ERC1155Holder, Pausable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using CustomEnumerableMap for CustomEnumerableMap.AddressToUintMap;

    enum PowerType {
        Water,  // next opponent's turn is 25% weaker
        Fire,   // random multiplier boost
        Air,    // see opponent's cards
        Earth   // +5 weight boost
    }

    struct PowerInfo {
        bool used;
        PowerType powerType;
        uint256 value;
    }

    struct GamePlayer {
        address addr;
        uint256[3] placedCards;
        uint256[3] borrowedCards;
        PowerInfo[3] usedPowers;
        bool[3] lent;
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
    uint256[4] public powerPrices;
    uint256 public abortTimeout = 5 * 60;  // seconds
    uint256 public joinPrice;
    uint256 public minWeight;
    uint256 public maxWeight;
    uint256 public epoch = 30 * 60;
    uint256 public fee = 50000;  // 1e6
    uint256 public inGameCount;
    CustomEnumerableMap.AddressToUintMap _playerPlayed;
    CustomEnumerableMap.AddressToUintMap _playerWins;
    mapping (address => EnumerableSet.UintSet) internal _playerGames;
    mapping (uint256 => mapping (address => mapping (uint256 => bool))) internal _playerOwnedTokens;
    mapping (address => uint256) public lastGameTimestamps;
    mapping (address => uint256) public currentGames;

    Resource internal immutable _resource;
    IERC20 internal immutable _phi;
    GameLending internal _gameLending;

    event PlayerEntered(uint256 indexed gameId, address indexed player);
    event PlayerLeft(uint256 indexed gameId, address indexed player);
    event GameStarted(uint256 indexed gameId);
    event PlayerPlacedCard(uint256 indexed gameId, address indexed player, uint256 tokenId);
    event GameFinished(uint256 indexed gameId, address indexed winner);
    event GameAborted(uint256 indexed gameId, address indexed winner);
    event PowerUsed(uint256 indexed gameId, address indexed player, uint256 round, PowerType powerType, uint256 value);

    event JoinPriceUpdated(uint256 newValue);
    event MinWeightUpdated(uint256 newValue);
    event MaxWeightUpdated(uint256 newValue);
    event AbortTimeoutUpdated(uint256 newValue);
    event PowerPricesUpdated(uint256 waterPrice, uint256 firePrice, uint256 airPrice, uint256 earthPrice);
    event EpochUpdated(uint256 newValue);

    constructor(Resource resource, IERC20 phi, GameLending gameLending, uint256 joinPrice_, uint256 minWeight_, uint256 maxWeight_) {
        _resource = resource;
        _phi = phi;
        _gameLending = gameLending;
        joinPrice = joinPrice_;
        minWeight = minWeight_;
        maxWeight = maxWeight_;
        powerPrices[0] = powerPrices[1] = powerPrices[2] = powerPrices[3] = 1 ether;
        _createGame();

        emit JoinPriceUpdated(joinPrice_);
        emit MinWeightUpdated(minWeight_);
        emit MaxWeightUpdated(maxWeight_);
        emit AbortTimeoutUpdated(abortTimeout);
        emit PowerPricesUpdated(powerPrices[0], powerPrices[1], powerPrices[2], powerPrices[3]);
        emit EpochUpdated(epoch);
    }

    function _createGame() private {
        _gameIds.increment();
        uint256 gameId = _gameIds.current();
        GameInfo storage game_ = _games[gameId];
        game_.gameId = gameId;
    }

    function game(uint256 gameId) external view returns (GameInfo memory) {
        return _games[gameId];
    }

    function playerWins(address player) external view returns (uint256) {
        return _playerWins.get(player);
    }

    function playerPlayed(address player) external view returns (uint256) {
        return _playerPlayed.get(player);
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
        uint256[] memory borrowedTokens = _gameLending.getBorrowedTokenIds(msg.sender);
        for (uint256 i=0; i < ownedTokens.length; i++) {
            // skip element cards
            if (ownedTokens[i] > 4) {
                uint256 balance = _resource.balanceOf(msg.sender, ownedTokens[i]);
                accumulatedWeight += _resource.getResourceWeight(ownedTokens[i]) * balance;
                cardsCount += balance;
                require(accumulatedWeight <= maxWeight, "you have too much cards weight");
            }
        }
        for (uint256 i=0; i < borrowedTokens.length; i++) {
            // skip element cards
            if (borrowedTokens[i] > 4) {
                accumulatedWeight += _resource.getResourceWeight(borrowedTokens[i]);
                cardsCount += 1;
                require(accumulatedWeight <= maxWeight, "you have too much cards weight");
            }
        }
        require(accumulatedWeight >= minWeight, "you don't have enough cards weight");
        require(cardsCount >= 3, "you don't have 3 cards");

        if (joinPrice > 0) {
            _phi.safeTransferFrom(msg.sender, address(this), joinPrice);
            game_.bank += joinPrice;
        }

        for (uint256 i=0; i < ownedTokens.length; i++)
            _playerOwnedTokens[gameId][msg.sender][ownedTokens[i]] = true;
        for (uint256 i=0; i < borrowedTokens.length; i++)
            if (borrowedTokens[i] != 0)
                _playerOwnedTokens[gameId][msg.sender][borrowedTokens[i]] = true;

        if (game_.player[0].addr == address(0)) {
            game_.player[0].addr = msg.sender;
        } else {
            game_.player[1].addr = msg.sender;
            game_.started = true;
            emit GameStarted(gameId);
            inGameCount += 2;
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
        require(_playerOwnedTokens[gameId][msg.sender][tokenId], "you cannot use this token");
        _resource.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");
        game_.player[game_.turn].placedCards[game_.round] = tokenId;
        _afterPlace(game_, tokenId);
    }

    function placeBorrowedCard(uint256 listingId) external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not playing a game");
        GameInfo storage game_ = _games[gameId];
        require(game_.started, "game has not started");
        bool turn0 = game_.turn == 0;
        require(turn0 && game_.player[0].addr == msg.sender || !turn0 && game_.player[1].addr == msg.sender, "not your turn");
        uint256 playerIdx = game_.player[0].addr == msg.sender ? 0 : 1;
        for (uint256 i=0; i < game_.round; i++)
            require(game_.player[playerIdx].borrowedCards[i] != listingId, "this listing is already used");
        require(_gameLending.isListingAvailable(msg.sender, listingId), "you do not have this listing borrowed");
        uint256 tokenId = _gameLending.getListingTokenId(listingId);
        game_.player[playerIdx].placedCards[game_.round] = tokenId;
        game_.player[playerIdx].borrowedCards[game_.round] = listingId;
        _afterPlace(game_, tokenId);
    }

    function _afterPlace(GameInfo storage game_, uint256 tokenId) private {
        bool turn0 = game_.turn == 0;
        if (game_.round == 1 && turn0 || game_.round != 1 && !turn0)
            game_.round++;
        else
            game_.turn = turn0 ? 1 : 0;
        emit PlayerPlacedCard(game_.gameId, msg.sender, tokenId);
        game_.lastAction = block.timestamp;
        if (game_.round == 3 || game_.round == 2 && _roundWinner(game_, 0) == _roundWinner(game_, 1))
            _finishGame(game_);
    }

    function _roundWinner(GameInfo storage game_, uint256 round) private view returns (int8) {
        uint256 multiplier = 100;
        uint256[2] memory weights;
        for (uint8 p=0; p < 2; p++) {
            PowerInfo memory playerPower = game_.player[p].usedPowers[round];
            PowerInfo memory opponentPower = game_.player[1 - p].usedPowers[round];
            multiplier = 100;
            if (playerPower.used && playerPower.powerType == PowerType.Fire)
                multiplier = game_.player[p].usedPowers[round].value * 100;
            if (opponentPower.used && opponentPower.powerType == PowerType.Water)
                multiplier = multiplier * 75 / 100;
            weights[p] = _resource.getResourceWeight(game_.player[p].placedCards[round]) * multiplier;
            if (playerPower.used && playerPower.powerType == PowerType.Earth)
                weights[p] += 500;
        }
        if (weights[0] > weights[1])
            return 1;
        else if (weights[1] > weights[0])
            return -1;
        else
            return 0;
    }

    function getRoundWinner(uint256 gameId, uint256 round) external view returns (int256) {
        GameInfo storage game_ = _games[gameId];
        return _roundWinner(game_, round);
    }

    function _finishGame(GameInfo storage game_) private {
        game_.finished = true;
        uint256[2] memory weights;
        uint256 multiplier = 1;
        int8 balance = 0;
        for (uint8 r=0; r < game_.round; r++) {
            balance += _roundWinner(game_, r);
            if (game_.player[0].borrowedCards[r] == 0)
                _resource.safeTransferFrom(address(this), game_.player[0].addr, game_.player[0].placedCards[r], 1, "");
            if (game_.player[1].borrowedCards[r] == 0)
                _resource.safeTransferFrom(address(this), game_.player[1].addr, game_.player[1].placedCards[r], 1, "");
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

        uint256 prevPlayed = 0;
        if (_playerPlayed.contains(game_.player[0].addr))
            prevPlayed = _playerPlayed.get(game_.player[0].addr);
        _playerPlayed.set(game_.player[0].addr, prevPlayed + 1);
        prevPlayed = 0;
        if (_playerPlayed.contains(game_.player[1].addr))
            prevPlayed = _playerPlayed.get(game_.player[1].addr);
        _playerPlayed.set(game_.player[1].addr, prevPlayed + 1);

        currentGames[game_.player[0].addr] = 0;
        currentGames[game_.player[1].addr] = 0;

        emit GameFinished(game_.gameId, game_.winner);

        inGameCount -= 2;
    }

    function usePower(PowerType powerType) external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not playing a game");
        GameInfo storage game_ = _games[gameId];
        require(game_.started, "game is not running");
        bool turn0 = game_.turn == 0;
        uint256 round = game_.round;
        require(turn0 && game_.player[0].addr == msg.sender || !turn0 && game_.player[1].addr == msg.sender, "not your turn");
        require(turn0 && !game_.player[0].usedPowers[round].used || !turn0 && !game_.player[1].usedPowers[round].used, "power already used in this round");
        uint256 playerIdx = game_.player[0].addr == msg.sender ? 0 : 1;
        for (uint256 i=0; i < game_.round; i++) {
            require(!game_.player[playerIdx].usedPowers[i].used || game_.player[playerIdx].usedPowers[i].powerType != powerType, "this power is already used in the game");
        }
        require(_phi.balanceOf(msg.sender) >= powerPrices[uint256(powerType)], "insufficient funds");

        _phi.safeTransferFrom(msg.sender, address(this), powerPrices[uint256(powerType)]);
        game_.player[game_.turn].usedPowers[round].used = true;
        game_.player[game_.turn].usedPowers[round].powerType = powerType;
        if (powerType == PowerType.Fire) {
            uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), powerType))) % 6 + 1;
            game_.player[game_.turn].usedPowers[round].value = rand;
        }
        emit PowerUsed(game_.gameId, msg.sender, game_.round, powerType, game_.player[game_.turn].usedPowers[round].value);
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
                    if (game_.player[p].borrowedCards[r] == 0)
                        _resource.safeTransferFrom(address(this), game_.player[p].addr, tokenId, 1, "");
                }
            }
        }

        currentGames[game_.player[0].addr] = 0;
        currentGames[game_.player[1].addr] = 0;

        emit GameAborted(game_.gameId, winner);

        inGameCount -= 2;
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

    function updatePowerPrices(uint256 waterPrice, uint256 firePrice, uint256 airPrice, uint256 earthPrice) external onlyOwner {
        require(powerPrices[0] != waterPrice || powerPrices[1] != firePrice || powerPrices[2] != airPrice || powerPrices[3] != earthPrice, "no change");
        powerPrices[0] = waterPrice;
        powerPrices[1] = firePrice;
        powerPrices[2] = airPrice;
        powerPrices[3] = earthPrice;
        emit PowerPricesUpdated(waterPrice, firePrice, airPrice, earthPrice);
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

    function waitingCount() external view returns (uint256) {
        if (_games[_gameIds.current()].player[0].addr != address(0))
            return 1;
        return 0;
    }

    function updateGameLending(GameLending newAddress) external onlyOwner {
        _gameLending = newAddress;
    }

    function emergencyWithdraw(uint256[] memory tokenId, uint256[] memory amount) external onlyOwner {
        _resource.safeBatchTransferFrom(address(this), msg.sender, tokenId, amount, "");
    }
}
