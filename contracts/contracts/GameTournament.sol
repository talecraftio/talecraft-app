// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/Counters.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/security/Pausable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/token/ERC1155/IERC1155.sol";
import "OpenZeppelin/openzeppelin-contracts@4.3.2/contracts/utils/structs/EnumerableSet.sol";
import "./CustomEnumerableMap.sol";
import "./Resource.sol";
import "./GameLending.sol";

contract GameTournament is Ownable, Pausable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using CustomEnumerableMap for CustomEnumerableMap.AddressToUintMap;
    using CustomEnumerableMap for CustomEnumerableMap.UintToUintMap;

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

    struct InventoryItem {
        uint256 tokenId;
        uint256 balance;
    }

    struct Tournament {
        uint256 tournamentId;
        uint256 tournamentRound;
        address[] players;
        uint256[][4] gameIds;
        address[] currentWinners;
        uint256 startTime;
        uint256 joinDeadline;
        uint256 playersCount;
        bool started;
        bool finished;
        address winner;
    }

    mapping (uint256 => Tournament) private tournaments;
    mapping (uint256 => EnumerableSet.AddressSet) private tournamentPlayers;
    Counters.Counter private tournamentIds;
    mapping (address => uint256) public playersCurrentTournaments;
    mapping (uint256 => bool) public diceRolled;
    uint256[5] public winAmounts = [10e18, 20e18, 40e18, 80e18, 160e18];

    Counters.Counter internal _gameIds;
    mapping (uint256 => GameInfo) _games;
    uint256[4] public powerPrices;
    uint256 public abortTimeout = 5 * 60;  // seconds
    uint256 public joinPrice;
    uint256 public fee = 50000;  // 1e6
    uint256 public inGameCount;
    CustomEnumerableMap.AddressToUintMap _playerPlayed;
    CustomEnumerableMap.AddressToUintMap _playerWins;
    mapping (address => EnumerableSet.UintSet) internal _playerGames;
    mapping (uint256 => mapping (address => bool)) internal _playerJoins;
    mapping (uint256 => mapping (address => CustomEnumerableMap.UintToUintMap)) internal _usedCards;
    mapping (address => uint256) public currentGames;
    mapping (uint256 => uint256) internal _gameTournaments;

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
    event AbortTimeoutUpdated(uint256 newValue);
    event PowerPricesUpdated(uint256 waterPrice, uint256 firePrice, uint256 airPrice, uint256 earthPrice);

    event WinAmountsUpdated(uint256[5] values);
    event TournamentCreated(uint256 indexed tournamentId);
    event TournamentJoin(uint256 indexed tournamentId, address account);
    event TournamentStart(uint256 indexed tournamentId);
    event TournamentFinish(uint256 indexed tournamentId);

    constructor(Resource resource, IERC20 phi, GameLending gameLending, uint256 joinPrice_) {
        _resource = resource;
        _phi = phi;
        _gameLending = gameLending;
        joinPrice = joinPrice_;
        powerPrices[0] = powerPrices[1] = powerPrices[2] = powerPrices[3] = 0 ether;
        _createGame();

        emit JoinPriceUpdated(joinPrice_);
        emit AbortTimeoutUpdated(abortTimeout);
        emit PowerPricesUpdated(powerPrices[0], powerPrices[1], powerPrices[2], powerPrices[3]);
        emit WinAmountsUpdated(winAmounts);
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

    function _checkCardsCount(address account) internal {
        uint256 cardsCount = 0;
        uint256[] memory ownedTokens = _resource.ownedTokens(account);
        uint256[] memory ownedTokensBalances = new uint256[](ownedTokens.length);
        for (uint256 i=0; i < ownedTokens.length; i++) {
            uint256 balance = _resource.balanceOf(account, ownedTokens[i]);
            // skip element cards
            if (ownedTokens[i] > 4) {
                cardsCount += balance;
                if (cardsCount >= 3)
                    break;
            }
        }
        if (cardsCount < 3) {
            uint256[] memory borrowedTokens = _gameLending.getBorrowedTokenIds(account);
            for (uint256 i=0; i < borrowedTokens.length; i++) {
                // skip element cards
                if (borrowedTokens[i] > 4) {
                    cardsCount += 1;
                    if (cardsCount >= 3)
                        break;
                }
            }
        }
        require(cardsCount >= 3, "you don't have 3 cards");
    }

    function _leaveCurrentTournamentIfExpired(address account) private {
        uint256 tournamentId = playersCurrentTournaments[account];
        if (tournamentId == 0)
            return;
        Tournament memory tournament = tournaments[tournamentId];
        if (block.timestamp > tournament.joinDeadline && !tournament.started)
            playersCurrentTournaments[account] = 0;
    }

    function joinTournament(uint256 tournamentId) external {
        _leaveCurrentTournamentIfExpired(msg.sender);

        require(tournamentId > 0 && tournamentId <= tournamentIds.current(), "invalid tournament id");
        Tournament storage tournament = tournaments[tournamentId];
        require(tournamentPlayers[tournamentId].length() < tournament.playersCount, "tournament is full");
        require(block.timestamp >= tournament.startTime, "joins are not allowed yet");
        require(block.timestamp <= tournament.joinDeadline, "join deadline passed");
        require(playersCurrentTournaments[msg.sender] == 0, "you are already participating in a tournament");

        tournamentPlayers[tournamentId].add(msg.sender);
        playersCurrentTournaments[msg.sender] = tournamentId;
        _checkCardsCount(msg.sender);
        emit TournamentJoin(tournamentId, msg.sender);

        uint256 newPlayersCount = tournamentPlayers[tournamentId].length();

        if (newPlayersCount % 2 == 0) {
            address player1 = msg.sender;
            address player2 = tournamentPlayers[tournamentId].at(newPlayersCount - 2);
            // start game
            uint256 gameId = _gameIds.current();
            _joinGame(player1);
            _joinGame(player2);
            tournament.gameIds[0].push(gameId);
            _gameTournaments[gameId] = tournamentId;
        }

        if (newPlayersCount == tournament.playersCount) {
            tournament.players = tournamentPlayers[tournamentId].values();
            tournament.started = true;
            for (uint256 i=0; i < tournament.gameIds[0].length; i++) {
                _games[tournament.gameIds[0][i]].lastAction = block.timestamp;
            }
            emit TournamentStart(tournamentId);
        }
    }

    function addTournament(uint256 playersCount, uint256 startTime, uint256 joinDeadline) external onlyOwner {
        require(startTime > block.timestamp, "startTime should be in future");
        require(joinDeadline > startTime, "join deadline should be after startTime");
        require(playersCount == 2 || playersCount == 4 || playersCount == 8 || playersCount == 16, "playersCount should be a power of 2");

        tournamentIds.increment();
        uint256 id = tournamentIds.current();
        Tournament storage tournament = tournaments[id];
        tournament.tournamentId = id;
        tournament.playersCount = playersCount;
        tournament.startTime = startTime;
        tournament.joinDeadline = joinDeadline;
    }

    function getTournaments(uint256[] memory ids) external view returns (Tournament[] memory) {
        Tournament[] memory result = new Tournament[](ids.length);
        for (uint256 i=0; i < ids.length; i++) {
            result[i] = tournaments[ids[i]];
            result[i].players = tournamentPlayers[ids[i]].values();
        }
        return result;
    }

    function _joinGame(address account) internal {
        uint256 gameId = _gameIds.current();
        GameInfo storage game_ = _games[gameId];
        require(!_playerJoins[gameId][account], "please wait for the next game");

        if (joinPrice > 0) {
            _phi.safeTransferFrom(account, address(this), joinPrice);
            game_.bank += joinPrice;
        }

        if (game_.player[0].addr == address(0)) {
            game_.player[0].addr = account;
        } else {
            game_.player[1].addr = account;
            game_.started = true;
            emit GameStarted(gameId);
            inGameCount += 2;
            _createGame();
        }
        emit PlayerEntered(gameId, account);

        _playerGames[account].add(gameId);
        game_.lastAction = block.timestamp;
        currentGames[account] = gameId;
        _playerJoins[gameId][account] = true;
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

    function placeCardMangledNameFoo(uint256 tokenId) external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not playing a game");
        GameInfo storage game_ = _games[gameId];
        require(game_.started, "game has not started");
        require(tournaments[_gameTournaments[gameId]].started, "tournament has not started yet");

        bool turn0 = game_.turn == 0;
        require(turn0 && game_.player[0].addr == msg.sender || !turn0 && game_.player[1].addr == msg.sender, "not your turn");
//        require(_playerOwnedTokens[gameId][msg.sender][tokenId] > 0, "insufficient virtual balance");
        uint256 cardBalance = _resource.balanceOf(msg.sender, tokenId);
        (/*bool success*/, uint256 usedBalance) = _usedCards[gameId][msg.sender].tryGet(tokenId);
        if (cardBalance <= usedBalance) {
            uint256[] memory borrowedTokenIds = _gameLending.getBorrowedTokenIds(msg.sender);
            for (uint256 i=0; i < borrowedTokenIds.length; i++) {
                if (borrowedTokenIds[i] == tokenId) {
                    cardBalance++;
                    if (cardBalance > usedBalance)
                        break;
                }
            }
        }
        require(cardBalance > usedBalance, "insufficient balance");

        _usedCards[gameId][msg.sender].set(tokenId, usedBalance + 1);
        game_.player[game_.turn].placedCards[game_.round] = tokenId;
        _afterPlace(game_, tokenId);
    }

    function _afterPlace(GameInfo storage game_, uint256 tokenId) private {
        bool turn0 = game_.turn == 0;
        if (game_.round == 1 && turn0 || (game_.round == 0 || game_.round == 2) && !turn0)
            game_.round++;
        else
            game_.turn = turn0 ? 1 : 0;
//        emit PlayerPlacedCard(game_.gameId, msg.sender, tokenId);
        game_.lastAction = block.timestamp;
        int8 winner0 = _roundWinner(game_, 0);
        if (game_.round == 3 || game_.round == 2 && winner0 == _roundWinner(game_, 1) && winner0 != 0)
            _finishGame(game_);
    }

    function getPlayerUsedCards(uint256 gameId, address player) external view returns (InventoryItem[] memory) {
        InventoryItem[] memory result = new InventoryItem[](_usedCards[gameId][player].length());
        for (uint256 i=0; i < result.length; i++) {
            (uint256 tokenId, uint256 used) = _usedCards[gameId][player].at(i);
            result[i] = InventoryItem({ tokenId: tokenId, balance: used });
        }
        return result;
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
        int8 balance = 0;
        for (uint8 r=0; r < game_.round; r++) {
            balance += _roundWinner(game_, r);
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

        _afterGameEnd(game_);
    }

    function _afterGameEnd(GameInfo storage game_) internal {
        address winner = game_.winner;
        if (winner == address(0)) {
            uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), game_.gameId))) % 2;
            winner = game_.winner = game_.player[rand].addr;
            diceRolled[game_.gameId] = true;
        }
        uint256 tournamentId = playersCurrentTournaments[winner];
        Tournament storage tournament = tournaments[tournamentId];
        tournament.currentWinners.push(winner);

        if (tournament.tournamentRound == 0) {
            address addr0 = game_.player[0].addr;
            _phi.safeTransfer(addr0 == winner ? game_.player[1].addr : addr0, winAmounts[0]);
        }
        _phi.safeTransfer(winner, winAmounts[tournament.tournamentRound + 1]);

        uint256 winnersCount = tournament.currentWinners.length;
        if (winnersCount == tournament.gameIds[tournament.tournamentRound].length) {
            // all games in a round are finished
            if (winnersCount == 1) {
                // tournament end
                tournament.finished = true;
                tournament.winner = tournament.currentWinners[0];
                for (uint256 i=0; i < tournament.players.length; i++) {
                    playersCurrentTournaments[tournament.players[i]] = 0;
                }
                emit TournamentFinish(tournamentId);
            } else {
                tournament.tournamentRound++;
                address[] memory winners = tournament.currentWinners;
                for (uint256 i=0; i < winnersCount; i += 2) {
                    address player1 = winners[i];
                    address player2 = winners[i + 1];
                    uint256 gameId = _gameIds.current();
                    _joinGame(player1);
                    _joinGame(player2);
                    tournament.gameIds[tournament.tournamentRound].push(gameId);
                    _gameTournaments[gameId] = tournamentId;
                }
                delete tournament.currentWinners;
            }
        }
    }

    function usePower(PowerType powerType) external {
        uint256 gameId = currentGames[msg.sender];
        require(gameId != 0, "you are not playing a game");
        GameInfo storage game_ = _games[gameId];
        require(game_.started, "game is not running");
        require(tournaments[_gameTournaments[gameId]].started, "tournament has not started yet");

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
        require(tournaments[_gameTournaments[game_.gameId]].started, "tournament has not started yet");

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

        currentGames[game_.player[0].addr] = 0;
        currentGames[game_.player[1].addr] = 0;

        emit GameAborted(game_.gameId, winner);

        inGameCount -= 2;

        _afterGameEnd(game_);
    }

    function updateJoinPrice(uint256 newValue) external onlyOwner {
        require(newValue != joinPrice, "no change");
        joinPrice = newValue;
        emit JoinPriceUpdated(newValue);
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

    function getLastTournamentId() external view returns (uint256) {
        return tournamentIds.current();
    }

    function getWinAmounts() external view returns (uint256[5] memory) {
        return winAmounts;
    }

    function updateWinAmounts(uint256[5] memory amounts) external onlyOwner {
        winAmounts = amounts;
    }

    function updateGameLending(GameLending newAddress) external onlyOwner {
        _gameLending = newAddress;
    }
}
