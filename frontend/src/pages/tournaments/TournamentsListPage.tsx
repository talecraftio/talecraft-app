import React, { useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import useAsyncEffect from "use-async-effect";
import _ from "lodash";
import { TournamentResponse } from "../../utils/contracts/gameTournament";
import { Link } from "react-router-dom";

interface IGameTournamentPageProps {
}

const TournamentsListPage = ({}: IGameTournamentPageProps) => {
    const walletStore = useInjection(WalletStore);

    const contract = walletStore.gameTournamentContract;
    const phi = walletStore.phiContract;

    const [ allTournaments, setAllTournaments ] = useState<TournamentResponse[]>([]);
    const [ upcomingTournaments, setUpcomingTournaments ] = useState<TournamentResponse[]>([]);
    const [ currentTournaments, setCurrentTournaments ] = useState<TournamentResponse[]>([]);

    const loadTournaments = async () => {
        const tournamentsCount = parseInt(await contract.methods.getLastTournamentId().call());
        const tournaments = await contract.methods.getTournaments(_.range(1, tournamentsCount + 1).map(i => i.toString())).call()
        setAllTournaments(allTournaments);
        const now = +new Date() / 1000;
        const futureTournaments = _.sortBy(tournaments.filter(t => parseInt(t.joinDeadline) > now && !t.started), t => parseInt(t.startTime));
        setUpcomingTournaments(futureTournaments.filter(t => Math.abs(parseInt(t.startTime) - parseInt(futureTournaments[0]?.startTime)) < 30));
        setCurrentTournaments(tournaments.filter(t => t.started && !t.finished));
    };

    useAsyncEffect(loadTournaments, [walletStore.lastBlock]);

    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <div className="container tournaments-page" style={{ marginTop: 150 }}>
                <h1>Tournaments</h1>
                <h3>Upcoming</h3>
                {!upcomingTournaments.length && 'No upcoming tournaments'}
                <div className='tournaments'>
                    {upcomingTournaments.map(t => (
                        <div className='tournaments__item' key={t.tournamentId}>
                            <h4>Tournament #{t.tournamentId}</h4>
                            <div>{t.players.length}/{t.playersCount} players</div>
                            <div><Link className='btn' to={`/tournaments/${t.tournamentId}`}>Info</Link></div>
                        </div>
                    ))}
                </div>
                <h3>Ongoing</h3>
                {!currentTournaments.length && 'No current tournaments'}
                <div className='tournaments'>
                    {currentTournaments.map(t => (
                        <div className='tournaments__item' key={t.tournamentId}>
                            <h4>Tournament #{t.tournamentId}</h4>
                            <div>{t.players.length}/{t.playersCount} players</div>
                            <div><Link className='btn' to={`/tournaments/${t.tournamentId}`}>Info</Link></div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
};

export default TournamentsListPage;
