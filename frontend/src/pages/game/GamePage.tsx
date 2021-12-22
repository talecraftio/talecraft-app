import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../../stores/WalletStore";
import { GameinfoResponse } from "../../utils/contracts/game2";
import { observer } from "mobx-react";
import useAsyncEffect from "use-async-effect";
import { useAsyncMemo } from "use-async-memo";
import { toast } from "react-toastify";
import { ADDRESSES } from "../../utils/contracts";
import { ZERO_ADDRESS } from "../../utils/address";
import _, { forEach } from "lodash";
import { IMAGES_CDN, MAX_UINT256 } from "../../utils/const";
import { toBN } from "../../utils/number";
import { RouterStore } from "mobx-react-router";
import Timer from '../../components/Timer';
import { usePrevious } from "react-use";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import Timeout from "await-timeout";
import { RouteComponentProps } from "react-router";
import classNames from "classnames";

interface IGamePageProps extends RouteComponentProps {
}

const GreenLight = () => {
    const greenAnimOptions = {
        animationData: require('../../animations/Green_Light_Complete.json'),
        assetsPath: 'https://app.talecraft.io/uploads/lights/Green_Light_Complete/images/',
        loop: false,
        autoplay: true,
    };
    const greenAnimApi = useRef<LottieRefCurrentProps>();
    return (
        <Lottie
            renderer='canvas'
            {...greenAnimOptions}
            lottieRef={greenAnimApi}
            style={{ width: 137, height: 137 }}
            onComplete={() => { greenAnimApi.current.goToAndPlay(90, true) }}
        />
    );
}

const YellowLight = () => {
    const yellowAnimOptions = {
        animationData: require('../../animations/Yellow_Light_Complete.json'),
        assetsPath: 'https://app.talecraft.io/uploads/lights/Yellow_Light_Complete/images/',
        loop: false,
        autoplay: true,
    };
    const yellowAnimApi = useRef<LottieRefCurrentProps>();
    return (
        <Lottie
            renderer='canvas'
            {...yellowAnimOptions}
            lottieRef={yellowAnimApi}
            style={{ width: 137, height: 137 }}
            onComplete={() => { yellowAnimApi.current.goToAndPlay(90, true) }}
        />
    );
}

const RedLight = () => {
    const redAnimOptions = {
        animationData: require('../../animations/Red_Light_Complete.json'),
        assetsPath: 'https://app.talecraft.io/uploads/lights/Red_Light_Complete/images/',
        loop: false,
        autoplay: true,
    };
    const redAnimApi = useRef<LottieRefCurrentProps>();
    return (
        <Lottie
            renderer='canvas'
            {...redAnimOptions}
            lottieRef={redAnimApi}
            style={{ width: 137, height: 137 }}
            onComplete={() => { redAnimApi.current.goToAndPlay(90, true) }}
        />
    );
}



