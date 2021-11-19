// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "./Resource.sol";

contract Game is ERC20, Ownable, ERC1155Holder {
    using Counters for Counters.Counter;

    struct GamePlayer {
        address addr;
        uint256[3] placedCards;
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

    Counters.Counter internal _gameIds;
    mapping (uint256 => GameInfo) _games;
    uint256[50] internal _pools;
    uint256 public constant AVAX_PER_TOKEN = .5 ether;
    uint256 public constant ABORT_TIMEOUT = 5 * 60;  // seconds

    Resource internal _resource;

    event PlayerEntered(uint256 indexed gameId, uint256 indexed poolSlot, address indexed player);
    event PlayerExited(uint256 indexed gameId, uint256 indexed poolSlot, address indexed player);
    event GameStarted(uint256 indexed gameId, uint256 indexed poolSlot);
    event PlayerPlacedCard(uint256 indexed gameId, uint256 indexed poolSlot, address indexed player, uint256 tokenId);
    event GameFinished(uint256 indexed gameId, uint256 indexed poolSlot, address indexed winner);
    event CreatedNewGame(uint256 indexed gameId, uint256 indexed poolSlot);
    event TokensExchanged(address indexed player, uint256 tokensSpent);

    constructor(Resource resource) ERC20("Loyalty Point", "LP") {
        _resource = resource;
        for (uint256 i=0; i < 50; i++) {
            _createNewGame(i);
        }
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
        emit CreatedNewGame(gameId, poolSlot);
    }

    function getGameByPoolSlot(uint256 poolSlot) external view returns (GameInfo memory) {
        return _games[_pools[poolSlot]];
    }

    function getGameById(uint256 gameId) external view returns (GameInfo memory) {
        return _games[gameId];
    }

    function getAllGames() external view returns (GameInfo[50] memory) {
        GameInfo[50] memory games;
        for (uint8 i=0; i < 50; i++) {
            games[i] = _games[_pools[i]];
        }
        return games;
    }

    function getLastGameId() external view returns (uint256) {
        return _gameIds.current();
    }

    function enterGame(uint256 poolSlot) external {
        GameInfo storage game = _games[_pools[poolSlot]];
        require(!game.started, "Game has already started");
        for (uint8 i=0; i < 50; i++) {
            require(_games[_pools[i]].finished || _games[_pools[i]].player1.addr != msg.sender && _games[_pools[i]].player2.addr != msg.sender, "You are already playing in some other pool");
        }
        uint256[] memory ownedTokens = _resource.ownedTokens(msg.sender);
        require(ownedTokens.length >= 3, "You do not have enough cards to play");
        uint256 accumulatedWeight = 0;
        for (uint8 i=0; i < ownedTokens.length; i++) {
            accumulatedWeight += _resource.getResourceWeight(ownedTokens[i]);
            if (accumulatedWeight >= 5)
                break;
        }
        require(accumulatedWeight >= 5, "You must have more than 5 total weight to play");

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
            uint256 player1Weights; uint256 player2Weights;
            for (uint8 i=0; i < 3; i++) {
                player1Weights += _resource.getResourceWeight(game.player1.placedCards[i]);
                player2Weights += _resource.getResourceWeight(game.player2.placedCards[i]);
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
        }

        game.lastAction = block.timestamp;
    }

    function abortGame(uint256 poolSlot) external {
        GameInfo storage game = _games[_pools[poolSlot]];
        bool isPlayer1 = game.player1.addr == msg.sender;
        bool isPlayer2 = game.player2.addr == msg.sender;
        require(isPlayer1 || isPlayer2, "You are not playing in this pool");
        require(game.started && !game.finished, "Game should be running");
        require(block.timestamp - game.lastAction >= ABORT_TIMEOUT, "Timeout has not passed");

        game.finished = true;
        game.winner = msg.sender;
        _mint(game.winner, 1);
        emit GameFinished(game.gameId, poolSlot, game.winner);

        for (uint8 i=0; i < 3; i++) {
            if (game.player1.placedCards[i] != 0)
                _resource.safeTransferFrom(address(this), game.player1.addr, game.player1.placedCards[i], 1, "");
            if (game.player2.placedCards[i] != 0)
                _resource.safeTransferFrom(address(this), game.player2.addr, game.player2.placedCards[i], 1, "");
        }
    }

    function startGames(uint256[] calldata poolSlots) external onlyOwner {
        for (uint8 i=0; i < poolSlots.length; i++) {
            _createNewGame(i);
        }
    }

    function burn(uint256 amount) external {
        uint256 sum = amount * AVAX_PER_TOKEN;
        require(address(this).balance >= sum, "Not enough balance on contract");
        payable(msg.sender).transfer(sum);
        emit TokensExchanged(msg.sender, amount);
        _burn(msg.sender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        require(from == address(0) || to == address(0), "transfers between users are not allowed");
    }

    receive() external payable {}
}
