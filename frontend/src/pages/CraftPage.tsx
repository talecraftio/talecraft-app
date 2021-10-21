import React, { useRef, useState } from 'react';
import _ from "lodash";
import IntroSection from "../components/IntroSection";
import { toast } from "react-toastify";
import { Redirect, RouteChildrenProps } from "react-router";
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { InventoryItem } from "../../types";
import useAsyncEffect from "use-async-effect";
import { IMAGES_CDN, MAX_UINT256 } from "../utils/const";
import { PendingcraftResponse, ResourcetypeResponse } from "../utils/contracts/resource";
import classNames from "classnames";
import { toBN } from "../utils/number";
import { ADDRESSES } from "../utils/contracts";
import AnimatedCardsWrap from "../components/AnimatedCardsWrap";
import { motion } from 'framer-motion';

interface ICraftPageProps {
}

const PendingCraft = ({ craft, craftId, callback }: { craft: PendingcraftResponse, craftId: string, callback: () => any }) => {
    const walletStore = useInjection(WalletStore);

    const [ resourceType, setResourceType ] = useState<ResourcetypeResponse>();
    const [ claimLoading, setClaimLoading ] = useState(false);

    const onClaim = async () => {
        setClaimLoading(true);
        try {
            const contract = walletStore.resourceContract;
            const tx = await walletStore.sendTransaction(contract.methods.claimCraft(craftId));
            await walletStore.waitForNextBlock();
            toast.success(
                <>
                    Craft was successfully claimed<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
            callback();
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setClaimLoading(false);
        }
    }

    useAsyncEffect(async () => {
        if (!craft) return;
        setResourceType((await walletStore.resourceContract.methods.getResourceTypes([craft.tokenId]).call())[0]);
    }, [craft?.tokenId]);

    const claimable = parseInt(craft?.finishTimestamp) <= +new Date() / 1000;

    return (
        <div className="card card_claim">
            <div className="card__wrapper">
                <div className="card__wrap">
                    <div className="card__image">{resourceType && <img src={`${IMAGES_CDN}/${resourceType.ipfsHash}.webp`} alt="" />}</div>
                </div>
                <div className="card__btn">
                    <button className="btn primary up" type="button" disabled={!claimable || claimLoading} onClick={onClaim}>Claim</button>
                </div>
            </div>
            <div className={classNames('note active', claimable ? 'note_succcess' : 'note_error')}>
                {claimable ? (
                    <div className="note__wrap">
                        <div className="note__img"><img src={require('url:../images/!.svg')} alt="" /></div>
                        <p className="note__text">Available</p>
                    </div>
                ) : (
                    <div className="note__wrap">
                        <div className="note__img"><img src={require('url:../images/! (1).svg')} alt="" /></div>
                        <p className="note__text"><span>Pending duration: </span>{Math.round((parseInt(craft?.finishTimestamp) - +new Date() / 1000) / 60)} mins</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const CraftPage = observer(({}: ICraftPageProps) => {
    const walletStore = useInjection(WalletStore);

    const transitionOrigin = useRef<HTMLDivElement>();
    const item1Slot = useRef<HTMLDivElement>();
    const item2Slot = useRef<HTMLDivElement>();

    const [ inventory, setInventory ] = useState<InventoryItem[]>([]);
    const [ item1, setItem1 ] = useState<InventoryItem>();
    const [ item2, setItem2 ] = useState<InventoryItem>();
    const [ item1i, setItem1i ] = useState(0);
    const [ item2i, setItem2i ] = useState(0);
    const [ resultLoading, setResultLoading ] = useState(false);
    const [ resultItemId, setResultItemId ] = useState<string>();
    const [ resultItem, setResultItem ] = useState<ResourcetypeResponse>();
    const [ q, setQ ] = useState('');
    const [ craftLoading, setCraftLoading ] = useState(false);
    const [ pendingCraftsIds, setPendingCraftsIds ] = useState<string[]>([]);
    const [ pendingCrafts, setPendingCrafts ] = useState<PendingcraftResponse[]>([]);

    const updateData = async () => {
        if (!walletStore.address)
            return;

        const contract = walletStore.resourceContract;
        const pendingCraftsIds = await contract.methods.pendingCrafts(walletStore.address).call();
        setPendingCrafts(await contract.methods.getCrafts(pendingCraftsIds).call());
        setPendingCraftsIds(pendingCraftsIds);

        setInventory(await walletStore.getInventory());
    };

    useAsyncEffect(updateData, [walletStore.address, walletStore.lastBlock]);

    useAsyncEffect(async () => {
        if (!item1 || !item2) {
            setResultItem(undefined);
            setResultLoading(false);
            return;
        }
        setResultLoading(true);
        const contract = walletStore.resourceContract;
        const resultId = await contract.methods.getCraftingResult(item1.tokenId, item2.tokenId).call();
        if (resultId !== '0') {
            setResultItemId(resultId);
            const resultItem = (await contract.methods.getResourceTypes([resultId]).call())[0];
            setResultItem(resultItem);
            console.log(resultItem);
        }
        setResultLoading(false);
    }, [item1, item2]);

    if (!walletStore.initialized)
        return null;

    if (!walletStore.connected) {
        toast.error('You must connect your wallet in order to access this page');
        return <Redirect to='/' />;
    }

    const onCraft = async () => {
        if (!resultItem) return;

        setCraftLoading(true);
        try {
            const phi = walletStore.phiContract;
            const maxTier = Math.max(parseInt(item1.info.tier), parseInt(item2.info.tier));
            if (toBN(await phi.methods.allowance(walletStore.address, ADDRESSES.resource).call()).lt(`${maxTier}e18`)) {
                const tx = await walletStore.sendTransaction(phi.methods.approve(ADDRESSES.resource, MAX_UINT256));
                toast.success(
                    <>
                        $CRAFT approved successfully<br />
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }

            const contract = walletStore.resourceContract;
            const tx = await walletStore.sendTransaction(contract.methods.craft(resultItemId));

            await walletStore.waitForNextBlock();

            setItem1(undefined);
            setItem2(undefined);
            toast.success(
                <>
                    Craft was started<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
            updateData();
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setCraftLoading(false);
        }
    }

    const filteredInventory = inventory
        .filter(item => q ? new RegExp(`.*${q}.*`, 'i').test(item.info.name) : true);

    return (
        <main className="main">
            <IntroSection background={require('url:../images/intro-2.webp')} title={<>Alchemist’s<br />Table</>} />
            <section className="craft-section">
                <div className="container">
                    <div className="cards-wrap">
                        <div className="card card_craft">
                            <div className="card__wrapper">
                                <div className="card__wrap">
                                    <div className="card__image"
                                         onClick={() => {
                                             if (!craftLoading) { setItem1(undefined); transitionOrigin.current = item1Slot.current }
                                         }}
                                         ref={item1Slot}
                                    >
                                        <img src='data:image/svg+xml;utf8,<svg version="1.1" width="300" height="420" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                        {item1 && (<motion.img src={`${IMAGES_CDN}/${item1.info.ipfsHash}.webp`} style={{ display: 'none' }} animate={{ display: 'block' }} transition={{ delay: .3 }} alt="" />)}
                                    </div>
                                    <p className="card__label">{!item1 && 'Select'} Item 1</p>
                                </div>
                            </div>
                        </div>
                        <div className="card card_craft">
                            <div className="card__wrapper">
                                <div className="card__wrap">
                                    <div className="card__image">
                                        <img src='data:image/svg+xml;utf8,<svg version="1.1" width="300" height="420" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                        {resultItem && (<img src={`${IMAGES_CDN}/${resultItem.ipfsHash}.webp`} alt="" />)}
                                    </div>
                                    <p className="card__label">
                                        {(!item1 || !item2) ? 'Select items' : (
                                            resultLoading ? 'Loading...' : (
                                                resultItem ? 'Result' : 'No result'
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="card card_craft">
                            <div className="card__wrapper">
                                <div className="card__wrap">
                                    <div className="card__image"
                                         onClick={() => {
                                             if (!craftLoading) { setItem2(undefined); transitionOrigin.current = item2Slot.current }
                                         }}
                                         ref={item2Slot}
                                    >
                                        <img src='data:image/svg+xml;utf8,<svg version="1.1" width="300" height="420" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                        {item2 && (<motion.img src={`${IMAGES_CDN}/${item2.info.ipfsHash}.webp`} style={{ display: 'none' }} animate={{ display: 'block' }} transition={{ delay: .3 }} alt="" />)}
                                    </div>
                                    <p className="card__label">{!item2 && 'Select'} Item 2</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="btn primary up" disabled={craftLoading || !resultItem} type="button" onClick={onCraft}>CRAFT</button>
                </div>
            </section>
            <section className="pending-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">Pending Crafts</h2>
                    <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                    <div className="cards-wrap">
                        {_.zip(pendingCraftsIds, pendingCrafts).map(([ craftId, craft ], i) => (
                            <PendingCraft craft={craft} craftId={craftId} key={`${craftId}_${i}`} callback={() => updateData()} />
                        ))}
                    </div>
                </div>
            </section>
            <section className="collection-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">My Card Collection</h2>
                    <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                    <div className="form-search-wrap">
                        <form className="form-search" action="#">
                            <div className="form-search__wrap">
                                <input className="form__input" type="search" name="search" id="search"
                                       placeholder="Type your search here" value={q} onChange={e => setQ(e.target.value)} />
                                <button className="form-search__btn" type="submit">
                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                        <path
                                            d="M13.4401 1.91992C7.42506 1.91992 2.56006 6.78492 2.56006 12.7999C2.56006 18.8149 7.42506 23.6799 13.4401 23.6799C15.5876 23.6799 17.5751 23.0499 19.2601 21.9799L27.1201 29.8399L29.8401 27.1199L22.0801 19.3799C23.4751 17.5499 24.3201 15.2824 24.3201 12.7999C24.3201 6.78492 19.4551 1.91992 13.4401 1.91992ZM13.4401 4.47992C18.0476 4.47992 21.7601 8.19242 21.7601 12.7999C21.7601 17.4074 18.0476 21.1199 13.4401 21.1199C8.83256 21.1199 5.12006 17.4074 5.12006 12.7999C5.12006 8.19242 8.83256 4.47992 13.4401 4.47992Z"
                                            fill="#98753D"/>
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                    <AnimatedCardsWrap transitionOrigin={transitionOrigin.current}>
                        {_.flatten(filteredInventory.map(item => (
                            _.range(item.balance).filter(i => !((item1 && item1?.tokenId == item.tokenId && i == item1i) || (item2 && item2?.tokenId == item.tokenId && i == item2i))).map(i => (
                                // <div key={`${item.tokenId}-${i}`} className="card">
                                    <div
                                        className="card__wrap"
                                        key={`${item.tokenId}-${i}`}
                                        onClick={() => {
                                            if (craftLoading)
                                                return;

                                            if (!item1) {
                                                setItem1(item);
                                                setItem1i(i);
                                                transitionOrigin.current = item1Slot.current;
                                            } else if (!item2) {
                                                setItem2(item);
                                                setItem2i(i);
                                                transitionOrigin.current = item2Slot.current;
                                            } else
                                                toast.error('Please free an item slot first');
                                        }}
                                    >
                                        <div className="card__image">
                                            <img src='data:image/svg+xml;utf8,<svg version="1.1" width="300" height="420" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                            <img src={`${IMAGES_CDN}/${item.info.ipfsHash}.webp`} alt="" />
                                        </div>
                                    </div>
                                // </div>
                            ))
                        ))).concat(_.range(4).map(i => (
                            // <div className="card" key={`filler-${i}`}>
                                <div className="card__wrap" key={`filler-${i}`}>
                                    <div className="card__image">
                                        <img src='data:image/svg+xml;utf8,<svg version="1.1" width="300" height="420" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                    </div>
                                </div>
                            // </div>
                        )))}
                    </AnimatedCardsWrap>
                </div>
            </section>
        </main>
    )
});

export default CraftPage;
