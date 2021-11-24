import React, { useState } from 'react';
import { GameinfoResponse } from "../../utils/contracts/game";
import useAsyncEffect from "use-async-effect";
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";

interface IGameInfoPageProps {
}

const GameInfoPage = ({}: IGameInfoPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ gameId, setGameId ] = useState('');
    const [ gameInfo, setGameInfo ] = useState<GameinfoResponse>();
    const [ staleSlots, setStaleSlots ] = useState<number[]>([]);

    useAsyncEffect(async () => {
        const games = await walletStore.gameContract.methods.getAllGames().call();
        const staleSlots = [];

        games.forEach((g, i) => {
            if (g.started && !g.finished && (+new Date() / 1000) - parseInt(g.lastAction) >= 300) {
                staleSlots.push(i);
            }
        });

        setStaleSlots(staleSlots);
    })

    return (
        <main className="main" style={{ fontSize: 14, color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <h2>Stale game slots</h2>
                <pre>[{staleSlots.join(', ')}]</pre>
            </div>
        </main>
    )
};

export default GameInfoPage;
