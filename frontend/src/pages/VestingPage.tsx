import React, { useEffect, useState } from 'react';
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { ADDRESSES, TimelockContract, VestingContract } from '../utils/contracts';
import useAsyncEffect from "use-async-effect";
import { toBN } from "../utils/number";

interface IVestingPageProps {
}

const VestingItem = ({ c }: { c: VestingContract }) => {
    const walletStore = useInjection(WalletStore);

    const [ releasable, setReleasable ] = useState('');

    useAsyncEffect(async () => {
        setReleasable(toBN(await c.methods.releasableAmount(ADDRESSES.phi).call()).div('1e18').toString());
    }, []);

    const onRelease = async () => {
        await walletStore.sendTransaction(c.methods.release(ADDRESSES.phi));
    }

    return (
        <div style={{ marginTop: 10 }}>
            <p>Address: {c._address}</p>
            <p>Releasable: {releasable}</p>
            {releasable && releasable !== '0' && <button className='btn primary' type='button' onClick={onRelease}>Release</button>}
        </div>
    )
}

const TimelockItem = ({ c }: { c: TimelockContract }) => {
    const walletStore = useInjection(WalletStore);

    const [ releaseTime, setReleaseTime ] = useState<Date>();
    const [ balance, setBalance ] = useState('');

    useAsyncEffect(async () => {
        setReleaseTime(new Date(+(await c.methods.releaseTime().call()) * 1000));
        setBalance(toBN(await walletStore.phiContract.methods.balanceOf(c._address).call()).div('1e18').toString());
    }, []);

    const onRelease = async () => {
        await walletStore.sendTransaction(c.methods.release(ADDRESSES.phi));
    }

    return (
        <div style={{ marginTop: 10 }}>
            <p>Address: {c._address}</p>
            <p>Release time: {releaseTime?.toLocaleString()}</p>
            <p>Timelock balance: {balance}</p>
            {releaseTime && releaseTime <= new Date() && <button className='btn primary' type='button' onClick={onRelease}>Release</button>}
        </div>
    )
}

const VestingPage = observer(({}: IVestingPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ vestingContracts, setVestingContracts ] = useState<VestingContract[]>([]);
    const [ timelockContracts, setTimelockContracts ] = useState<TimelockContract[]>([]);
    const [ update, setUpdate ] = useState(0);

    useAsyncEffect(async () => {
        if (!walletStore.address || !walletStore.connected)
            return;
        const vestingContracts = (await walletStore.vestingFactoryContract.methods.vestingContracts(walletStore.address).call()).map(addr => walletStore.getVestingContract(addr));
        const vestingContracts2 = (await walletStore.vestingFactory2Contract.methods.vestingContracts(walletStore.address).call()).map(addr => walletStore.getVestingContract(addr));
        setVestingContracts(vestingContracts.concat(vestingContracts2));
        const timelockContracts = (await walletStore.vestingFactoryContract.methods.timelockContracts(walletStore.address).call()).map(addr => walletStore.getTimelockContract(addr));
        const timelockContracts2 = (await walletStore.vestingFactory2Contract.methods.timelockContracts(walletStore.address).call()).map(addr => walletStore.getTimelockContract(addr));
        setTimelockContracts(timelockContracts.concat(timelockContracts2));
        setUpdate(Math.random());
    }, [walletStore.address, walletStore.connected, walletStore.lastBlock]);

    return (
        <main className="main" style={{ fontSize: 14, color: 'white' }}>
            <div className='container' style={{ marginTop: 150, color: 'white', fontFamily: 'monospace' }}>
                {!walletStore.connected ? 'Connect wallet to view this page' : (
                    <>
                        <h2>Vesting</h2>
                        {vestingContracts.map(c => <VestingItem c={c} key={c._address + update} />)}
                        <h2 style={{ marginTop: 30 }}>Timelock</h2>
                        {timelockContracts.map(c => <TimelockItem c={c} key={c._address + update} />)}
                    </>
                )}
            </div>
        </main>
    )
});

export default VestingPage;
