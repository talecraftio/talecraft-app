import React, { useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { ResourcetypeResponse } from "../utils/contracts/resource";
import useAsyncEffect from "use-async-effect";
import _ from "lodash";
import { ADDRESSES } from "../utils/contracts";
import { ZERO_ADDRESS } from "../utils/address";

interface IPlayerInfoPageProps {
}

const PlayerInfoPage = ({}: IPlayerInfoPageProps) => {
    const walletStore = useInjection(WalletStore);

    const [ resourceTypes, setResourceTypes ] = useState<ResourcetypeResponse[]>([]);
    const [ players, setPlayers ] = useState<string[]>([]);
    const [ balances, setBalances ] = useState<{ [address: string]: { [tokenId: string]: string } }>({});
    const [ playersWeight, setPlayersWeight ] = useState<{ [address: string]: number }>({});
    const [ status, setStatus ] = useState('Initializing');
    const [ loading, setLoading ] = useState(true);

    useAsyncEffect(async () => {
        setStatus('Loading resource types');
        const contract = walletStore.resourceContract;
        const rtCount = await contract.methods.resourceCount().call();
        const resourceTypeIds = _.range(1, parseInt(rtCount)).map(i => i.toString());
        const resourceTypes = await contract.methods.getResourceTypes(resourceTypeIds).call();
        setResourceTypes(resourceTypes);
        setStatus('Loading players list');
        const players = (await contract.methods.getPlayers().call()).filter(address => address != ZERO_ADDRESS && address != ADDRESSES.chest && address != ADDRESSES.marketplace);
        setStatus('Loading balances');
        const balancesResult = {};
        const playersWeight = {};
        const promises = players.map(async address => {
            const playerBalancesList = await contract.methods.balanceOfBatch(_.range(resourceTypeIds.length).map(_ => address), resourceTypeIds).call();
            const playerBalancesObj = {};
            let playerWeight = 0;
            playerBalancesList.forEach((balance, i) => {
                playerBalancesObj[resourceTypeIds[i]] = balance;
                playerWeight += parseInt(balance) * parseInt(resourceTypes[i].weight);
            });
            balancesResult[address] = playerBalancesObj;
            playersWeight[address] = playerWeight;
        });
        await Promise.all(promises);
        setPlayers(players);
        setBalances(balancesResult);
        setPlayersWeight(playersWeight);
        setStatus('Done');
        setLoading(false);
    }, []);

    const result = !loading && players.map(p => `${p},${playersWeight[p]}`).join('\n');
    let downloadLink;

    if (result) {
        const blob = new Blob([result], { type: 'text/csv' });
        downloadLink = URL.createObjectURL(blob);
    }

    return (
        <main className="main" style={{ fontSize: 14, color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <pre>{status}</pre>
                {result && <div><a href={downloadLink} download='player_weights.csv' style={{ fontSize: 14, color: 'white', fontFamily: 'monospace', textDecoration: 'underline' }}>Download CSV</a></div>}
                {result && <pre>{result}</pre>}
            </div>
        </main>
    )
};

export default PlayerInfoPage;
