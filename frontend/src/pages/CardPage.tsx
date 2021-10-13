import React, { useState } from 'react';
import { ModalsEnum, ModalStore } from "../stores/ModalStore";
import { useInjection } from "inversify-react";
import { RouteChildrenProps } from "react-router";
import { ResourcetypeResponse } from "../utils/contracts/resource";
import useAsyncEffect from "use-async-effect";
import WalletStore from "../stores/WalletStore";
import { toast } from "react-toastify";
import { IMAGES_CDN } from "../utils/const";
import { observer } from "mobx-react";

interface ICardPageProps extends RouteChildrenProps<{ tokenId: string }> {
}

const CardPage = observer(({ match: { params: { tokenId } } }: ICardPageProps) => {
    const modalStore = useInjection(ModalStore);
    const walletStore = useInjection(WalletStore);

    const [ resourceType, setResourceType ] = useState<ResourcetypeResponse>();
    const [ balance, setBalance ] = useState(0);
    const [ loading, setLoading ] = useState(true);

    const loadBalance = async () => {
        const contract = walletStore.resourceContract;
        if (walletStore.address) {
            const balance = await contract.methods.balanceOf(walletStore.address, tokenId).call();
            setBalance(parseInt(balance));
        } else {
            setBalance(0);
        }
    }


    useAsyncEffect(async () => {
        setLoading(true);
        setBalance(0);
        setResourceType(undefined);
        try {
            const contract = walletStore.resourceContract;
            const resourceType = (await contract.methods.getResourceTypes([tokenId]).call())[0];
            setResourceType(resourceType);
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }, [tokenId]);

    useAsyncEffect(loadBalance, [tokenId, walletStore.lastBlock]);

    return (
        <main className="main">
            <section className="card-section">
                <div className="container">
                    {loading ? 'Loading...' : (
                        resourceType ? (
                            <div className="card-wrap">
                                <div className="card card_market">
                                    <div className="card__wrapper">
                                        <div className="card__wrap">
                                            <div className="card__image"><img src={`${IMAGES_CDN}/${resourceType.ipfsHash}.webp`} alt="" /></div>
                                        </div>
                                        <div className="card__body">
                                            <p className="card__text">#{tokenId}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-info">
                                    <h2 className="section-title">{resourceType.name}</h2>
                                    <div className="card-table">
                                        <div className="card-row"><span className="card__name">Name</span><span className="card__name">{resourceType.name}</span></div>
                                        <div className="card-row"><span>ID</span><span>{tokenId}</span></div>
                                        <div className="card-row"><span>Tier</span><span>{['None', 'Stone', 'Iron', 'Silver', 'Gold', 'Phi Stone'][parseInt(resourceType.tier)]}</span></div>
                                        <div className="card-row"><span>Weight</span><span>{resourceType.weight}</span></div>
                                        {walletStore.address && <div className="card-row"><span>Owned</span><span>{balance}</span></div>}
                                    </div>
                                    {walletStore.address && balance > 0 && (
                                        <div className="card-footer">
                                            <button className="btn primary" type="button" onClick={() => modalStore.showModal(ModalsEnum.Sell)}>Put on Marketplace</button>
                                            <button className="btn primary" type="button" onClick={() => modalStore.showModal(ModalsEnum.Transfer, { balance, tokenId })}>Transfer</button>
                                        </div>
                                    )}
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

export default CardPage;
