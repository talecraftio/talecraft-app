import React, { useState } from 'react';
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../../stores/WalletStore";
import useAsyncEffect from "use-async-effect";
import { toast } from "react-toastify";
import { Redirect } from "react-router";
import { ListingResponse } from "../../utils/contracts/marketplaceOld";

interface IOldMarketplaceWithdrawPageProps {
}

const OldMarketplaceWithdrawPage = observer(({}: IOldMarketplaceWithdrawPageProps) => {
    const walletStore = useInjection(WalletStore);

    const oldMarketplace = walletStore.marketplaceOldContract;

    const [ listings, setListings ] = useState<(ListingResponse & { lid: string })[]>([]);
    const [ loading, setLoading ] = useState(true);

    useAsyncEffect(async () => {
        const activeListings = await oldMarketplace.methods.getListingsBySeller(walletStore.address).call();
        const listings = [];
        const promises = activeListings.map(async lid => listings.push({ ...await oldMarketplace.methods.getListing(lid).call(), lid }));
        await Promise.all(promises);
        setListings(listings);
        setLoading(false);
    }, [walletStore.lastBlock]);

    if (!walletStore.connected) {
        toast.error('You must connect your wallet in order to access this page');
        return <Redirect to='/' />;
    }

    const onRecover = async (lid: string) => {
        const tx = await walletStore.sendTransaction(oldMarketplace.methods.cancelSale(lid));
        toast.success(
            <>
                Tokens were recovered successfully<br />
                <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
            </>
        );
    }

    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <h1>Recover tokens from old marketplace</h1>

                {loading ? 'Loading...' : (
                    <table cellSpacing='10'>
                        <tr>
                            <th>Listing ID</th>
                            <th>Token ID</th>
                            <th>Amount</th>
                            <th/>
                        </tr>
                        {listings.map(l => (
                            <tr>
                                <td>{l.lid}</td>
                                <td>{l.tokenId}</td>
                                <td>{l.amount}</td>
                                <td><button className='btn primary' type='button' onClick={() => onRecover(l.lid)}>Recover</button></td>
                            </tr>
                        ))}
                    </table>
                )}
            </div>
        </main>
    )
});

export default OldMarketplaceWithdrawPage;
