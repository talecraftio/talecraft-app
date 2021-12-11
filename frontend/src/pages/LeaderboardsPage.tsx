import React, { useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { ResourcetypeResponse } from "../utils/contracts/resource";
import useAsyncEffect from "use-async-effect";
import _, { parseInt } from "lodash";
import { ADDRESSES } from "../utils/contracts";
import { ZERO_ADDRESS } from "../utils/address";
import { RouterStore } from "mobx-react-router";
import classNames from "classnames";

interface ILeaderboardsPageProps {
}

const tierNames = ["None", "Stone", "Iron", 'Silver', 'Gold', 'Phi Stone'];
const excludeAddresses = [ZERO_ADDRESS, '0xF536Cb8037ab72249404f14E507b7b660d052F9D', '0x23BBba252DA45fEac8A22F0497bD2954D67b3cD0', ADDRESSES.chest]

const LeaderboardsPage = ({}: ILeaderboardsPageProps) => {
    const walletStore = useInjection(WalletStore);
    const routerStore = useInjection(RouterStore);

    const [ resourceTypes, setResourceTypes ] = useState<ResourcetypeResponse[]>([]);
    const [ players, setPlayers ] = useState<string[]>([]);
    const [ balances, setBalances ] = useState<{ [address: string]: { [tokenId: string]: string } }>({});
    const [ playersWeight, setPlayersWeight ] = useState<{ [address: string]: number }>({});
    const [ playersMaxTiers, setPlayersMaxTiers ] = useState<{ [address: string]: number }>({});
    const [ loading, setLoading ] = useState(true);

    const isCsv = routerStore.location.hash === '#csv';

    useAsyncEffect(async () => {
        setLoading(true);
        console.log('Loading resource types');
        const contract = walletStore.resourceContract;
        const marketplace = walletStore.marketplaceContract;
        const rtCount = await contract.methods.resourceCount().call();
        const resourceTypeIds = _.range(0, parseInt(rtCount)).map(i => i.toString());
        const resourceTypes = await contract.methods.getResourceTypes(resourceTypeIds).call();
        setResourceTypes(resourceTypes);
        console.log('Loading players list');
        let players = (await contract.methods.getPlayers().call()).filter(address => !excludeAddresses.includes(address));
        console.log('Loading balances');
        const balancesResult = {};
        const playersWeight = {};
        const playersMaxTiers = {};
        const promises = players.map(async address => {
            const playerBalancesList = await contract.methods.balanceOfBatch(_.range(resourceTypeIds.length).map(_ => address), resourceTypeIds).call();
            const playerBalancesObj = {};
            let playerWeight = 0;
            let maxTier = 0;
            playerBalancesList.forEach((balance, i) => {
                playerBalancesObj[resourceTypeIds[i]] = balance;
                playerWeight += parseInt(balance) * parseInt(resourceTypes[resourceTypeIds[i]].weight);
                if (parseInt(balance) > 0)
                    maxTier = Math.max(maxTier, parseInt(resourceTypes[resourceTypeIds[i]].tier));
            });
            const lockedBalancesList = await marketplace.methods.getLockedTokens(address).call();
            lockedBalancesList.forEach(({ tokenId, amount }) => {
                playerBalancesObj[resourceTypeIds[tokenId]] += parseInt(amount);
                playerWeight += parseInt(amount) * parseInt(resourceTypes[resourceTypeIds[tokenId]].weight);
                if (parseInt(amount) > 0)
                    maxTier = Math.max(maxTier, parseInt(resourceTypes[resourceTypeIds[tokenId]].tier));
            })
            balancesResult[address] = playerBalancesObj;
            playersWeight[address] = playerWeight;
            playersMaxTiers[address] = maxTier;
        });
        await Promise.all(promises);
        players = _.sortBy(players, player => playersWeight[player] || 0);
        players.reverse();
        setPlayers(players);
        setBalances(balancesResult);
        setPlayersWeight(playersWeight);
        setPlayersMaxTiers(playersMaxTiers);
        console.log('Done');
        setLoading(false);
    }, []);

    let downloadLink;
    if (isCsv) {
        const result = !loading && players.map(p => `${p},${playersWeight[p]},${tierNames[playersMaxTiers[p]]}`).join('\n');

        if (result) {
            const blob = new Blob([result], { type: 'text/csv' });
            downloadLink = URL.createObjectURL(blob);
        }
    }

    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <h1>Leaderboard</h1>
                {loading ? 'Loading...' : (
                    <>
                        {isCsv && <div><a href={downloadLink} download='player_weights.csv' style={{ fontSize: 14, color: 'white', fontFamily: 'monospace', textDecoration: 'underline' }}>Download CSV</a></div>}
                        <ul>
                            <li>
                                <span>#</span>
                                <span>Address</span>
                                <span>Weight</span>
                                <span>Max tier</span>
                            </li>
                            {players.map((addr, i) => (
                                <li key={addr} className={classNames(addr === walletStore.address && 'you')}>
                                    <span>{i+1}</span>
                                    <span>{addr}</span>
                                    <span>{playersWeight[addr]}</span>
                                    <span>{tierNames[playersMaxTiers[addr]]}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <ul></ul>
            </div>
        </main>
    )
};

export default LeaderboardsPage;
