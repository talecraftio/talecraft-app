import React, { useMemo, useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { ZERO_ADDRESS } from "../utils/address";
import _, { parseInt } from "lodash";
import { IMAGES_CDN } from "../utils/const";
import Timer from "./Timer";
import ChatWidget from "./ChatWidget";
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { GameinfoResponse } from "../utils/contracts/game2";
import { useAsyncMemo } from "use-async-memo";
import { ContractContext as GameBaseContract } from '../utils/contracts/gameBase';
import useAsyncEffect from "use-async-effect";
import { usePrevious } from "react-use";
import { toast } from "react-toastify";
import { observer } from "mobx-react";

interface IGameComponentProps {
    activeGame: GameinfoResponse;
    gameContract: GameBaseContract;
    debugName: string;
}

enum PowerType {
    Water = '0',
    Fire = '1',
    Air = '2',
    Earth = '3',
}

const GreenLight = () => {
    const greenAnimOptions = {
        animationData: require('../animations/Green_Light_Complete.json'),
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
        animationData: require('../animations/Yellow_Light_Complete.json'),
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
        animationData: require('../animations/Red_Light_Complete.json'),
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

const GameComponent = observer(({ activeGame, gameContract, debugName }: IGameComponentProps) => {
    const walletStore = useInjection(WalletStore);

    const prevActiveGame = usePrevious(activeGame);
    const [ showWinAnim, setShowWinAnim ] = useState(false);
    const [ showLoseAnim, setShowLoseAnim ] = useState(false);
    const [ q, setQ ] = useState('');
    const [ loading, setLoading ] = useState(false);

    const item1SelfSlot = useRef<HTMLDivElement>();
    const item2SelfSlot = useRef<HTMLDivElement>();
    const item3SelfSlot = useRef<HTMLDivElement>();
    const item1RivalSlot = useRef<HTMLDivElement>();
    const item2RivalSlot = useRef<HTMLDivElement>();
    const item3RivalSlot = useRef<HTMLDivElement>();

    const inventory = useAsyncMemo(() => activeGame ? gameContract.methods.getPlayerInventory(activeGame.gameId, walletStore.address).call() : undefined, [walletStore.lastBlock, activeGame]);
    const isPlayer0 = useMemo(() => activeGame?.player[0].addr === walletStore.address, [walletStore.lastBlock, activeGame, walletStore.address]);
    const isTurn = useMemo(() => activeGame?.turn === (isPlayer0 ? '0' : '1'), [isPlayer0, activeGame, walletStore.address]);
    const selfInfo = useMemo(() => isPlayer0 ? activeGame?.player[0] : activeGame?.player[1], [activeGame]);
    const rivalInfo = useMemo(() => isPlayer0 ? activeGame?.player[1] : activeGame?.player[0], [activeGame]);

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
        onComplete={() => { setShowLoseAnim(false) }}
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
        onComplete={() => { setShowWinAnim(false) }}
    />, []);

    const boostAirAnimOptions = {
        animationData: require('../animations/frameAir.json'),
        assetsPath: 'https://app.talecraft.io/uploads/boost/air/images/',
        loop: true,
        autoplay: true,
    };
    const boostAirAnimApi = useRef<LottieRefCurrentProps>();
    const boostAirAnim = useMemo(() => <Lottie
        className='boost-anim'
        renderer='canvas'
        {...boostAirAnimOptions}
        lottieRef={boostAirAnimApi}
        style={{ width: 600, height: 840 }}
    />, []);

    const boostEarthAnimOptions = {
        animationData: require('../animations/frameEarth.json'),
        assetsPath: 'https://app.talecraft.io/uploads/boost/earth/images/',
        loop: true,
        autoplay: true,
    };
    const boostEarthAnimApi = useRef<LottieRefCurrentProps>();
    const boostEarthAnim = useMemo(() => <Lottie
        className='boost-anim'
        renderer='canvas'
        {...boostEarthAnimOptions}
        lottieRef={boostEarthAnimApi}
        style={{ width: 600, height: 840 }}
    />, []);

    const boostFireAnimOptions = {
        animationData: require('../animations/frameFire.json'),
        assetsPath: 'https://app.talecraft.io/uploads/boost/fire/images/',
        loop: true,
        autoplay: true,
    };
    const boostFireAnimApi = useRef<LottieRefCurrentProps>();
    const boostFireAnim = useMemo(() => <Lottie
        className='boost-anim'
        renderer='canvas'
        {...boostFireAnimOptions}
        lottieRef={boostFireAnimApi}
        style={{ width: 600, height: 840 }}
    />, []);

    const boostWaterAnimOptions = {
        animationData: require('../animations/frameWater.json'),
        assetsPath: 'https://app.talecraft.io/uploads/boost/water/images/',
        loop: true,
        autoplay: true,
    };
    const boostWaterAnimApi = useRef<LottieRefCurrentProps>();
    const boostWaterAnim = useMemo(() => <Lottie
        className='boost-anim'
        renderer='canvas'
        {...boostWaterAnimOptions}
        lottieRef={boostWaterAnimApi}
        style={{ width: 600, height: 840 }}
    />, []);

    const getLight = async (round: number) => {
        if (!activeGame || activeGame.player[0].placedCards[round] == '0' || activeGame.player[1].placedCards[round] == '0')
            // return (<YellowLight />);
            return (
                <div>
                    <img src={require('url:../images/empty_bulb.png')} style={{ width: '100%', height: '100%' }} />
                </div>
            );
        const balance = parseInt(await gameContract.methods.getRoundWinner(activeGame.gameId, round.toString()).call());
        if (balance > 0)
            return isPlayer0 ? <GreenLight /> : <RedLight />;
        else if (balance < 0)
            return isPlayer0 ? <RedLight /> : <GreenLight />;
        else
            return <YellowLight />;
    }

    const light0 = useAsyncMemo(
        () => getLight(0),
        [activeGame?.player[0].placedCards[0], activeGame?.player[1].placedCards[0]]
    );
    const light1 = useAsyncMemo(
        () => getLight(1),
        [activeGame?.player[0].placedCards[1], activeGame?.player[1].placedCards[1]]
    );
    const light2 = useAsyncMemo(
        () => getLight(2),
        [activeGame?.player[0].placedCards[2], activeGame?.player[1].placedCards[2]]
    );

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

    const onPlace = async (placeTokenId: string) => {
        await walletStore.sendTransaction(gameContract.methods.placeCardMangledNameFoo(placeTokenId));
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

    const onUsePower = async (powerType: number) => {
        setLoading(true);
        try {
            const tx = await walletStore.sendTransaction(gameContract.methods.usePower(powerType));
            toast.success('Power used');
            walletStore.triggerBlockChange();
        } finally {
            setLoading(false);
        }
    }

    const filteredInventory = useAsyncMemo(async () => {
        if (!inventory || !walletStore.resourceTypes.length) return [];

        return inventory.map(({ tokenId, balance }) => ({
            info: walletStore.resourceTypes[parseInt(tokenId)],
            tokenId,
            balance: parseInt(balance),
        })).filter(item => parseInt(item.tokenId) > 4 && (q ? new RegExp(`.*${q}.*`, 'i').test(item.info.name) : true))
    }, [inventory, walletStore.lastBlock, walletStore.resourceTypes, q]);

    return (
        activeGame && walletStore.resourceTypes.length > 0 ? (
            <>
                <section className="table-section" style={{ backgroundImage: `url(${require('../images/table-bg.jpeg')})` }}>
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
                                                <img src={require('../images/board.jpg')} alt=""/>
                                                <div className="card__img-inner" ref={item1RivalSlot}>
                                                    {rivalInfo?.placedCards[0] !== '0' && <img src={selfInfo.usedPowers[0].powerType === PowerType.Air || parseInt(activeGame.round) > 0 ? `${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[0])].ipfsHash}.webp` : require('url:../images/card_back.webp')} />}
                                                    <div className="card__img-multiplier-wrapper">
                                                        {rivalInfo?.usedPowers[0].powerType === PowerType.Fire && <div className='card__img-multiplier'>{rivalInfo.usedPowers[0].value}x</div>}
                                                        {rivalInfo?.usedPowers[0].powerType === PowerType.Earth && <div className='card__img-multiplier'>+5</div>}
                                                        {selfInfo?.usedPowers[0].used && selfInfo.usedPowers[0].powerType == PowerType.Water && <div className='card__img-multiplier'>-25%</div>}
                                                    </div>
                                                </div>
                                                {rivalInfo?.usedPowers[0].powerType === PowerType.Air && boostAirAnim}
                                                {rivalInfo?.usedPowers[0].powerType === PowerType.Earth && boostEarthAnim}
                                                {rivalInfo?.usedPowers[0].powerType === PowerType.Fire && boostFireAnim}
                                                {rivalInfo?.usedPowers[0].used && rivalInfo?.usedPowers[0].powerType === PowerType.Water && boostWaterAnim}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card card_table">
                                        <div className="card__wrap">
                                            <div className="card__image">
                                                <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                <img src={require('../images/board.jpg')} alt=""/>
                                                <div className="card__img-inner" ref={item2RivalSlot}>
                                                    {rivalInfo?.placedCards[1] !== '0' && <img src={selfInfo.usedPowers[1].powerType === PowerType.Air || parseInt(activeGame.round) > 1 ? `${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[1])].ipfsHash}.webp` : require('url:../images/card_back.webp')} />}
                                                    <div className="card__img-multiplier-wrapper">
                                                        {rivalInfo?.usedPowers[1].powerType === PowerType.Fire && <div className='card__img-multiplier'>{rivalInfo.usedPowers[1].value}x</div>}
                                                        {rivalInfo?.usedPowers[1].powerType === PowerType.Earth && <div className='card__img-multiplier'>+5</div>}
                                                        {selfInfo?.usedPowers[1].used && selfInfo.usedPowers[1].powerType == PowerType.Water && <div className='card__img-multiplier'>-25%</div>}
                                                    </div>
                                                </div>
                                                {rivalInfo?.usedPowers[1].powerType === PowerType.Air && boostAirAnim}
                                                {rivalInfo?.usedPowers[1].powerType === PowerType.Earth && boostEarthAnim}
                                                {rivalInfo?.usedPowers[1].powerType === PowerType.Fire && boostFireAnim}
                                                {rivalInfo?.usedPowers[1].used && rivalInfo?.usedPowers[1].powerType === PowerType.Water && boostWaterAnim}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card card_table">
                                        <div className="card__wrap">
                                            <div className="card__image">
                                                <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                <img src={require('../images/board.jpg')} alt=""/>
                                                <div className="card__img-inner" ref={item3RivalSlot}>
                                                    {rivalInfo?.placedCards[2] !== '0' && <img src={selfInfo.usedPowers[2].powerType === PowerType.Air || parseInt(activeGame.round) > 2 ? `${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(rivalInfo?.placedCards[2])].ipfsHash}.webp` : require('url:../images/card_back.webp')} />}
                                                    <div className="card__img-multiplier-wrapper">
                                                        {rivalInfo?.usedPowers[2].powerType === PowerType.Fire && <div className='card__img-multiplier'>{rivalInfo.usedPowers[2].value}x</div>}
                                                        {rivalInfo?.usedPowers[2].powerType === PowerType.Earth && <div className='card__img-multiplier'>+5</div>}
                                                        {selfInfo?.usedPowers[2].used && selfInfo.usedPowers[2].powerType == PowerType.Water && <div className='card__img-multiplier'>-25%</div>}
                                                    </div>
                                                </div>
                                                {rivalInfo?.usedPowers[2].powerType === PowerType.Air && boostAirAnim}
                                                {rivalInfo?.usedPowers[2].powerType === PowerType.Earth && boostEarthAnim}
                                                {rivalInfo?.usedPowers[2].powerType === PowerType.Fire && boostFireAnim}
                                                {rivalInfo?.usedPowers[2].used && rivalInfo?.usedPowers[2].powerType === PowerType.Water && boostWaterAnim}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="table-img">
                                        <img src={require('../images/table-decor.png')} alt=""/>
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
                                                <img src={require('../images/board.jpg')} alt=""/>
                                                <div className="card__img-inner" ref={item1SelfSlot}>
                                                    {selfInfo?.placedCards[0] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[0]) ].ipfsHash}.webp`} />}
                                                    <div className="card__img-multiplier-wrapper">
                                                        {selfInfo?.usedPowers[0].powerType === PowerType.Fire && <div className='card__img-multiplier'>{selfInfo.usedPowers[0].value}x</div>}
                                                        {selfInfo?.usedPowers[0].powerType === PowerType.Earth && <div className='card__img-multiplier'>+5</div>}
                                                        {rivalInfo?.usedPowers[0].used && rivalInfo.usedPowers[0].powerType == PowerType.Water && <div className='card__img-multiplier'>-25%</div>}
                                                    </div>
                                                </div>
                                                {selfInfo?.usedPowers[0].powerType === PowerType.Air && boostAirAnim}
                                                {selfInfo?.usedPowers[0].powerType === PowerType.Earth && boostEarthAnim}
                                                {selfInfo?.usedPowers[0].powerType === PowerType.Fire && boostFireAnim}
                                                {selfInfo?.usedPowers[0].used && selfInfo?.usedPowers[0].powerType === PowerType.Water && boostWaterAnim}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card card_table">
                                        <div className="card__wrap">
                                            <div className="card__image">
                                                <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                <img src={require('../images/board.jpg')} alt=""/>
                                                <div className="card__img-inner" ref={item2SelfSlot}>
                                                    {selfInfo?.placedCards[1] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[1])].ipfsHash}.webp`} />}
                                                    <div className="card__img-multiplier-wrapper">
                                                        {selfInfo?.usedPowers[1].powerType === PowerType.Fire && <div className='card__img-multiplier'>{selfInfo.usedPowers[1].value}x</div>}
                                                        {selfInfo?.usedPowers[1].powerType === PowerType.Earth && <div className='card__img-multiplier'>+5</div>}
                                                        {rivalInfo?.usedPowers[1].used && rivalInfo.usedPowers[1].powerType == PowerType.Water && <div className='card__img-multiplier'>-25%</div>}
                                                    </div>
                                                </div>
                                                {selfInfo?.usedPowers[1].powerType === PowerType.Air && boostAirAnim}
                                                {selfInfo?.usedPowers[1].powerType === PowerType.Earth && boostEarthAnim}
                                                {selfInfo?.usedPowers[1].powerType === PowerType.Fire && boostFireAnim}
                                                {selfInfo?.usedPowers[1].used && selfInfo?.usedPowers[1].powerType === PowerType.Water && boostWaterAnim}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card card_table">
                                        <div className="card__wrap">
                                            <div className="card__image">
                                                <img src='data:image/svg+xml;utf8,<svg version="1.1" width="259" height="349" xmlns="http://www.w3.org/2000/svg"></svg>' />
                                                <img src={require('../images/board.jpg')} alt=""/>
                                                <div className="card__img-inner" ref={item3SelfSlot}>
                                                    {selfInfo?.placedCards[2] !== '0' && <img src={`${IMAGES_CDN}/${walletStore.resourceTypes[parseInt(selfInfo?.placedCards[2])].ipfsHash}.webp`} />}
                                                    <div className="card__img-multiplier-wrapper">
                                                        {selfInfo?.usedPowers[2].powerType === PowerType.Fire && <div className='card__img-multiplier'>{selfInfo.usedPowers[2].value}x</div>}
                                                        {selfInfo?.usedPowers[2].powerType === PowerType.Earth && <div className='card__img-multiplier'>+5</div>}
                                                        {rivalInfo?.usedPowers[2].used && rivalInfo.usedPowers[2].powerType == PowerType.Water && <div className='card__img-multiplier'>-25%</div>}
                                                    </div>
                                                </div>
                                                {selfInfo?.usedPowers[2].powerType === PowerType.Air && boostAirAnim}
                                                {selfInfo?.usedPowers[2].powerType === PowerType.Earth && boostEarthAnim}
                                                {selfInfo?.usedPowers[2].powerType === PowerType.Fire && boostFireAnim}
                                                {selfInfo?.usedPowers[2].used && selfInfo?.usedPowers[2].powerType === PowerType.Water && boostWaterAnim}
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
                                            (!activeGame.player[isPlayer0 ? 0 : 1].usedPowers[parseInt(activeGame.round)].used) && (
                                                <div className='table-powers'>
                                                    <button disabled={loading || _.some(selfInfo.usedPowers.map(p => p.used && p.powerType === PowerType.Air))} onClick={() => onUsePower(2)}><img src={require('../images/powers/Air.png.webp')} /><span className='tooltip'>Power of Air: Can see opponent's card</span></button>
                                                    <button disabled={loading || _.some(selfInfo.usedPowers.map(p => p.used && p.powerType === PowerType.Earth))} onClick={() => onUsePower(3)}><img src={require('../images/powers/Earth.png.webp')} /><span className='tooltip'>Power of Earth: +5 weight for your next placed card</span></button>
                                                    <button disabled={loading || _.some(selfInfo.usedPowers.map(p => p.used && p.powerType === PowerType.Fire))} onClick={() => onUsePower(1)}><img src={require('../images/powers/Fire.png.webp')} /><span className='tooltip'>Power of Fire: Multiples your next placed card's weight by random amount</span></button>
                                                    <button disabled={loading || _.some(selfInfo.usedPowers.map(p => p.used && p.powerType === PowerType.Water))} onClick={() => onUsePower(0)}><img src={require('../images/powers/Water.png.webp')} /><span className='tooltip'>Power of Water: %25 decrease for opponent’s card weight in current round</span></button>
                                                </div>
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
                                Game ID: #{activeGame.gameId} {debugName}
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
                                        <div className='card' key={`${item.tokenId}${i}`}>
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
                                    <div className='card' key={i}>
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
                {activeGame.started && (
                    <ChatWidget chatId={`game.${debugName}.${activeGame.gameId}`} />
                )}
            </>
        ) : null
    )
});

export default GameComponent;
