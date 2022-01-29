import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import { useAsyncMemo } from "use-async-memo";
import _ from "lodash";
import { ADDRESSES } from "../../utils/contracts";
import { toBN } from "../../utils/number";
import { GameStats } from "../../graphql/sdk";
import { Api } from "../../graphql/api";

interface IGameLeagueSelectPageProps {
}

const GameLeagueItem = observer(({ title, address, minWeight, maxWeight, link, gameStats }) => {
    const walletStore = useInjection(WalletStore);
    const contract = walletStore.getGame2Contract(address);
    const lending = walletStore.gameLendingContract;

    const eligible = useAsyncMemo(async () => {
        if (!walletStore.resourceTypes.length)
            return false;
        const address = walletStore.address;
        const inventory = await walletStore.getInventory();
        let weight = _.sum(inventory.map(i => parseInt(i.tokenId) > 4 ? i.balance * parseInt(walletStore.resourceTypes[i.tokenId].weight) : 0));
        weight += _.sum((await lending.methods.getBorrowedListings(address).call()).map(l => parseInt(walletStore.resourceTypes[parseInt(l.tokenId)].weight)));
        const listingIds = await walletStore.marketplaceContract.methods.getListingsBySeller(address).call();
        weight += _.sum(await Promise.all(listingIds.map(async lid => {
            const l = await walletStore.marketplaceContract.methods.getListing(lid).call();
            if (parseInt(l.tokenId) > 4)
                return parseInt(l.amount) * parseInt(walletStore.resourceTypes[l.tokenId].weight);
            return 0;
        })));
        const craftIds = await walletStore.resourceContract.methods.pendingCrafts(address).call();
        weight += _.sum(await Promise.all(craftIds.map(async cid => {
            const c = await walletStore.resourceContract.methods.getCrafts([cid]).call();
            if (parseInt(c[0].tokenId) > 4)
                return parseInt(walletStore.resourceTypes[c[0].tokenId].weight);
            return 0;
        })));
        return weight >= minWeight && weight <= maxWeight;
    }, [address, walletStore.lastBlock, walletStore.resourceTypes]);

    const entryPrice = useAsyncMemo(async () => {
        return toBN(await contract.methods.joinPrice().call()).div('1e18').toString();
    }, [address]);

    const waitingPlayers = useAsyncMemo(async () => {
        return await contract.methods.waitingCount().call();
    }, [walletStore.lastBlock]);

    const inGamePlayers = useAsyncMemo(async () => {
        return await contract.methods.inGameCount().call();
    }, [walletStore.lastBlock]);

    return (
        <div className="staking">
            <div className="staking__wrap">
                <h2 className="section-title text-center">{title}</h2>
                <div className="staking__row">
                    <p className="staking__count">
                        <span>Entry</span> {entryPrice || '...'} CRAFT
                    </p>
                </div>
                <div className="staking__row">
                    <p className="staking__count">
                        <span>Min weight</span> {minWeight}
                    </p>
                    <p className="staking__count">
                        <span>Max weight</span> {maxWeight}
                    </p>
                </div>
                <div className="staking__row">
                    <p className="staking__count">
                        <span>Waiting</span> {waitingPlayers}
                    </p>
                    <p className="staking__count">
                        <span>In-game</span> {gameStats?.inGame}
                    </p>
                </div>
                <div className="staking__btn" style={{ flexDirection: "column" }}>
                    {eligible ? (
                        <Link to={link} className="btn primary up">
                            Select
                        </Link>
                    ) : (
                        <button disabled className="btn primary up">
                            Not eligible
                        </button>
                    )}
                    <Link to={`${link}/leaderboard`} className="btn primary up">
                        Leaderboard
                    </Link>
                </div>
            </div>
        </div>
    )
})

const GameLeagueSelectPage = observer(({}: IGameLeagueSelectPageProps) => {
    const walletStore = useInjection(WalletStore);
    const api = useInjection(Api);

    const gameStats = useAsyncMemo(async () => {
        return await api.getGameStats();
    }, [walletStore.lastBlock]);

    if (!walletStore.connected) {
        return (
            <main className="main leaderboards" style={{ color: 'white' }}>
                <div className="container" style={{ marginTop: 150 }}>
                    Connect wallet to access this page
                </div>
            </main>
        );
    }

    return (
        <main className="main">
            <section className="game-section">
                <div className="container">
                    <h1 className='section-title text-center'>Select game league</h1>

                    <div className="staking-wrap">
                        <GameLeagueItem title='Junior' minWeight={6} maxWeight={50} address={ADDRESSES.games['0']} link='/game/junior' gameStats={gameStats?.junior} />
                        <GameLeagueItem title='Senior' minWeight={51} maxWeight={150} address={ADDRESSES.games['1']} link='/game/senior' gameStats={gameStats?.senior} />
                        <GameLeagueItem title='Master' minWeight={151} maxWeight={1000} address={ADDRESSES.games['2']} link='/game/master' gameStats={gameStats?.master} />
                    </div>
                </div>
            </section>
        </main>
    )
});

export default GameLeagueSelectPage;
