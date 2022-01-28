import React, { useState } from 'react';
import DDSlick from "../components/DDSlick";
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { ResourcetypeResponse } from "../utils/contracts/resource";
import useAsyncEffect from "use-async-effect";
import _ from "lodash";
import BN from "bignumber.js";
import { fd, toBN } from "../utils/number";
import { toast } from "react-toastify";
import { Redirect } from "react-router";
import { InventoryItem } from "../../types";
import { IMAGES_CDN } from "../utils/const";
import { Link } from 'react-router-dom';

interface IWalletPageProps {
}

const WalletPage = observer(({}: IWalletPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ loading, setLoading ] = useState(true);
    const [ inventory, setInventory ] = useState<InventoryItem[]>([]);
    const [ phiBalance, setPhiBalance ] = useState<BN>(toBN(0));
    const [ ethBalance, setEthBalance ] = useState<BN>(toBN(0));

    useAsyncEffect(async () => {
        if (!walletStore.address)
            return;

        const phi = walletStore.phiContract;

        setPhiBalance(toBN(await phi.methods.balanceOf(walletStore.address).call()).div('1e18'));
        setEthBalance(toBN(await walletStore.web3.eth.getBalance(walletStore.address)).div('1e18'));

        setInventory(await walletStore.getInventory());
        setLoading(false);
    }, [walletStore.address, walletStore.lastBlock]);

    if (!walletStore.initialized)
        return null;

    if (!walletStore.connected) {
        toast.error('You must connect your wallet in order to access this page');
        return <Redirect to='/' />;
    }

    return (
            <section className="wallet-section">
                <div className="container">
                    <div className="market-content">
                        <div className="market-sidebar">
                            <div className="staking staking_wallet">
                                <div className="staking__wrap">
                                    <h2 className="section-title text-center">My wallet</h2>
                                    <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                                    <div className="staking__row">
                                        <p className="staking__text">AVAX balance: <span>{fd(ethBalance)} AVAX</span></p>
                                    </div>
                                    <div className="staking__row">
                                        <p className="staking__text">CRAFT balance: <span>{fd(phiBalance)} CRAFT</span></p>
                                    </div>
                                    <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                                    <div className="staking__row">
                                        <p className="staking__text">Unique resources: <span>{inventory.length}</span></p>
                                    </div>
                                    <div className="staking__row">
                                        <p className="staking__text">Total resources: <span>{_.sum(inventory.map(inv => inv.balance))}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="market-wrap">
                            <div className="cards-wrap">
                                {loading ? (
                                    <p className='market__status'>Loading...</p>
                                ) : (
                                    inventory.length > 0 ? (
                                        inventory.map(inv => (
                                            <Link className="card card_market" to={`/card/${inv.tokenId}`} key={inv.tokenId}>
                                                <div className="card__wrapper">
                                                    <div className="card__wrap">
                                                        <div className="card__image"><img src={`${IMAGES_CDN}/${inv.info?.ipfsHash}.webp`} alt="" /></div>
                                                    </div>
                                                    <div className="card__body">
                                                        <p className="card__text">{inv.balance}x #{inv.tokenId}</p>
                                                        <p className="card__descr"><span>{inv.info.name}</span></p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className='market__status'>You have no resources in your collection</p>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
    )
});

export default WalletPage;
