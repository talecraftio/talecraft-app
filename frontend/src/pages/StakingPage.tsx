import React, { useState } from 'react';
import { observer } from "mobx-react";
import BN from "bignumber.js";
import useAsyncEffect from "use-async-effect";
import { useInjection } from "inversify-react";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { toBN } from "../utils/number";
import { ADDRESSES } from "../utils/contracts";
import { MAX_UINT256 } from "../utils/const";
import { ContractContext as StakingContract } from '../utils/contracts/staking';
import { toast } from "react-toastify";

interface IStakingPageProps {
}

const StakingBlock = observer(({ contract, address, aprBase, craftPrice, avaxPrice, title = 'Earn CRAFT', subtitle = 'Stake CRAFT', info, earnedVisible = true, disabled, timelock = false }: { contract: StakingContract, address: string, aprBase: string, craftPrice: BN, avaxPrice: BN, title?: string, subtitle?: React.ReactChild, info?: React.ReactChild, earnedVisible?: boolean, disabled?: boolean, timelock?: boolean }) => {
    const walletStore = useInjection(WalletStore);

    const [ amount, setAmount ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ balance, setBalance ] = useState<BN>(toBN(0));
    const [ staked, setStaked ] = useState<BN>(toBN(0));
    const [ allowance, setAllowance ] = useState<BN>(toBN(0));
    const [ earned, setEarned ] = useState<BN>(toBN(0));
    const [ apr, setApr ] = useState<BN>(toBN(0));
    const [ startTimestamp, setStartTimestamp ] = useState(0);
    const [ endTimestamp, setEndTimestamp ] = useState(0);
    const [ totalStakedAmount, setTotalStakedAmount ] = useState<BN>(toBN(0));

    useAsyncEffect(async () => {
        if (!walletStore.address) return;

        const phi = walletStore.phiContract;

        setEarned(toBN(await contract.methods.getPendingRewards('0', walletStore.address).call()).div('1e18'));
        setBalance(toBN(await phi.methods.balanceOf(walletStore.address).call()).div('1e18'));
        setAllowance(toBN(await phi.methods.allowance(walletStore.address, address).call()).div('1e18'));
        setStaked(toBN((await contract.methods.userInfo('0', walletStore.address).call()).amount).div('1e18'));

        const poolInfo = await contract.methods.poolInfo('0').call();
        const totalStakedAmount = toBN(poolInfo.supply).div('1e18');
        setTotalStakedAmount(totalStakedAmount);
        setEndTimestamp(parseInt(await contract.methods.endTimestamp().call()));
        setStartTimestamp(parseInt(await contract.methods.startTimestamp().call()));

        const apr = toBN(aprBase).div(totalStakedAmount).times(100);
        setApr(apr);
    }, [walletStore.lastBlock, walletStore.address]);

    // console.log(earned.toString());

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            const phi = walletStore.phiContract;

            const allowance = toBN(await phi.methods.allowance(walletStore.address, address).call()).div('1e18');
            if (allowance.lt(amount)) {
                const tx = await walletStore.sendTransaction(phi.methods.approve(address, MAX_UINT256));
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
        <div className="staking">
            <form className="staking__wrap" onSubmit={onSubmit}>
                <h2 className="section-title text-center">{title}</h2>
                <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                <h4 className="section-subtitle">{subtitle}</h4>
                <div className="staking__row">
                    <p className="staking__category">APR:</p>
                    <p className="staking__count">{apr?.toFixed(2) || '0.00'}%</p>
                </div>
                <div className="staking__row">
                    <p className="staking__count">
                        <span>CRAFT staked</span>
                        {staked.toFixed(6)} CRAFT
                    </p>
                    <button className="btn up" type="button" disabled={loading || staked.isZero() || timelock && (+new Date() / 1000 < endTimestamp)} onClick={onWithdraw}>WITHDRAW</button>
                </div>
                {earnedVisible && <div className="staking__row">
                    <p className="staking__count">
                        <span>CRAFT earned</span>
                        {earned.toFixed(6)} CRAFT
                    </p>
                    <button className="btn up" type="button" disabled={loading || earned.isZero()} onClick={onHarvest}>HARVEST</button>
                </div>}
                <div className="staking__row">
                    <p className="staking__count">
                        <span>Total staked</span>
                        {totalStakedAmount.toFixed(6)} CRAFT
                    </p>
                    <p className="staking__count">
                        <span>TVL</span>
                        ${totalStakedAmount.times(craftPrice).times(avaxPrice).toFixed(2)}
                    </p>
                </div>
                <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                {info}
                <div className="form__field">
                    <input
                        className="form__input"
                        type="number"
                        required
                        min={0}
                        max={balance.toString()}
                        step='1e-18'
                        placeholder="Amount"
                        disabled={loading || disabled}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                    <button type='button' className='btn primary' style={{ fontSize: 16, minHeight: 0, minWidth: 0 }} onClick={() => setAmount(balance.toString())} disabled={loading || disabled}>MAX</button>
                </div>
                <div className="staking__btn">
                    <button className="btn primary up" type="submit" disabled={loading || toBN(amount).gt(balance) || toBN(amount).isZero() || disabled || timelock && (+new Date() / 1000 < startTimestamp)}>
                        {allowance.lt(amount) ? 'approve' : 'stake'}
                    </button>
                </div>
            </form>
        </div>
    )
})

const StakingPage = observer(({}: IStakingPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ craftPrice, setCraftPrice ] = useState<BN>(toBN(0));
    const [ avaxPrice, setAvaxPrice ] = useState<BN>(toBN(0));

    useAsyncEffect(async () => {
        setCraftPrice(toBN(await walletStore.getTokenPrice()));
        setAvaxPrice(toBN(await walletStore.getAvaxPrice()));
    }, [walletStore.lastBlock]);

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
                        <StakingBlock
                            aprBase='47414'
                            contract={walletStore.stakingContract}
                            craftPrice={craftPrice}
                            avaxPrice={avaxPrice}
                            address={ADDRESSES.staking}
                            title='FINISHED'
                            disabled
                        />
                        <StakingBlock
                            aprBase='311040'
                            contract={walletStore.stakingContractX7}
                            craftPrice={craftPrice}
                            avaxPrice={avaxPrice}
                            address={ADDRESSES.staking_x7}
                            title='Earn CRAFT x7'
                        />
                        <StakingBlock
                            aprBase='600000'
                            contract={walletStore.stakingLockContract}
                            craftPrice={craftPrice}
                            avaxPrice={avaxPrice}
                            address={ADDRESSES.staking_lock}
                            title='Earn Alchemy Power'
                            earnedVisible={false}
                            timelock
                            info={<h5 className='section-info'>
                                CRAFTs will be locked until April 15th.<br/>
                                5000 AP will be airdropped depends on weights.
                            </h5>}
                        />
                    </div>
                </div>
            </section>
        </main>
    )
});

export default StakingPage;
