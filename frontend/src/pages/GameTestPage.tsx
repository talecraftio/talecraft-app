import React, { useEffect, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { observer } from "mobx-react";
import useAsyncEffect from "use-async-effect";
import { Game50Response } from "../utils/contracts/game";
import { ZERO_ADDRESS } from "../utils/address";
import { toast } from "react-toastify";
import { useAsyncMemo } from "use-async-memo";
import { ADDRESSES } from "../utils/contracts";
import Timeout from "await-timeout";

interface IGameTestPageProps {
}

const GameTestPage = observer(({}: IGameTestPageProps) => {
    const walletStore = useInjection(WalletStore);
    const gameContract = walletStore.gameContract;
    const resourceContract = walletStore.resourceContract;

    const [ slots, setSlots ] = useState<Game50Response[]>([]);
    const [ activeGame, setActiveGame ] = useState<Game50Response>();
    const [ activeSlot, setActiveSlot ] = useState<number>();
    const [ placeTokenId, setPlaceTokenId ] = useState('');
    const [ logEntries, setLogEntries ] = useState<string[]>([]);

    useAsyncEffect(async () => {
        setSlots(await gameContract.methods.getAllGames().call());
        if (activeGame) {
            setActiveGame(await gameContract.methods.getGameById(activeGame.gameId).call());
        }
    }, [walletStore.lastBlock]);

    const gameInfo = useAsyncMemo(async () => {
        if (!activeGame)
            return null;

        const { player1, player2, turn, started, finished, winner, round } = activeGame;

        const isPlayer1 = player1.addr === walletStore.address;
        const isTurn = turn === (isPlayer1 ? '1' : '2');

        const output = [];
        output.push(`Player 1${isPlayer1 ? ' (you)' : ''}: ${player1.addr}`);
        output.push(`Placed cards: ${player1.placedCards.join(',')}`)
        output.push('');
        output.push(`Player 2${!isPlayer1 ? ' (you)' : ''}: ${player2.addr}`);
        output.push(`Placed cards: ${player2.placedCards.join(',')}`)
        output.push('');
        output.push(`Turn: Player ${turn}${isTurn ? ' (you)' : ''}`);
        output.push('')
        output.push(`Started: ${started}`);
        output.push(`Finished: ${finished}`);
        output.push(`Winner: ${winner}`);
        output.push(`Current round: ${round}`);

        return (
            <>
                <pre>{output.join('\n')}</pre>
                {started && !finished && isTurn && (
                    <form onSubmit={onPlace}>
                        Your turn! <input type='text' placeholder='token id' value={placeTokenId} onChange={e => setPlaceTokenId(e.target.value)} style={{ background: 'grey' }} /> <button type='submit' style={{ padding: 5, margin: 5, border: 'grey 1px solid', color: 'grey' }}>Place</button>
                    </form>
                )}
            </>
        );
    }, [activeGame, placeTokenId]);

    useAsyncEffect(async () => {
        if (!activeGame) {
            setLogEntries([]);
            return;
        }
        const events = await gameContract.getPastEvents('allEvents' as any, { fromBlock: 2217934 });
        setLogEntries([]);
        setLogEntries(events.filter(e => e.returnValues.gameId === activeGame.gameId).map(e => {
            switch (e.event) {
                case 'PlayerEntered':
                    return `${e.blockNumber}: ${e.returnValues.player} entered`;
                case 'PlayerExited':
                    return `${e.blockNumber}: ${e.returnValues.player} exited`;
                case 'GameStarted':
                    return `${e.blockNumber}: Game started`;
                case 'PlayerPlacedCard':
                    return `${e.blockNumber}: ${e.returnValues.player} placed card #${e.returnValues.tokenId}`;
                case 'GameFinished':
                    return `${e.blockNumber}: Game finished, winner: ${e.returnValues.winner}`;
                case 'CreatedNewGame':
                    return `${e.blockNumber}: Game created`;
            }
        }))
    }, [activeGame]);

    if (!walletStore.address) {
        return <div>Connect wallet first</div>;
    }

    const onJoin = async (slot: number, game: Game50Response) => {
        if (game.gameId === activeGame?.gameId) {
            toast.warning('Selected already');
            return;
        }

        if (game.player1.addr !== walletStore.address && game.player2.addr !== walletStore.address) {
            await walletStore.sendTransaction(gameContract.methods.enterGame(slot.toString()));
            toast.success('Joined game');
        }

        setActiveSlot(slot);
        setActiveGame(game);
        setPlaceTokenId('');
    }

    const onPlace = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((await resourceContract.methods.balanceOf(walletStore.address, placeTokenId).call()) === '0') {
            toast.error('You do not own tokens with this ID');
            return;
        }

        if (!await resourceContract.methods.isApprovedForAll(walletStore.address, ADDRESSES.game).call()) {
            await walletStore.sendTransaction(resourceContract.methods.setApprovalForAll(ADDRESSES.game, true));
            toast.success('Approved');
        }

        await walletStore.sendTransaction(gameContract.methods.placeCard(activeSlot.toString(), placeTokenId));
        toast.success('Placed');
        setPlaceTokenId('');
    }

    return (
        <main className="main" style={{ fontSize: 14, color: 'white' }}>
            <div className='container' style={{ marginTop: 150, color: 'white', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {slots.map((g, i) => {
                        let players = 0;
                        g.player1.addr !== ZERO_ADDRESS && players++;
                        g.player2.addr !== ZERO_ADDRESS && players++;
                        const isJoined = activeGame?.gameId == g.gameId;
                        return (
                            <div key={i}>
                                <button type='button' style={{ border: `${isJoined ? 'white': 'gray'} 1px solid`, padding: 5, margin: 5, color: isJoined ? 'white': 'gray' }} onClick={() => onJoin(i, g)}>Join game {i.toString().padStart(2, '0')} ({players}/2)</button>
                            </div>
                        );
                    })}
                </div>
                {activeGame && (
                    <>
                        <h2 style={{ marginTop: 15 }}>Playing game in slot {activeSlot} (ID: {activeGame.gameId})</h2>
                        {gameInfo}
                        <h2 style={{ marginTop: 15 }}>Log</h2>
                        <pre>{logEntries.join('\n')}</pre>
                    </>
                )}
            </div>
        </main>
    )
});

export default GameTestPage;
