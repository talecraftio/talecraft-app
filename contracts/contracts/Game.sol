// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/structs/EnumerableSet.sol";
import "./Resource.sol";

contract Game is ERC20, Ownable, ERC1155Holder {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct GamePlayer {
        address addr;
        uint256[3] placedCards;
        uint256 boostValue;
        uint256 boostUsedRound;
    }

    struct GameInfo {
        uint256 gameId;
        GamePlayer player1;
        GamePlayer player2;
        bool started;
        bool finished;
        uint8 turn;
        address winner;
        uint8 round;
        uint256 lastAction;
    }

    struct UserStats {
        uint256 weekStart;
        uint256 gamesPlayed;
    }

    Counters.Counter internal _gameIds;
    mapping (uint256 => GameInfo) _games;
    mapping (uint256 => uint256) internal _pools;
    uint256 public avaxPerToken = .5 ether;
    uint256 public boostPrice = 1 ether;
    uint256 public abortTimeout = 5 * 60;  // seconds
    uint256 public minWeight = 5;
    uint256 public minCardsCount = 3;
    uint256 public maxSlotId = 49;
    mapping (address => bool) _isPlaying;
    EnumerableSet.AddressSet _whitelisted;
    uint256 public gamesPerWeek = 1;
    uint256 public weekStart;
    uint256 public epoch = 7 * 24 * 60 * 60;
    mapping (address => UserStats) _userStats;

    Resource internal immutable _resource;
    IERC20 internal immutable _phi;

    event PlayerEntered(uint256 indexed gameId, uint256 indexed poolSlot, address indexed player);
    event PlayerExited(uint256 indexed gameId, uint256 indexed poolSlot, address indexed player);
    event GameStarted(uint256 indexed gameId, uint256 indexed poolSlot);
    event PlayerPlacedCard(uint256 indexed gameId, uint256 indexed poolSlot, address indexed player, uint256 tokenId);
    event GameFinished(uint256 indexed gameId, uint256 indexed poolSlot, address indexed winner);
    event CreatedNewGame(uint256 indexed gameId, uint256 indexed poolSlot);
    event BoostUsed(uint256 indexed gameId, uint256 indexed poolSlot, address indexed player, uint256 round, uint256 value);

    event TokensExchanged(address indexed player, uint256 tokensSpent);
    event AvaxPerTokenUpdated(uint256 newValue);
    event MinWeightUpdated(uint256 newValue);
    event MinCardsCountUpdated(uint256 newValue);
    event AbortTimeoutUpdated(uint256 newValue);
    event PlayerWhitelistUpdated(address player, bool newValue);
    event BoostPriceUpdated(uint256 newValue);
    event GamesPerWeekUpdated(uint256 newValue);

    constructor(Resource resource, IERC20 phi) ERC20("Loyalty Point", "LP") {
        _resource = resource;
        _phi = phi;
        emit AvaxPerTokenUpdated(avaxPerToken);
        emit MinWeightUpdated(minWeight);
        emit MinCardsCountUpdated(minCardsCount);
        emit AbortTimeoutUpdated(abortTimeout);
        emit BoostPriceUpdated(boostPrice);
        emit GamesPerWeekUpdated(gamesPerWeek);
    }

    function decimals() public view override returns (uint8) {
        return 0;
    }

    function _createNewGame(uint256 poolSlot) private {
        _gameIds.increment();
        uint256 gameId = _gameIds.current();
        _pools[poolSlot] = gameId;
        _games[gameId].gameId = gameId;
        _games[gameId].turn = 1;
        _games[gameId].player1.boostUsedRound = 0xFF;
        _games[gameId].player2.boostUsedRound = 0xFF;
        emit CreatedNewGame(gameId, poolSlot);
    }

    function getGameByPoolSlot(uint256 poolSlot) external view returns (GameInfo memory) {
        return _games[_pools[poolSlot]];
    }

    function getGameById(uint256 gameId) external view returns (GameInfo memory) {
        return _games[gameId];
    }

    function getAllGames() external view returns (GameInfo[] memory) {
        GameInfo[] memory games = new GameInfo[](maxSlotId + 1);
        for (uint8 i=0; i <= maxSlotId; i++) {
            games[i] = _games[_pools[i]];
        }
        return games;
    }

    function getAllGamesPaginated(uint256 offset, uint256 count) external view returns (GameInfo[] memory) {
        GameInfo[] memory games = new GameInfo[](count);
        for (uint8 i=0; i < count && i <= maxSlotId; i++) {
            games[i] = _games[_pools[offset + i]];
        }
        return games;
    }

    function getLastGameId() external view returns (uint256) {
        return _gameIds.current();
    }

    function enterGame(uint256 poolSlot) external {
        GameInfo storage game = _games[_pools[poolSlot]];
        require(!game.started, "Game has already started");
        require(!_isPlaying[msg.sender], "You are already playing in another pool");
        require(_whitelisted.contains(msg.sender), "You're not whitelisted to use this contract");
        _isPlaying[msg.sender] = true;
        uint256[] memory ownedTokens = _resource.ownedTokens(msg.sender);
        uint256 accumulatedWeight = 0;
        uint256 cardsCount = 0;
        for (uint8 i=0; i < ownedTokens.length; i++) {
            uint256 balance = _resource.balanceOf(msg.sender, ownedTokens[i]);
            accumulatedWeight += _resource.getResourceWeight(ownedTokens[i]) * balance;
            if (ownedTokens[i] > 4) {
                cardsCount += balance;
                if (accumulatedWeight >= minWeight && cardsCount >= minCardsCount)
                    break;
            }
        }
        require(cardsCount >= minCardsCount, "You do not have enough cards to play");
        require(accumulatedWeight >= minWeight, "You must have more than 5 total weight to play");

        // start next week if needed
        if (block.timestamp - weekStart >= epoch)
            weekStart = block.timestamp;

        UserStats storage userStats = _userStats[msg.sender];
        if (userStats.weekStart != weekStart) {
            userStats.gamesPlayed = 0;
            userStats.weekStart = weekStart;
        }
        require(userStats.gamesPlayed + 1 <= gamesPerWeek, "your weekly games limit is exceeded");
        userStats.gamesPlayed++;

        if (game.player1.addr == address(0)) {
            game.player1.addr = msg.sender;
        } else {
            game.player2.addr = msg.sender;
        }
        emit PlayerEntered(game.gameId, poolSlot, msg.sender);

        if (game.player1.addr != address(0) && game.player2.addr != address(0)) {
            game.started = true;
            emit GameStarted(game.gameId, poolSlot);
        }

        game.lastAction = block.timestamp;
    }

    function exitGame(uint256 poolSlot) external {
        GameInfo storage game = _games[_pools[poolSlot]];
        require(!game.started, "Game has already started");
        if (game.player1.addr == msg.sender) {
            game.player1.addr = address(0);
        } else if (game.player2.addr == msg.sender) {
            game.player2.addr = address(0);
        } else {
            revert("You are not in this pool");
        }
        _isPlaying[msg.sender] = false;
        emit PlayerExited(game.gameId, poolSlot, msg.sender);
    }

    function placeCard(uint256 poolSlot, uint256 tokenId) external {
        GameInfo storage game = _games[_pools[poolSlot]];
        bool isPlayer1 = game.player1.addr == msg.sender;
        bool isPlayer2 = game.player2.addr == msg.sender;
        require(isPlayer1 || isPlayer2, "You are not playing in this pool");
        require(game.started, "Game has not started yet");

        if (isPlayer1) {
            require(game.turn == 1, "Now is not your turn");
            _resource.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");
            game.player1.placedCards[game.round] = tokenId;
            game.turn = 2;
        } else if (isPlayer2) {
            require(game.turn == 2, "Now is not your turn");
            _resource.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");
            game.player2.placedCards[game.round] = tokenId;
            game.turn = 1;
            game.round++;
        }

        emit PlayerPlacedCard(game.gameId, poolSlot, msg.sender, tokenId);

        if (game.round == 3) {
            game.finished = true;
            uint256 player1Weights; uint256 player2Weights; uint256 multiplier = 1;
            for (uint8 i=0; i < 3; i++) {
                if (game.player1.boostUsedRound == i)
                    multiplier = game.player1.boostValue;
                else
                    multiplier = 1;
                player1Weights += _resource.getResourceWeight(game.player1.placedCards[i]) * multiplier;
                if (game.player2.boostUsedRound == i)
                    multiplier = game.player2.boostValue;
                else
                    multiplier = 1;
                player2Weights += _resource.getResourceWeight(game.player2.placedCards[i]) * multiplier;
            }
            if (player1Weights > player2Weights) {
                game.winner = game.player1.addr;
            } else if (player2Weights > player1Weights) {
                game.winner = game.player2.addr;
            }
            if (game.winner != address(0))
                _mint(game.winner, 1);
            emit GameFinished(game.gameId, poolSlot, game.winner);

            uint256[] memory amounts = new uint256[](3);
            uint256[] memory placedCards1 = new uint256[](3);
            uint256[] memory placedCards2 = new uint256[](3);
            for (uint8 i=0; i < 3; i++) {
                amounts[i] = 1;
                placedCards1[i] = game.player1.placedCards[i];
                placedCards2[i] = game.player2.placedCards[i];
            }
            _resource.safeBatchTransferFrom(address(this), game.player1.addr, placedCards1, amounts, "");
            _resource.safeBatchTransferFrom(address(this), game.player2.addr, placedCards2, amounts, "");
            _isPlaying[game.player1.addr] = false;
            _isPlaying[game.player2.addr] = false;
        }

        game.lastAction = block.timestamp;
    }

    function boost(uint256 poolSlot) external {
        GameInfo storage game = _games[_pools[poolSlot]];
        bool isPlayer1 = game.player1.addr == msg.sender;
        bool isPlayer2 = game.player2.addr == msg.sender;

        require(isPlayer1 || isPlayer2, "You are not playing in this pool");
        require(game.started && !game.finished, "game should be running");
        require(isPlayer1 && game.turn == 1 || isPlayer2 && game.turn == 2, "you can boost only at your turn");
        require(isPlayer1 && game.player1.boostUsedRound == 0xFF || isPlayer2 && game.player2.boostUsedRound == 0xFF, "you can only use boost once per game");
        require(_phi.balanceOf(msg.sender) >= boostPrice, "insufficient funds");

        _phi.safeTransferFrom(msg.sender, address(this), boostPrice);
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1)))) % 6 + 1;
        if (isPlayer1) {
            game.player1.boostValue = rand;
            game.player1.boostUsedRound = game.round;
        } else if (isPlayer2) {
            game.player2.boostValue = rand;
            game.player2.boostUsedRound = game.round;
        }
        emit BoostUsed(game.gameId, poolSlot, msg.sender, game.round, rand);
    }

    function abortGame(uint256 poolSlot) external {
        GameInfo storage game = _games[_pools[poolSlot]];
        bool isPlayer1 = game.player1.addr == msg.sender;
        bool isPlayer2 = game.player2.addr == msg.sender;
        bool owner = owner() == msg.sender;
        require(owner || isPlayer1 || isPlayer2, "You are not playing in this pool");
        require(game.started && !game.finished, "game should be running");
        require(owner || block.timestamp - game.lastAction >= abortTimeout, "timeout has not passed");
        require(owner || isPlayer1 && game.turn != 1 || isPlayer2 && game.turn != 2, "you can't abort game at your turn");

        game.finished = true;
        if (!owner) {
            game.winner = msg.sender;
            _mint(game.winner, 1);
        }
        emit GameFinished(game.gameId, poolSlot, game.winner);

        for (uint8 i=0; i < 3; i++) {
            if (game.player1.placedCards[i] != 0)
                _resource.safeTransferFrom(address(this), game.player1.addr, game.player1.placedCards[i], 1, "");
            if (game.player2.placedCards[i] != 0)
                _resource.safeTransferFrom(address(this), game.player2.addr, game.player2.placedCards[i], 1, "");
        }
        _isPlaying[game.player1.addr] = false;
        _isPlaying[game.player2.addr] = false;
    }

    function startGames(uint256[] calldata poolSlots) external onlyOwner {
        for (uint8 i=0; i < poolSlots.length; i++) {
            GameInfo memory game = _games[poolSlots[i]];
            require(!game.started || game.finished, "cannot replace running games");
            _createNewGame(poolSlots[i]);
            if (poolSlots[i] > maxSlotId) {
                require(maxSlotId + 1 == poolSlots[i], "cannot add slots not following existing");
                maxSlotId = poolSlots[i];
            }
        }
    }

    function burn(uint256 amount) external {
        uint256 sum = amount * avaxPerToken;
        require(address(this).balance >= sum, "Not enough balance on contract");

        (bool sent, bytes memory data) = msg.sender.call{value: sum}("");
        require(sent, "an error occurred while sending avax");

        emit TokensExchanged(msg.sender, amount);
        _burn(msg.sender, amount);
    }

    function updateAvaxPerToken(uint256 newValue) external onlyOwner {
        require(newValue > 0, "cannot be 0");
        require(newValue != avaxPerToken, "no change");
        avaxPerToken = newValue;
        emit AvaxPerTokenUpdated(newValue);
    }

    function updateMinWeight(uint256 newValue) external onlyOwner {
        require(newValue != minWeight, "no change");
        minWeight = newValue;
        emit MinWeightUpdated(newValue);
    }

    function updateMinCardsCount(uint256 newValue) external onlyOwner {
        require(newValue != minCardsCount, "no change");
        minCardsCount = newValue;
        emit MinCardsCountUpdated(newValue);
    }

    function updateAbortTimeout(uint256 newValue) external onlyOwner {
        require(newValue != abortTimeout, "no change");
        abortTimeout = newValue;
        emit AbortTimeoutUpdated(newValue);
    }

    function setWhitelisted(address player, bool status) external onlyOwner {
        if (status)
            _whitelisted.add(player);
        else
            _whitelisted.remove(player);
        emit PlayerWhitelistUpdated(player, status);
    }

    function setWhitelistedBulk(address[] calldata players, bool status) external onlyOwner {
        for (uint256 i=0; i < players.length; i++) {
            if (status)
                _whitelisted.add(players[i]);
            else
                _whitelisted.remove(players[i]);
            emit PlayerWhitelistUpdated(players[i], status);
        }
    }

    function clearWhitelist(uint256 amount) external onlyOwner {
        uint256 whitelistLength = _whitelisted.length();
        if (amount > whitelistLength)
            amount = whitelistLength;
        for (uint256 i=0; i < amount; i++) {
            address player = _whitelisted.at(i);
            _whitelisted.remove(player);
            emit PlayerWhitelistUpdated(player, false);
        }
    }

    function isWhitelisted(address player) external view returns (bool) {
        return _whitelisted.contains(player);
    }

    function getWhitelistLength() external view returns (uint256) {
        return _whitelisted.length();
    }

    function updateBoostPrice(uint256 newValue) external onlyOwner {
        require(newValue != boostPrice, "no change");
        boostPrice = newValue;
        emit BoostPriceUpdated(newValue);
    }

    function updateGamesPerWeek(uint256 newValue) external onlyOwner {
        require(newValue != gamesPerWeek, "no change");
        gamesPerWeek = newValue;
        emit GamesPerWeekUpdated(newValue);
    }

    function withdrawFee(address to) external onlyOwner {
        uint256 balance = _phi.balanceOf(address(this));
        require(balance > 0, "nothing to withdraw");
        _phi.safeTransfer(to, balance);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        require(from == address(0) || to == address(0), "transfers between users are not allowed");
    }

    receive() external payable {}
}
