import React, { useMemo, useRef, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { toast } from "react-toastify";
import { ADDRESSES } from "../utils/contracts";
import IntroSection from "../components/IntroSection";
import { observer } from "mobx-react";
import useAsyncEffect from "use-async-effect";
import { Redirect } from "react-router";
import { IMAGES_CDN, MAX_UINT256 } from "../utils/const";

interface IChestPageProps {
}

const ChestPage = observer(({}: IChestPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ saleProgress, setSaleProgress ] = useState(0);
    const [ totalChests, setTotalChests ] = useState(0);
    const [ soldChests, setSoldChests ] = useState(0);
    const [ chestsCount, setChestsCount ] = useState('1');
    const [ loading, setLoading ] = useState(false);

    const updateInfo = async () => {
        const contract = walletStore.chestContract;

        const weekTotal = parseInt(await contract.methods.CHESTS_PER_WEEK().call());
        const chestsLeft = parseInt(await contract.methods.chestsLeft().call());

        setTotalChests(weekTotal);
        setSoldChests(weekTotal - chestsLeft);
        setSaleProgress(1 - chestsLeft / weekTotal);
    };

    useAsyncEffect(updateInfo, [walletStore.lastBlock]);

    const animOptions = {
        animationData: require('../animations/chest.json'),
        assetsPath: 'https://app.talecraft.io/uploads/chest_anim/',
        loop: true,
        autoplay: false,
    };
    const lottieApi = useRef<LottieRefCurrentProps>();
    const animElement = useMemo(() => <Lottie renderer='canvas' {...animOptions} lottieRef={lottieApi} />, []);

    const onBuy = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        lottieApi.current.playSegments([0, 44], true);
        lottieApi.current.animationItem.loop = true;
        try {
            const chest = walletStore.chestContract;
            const phi = walletStore.phiContract;
            const allowance = await phi.methods.allowance(walletStore.address, ADDRESSES.chest).call();
            const phiPrice = await chest.methods.chestPricePhi().call();
            const ethPrice = await chest.methods.chestPriceEth().call();
            const totalPhiPrice = parseInt(phiPrice) * parseInt(chestsCount);
            const totalEthPrice = parseInt(ethPrice) * parseInt(chestsCount);
            if (parseInt(await phi.methods.balanceOf(walletStore.address).call()) < totalPhiPrice) {
                toast.error('Insufficient $CRAFT balance');
                return;
            }
            if (parseInt(await walletStore.web3.eth.getBalance(walletStore.address)) < totalEthPrice) {
                toast.error('Insufficient AVAX balance');
                return;
            }
            if (parseInt(allowance) < totalPhiPrice) {
                const tx = await walletStore.sendTransaction(phi.methods.approve(ADDRESSES.chest, MAX_UINT256));
                toast.success(
                    <>
                        CRAFT approved successfully<br />
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }
            const tx = await walletStore.sendTransaction(chest.methods.openChest(chestsCount.toString()), { value: totalEthPrice });
            setChestsCount('1');
            toast.success(
                <>
                    Chests were opened successfully<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
            lottieApi.current.playSegments([45, 88]);
            await Timeout.set(0);
            lottieApi.current.animationItem.loop = false;
            await updateInfo();
        } catch (e) {
            console.error(e);
            toast.error('An error has occurred');
            lottieApi.current.goToAndStop(0);
        } finally {
            setLoading(false);
        }
    }

    if (!walletStore.initialized)
        return null;

    if (!walletStore.connected) {
        toast.error('You must connect your wallet in order to access this page');
        return <Redirect to='/' />;
    }

    return (
        <main className="main">
            <IntroSection background={require('url:../images/intro-3.webp')} title={<>Alchemist<br />Chest</>} />
            <section className="buy-section">
                <div className="container">
                    <div className="chest-wrap">
                        <div className="chest">
                            <div className="chest__wrap">
                                <div className="chest__img"><img src={require('url:../images/box-img.webp')} alt="" /></div>
                                <form className="chest-form" onSubmit={onBuy}>
                                    <div className="chest-form__wrap">
                                        <button
                                            className="chest-form__btn minus"
                                            type="button"
                                            onClick={() => setChestsCount(Math.max(parseInt(chestsCount) - 1, 1).toString())}
                                            disabled={loading || chestsCount === '1'}
                                        >
                                            –
                                        </button>
                                        <input
                                            className="chest-form__input"
                                            type="number"
                                            id="buy"
                                            name="buy"
                                            min='1'
                                            max='500'
                                            value={chestsCount}
                                            onChange={e => setChestsCount(e.target.value)}
                                            disabled={loading}
                                        />
                                        <button
                                            className="chest-form__btn plus"
                                            type="button"
                                            onClick={() => setChestsCount(Math.min(parseInt(chestsCount) + 1, 500).toString())}
                                            disabled={loading || chestsCount === '500'}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className="btn primary up"
                                        disabled={loading}
                                        type="submit"
                                    >
                                        BUY CHESTS
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar__bg">
                                <img src={require('url:../images/empty3.png')} alt="" />
                                <div className="progress-bar__fill-wrapper">
                                    <div className="progress-bar__fill" style={{ width: `${saleProgress * 100}%` }}/>
                                </div>
                                <span className="progress-bar__name">{soldChests} / {totalChests} weekly chests sold</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="elements-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">Collection of Four Elements</h2>
                    <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                    <div className="cards-wrap">
                        <div className="card">
                            <div className="card__wrap">
                                <div className="card__image"><img src={`${IMAGES_CDN}/QmYKGb7p6k23XP7HGd63tJ8c4ftPT8mYQZuLZpLj26eFtc.webp`} alt="" /></div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card__wrap">
                                <div className="card__image"><img src={`${IMAGES_CDN}/QmT3jQjCzAmPY8Mo4sHYpgN3covtw7o7XbudMDDiCX4Qh9.webp`} alt="" /></div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card__wrap">
                                <div className="card__image"><img src={`${IMAGES_CDN}/QmUaRGqSywM4UyvBhLW66ewWDheK2hKfnv4PYotjuCvoAa.webp`} alt="" /></div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card__wrap">
                                <div className="card__image"><img src={`${IMAGES_CDN}/Qmf2ZAyZXGiB3PRp1nEG1ss9VMrtrnwutaotThU5tMxjj5.webp`} alt="" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
});

export default ChestPage;
