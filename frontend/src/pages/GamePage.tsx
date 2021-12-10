import React, { useMemo, useRef, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { GameinfoResponse } from "../utils/contracts/game";
import { observer } from "mobx-react";
import useAsyncEffect from "use-async-effect";
import { useAsyncMemo } from "use-async-memo";
import { toast } from "react-toastify";
import { ADDRESSES } from "../utils/contracts";
import { ZERO_ADDRESS } from "../utils/address";
import classNames from "classnames";
import _, { forEach } from "lodash";
import { IMAGES_CDN, MAX_UINT256 } from "../utils/const";
import AnimatedCardsWrap from '../components/AnimatedCardsWrap';
import { act } from "react-dom/test-utils";
import { toBN } from "../utils/number";
import { RouterStore } from "mobx-react-router";
import Timer from '../components/Timer';
import { usePrevious } from "react-use";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import Timeout from "await-timeout";

interface IGamePageProps {
}

const GamePage = observer(({}: IGamePageProps) => {
    const walletStore = useInjection(WalletStore);
    const routerStore = useInjection(RouterStore);
    const gameContract = walletStore.gameContract;
    const resourceContract = walletStore.resourceContract;

    const transitionOrigin = useRef<HTMLDivElement>();
    const item1SelfSlot = useRef<HTMLDivElement>();
    const item2SelfSlot = useRef<HTMLDivElement>();
    const item3SelfSlot = useRef<HTMLDivElement>();
    const item1RivalSlot = useRef<HTMLDivElement>();
    const item2RivalSlot = useRef<HTMLDivElement>();
    const item3RivalSlot = useRef<HTMLDivElement>();

    const [ slots, setSlots ] = useState<GameinfoResponse[]>([]);
    const [ activeGame, setActiveGame ] = useState<GameinfoResponse>();
    const prevActiveGame = usePrevious(activeGame);
    const [ activeSlot, setActiveSlot ] = useState<number>();
    const [ q, setQ ] = useState('');
    const [ logEntries, setLogEntries ] = useState<string[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ notificationsEnabled, setNotificationsEnabled ] = useState(true);
    const [ showLoadingAnim, setShowLoadingAnim ] = useState(false);
    const [ showWinAnim, setShowWinAnim ] = useState(false);
    const [ showLoseAnim, setShowLoseAnim ] = useState(false);

    const inventory = useAsyncMemo(() => walletStore.getInventory(), [walletStore.lastBlock]);
    const isPlayer1 = useMemo(() => activeGame?.player1.addr === walletStore.address, [walletStore.lastBlock, activeGame, walletStore.address]);
    const isTurn = useMemo(() => activeGame?.turn === (isPlayer1 ? '1' : '2'), [isPlayer1, activeGame, walletStore.address]);
    const selfInfo = useMemo(() => isPlayer1 ? activeGame?.player1 : activeGame?.player2, [activeGame]);
    const rivalInfo = useMemo(() => isPlayer1 ? activeGame?.player2 : activeGame?.player1, [activeGame]);

    const loadingAnimOptions = {
        animationData: require('../animations/loading.json'),
        assetsPath: 'https://app.talecraft.io/uploads/loading/',
        loop: true,
        autoplay: true,
    };
    const loadingAnimApi = useRef<LottieRefCurrentProps>();
    const loadingAnim = useMemo(() => <Lottie
        renderer='canvas'
        {...loadingAnimOptions}
        lottieRef={loadingAnimApi}
        style={{ width: 600, height: 300 }}
    />, []);

    const loseAnimOptions = {
        animationData: require('../animations/youLose.json'),
        assetsPath: 'https://app.talecraft.io/uploads/youLose/',
        loop: false,
        autoplay: true,
    };
    const loseAnimApi = useRef<LottieRefCurrentProps>();
    const loseAnim = useMemo(() => <Lottie
        renderer='canvas'
        {...loseAnimOptions}
        lottieRef={loseAnimApi}
        style={{ width: 600, height: 300 }}
        onComplete={() => { console.log('iter'); setShowLoseAnim(false) }}
    />, []);

    const winAnimOptions = {
        animationData: require('../animations/youWin.json'),
        assetsPath: 'https://app.talecraft.io/uploads/youWin/',
        loop: false,
        autoplay: true,
    };
    const winAnimApi = useRef<LottieRefCurrentProps>();
    const winAnim = useMemo(() => <Lottie
        renderer='canvas'
        {...winAnimOptions}
        lottieRef={winAnimApi}
        style={{ width: 600, height: 300 }}
        onComplete={() => { console.log('iter'); setShowWinAnim(false) }}
    />, []);

    useAsyncEffect(async () => {
        let slots = [];
        const maxId = parseInt(await gameContract.methods.maxSlotId().call());
        for (let i=0; i <= maxId; i += 50) {
            const page = await gameContract.methods.getAllGamesPaginated(i.toString(), Math.min(50, maxId - i).toString()).call();
            slots = slots.concat(page);
        }
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


        if (!prevActiveGame?.started && activeGame.started)
            new Notification('TaleCraft', { body: 'A game has started' });
        if (activeGame.started && !activeGame.finished && prevActiveGame?.turn !== activeGame.turn && isTurn)
            new Notification('TaleCraft', { body: 'Your turn' });
        if (prevActiveGame && !prevActiveGame.finished && activeGame.finished) {
            const isDraw = activeGame.winner === ZERO_ADDRESS;
            const isWon = activeGame.winner === walletStore.address;
            new Notification('TaleCraft', { body: `A game has finished, ${isDraw ? 'draw' : (isWon ? 'you won' : 'you lost')}` })
            if (isDraw) {}
            else if (isWon) {
                setShowWinAnim(true);
            } else {
                setShowLoseAnim(true);
            }
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
        }));
    }, [activeGame]);

    useAsyncEffect(async () => {
        setNotificationsEnabled(Notification.permission === 'granted');
    }, []);


    const filteredInventory = useMemo(() => inventory?.
        filter(item => parseInt(item.tokenId) > 4 && (q ? new RegExp(`.*${q}.*`, 'i').test(item.info.name) : true)), [inventory]);

    if (!walletStore.address) {
        return <div>Connect wallet first</div>;
    }

    const onJoin = async (slot: number, game: GameinfoResponse) => {
        setLoading(true);
        await Timeout.set(0);
        setShowLoadingAnim(true);
        await Timeout.set(0);
        loadingAnimApi.current.goToAndPlay(0, true);
        await Timeout.set(0);

        try {
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
        } finally {
            await Timeout.set(0);
            setLoading(false);
            await Timeout.set(0);
            setShowLoadingAnim(false);
            await Timeout.set(0);
        }
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

    const onAbort = async () => {
        setLoading(true);
        try {
            const tx = await walletStore.sendTransaction(gameContract.methods.abortGame(activeSlot.toString()));
            toast.success('Game aborted');
        } finally {
            setLoading(false);
        }
    }

    const onBoost = async () => {
        setLoading(true);
        try {
            const phi = walletStore.phiContract;
            if (toBN(await phi.methods.allowance(walletStore.address, ADDRESSES.game).call()).lt(await gameContract.methods.boostPrice().call())) {
                const tx = await walletStore.sendTransaction(phi.methods.approve(ADDRESSES.game, MAX_UINT256));
                toast.success(
                    <>
                        CRAFT approved successfully<br/>
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }
            const tx = await walletStore.sendTransaction(gameContract.methods.boost(activeSlot.toString()));
            toast.success('Boost applied');
        } finally {
            setLoading(false);
        }
    }

    const havePastGames = slots.filter((g, i) => g.finished && (g.player1.addr === walletStore.address || g.player2.addr === walletStore.address)).length > 0

    return (
        <main className='main'>
            <section className="game-section">
                <div className="container">
                    <h2 className="section-title text-center">Board Game Mode</h2>
                    <div className="title-img"><img src={require('../images/border.png')} alt="alt"/></div>
                    {/*<button className='btn primary' onClick={() => { setShowLoadingAnim(!showLoadingAnim); loadingAnimApi.current.goToAndPlay(0, true); }}>toggle loading</button>*/}
                    {!notificationsEnabled && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                            <button
                                className='btn primary'
                                onClick={async () => {
                                    setLoading(true);
                                    const perm = await Notification.requestPermission();
                                    setNotificationsEnabled(perm === 'granted');
                                    setLoading(false);
                                }}
                                disabled={loading}
                            >
                                Enable notifications
                            </button>
                        </div>
                    )}
                    {routerStore.location.hash === '#joinlist' && (
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
                    )}
                    {havePastGames && (
                        <>
                            <h3 className="section-title text-center">Your past games</h3>
                            <div className="join-wrap">
                                {slots.map((g, i) => {
                                    const isActive = activeGame?.gameId == g.gameId;
                                    const isJoined = [g.player1.addr, g.player2.addr].includes(walletStore.address);
                                    if (!isJoined || !g.finished) return null;
                                    return (
                                        <div className="join-col" key={i}>
                                            <button
                                                className={classNames('btn-join', isActive && 'active', isJoined && 'joined', !isJoined || g.finished && 'inactive')}
                                                type="button"
                                                onClick={() => onJoin(i, g)}
                                            >
                                                View game {(i+1).toString().padStart(2, '0')}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                    {activeGame && !activeGame.finished ? (
                        <h3 className="section-title text-center">You are playing</h3>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <button
                                className='btn primary'
                                onClick={() => {
                                    for (let i=0; i < slots.length; i++) {
                                        if (!slots[i].started) {
                                            onJoin(i, slots[i]);
                                            break;
                                        }
                                    }
                                }}
                                disabled={loading}
                            >
                                Join a new game
                            </button>
                            {showLoadingAnim && <div className='table-loading'>{loadingAnim}</div>}
                        </div>
                    )}
                </div>
            </section>

            {activeGame && walletStore.resourceTypes && (
                <>
                    <section className="table-section" style={{ backgroundImage: `url(${require('../images/table-bg.jpeg')})` }}>
                        <div className="container">
                            <div className="table-bg">
                                <div className='table-status'>
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
                                </div>
                                <div className="table-wrap">
                                    <div className="cards-wrap">
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item1RivalSlot}>
                                                        {rivalInfo?.placedCards[0] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[0])].ipfsHash}.webp`} />}
                                                        {rivalInfo?.boostUsedRound === '0' && <div className='card__img-multiplier'>{rivalInfo.boostValue}x</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item2RivalSlot}>
                                                        {rivalInfo?.placedCards[1] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[1])].ipfsHash}.webp`} />}
                                                        {rivalInfo?.boostUsedRound === '1' && <div className='card__img-multiplier'>{rivalInfo.boostValue}x</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item3RivalSlot}>
                                                        {rivalInfo?.placedCards[2] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[2])].ipfsHash}.webp`} />}
                                                        {rivalInfo?.boostUsedRound === '2' && <div className='card__img-multiplier'>{rivalInfo.boostValue}x</div>}
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
                                                        {selfInfo?.placedCards[0] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[0]) ].ipfsHash}.webp`} />}
                                                        {selfInfo?.boostUsedRound === '0' && <div className='card__img-multiplier'>{selfInfo.boostValue}x</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item2SelfSlot}>
                                                        {selfInfo?.placedCards[1] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[1])].ipfsHash}.webp`} />}
                                                        {selfInfo?.boostUsedRound === '1' && <div className='card__img-multiplier'>{selfInfo.boostValue}x</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={require('../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item3SelfSlot}>
                                                        {selfInfo?.placedCards[2] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[2])].ipfsHash}.webp`} />}
                                                        {selfInfo?.boostUsedRound === '2' && <div className='card__img-multiplier'>{selfInfo.boostValue}x</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {activeGame.started && !activeGame.finished && (
                                    <>
                                        <div className="table-timer">
                                            <Timer tillTimestamp={parseInt(activeGame.lastAction) + 5 * 60} />
                                        </div>
                                        <div className='table-action'>
                                            {!isTurn ? (
                                                +new Date() / 1000 - parseInt(activeGame.lastAction) >= 5 * 60 && (
                                                    <button className='btn red' onClick={onAbort} disabled={loading}>Abort</button>
                                                )
                                            ) : (
                                                (isPlayer1 && parseInt(activeGame.player1.boostUsedRound) === 0xFF || !isPlayer1 && parseInt(activeGame.player2.boostUsedRound) === 0xFF) && (
                                                    <button className='btn' onClick={onBoost} disabled={loading}>Boost</button>
                                                )
                                            )}
                                        </div>
                                    </>
                                )}
                                <div className="table-overlay-anim">
                                    {showWinAnim && winAnim}
                                    {showLoseAnim && loseAnim}
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
                                    {_.flatten(filteredInventory?.map(item => (
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
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                {/*{loadingAnim}*/}
                {/*{winAnim}*/}
                {/*{loseAnim}*/}
            </div>
        </main>
    )
});

export default GamePage;
