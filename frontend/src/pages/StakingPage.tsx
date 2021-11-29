import React, { useState } from 'react';
import { observer } from "mobx-react";
import BN from "bignumber.js";
import useAsyncEffect from "use-async-effect";
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { toBN } from "../utils/number";
import { ADDRESSES } from "../utils/contracts";
import { MAX_UINT256 } from "../utils/const";
import { toast } from "react-toastify";

interface IStakingPageProps {
}

const StakingPage = observer(({}: IStakingPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ amount, setAmount ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ balance, setBalance ] = useState<BN>(toBN(0));
    const [ staked, setStaked ] = useState<BN>(toBN(0));
    const [ allowance, setAllowance ] = useState<BN>(toBN(0));
    const [ earned, setEarned ] = useState<BN>(toBN(0));
    const [ apr, setApr ] = useState<BN>(toBN(0));

    useAsyncEffect(async () => {
        if (!walletStore.address) return;

        const contract = walletStore.stakingContract;
        const phi = walletStore.phiContract;

        setEarned(toBN(await contract.methods.getPendingRewards('0', walletStore.address).call()).div('1e18'));
        setBalance(toBN(await phi.methods.balanceOf(walletStore.address).call()).div('1e18'));
        setAllowance(toBN(await phi.methods.allowance(walletStore.address, ADDRESSES.staking).call()).div('1e18'));
        setStaked(toBN((await contract.methods.userInfo('0', walletStore.address).call()).amount).div('1e18'));

        const poolInfo = await contract.methods.poolInfo('0').call();
        const totalStakedAmount = toBN(poolInfo.supply);

        const userInfo = await contract.methods.userInfo('0', walletStore.address).call();
        const govTokenWETHPrice = toBN(await walletStore.getTokenPrice());
        const baseBlockRewards = toBN(await contract.methods.tokenPerSecond().call());
        const blocksPerYear = 60 * 60 * 24 * 365;
        const poolShare = toBN(userInfo.amount).div(totalStakedAmount);
        const totalStakedAmountWETH = totalStakedAmount.times(govTokenWETHPrice);

        const multiplied = govTokenWETHPrice.times(baseBlockRewards).times(blocksPerYear).times(poolShare);
        let apr;
        if (multiplied.isPositive() && totalStakedAmountWETH.gt(0)) {
            apr = multiplied.div(totalStakedAmountWETH);
        }
        setApr(apr);
    }, [walletStore.lastBlock, walletStore.address]);

    // console.log(earned.toString());

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            const contract = walletStore.stakingContract;
            const phi = walletStore.phiContract;

            const allowance = toBN(await phi.methods.allowance(walletStore.address, ADDRESSES.staking).call()).div('1e18');
            if (allowance.lt(amount)) {
                const tx = await walletStore.sendTransaction(phi.methods.approve(ADDRESSES.staking, MAX_UINT256));
                toast.success(
                    <>
                        $CRAFT was successfully approved<br />
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
                return;
            } else {
                const tx = await walletStore.sendTransaction(contract.methods.deposit('0', toBN(amount).times('1e18').toFixed(0)));
                toast.success(
                    <>
                        Tokens were successfully staked<br />
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
                setAmount('');
                return;
            }
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }

    const onHarvest = async () => {
        setLoading(true);
        try {
            const contract = walletStore.stakingContract;

            const tx = await walletStore.sendTransaction(contract.methods.withdraw('0', '0'));
            toast.success(
                <>
                    Tokens were successfully harvested<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }

    const onWithdraw = async () => {
        setLoading(true);
        try {
            const contract = walletStore.stakingContract;

            const userInfo = await contract.methods.userInfo('0', walletStore.address).call();
            let tx = await walletStore.sendTransaction(contract.methods.withdraw('0', userInfo.amount));
            toast.success(
                <>
                    Stake was successfully withdrawn<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="main">
            <section className="intro-section" style={{ backgroundImage: `url(${require('url:../images/intro-4.webp')})` }}>
                <div className="video-bg">
                    {/*<video width="100%" height="auto" preload="auto" autoPlay muted>
                        <source src={require('url:../video/video1.mp4')} type="video/mp4" />
                    </video>*/}
                </div>
                <div className="container">
                    <div className="intro">
                        <div className="intro__wrap">
                            <button className="btn primary up" type="button">Staking</button>
                        </div>
                        <div className="intro-bar">
                            <div className="intro-bar__bg">
                                <img src={require('url:../images/loading-bar.png')} alt="" />
                                <div className="intro-bar__fill-wrapper">
                                    <div className="intro-bar__fill" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="staking-section">
                <div className="container">
                    <div className="staking-wrap">
                        <div className="staking">
                            <form className="staking__wrap" onSubmit={onSubmit}>
                                <h2 className="section-title text-center">Earn $CRAFT</h2>
                                <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                                <h4 className="section-subtitle">Stake $CRAFT</h4>
                                <div className="staking__row">
                                    <p className="staking__category">APR:</p>
                                    <p className="staking__count">{apr?.toFixed(2) || '0.00'}%</p>
                                </div>
                                <div className="staking__row">
                                    <p className="staking__count">
                                        <span>$CRAFT staked</span>
                                        {staked.toFixed(6)} $CRAFT
                                    </p>
                                    <button className="btn up" type="button" disabled={loading || staked.isZero()} onClick={onWithdraw}>WITHDRAW</button>
                                </div>
                                <div className="staking__row">
                                    <p className="staking__count">
                                        <span>$CRAFT earned</span>
                                        {earned.toFixed(6)} $CRAFT
                                    </p>
                                    <button className="btn up" type="button" disabled={loading || earned.isZero()} onClick={onHarvest}>HARVEST</button>
                                </div>
                                <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                                <div className="form__field">
                                    <input
                                        className="form__input"
                                        type="number"
                                        required
                                        min={0}
                                        max={balance.toString()}
                                        step='1e-18'
                                        placeholder="Amount"
                                        disabled={loading}
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                    <button type='button' className='btn primary' style={{ fontSize: 16, minHeight: 0, minWidth: 0 }} onClick={() => setAmount(balance.toString())} disabled={loading}>MAX</button>
                                </div>
                                <div className="staking__btn">
                                    <button className="btn primary up" type="submit" disabled={loading || toBN(amount).gt(balance) || toBN(amount).isZero()}>
                                        {allowance.lt(amount) ? 'approve' : 'stake'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
});

export default StakingPage;
