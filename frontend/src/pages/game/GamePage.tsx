import React, { useMemo, useRef, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../../stores/WalletStore";
import { GameinfoResponse } from "../../utils/contracts/game2";
import { observer } from "mobx-react";
import useAsyncEffect from "use-async-effect";
import { toast } from "react-toastify";
import { ADDRESSES } from "../../utils/contracts";
import _, { parseInt } from "lodash";
import { IMAGES_CDN, MAX_UINT256 } from "../../utils/const";
import { toBN } from "../../utils/number";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import Timeout from "await-timeout";
import { RouteComponentProps } from "react-router";
import classNames from "classnames";
import GameComponent from "../../components/GameComponent";

interface IGamePageProps extends RouteComponentProps {
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

    const spectate = location.hash.includes('spec');
    const [ spectateNumber, setSpectateNumber ] = useState('');

    const [ activeGame, setActiveGame ] = useState<GameinfoResponse>();
    const [ notificationsEnabled, setNotificationsEnabled ] = useState(true);
    const [ pastGames, setPastGames ] = useState<GameinfoResponse[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ showLoadingAnim, setShowLoadingAnim ] = useState(false);

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
        setNotificationsEnabled(Notification.permission === 'granted');
    }, []);

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
            const powersPrices = await Promise.all([0, 1, 2, 3].map(i => gameContract.methods.powerPrices(i.toString()).call()));
            if (phiAllowance.lt(toBN(Math.max(...powersPrices.map(i => parseInt(i))) * 3).plus(await gameContract.methods.joinPrice().call()))) {
                const tx = await walletStore.sendTransaction(phiContract.methods.approve(gameAddress, MAX_UINT256));
                toast.success(
                    <>
                        CRAFT approved successfully<br/>
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
            <GameComponent activeGame={activeGame} gameContract={gameContract as any} debugName={league} />
        </main>
    )
});

export default GamePage;
