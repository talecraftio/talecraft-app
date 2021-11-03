import React, { useMemo, useRef, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { Game50Response } from "../utils/contracts/game";
import { observer } from "mobx-react";
import useAsyncEffect from "use-async-effect";
import { useAsyncMemo } from "use-async-memo";
import { toast } from "react-toastify";
import { ADDRESSES } from "../utils/contracts";
import { ZERO_ADDRESS } from "../utils/address";
import classNames from "classnames";
import _, { forEach } from "lodash";
import { IMAGES_CDN } from "../utils/const";
import AnimatedCardsWrap from '../components/AnimatedCardsWrap';
import { act } from "react-dom/test-utils";

interface IGamePageProps {
}

const GamePage = observer(({}: IGamePageProps) => {
    const walletStore = useInjection(WalletStore);
    const gameContract = walletStore.gameContract;
    const resourceContract = walletStore.resourceContract;

    const transitionOrigin = useRef<HTMLDivElement>();
    const item1SelfSlot = useRef<HTMLDivElement>();
    const item2SelfSlot = useRef<HTMLDivElement>();
    const item3SelfSlot = useRef<HTMLDivElement>();
    const item1RivalSlot = useRef<HTMLDivElement>();
    const item2RivalSlot = useRef<HTMLDivElement>();
    const item3RivalSlot = useRef<HTMLDivElement>();

    const [ slots, setSlots ] = useState<Game50Response[]>([]);
    const [ activeGame, setActiveGame ] = useState<Game50Response>();
    const [ activeSlot, setActiveSlot ] = useState<number>();
    const [ q, setQ ] = useState('');
    const [ logEntries, setLogEntries ] = useState<string[]>([]);

    const inventory = useAsyncMemo(() => walletStore.getInventory(), [walletStore.lastBlock]);
    const isPlayer1 = useMemo(() => activeGame?.player1.addr === walletStore.address, [walletStore.lastBlock, activeGame, walletStore.address]);
    const isTurn = useMemo(() => activeGame?.turn === (isPlayer1 ? '1' : '2'), [isPlayer1, activeGame, walletStore.address]);
    const selfInfo = useMemo(() => isPlayer1 ? activeGame?.player1 : activeGame?.player2, [activeGame]);
    const rivalInfo = useMemo(() => isPlayer1 ? activeGame?.player2 : activeGame?.player1, [activeGame]);

    const resourceTypes = useAsyncMemo(async () => {
        const contract = walletStore.resourceContract;
        const rtCount = await contract.methods.resourceCount().call();
        const resourceTypeIds = _.range(1, parseInt(rtCount)).map(i => i.toString());
        return await contract.methods.getResourceTypes(resourceTypeIds).call();
    }, []);

    useAsyncEffect(async () => {
        const slots = await gameContract.methods.getAllGames().call();
        setSlots(slots);
        if (!activeGame) {
            for (let i=0; i < slots.length; i++) {
                const slot = slots[i];
                if ([slot.player1.addr, slot.player2.addr].includes(walletStore.address) && !slot.finished) {
                    setActiveGame(slot);
                    setActiveSlot(i);
                    break;
                }
            }
        }
        if (activeGame) {
            setActiveGame(await gameContract.methods.getGameById(activeGame.gameId).call());
        }
    }, [walletStore.lastBlock]);

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
    }

    const onPlace = async (placeTokenId: string) => {
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
    }

    const filteredInventory = inventory
        .filter(item => q ? new RegExp(`.*${q}.*`, 'i').test(item.info.name) : true);

    return (
        <main className='main'>
            <section className="game-section">
                <div className="container">
                    <h2 className="section-title text-center">Board Game Mode</h2>
                    <div className="title-img"><img src={require('../images/border.png')} alt="alt"/></div>
                    <div className="join-wrap">
                        {slots.map((g, i) => {
                            let players = 0;
                            g.player1.addr !== ZERO_ADDRESS && players++;
                            g.player2.addr !== ZERO_ADDRESS && players++;
                            const isActive = activeGame?.gameId == g.gameId;
                            const isJoined = [g.player1.addr, g.player2.addr].includes(walletStore.address);
                            return (
                                <div className="join-col" key={i}>
                                    <button
                                        className={classNames('btn-join', isActive && 'active', isJoined && 'joined', players === 2 && !isJoined || g.finished && 'inactive')}
                                        type="button"
                                        onClick={() => onJoin(i, g)}
                                    >
                                        Join game {(i+1).toString().padStart(2, '0')} ({players}/2)
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {activeGame && resourceTypes && (
                <>
                    <section className="table-section" style={{ backgroundImage: `url(${require('../images/table-bg.jpeg')})` }}>
                        <div className="container">
                            <h2 className="section-title text-center" style={{ color: "white" }}>
                                {(() => {
                                    if (!activeGame.started) {
                                        return 'Waiting for the second player';
                                    } else if (activeGame.finished) {
                                        const winner1 = activeGame.winner === activeGame.player1.addr;
                                        return `Game finished, you ${(isPlayer1 ? winner1 : !winner1) ? 'won' : 'lost'}`;
                                    } else if (isTurn) {
                                        return 'Your turn';
                                    } else {
                                        return 'Opponent\'s turn';
                                    }
                                })()}
                            </h2>
                            <div className="table-bg">
                                <div className="table-wrap">
                                    <div className="cards-wrap">
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item1RivalSlot}>
                                                        {rivalInfo?.placedCards[0] !== '0' && <img src={`${IMAGES_CDN}/${resourceTypes[parseInt(rivalInfo?.placedCards[0]) - 1].ipfsHash}.webp`} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item2RivalSlot}>
                                                        {rivalInfo?.placedCards[1] !== '0' && <img src={`${IMAGES_CDN}/${resourceTypes[parseInt(rivalInfo?.placedCards[1]) - 1].ipfsHash}.webp`} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item3RivalSlot}>
                                                        {rivalInfo?.placedCards[2] !== '0' && <img src={`${IMAGES_CDN}/${resourceTypes[parseInt(rivalInfo?.placedCards[2]) - 1].ipfsHash}.webp`} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="table-img"><img src={require('../images/table-decor.png')} alt=""/></div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item1SelfSlot}>
                                                        {selfInfo?.placedCards[0] !== '0' && <img src={`${IMAGES_CDN}/${resourceTypes[parseInt(selfInfo?.placedCards[0]) - 1].ipfsHash}.webp`} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item2SelfSlot}>
                                                        {selfInfo?.placedCards[1] !== '0' && <img src={`${IMAGES_CDN}/${resourceTypes[parseInt(selfInfo?.placedCards[1]) - 1].ipfsHash}.webp`} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item3SelfSlot}>
                                                        {selfInfo?.placedCards[2] !== '0' && <img src={`${IMAGES_CDN}/${resourceTypes[parseInt(selfInfo?.placedCards[2]) - 1].ipfsHash}.webp`} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="table-decor" style={{ backgroundImage: `url(${require('../images/border.png')})` }}/>
                    </section>
                    {activeGame.started && !activeGame.finished && isTurn && (
                        <section className="collection-section">
                            <div className="container">
                                <h2 className="section-title text-center">My Card Collection</h2>
                                <div className="title-img"><img src={require('../images/border.png')} alt="alt"/></div>
                                <div className="form-search-wrap">
                                    <div className="form-search" >
                                        <div className="form-search__wrap">
                                            <input className="form__input" type="search" name="search" id="search" placeholder="Type your search here" value={q} onChange={e => setQ(e.target.value)}/>
                                            <button className="form-search__btn" type="submit">
                                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                                    <path d="M13.4401 1.91992C7.42506 1.91992 2.56006 6.78492 2.56006 12.7999C2.56006 18.8149 7.42506 23.6799 13.4401 23.6799C15.5876 23.6799 17.5751 23.0499 19.2601 21.9799L27.1201 29.8399L29.8401 27.1199L22.0801 19.3799C23.4751 17.5499 24.3201 15.2824 24.3201 12.7999C24.3201 6.78492 19.4551 1.91992 13.4401 1.91992ZM13.4401 4.47992C18.0476 4.47992 21.7601 8.19242 21.7601 12.7999C21.7601 17.4074 18.0476 21.1199 13.4401 21.1199C8.83256 21.1199 5.12006 17.4074 5.12006 12.7999C5.12006 8.19242 8.83256 4.47992 13.4401 4.47992Z" fill="#98753D"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className='cards-wrap'>
                                    {_.flatten(filteredInventory.map(item => (
                                        _.range(item.balance).map(i => (
                                            <div className='card'>
                                                <div
                                                    className="card__wrap"
                                                    key={`${item.tokenId}-${i}`}
                                                    onClick={async () => {
                                                        await onPlace(item.tokenId);
                                                    }}
                                                >
                                                    <div className="card__image">
                                                        <img src='data:image/svg+xml;utf8,<svg version="1.1" width="300" height="420" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                        <img src={`${IMAGES_CDN}/${item.info.ipfsHash}.webp`} alt="" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ))).concat(_.range(4).map(i => (
                                        <div className='card'>
                                            <div className="card__wrap" key={`filler-${i}`}>
                                                <div className="card__image">
                                                    <img src='data:image/svg+xml;utf8,<svg version="1.1" width="300" height="420" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                </div>
                                            </div>
                                        </div>
                                    )))}
                                </div>
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    )
});

export default GamePage;
