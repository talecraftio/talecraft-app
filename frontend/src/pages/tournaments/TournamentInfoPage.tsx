import React, { useMemo, useRef, useState } from 'react';
import { RouteComponentProps } from "react-router";
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import { GameinfoResponse, TournamentResponse } from "../../utils/contracts/gameTournament";
import useAsyncEffect from "use-async-effect";
import Moment from "react-moment";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import GameComponent from "../../components/GameComponent";
import { observer } from "mobx-react";
import { useAsyncMemo } from "use-async-memo";
import _ from "lodash";
import { trimAddress, ZERO_ADDRESS } from "../../utils/address";

interface PageProps {
    tournamentId: string;
}

interface ITournamentInfoPageProps extends RouteComponentProps<PageProps> {
}

const ROUND_TITLES = ['Eighth final', 'Quarter final', 'Half final', 'Final'];

const TournamentGame = observer(({ gameId, allowSpectate, onSpectate }: { gameId: string, allowSpectate?: boolean, onSpectate: (gameId: string) => any }) => {
    const walletStore = useInjection(WalletStore);
    const contract = walletStore.gameTournamentContract;

    const game = useAsyncMemo(() => contract.methods.game(gameId).call(), [gameId, walletStore.lastBlock]);
    const diceRolled = useAsyncMemo(() => contract.methods.diceRolled(gameId).call(), [gameId, walletStore.lastBlock]);

    return (
        <div className='game-info'>
            <h4>Game #{gameId}</h4>
            <div>
                <span className="row">{trimAddress(game?.player[0].addr)}
                {game?.player[0].addr === walletStore.address && ' (you)'}</span>
                <span className="row">{' vs '}</span>
                <span className="row">{trimAddress(game?.player[1].addr)}
                {game?.player[1].addr === walletStore.address && ' (you)'}</span>
            </div>
            <hr/>
            {game?.finished && <div>{trimAddress(game?.winner)} won{diceRolled && ' (dice roll)'}</div>}
            {allowSpectate && <div><button className='btn' onClick={() => onSpectate(gameId)}>Spectate</button></div>}
        </div>
    );
});

const TournamentGames = ({ t, allowSpectate, onSpectate }: { t: TournamentResponse, allowSpectate?: boolean, onSpectate: (gameId: string) => any }) => {
    if (!t)
        return;
    const rounds = Math.log2(parseInt(t.playersCount));
    const roundsOffset = 4 - rounds;
    return (
        <div className='games-list'>
            <h2>Games</h2>
            {_.range(rounds).map(i => (
                <div key={i}>
                    <h3 className='round-name'>{ROUND_TITLES[roundsOffset + i]}</h3>
                    <div className="games-wrap">
                        {t.gameIds[i].map(gameId => <TournamentGame key={gameId} gameId={gameId} allowSpectate={allowSpectate} onSpectate={onSpectate} />)}
                    </div>
                    {!t.gameIds[i].length && <div>Upcoming</div>}
                </div>
            ))}
        </div>
    )
}

