import React, { useState } from 'react';
import { ModalsEnum, ModalStore } from "../stores/ModalStore";
import { useInjection } from "inversify-react";
import { RouteChildrenProps } from "react-router";
import { ResourcetypeResponse } from "../utils/contracts/resource";
import useAsyncEffect from "use-async-effect";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { toast } from "react-toastify";
import { IMAGES_CDN } from "../utils/const";
import { observer } from "mobx-react";
import { ListingResponse } from "../utils/contracts/marketplace";
import { ZERO_ADDRESS } from "../utils/address";
import { toBN } from "../utils/number";
import Moment from "react-moment";
import { Api } from "../graphql/api";
import { ResourceType } from "../graphql/sdk";

interface ICardPageProps extends RouteChildrenProps<{ listingId: string }> {
}

const MarketListingPage = observer(({ match: { params: { listingId } } }: ICardPageProps) => {
    const modalStore = useInjection(ModalStore);
    const walletStore = useInjection(WalletStore);
    const api = useInjection(Api);

    const [ listing, setListing ] = useState<ListingResponse & { listingId: string }>();
    const [ resourceType, setResourceType ] = useState<ResourcetypeResponse>();
    const [ balance, setBalance ] = useState(0);
    const [ loading, setLoading ] = useState(true);
    const [ actionLoading, setActionLoading ] = useState(false);
    const [ apiResourceType, setApiResourceType ] = useState<ResourceType>();

    const loadBalance = async () => {
        const contract = walletStore.resourceContract;
        if (walletStore.address && listing) {
            const balance = await contract.methods.balanceOf(walletStore.address, listing.tokenId).call();
            setBalance(parseInt(balance));
        } else {
            setBalance(0);
        }
    }

    useAsyncEffect(async () => {
        if (listingId !== listing?.listingId) {
            setLoading(true);
            setBalance(0);
            setResourceType(undefined);
        }
        try {
            const market = walletStore.marketplaceContract;
            const listing = await market.methods.getListing(listingId).call();
            setListing({ ...listing, listingId });
            const resource = walletStore.resourceContract;
            const resourceType = (await resource.methods.getResourceTypes([listing.tokenId]).call())[0];
            setResourceType(resourceType);
            setApiResourceType(await api.getResource(listing.tokenId));
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }, [listingId, walletStore.lastBlock]);

    useAsyncEffect(loadBalance, [listingId, walletStore.lastBlock]);

    const onCancel = async () => {
        setActionLoading(true);

        try {
            const contract = walletStore.marketplaceContract;
            const tx = await walletStore.sendTransaction(contract.methods.cancelSale(listingId));
            toast.success(
                <>
                    Cancelled successfully<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setActionLoading(false);
        }
    }

    const onBuy = async () => {
        setActionLoading(true);

        try {
            const contract = walletStore.marketplaceContract;
            const tx = await walletStore.sendTransaction(contract.methods.buyListing(listingId), { value: listing.price });
            toast.success(
                <>
                    Bought successfully<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setActionLoading(false);
        }
    }

    const finished = listing?.closed && listing?.buyer != ZERO_ADDRESS;

    return (
        <main className="main">
            <section className="card-section">
                <div className="container">
                    {loading ? 'Loading...' : (
                        resourceType && apiResourceType ? (
                            <div className="card-wrap">
                                <div className="card card_market">
                                    <div className="card__wrapper">
                                        <div className="card__wrap">
                                            <div className="card__image"><img src={`${IMAGES_CDN}/${resourceType.ipfsHash}.webp`} alt="" /></div>
                                        </div>
                                        <div className="card__body">
                                            <p className="card__text">#{listing.tokenId}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-info">
                                    <h2 className="section-title">{resourceType.name}</h2>
                                    <div className="card-table">
                                        <div className="card-row"><span className="card__name">Name</span><span className="card__name">{resourceType.name}</span></div>
                                        <div className="card-row"><span>ID</span><span>{listing.tokenId}</span></div>
                                        <div className="card-row"><span>Tier</span><span>{['None', 'Stone', 'Iron', 'Silver', 'Gold', 'Phi Stone'][parseInt(resourceType.tier)]}</span></div>
                                        <div className="card-row"><span>Weight</span><span>{resourceType.weight}</span></div>
                                        <div className="card-row"><span>Listing amount</span><span>{listing.amount}</span></div>
                                        <div className="card-row"><span>Listing price</span><span>{toBN(listing.price).div('1e18').toString()}</span></div>
                                        <div className="card-row"><span>Seller</span><span>{listing.seller}</span></div>
                                        {finished && <div className="card-row"><span>Buyer</span><span>{listing.buyer}</span></div>}
                                        <div className="card-row"><span>Status</span><span>{listing.closed ? (finished ? 'Finished' : 'Cancelled') : 'Active'}</span></div>
                                        {walletStore.address && <div className="card-row"><span>Owned</span><span>{balance}</span></div>}
                                    </div>
                                    {walletStore.address && balance > 0 && (
                                        <div className="card-footer">
                                            <button className="btn primary" type="button" disabled={actionLoading} onClick={() => modalStore.showModal(ModalsEnum.Sell, { tokenId: listing.tokenId, balance })}>Put on Marketplace</button>
                                            <button className="btn primary" type="button" disabled={actionLoading} onClick={() => modalStore.showModal(ModalsEnum.Transfer, { balance, tokenId: listing.tokenId })}>Transfer</button>
                                        </div>
                                    )}
                                    <div className="card-footer">
                                        {!listing.closed && listing.seller === walletStore.address && (
                                            <button className="btn primary" type="button" disabled={actionLoading} onClick={() => onCancel()}>Cancel Sale</button>
                                        )}
                                        {!listing.closed && (
                                            <button className="btn primary" type="button" disabled={actionLoading} onClick={() => onBuy()}>Buy</button>
                                        )}
                                    </div>
                                    <h2 className="section-title">Sale history</h2>
                                    <table>
                                        <tr>
                                            <th>Datetime</th>
                                            <th>Amount</th>
                                            <th>Price</th>
                                        </tr>
                                        {apiResourceType.sales.map(s => (
                                            <tr>
                                                <td><Moment date={s.datetime} format='LLL' withTitle /></td>
                                                <td>{s.amount}</td>
                                                <td>{toBN(s.price).toFixed(6)} AVAX</td>
                                            </tr>
                                        ))}
                                    </table>
                                </div>
                            </div>
                        ) : (
                            '404'
                        )
                    )}
                </div>
            </section>
            <div className="decor-img decor-img--top"><img src={require('url:../images/decor.png')} alt="" /></div>
        </main>
    )
});

export default MarketListingPage;
