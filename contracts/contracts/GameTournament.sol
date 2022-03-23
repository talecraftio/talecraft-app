// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.5;

import "./GameBase.sol";

contract GameTournament is GameBase {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using CustomEnumerableMap for CustomEnumerableMap.AddressToUintMap;
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

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
    uint256[5] public winAmounts = [5e18, 10e18, 20e18, 40e18, 80e18];

    event WinAmountsUpdated(uint256[5] values);
    event TournamentCreated(uint256 indexed tournamentId);
    event TournamentJoin(uint256 indexed tournamentId, address account);
    event TournamentLeave(uint256 indexed tournamentId, address account);
    event TournamentStart(uint256 indexed tournamentId);
    event TournamentFinish(uint256 indexed tournamentId);

    constructor(Resource resource, IERC20 phi, GameLending gameLending, uint256 joinPrice_)
            GameBase(resource, phi, gameLending, joinPrice_, 0, 2**256-1) {
        epoch = 0;
        emit WinAmountsUpdated(winAmounts);
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
        _saveVirtualBalances(msg.sender, 10**10 + tournamentId);
        emit TournamentJoin(tournamentId, msg.sender);

        if (tournamentPlayers[tournamentId].length() == tournament.playersCount) {
            tournament.players = tournamentPlayers[tournamentId].values();
            tournament.started = true;

            // sorting prepare
            address[] memory players = tournamentPlayers[tournamentId].values();
            uint256[] memory playerWinsCounts = new uint256[](players.length);
            for (uint256 i=0; i < players.length; i++) {
                (/*uint256 success*/, uint256 winCount) = _playerWins.tryGet(players[i]);
                playerWinsCounts[i] = winCount;
            }

            // sort
            for (uint256 i=1; i < players.length; i++) {
                address key = players[i];
                uint256 value = playerWinsCounts[i];
                int256 j = int256(i - 1);
                while (j >= 0 && playerWinsCounts[uint256(j)] > value) {
                    players[uint256(j + 1)] = players[uint256(j)];
                    playerWinsCounts[uint256(j + 1)] = playerWinsCounts[uint256(j)];
                    j--;
                }
                players[uint256(j + 1)] = key;
                playerWinsCounts[uint256(j + 1)] = value;
            }

            // start games
            for (uint256 i=0; i < players.length; i += 2) {
                address player1 = players[i];
                address player2 = players[i + 1];
                // start game
                uint256 gameId = _gameIds.current();
                _joinGame(player1, false);
                _joinGame(player2, false);
                _copyVirtualBalances(tournamentId, gameId, player1, player2);
                tournament.gameIds[0].push(gameId);
            }
            emit TournamentStart(tournamentId);
        }
    }

    function leaveTournament(uint256 tournamentId) external {
        require(tournamentId > 0 && tournamentId <= tournamentIds.current(), "invalid tournament id");
        Tournament storage tournament = tournaments[tournamentId];
        require(!tournament.started, "tournament is started already");
        require(block.timestamp <= tournament.joinDeadline, "join deadline passed");
        require(tournamentPlayers[tournamentId].contains(msg.sender), "you did not join this tournament");

        tournamentPlayers[tournamentId].remove(msg.sender);
        playersCurrentTournaments[msg.sender] = 0;
        emit TournamentLeave(tournamentId, msg.sender);
    }

    function _leaveCurrentTournamentIfExpired(address account) private {
        uint256 tournamentId = playersCurrentTournaments[account];
        if (tournamentId == 0)
            return;
        Tournament memory tournament = tournaments[tournamentId];
        if (block.timestamp > tournament.joinDeadline && !tournament.started)
            playersCurrentTournaments[account] = 0;
    }

    function _afterGameEnd(GameBase.GameInfo storage game_) internal override {
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
                    _joinGame(player1, false);
                    _joinGame(player2, false);
                    _copyVirtualBalances(tournamentId, gameId, player1, player2);
                    tournament.gameIds[tournament.tournamentRound].push(gameId);
                }
                delete tournament.currentWinners;
            }
        }
    }

    function _copyVirtualBalances(uint256 tournamentId, uint256 gameId, address player0, address player1) private {
        uint256 balanceId = 10**10 + tournamentId;
        for (uint256 i=0; i < _playerOwnedTokensEnum[balanceId][player0].length(); i++) {
            uint256 tokenId = _playerOwnedTokensEnum[balanceId][player0].at(i);
            _playerOwnedTokensEnum[gameId][player0].add(tokenId);
            _playerOwnedTokens[gameId][player0][tokenId] = _playerOwnedTokens[balanceId][player0][tokenId];
        }
        for (uint256 i=0; i < _playerOwnedTokensEnum[balanceId][player1].length(); i++) {
            uint256 tokenId = _playerOwnedTokensEnum[balanceId][player1].at(i);
            _playerOwnedTokensEnum[gameId][player1].add(tokenId);
            _playerOwnedTokens[gameId][player1][tokenId] = _playerOwnedTokens[balanceId][player1][tokenId];
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

    function getLastTournamentId() external view returns (uint256) {
        return tournamentIds.current();
    }

    function getWinAmounts() external view returns (uint256[5] memory) {
        return winAmounts;
    }

    function updateWinAmounts(uint256[5] memory amounts) external onlyOwner {
        winAmounts = amounts;
    }
}
