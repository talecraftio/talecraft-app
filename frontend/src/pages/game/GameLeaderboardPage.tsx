import React, { useState } from 'react';
import { RouteComponentProps, useLocation } from "react-router";
import { ADDRESSES } from "../../utils/contracts";
import _ from "lodash";
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import useAsyncEffect from "use-async-effect";
import { LeaderboarditemResponse } from "../../utils/contracts/game2";
import classNames from "classnames";
import AsyncRender from "../../components/AsyncRender";
import { Api } from "../../graphql/api";
import { GameLeaderboardItem } from "../../graphql/sdk";

interface IGameLeaderboardPageProps extends RouteComponentProps {
}

const GameLeaderboardPage = observer(({}: IGameLeaderboardPageProps) => {
    const walletStore = useInjection(WalletStore);
    const api = useInjection(Api);
    const location = useLocation();

    const league = location.pathname.split('/')[2];
    let gameAddress;
    let leagueId;
    switch (league) {
        case 'junior':
            gameAddress = ADDRESSES.games['0']; leagueId = 0; break;
        case 'senior':
            gameAddress = ADDRESSES.games['1']; leagueId = 1; break;
        case 'master':
            gameAddress = ADDRESSES.games['2']; leagueId = 2; break;
    }
    const contract = walletStore.getGame2Contract(gameAddress);

    const [ loading, setLoading ] = useState(true);
    const [ leaderboard, setLeaderboard ] = useState<GameLeaderboardItem[]>([]);

    useAsyncEffect(async () => {
        setLoading(true);
        // const leaderboard = await contract.methods.leaderboard().call();
        const leaderboard = await api.getGameLeaderboard();
        setLeaderboard(_.reverse(_.sortBy(leaderboard.filter(i => i.wins > 0 && i.league == leagueId), i => i.wins)));
        setLoading(false);
    }, []);

    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <h1>{_.capitalize(league)} game leaderboard</h1>
                {loading ? 'Loading...' : (
                    <>
                        <ul>
                            <li>
                                <span>#</span>
                                <span>Address</span>
                                <span>Played</span>
                                <span>Wins</span>
                            </li>
                            {leaderboard.map((r, i) => (
                                <li key={r.address} className={classNames(r.address === walletStore.address && 'you')}>
                                    <span>{i+1}</span>
                                    <span>{r.address}</span>
                                    <span>{r.played}</span>
                                    <span>{r.wins}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </main>
    )
});

export default GameLeaderboardPage;