const TournamentInfoPage = observer(({ match: { params: { tournamentId } } }: ITournamentInfoPageProps) => {
    const walletStore = useInjection(WalletStore);

    const contract = walletStore.gameTournamentContract;
    const phi = walletStore.phiContract;

    const [ t, setT ] = useState<TournamentResponse>();
    const [ activeGame, setActiveGame ] = useState<GameinfoResponse>();
    // const [ showLoadingAnim, setShowLoadingAnim ] = useState(false);
    const [ spectateId, setSpectateId ] = useState<string>();

    // const loadingAnimOptions = {
    //     animationData: require('../../animations/loading.json'),
    //     assetsPath: 'https://app.talecraft.io/uploads/loading/',
    //     loop: true,
    //     autoplay: true,
    // };
    // const loadingAnimApi = useRef<LottieRefCurrentProps>();
    // const loadingAnim = useMemo(() => <Lottie
    //     renderer='canvas'
    //     {...loadingAnimOptions}
    //     lottieRef={loadingAnimApi}
    //     style={{ width: 600, height: 300 }}
    // />, []);

    useAsyncEffect(async () => {
        if (!walletStore.address)
            return;
        if (spectateId) {
            setActiveGame(await contract.methods.game(spectateId).call());
            return;
        }
        const activeTournament = await contract.methods.playersCurrentTournaments(walletStore.address).call();
        if (activeTournament !== tournamentId)
            return;
        let activeGameId = await contract.methods.currentGames(walletStore.address).call();
        if (activeGameId === '0')
            if (activeGame)
                activeGameId = activeGame.gameId;
        if (activeGameId !== '0') {
            const game = await contract.methods.game(activeGameId).call();
            setActiveGame(game);
        }
    }, [walletStore.connected, walletStore.lastBlock]);

    const loadTournamentInfo = async () => {
        const tournaments = await contract.methods.getTournaments([tournamentId]).call();
        setT(tournaments[0]);
    }

    useAsyncEffect(loadTournamentInfo, [walletStore.lastBlock]);

    const onJoin = async () => {
        await walletStore.sendTransaction(contract.methods.joinTournament(tournamentId));
        await loadTournamentInfo();
    }

    const onLeave = async () => {
        await walletStore.sendTransaction(contract.methods.leaveTournament(tournamentId));
        await loadTournamentInfo();
    }

    const totalPrize = useAsyncMemo(async () => {
        if (!t)
            return null;
        const winAmounts = (await contract.methods.getWinAmounts().call()).map(v => parseInt(v) / 1e18);
        let playersCount = parseInt(t.playersCount);
        let result = winAmounts[0] * playersCount / 2;
        playersCount /= 2;
        let i = 1;
        while (playersCount != .5) {
            result += winAmounts[i++] * playersCount;
            playersCount /= 2;
        }
        return result;
    }, [t?.playersCount]);

    const now = +new Date() / 1000;

    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <section className="game-section">
                <div className="container" style={{  }}>
                    <h1>Tournament #{tournamentId}</h1>
                    {t ? (
                        <>
                            <div className='tournament-info'>
                                <div className="tournament-info__item">
                                    <div className="title">Status:</div>
                                    <div className="value">
                                        {!t.started && now > parseInt(t.startTime) && now < parseInt(t.joinDeadline) && (
                                            `${t.players.length}/${t.playersCount} players joined`
                                        )}
                                        {t.started && !t.finished && <div>In progress</div>}
                                        {now >= parseInt(t.joinDeadline) && !t.started && <div>Tournament has not started, not enough players joined</div>}
                                        {now < parseInt(t.startTime) && <div>Join has not started yet</div>}
                                        {t.finished && <div>Finished</div>}
                                    </div>
                                </div>
                                <div className="tournament-info__item">
                                    <div className="title">Join start:</div>
                                    <Moment className='value' unix format='lll'>{t.startTime}</Moment>
                                </div>
                                {!t.started && <div className="tournament-info__item">
                                    <div className="title">Join deadline:</div>
                                    <Moment className='value' unix fromNow>{t.joinDeadline}</Moment>
                                </div>}
                                <div className="tournament-info__item">
                                    <div className="title">Total prize:</div>
                                    <div className="value">{totalPrize || '...'} CRAFT</div>
                                </div>
                                {!t.started && now > parseInt(t.startTime) && now < parseInt(t.joinDeadline) && (
                                    <div className="tournament-info__item">
                                        {t.players.includes(walletStore.address) ? (
                                            <button className='btn' onClick={onLeave}>Leave</button>
                                        ) : (
                                            <button className='btn' onClick={onJoin}>Join</button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {t.started && <TournamentGames t={t} allowSpectate={!activeGame || !!spectateId} onSpectate={(gameId: string) => { setSpectateId(gameId); walletStore.triggerBlockChange(); console.log(gameId) }} />}
                        </>
                    ) : 'Loading...'}
                </div>
            </section>
            {(t?.started || !!spectateId) && <GameComponent activeGame={activeGame} gameContract={contract as any} debugName='tournament' />}
        </main>
    )
});

export default TournamentInfoPage;
