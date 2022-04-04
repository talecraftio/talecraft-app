import React, { useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import { toast } from "react-toastify";

interface ITournamentAbortPageProps {
}

const TournamentAbortPage = ({}: ITournamentAbortPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ gameId, setGameId ] = useState('');

    const onAbort = async () => {
        try {
            await walletStore.sendTransaction(walletStore.gameTournamentContract.methods.ownerAbort(gameId));
            toast.success('Game aborted')
        } catch (e) {
            console.error(e);
            toast.error('An error has occurred');
        }
    };

    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <div className="container tournaments-page form" style={{ marginTop: 150 }}>
                <input className='form__field form__input' type='text' placeholder='game id' value={gameId} onChange={e => setGameId(e.target.value)} />
                <button className='btn' onClick={onAbort}>Abort</button>
            </div>
        </main>
    )
};

export default TournamentAbortPage;