const GamePage = observer(({ location }: IGamePageProps) => {
    const walletStore = useInjection(WalletStore);
    const league = location.pathname.split('/')[2];
    let gameAddress;
    switch (league) {
        case 'junior':
            gameAddress = ADDRESSES.games['0']; break;
        case 'senior':
            gameAddress = ADDRESSES.games['1']; break;
        case 'master':
            gameAddress = ADDRESSES.games['2']; break;
    }
    const gameContract = walletStore.getGame2Contract(gameAddress);
    const phiContract = walletStore.phiContract;
    const resourceContract = walletStore.resourceContract;

    const spectate = location.hash.includes('spec');
    const [ spectateNumber, setSpectateNumber ] = useState('');

    const item1SelfSlot = useRef<HTMLDivElement>();
    const item2SelfSlot = useRef<HTMLDivElement>();
    const item3SelfSlot = useRef<HTMLDivElement>();
    const item1RivalSlot = useRef<HTMLDivElement>();
    const item2RivalSlot = useRef<HTMLDivElement>();
    const item3RivalSlot = useRef<HTMLDivElement>();

    const [ activeGame, setActiveGame ] = useState<GameinfoResponse>();
    const prevActiveGame = usePrevious(activeGame);
    const [ q, setQ ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ notificationsEnabled, setNotificationsEnabled ] = useState(true);
    const [ pastGames, setPastGames ] = useState<GameinfoResponse[]>([]);
    const [ showLoadingAnim, setShowLoadingAnim ] = useState(false);
    const [ showWinAnim, setShowWinAnim ] = useState(false);
    const [ showLoseAnim, setShowLoseAnim ] = useState(false);

    const inventory = useAsyncMemo(() => walletStore.getInventory(), [walletStore.lastBlock]);
    const isPlayer0 = useMemo(() => activeGame?.player[0].addr === walletStore.address, [walletStore.lastBlock, activeGame, walletStore.address]);
    const isTurn = useMemo(() => activeGame?.turn === (isPlayer0 ? '0' : '1'), [isPlayer0, activeGame, walletStore.address]);
    const selfInfo = useMemo(() => isPlayer0 ? activeGame?.player[0] : activeGame?.player[1], [activeGame]);
    const rivalInfo = useMemo(() => isPlayer0 ? activeGame?.player[1] : activeGame?.player[0], [activeGame]);

    const loadingAnimOptions = {
        animationData: require('../../animations/loading.json'),
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
        animationData: require('../../animations/youLose.json'),
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
        onComplete={() => { setShowLoseAnim(false) }}
    />, []);

    const winAnimOptions = {
        animationData: require('../../animations/youWin.json'),
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
        onComplete={() => { setShowWinAnim(false) }}
    />, []);

    const boostAnimOptions = {
        animationData: require('../../animations/boost.json'),
        assetsPath: 'https://app.talecraft.io/uploads/boost/images/',
        loop: true,
        autoplay: true,
    };
    const boostAnimApi = useRef<LottieRefCurrentProps>();
    const boostAnim = useMemo(() => <Lottie
        className='boost-anim'
        renderer='canvas'
        {...boostAnimOptions}
        lottieRef={boostAnimApi}
        style={{ width: 600, height: 840 }}
    />, []);

    const getLight = (round: number) => {
        if (!activeGame || activeGame.player[0].placedCards[round] == '0' || activeGame.player[1].placedCards[round] == '0')
            // return (<YellowLight />);
            return (
                <div>
                    <img src={require('url:../../images/empty_bulb.png')} style={{ width: '100%', height: '100%' }} />
                </div>
            );
        let p0w = parseInt(walletStore.resourceTypes[activeGame.player[0].placedCards[round]].weight);
        if (activeGame.player[0].boostUsedRound == round.toString())
            p0w *= parseInt(activeGame.player[0].boostValue);
        let p1w = parseInt(walletStore.resourceTypes[activeGame.player[1].placedCards[round]].weight);
        if (activeGame.player[1].boostUsedRound == round.toString())
            p1w *= parseInt(activeGame.player[1].boostValue);
        if (p0w > p1w)
            return isPlayer0 ? <GreenLight /> : <RedLight />;
        else if (p1w > p0w)
            return isPlayer0 ? <RedLight /> : <GreenLight />;
        else
            return <YellowLight />;
    }

    const light0 = useMemo(
        () => getLight(0),
        [activeGame?.player[0].placedCards[0], activeGame?.player[1].placedCards[0]]
    );
    const light1 = useMemo(
        () => getLight(1),
        [activeGame?.player[0].placedCards[1], activeGame?.player[1].placedCards[1]]
    );
    const light2 = useMemo(
        () => getLight(2),
        [activeGame?.player[0].placedCards[2], activeGame?.player[1].placedCards[2]]
    );

    useAsyncEffect(async () => {
        if (!walletStore.address)
            return;
        let activeGameId = await gameContract.methods.currentGames(walletStore.address).call();
        if (activeGameId === '0')
            if (activeGame)
                activeGameId = activeGame.gameId;
        if (activeGameId !== '0') {
            const game = await gameContract.methods.game(activeGameId).call();
            setActiveGame(game);
        }
        const pastGamesIds = await gameContract.methods.playerGames(walletStore.address).call();
        setPastGames((await Promise.all(pastGamesIds.map(gid => gameContract.methods.game(gid).call()))).filter(g => g.finished));
    }, [walletStore.lastBlock, walletStore.connected]);

    useAsyncEffect(async () => {
        if (!activeGame)
            return;

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
    }, [activeGame]);

    useAsyncEffect(async () => {
        setNotificationsEnabled(Notification.permission === 'granted');
    }, []);


    const filteredInventory = useMemo(() => inventory?.
        filter(item => parseInt(item.tokenId) > 4 && (q ? new RegExp(`.*${q}.*`, 'i').test(item.info.name) : true)), [inventory]);

    if (!walletStore.connected) {
        return (
            <main className="main leaderboards" style={{ color: 'white' }}>
                <div className="container" style={{ marginTop: 150 }}>
                    Connect wallet to access this page
                </div>
            </main>
        );
    }

    const onJoin = async () => {
        setLoading(true);
        await Timeout.set(0);
        setShowLoadingAnim(true);
        await Timeout.set(0);
        loadingAnimApi.current.goToAndPlay(0, true);
        await Timeout.set(0);

        try {
            const phiAllowance = toBN(await phiContract.methods.allowance(walletStore.address, gameAddress).call());
            if (phiAllowance.lt(toBN(await gameContract.methods.boostPrice().call()).plus(await gameContract.methods.joinPrice().call()))) {
                const tx = await walletStore.sendTransaction(phiContract.methods.approve(gameAddress, MAX_UINT256));
                toast.success(
                    <>
                        CRAFT approved successfully<br/>
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }

            const resourceAllowance = await resourceContract.methods.isApprovedForAll(walletStore.address, gameAddress).call();
            if (!resourceAllowance) {
                const tx = await walletStore.sendTransaction(resourceContract.methods.setApprovalForAll(gameAddress, true));
                toast.success(
                    <>
                        Resource approved successfully<br/>
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }

            await walletStore.sendTransaction(gameContract.methods.joinGame());
            toast.success('Joined game');
            walletStore.triggerBlockChange();
        } finally {
            await Timeout.set(0);
            setLoading(false);
            await Timeout.set(0);
            setShowLoadingAnim(false);
            await Timeout.set(0);
        }
    }

    const onLeave = async () => {
        await walletStore.sendTransaction(gameContract.methods.leaveGame());
        toast.success('Game abandoned');
        setActiveGame(undefined);
        walletStore.triggerBlockChange();
    }

    const onPlace = async (placeTokenId: string) => {
        if ((await resourceContract.methods.balanceOf(walletStore.address, placeTokenId).call()) === '0') {
            toast.error('You do not own tokens with this ID');
            return;
        }

        await walletStore.sendTransaction(gameContract.methods.placeCard(placeTokenId));
        toast.success('Placed');
        walletStore.triggerBlockChange();
    }

    const onAbort = async () => {
        setLoading(true);
        try {
            const tx = await walletStore.sendTransaction(gameContract.methods.abort());
            toast.success('Game aborted');
            walletStore.triggerBlockChange();
        } finally {
            setLoading(false);
        }
    }

    const onBoost = async () => {
        setLoading(true);
        try {
            const tx = await walletStore.sendTransaction(gameContract.methods.boost());
            toast.success('Boost applied');
            walletStore.triggerBlockChange();
        } finally {
            setLoading(false);
        }
    }

    const onSpectate = async (gameId: string) => {
        setLoading(true);
        setActiveGame(await gameContract.methods.game(gameId).call());
        setLoading(false);
    }



    return (
        <main className='main'>
            <section className="game-section">
                <div className="container">
                    <h2 className="section-title text-center">Board Game Mode</h2>
                    <div className="title-img"><img src={require('../../images/border.png')} alt="alt"/></div>
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
                    {pastGames.length > 0 && (
                        <>
                            <h3 className="section-title text-center">Your past games</h3>
                            <div className="join-wrap">
                                {pastGames.map((g, i) => {
                                    const isActive = activeGame?.gameId == g.gameId;
                                    return (
                                        <div className="join-col" key={i}>
                                            <button
                                                className={classNames('btn-join', isActive && 'active')}
                                                type="button"
                                                onClick={() => onSpectate(g.gameId)}
                                            >
                                                View game #{(i+1).toString()}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                    {activeGame && !activeGame.finished ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h3 className="section-title text-center">You are playing</h3>
                            {activeGame && !activeGame.started && (+new Date() / 1000) >= parseInt(activeGame.lastAction) + 7 * 60 && (
                                <button
                                    className='btn primary'
                                    onClick={() => onLeave()}
                                    disabled={loading}
                                >
                                    Leave game
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <button
                                className='btn primary'
                                onClick={() => onJoin()}
                                disabled={loading}
                            >
                                Join a new game
                            </button>
                            {showLoadingAnim && <div className='table-loading'>{loadingAnim}</div>}
                        </div>
                    )}
                    {spectate && (
                        <form onSubmit={async (e: React.FormEvent) => {
                            e.preventDefault();
                            setActiveGame(await gameContract.methods.game(spectateNumber).call());
                        }}>
                            <input type='number' value={spectateNumber} onChange={e => setSpectateNumber(e.target.value)} className='form__field form__input' />
                            <button type='submit' className='btn primary'>spectate</button>
                        </form>
                    )}
                </div>
            </section>

            {activeGame && walletStore.resourceTypes && (
                <>
                    <section className="table-section" style={{ backgroundImage: `url(${require('../../images/table-bg.jpeg')})` }}>
                        <div className="container">
                            <div className="table-bg">
                                <div className='table-status'>
                                    {(() => {
                                        if (!activeGame.started) {
                                            return 'Waiting for the second player';
                                        } else if (activeGame.finished) {
                                            if (activeGame.winner === ZERO_ADDRESS)
                                                return 'Game finished, draw';
                                            const winner0 = activeGame.winner === activeGame.player[0].addr;
                                            return `Game finished, you ${(isPlayer0 ? winner0 : !winner0) ? 'won' : 'lost'}`;
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
                                                    <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                    <img src={require('../../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item1RivalSlot}>
                                                        {rivalInfo?.placedCards[0] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[0])].ipfsHash}.webp`} />}
                                                        {rivalInfo?.boostUsedRound === '0' && <div className='card__img-multiplier'>{rivalInfo.boostValue}x</div>}
                                                    </div>
                                                    {rivalInfo?.boostUsedRound === '0' && boostAnim}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                    <img src={require('../../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item2RivalSlot}>
                                                        {rivalInfo?.placedCards[1] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[1])].ipfsHash}.webp`} />}
                                                        {rivalInfo?.boostUsedRound === '1' && <div className='card__img-multiplier'>{rivalInfo.boostValue}x</div>}
                                                    </div>
                                                    {rivalInfo?.boostUsedRound === '1' && boostAnim}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                    <img src={require('../../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item3RivalSlot}>
                                                        {rivalInfo?.placedCards[2] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[2])].ipfsHash}.webp`} />}
                                                        {rivalInfo?.boostUsedRound === '2' && <div className='card__img-multiplier'>{rivalInfo.boostValue}x</div>}
                                                    </div>
                                                    {rivalInfo?.boostUsedRound === '2' && boostAnim}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="table-img">
                                            <img src={require('../../images/table-decor.png')} alt=""/>
                                            <div className="table-lights">
                                                {light0}
                                                {light1}
                                                {light2}
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                    <img src={require('../../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item1SelfSlot}>
                                                        {selfInfo?.placedCards[0] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[0]) ].ipfsHash}.webp`} />}
                                                        {selfInfo?.boostUsedRound === '0' && <div className='card__img-multiplier'>{selfInfo.boostValue}x</div>}
                                                    </div>
                                                    {selfInfo?.boostUsedRound === '0' && boostAnim}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                    <img src={require('../../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item2SelfSlot}>
                                                        {selfInfo?.placedCards[1] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[1])].ipfsHash}.webp`} />}
                                                        {selfInfo?.boostUsedRound === '1' && <div className='card__img-multiplier'>{selfInfo.boostValue}x</div>}
                                                    </div>
                                                    {selfInfo?.boostUsedRound === '1' && boostAnim}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card card_table">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                    <img src={require('../../images/board.jpg')} alt=""/>
                                                    <div className="card__img-inner" ref={item3SelfSlot}>
                                                        {selfInfo?.placedCards[2] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[2])].ipfsHash}.webp`} />}
                                                        {selfInfo?.boostUsedRound === '2' && <div className='card__img-multiplier'>{selfInfo.boostValue}x</div>}
                                                    </div>
                                                    {selfInfo?.boostUsedRound === '2' && boostAnim}
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
                                                (isPlayer0 && parseInt(activeGame.player[0].boostUsedRound) === 0xFF || !isPlayer0 && parseInt(activeGame.player[1].boostUsedRound) === 0xFF) && (
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
                                <div className="table-debug">
                                    Game ID: #{activeGame.gameId} {league}
                                </div>
                            </div>
                        </div>
                        <div className="table-decor" style={{ backgroundImage: `url(${require('../../images/border.png')})` }}/>
                    </section>
                    {activeGame.started && !activeGame.finished && isTurn && (
                        <section className="collection-section">
                            <div className="container">
                                <h2 className="section-title text-center">My Card Collection</h2>
                                <div className="title-img"><img src={require('../../images/border.png')} alt="alt"/></div>
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
