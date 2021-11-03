import React, { useState } from 'react';
import { observer } from "mobx-react";
import BN from "bignumber.js";
import useAsyncEffect from "use-async-effect";
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { toBN } from "../utils/number";
import { toast } from "react-toastify";

interface ILoyaltyPageProps {
}

const LoyaltyPage = observer(({}: ILoyaltyPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ lpBalance, setLpBalance ] = useState<number>();
    const [ loading, setLoading ] = useState(false);

    const updateBalance = async () => {
        if (!walletStore.address) {
            setLpBalance(undefined);
            return;
        }
        const contract = walletStore.gameContract;
        setLpBalance(parseInt(await contract.methods.balanceOf(walletStore.address).call()));
    };
    useAsyncEffect(updateBalance, [walletStore.lastBlock, walletStore.address]);

    const onClaim = async () => {
        setLoading(true);
        try {
            const contract = walletStore.gameContract;
            const tx = await walletStore.sendTransaction(contract.methods.burn(lpBalance.toString()));
            await updateBalance();
            toast.success(
                <>
                    Tokens were exchanged<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
        } catch (e) {

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="main" style={{ color: 'white' }}>
            <div className='container' style={{ marginTop: 150, color: 'white', fontSize: '2rem' }}>
                <h2 className="section-title text-center">Loyalty</h2>
                <p>Loyalty points balance: {lpBalance}</p>
                <button className='btn primary' disabled={!lpBalance || loading} onClick={() => onClaim()}>Claim {(lpBalance * .5).toFixed(1)} AVAX</button>
            </div>
        </main>
    )
});

export default LoyaltyPage;
