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
    const [ staleSlots, setStaleSlots ] = useState<[GameinfoResponse, number][]>([]);

    useAsyncEffect(async () => {
        const games = await walletStore.gameContract.methods.getAllGames().call();
        const staleSlots = [];

        games.forEach((g, i) => {
            if (g.started && !g.finished && (+new Date() / 1000) - parseInt(g.lastAction) >= 300) {
                staleSlots.push([g, i]);
            }
        });

        setStaleSlots(staleSlots);
    })

    return (
        <main className="main" style={{ fontSize: 14, color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <h2>Stale game slots</h2>
                <pre>{staleSlots.map(([g, i]) => `Slot ${i}: no actions since ${new Date(parseInt(g.lastAction) * 1000).toLocaleString()}\n`)}</pre>
            </div>
        </main>
    )
};

export default GameInfoPage;
