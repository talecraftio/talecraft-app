import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import { useAsyncMemo } from "use-async-memo";
import _ from "lodash";

interface IGameLeagueSelectPageProps {
}

const GameLeagueItem = observer(({ title, entry, minWeight, maxWeight, link }) => {
    const walletStore = useInjection(WalletStore);

    const eligible = useAsyncMemo(async () => {
        if (!walletStore.resourceTypes.length)
            return false;
        const inventory = await walletStore.getInventory();
        let weight = _.sum(inventory.map(i => parseInt(i.tokenId) > 4 ? i.balance * walletStore.resourceTypes[i.tokenId].weight : 0));
        const listingIds = await walletStore.marketplaceContract.methods.getListingsBySeller(walletStore.address).call();
        weight += _.sum(await Promise.all(listingIds.map(async lid => {
            const l = await walletStore.marketplaceContract.methods.getListing(lid).call();
            return parseInt(l.amount) * walletStore.resourceTypes[l.tokenId].weight;
        })));
        const craftIds = await walletStore.resourceContract.methods.pendingCrafts(walletStore.address).call();
        weight += _.sum(await Promise.all(craftIds.map(async cid => {
            const c = await walletStore.resourceContract.methods.getCrafts([cid]).call();
            return walletStore.resourceTypes[c[0].tokenId].weight;
        })));
        return weight >= minWeight && weight <= maxWeight;
    }, [walletStore.address, walletStore.lastBlock, walletStore.resourceTypes]);

    return (
        <div className="staking">
            <div className="staking__wrap">
                <h2 className="section-title text-center">{title}</h2>
                <div className="staking__row">
                    <p className="staking__count">
                        <span>Entry</span> {entry} CRAFT
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
                        <GameLeagueItem title='Junior' entry='10' minWeight={6} maxWeight={50} link='/game/junior' />
                        <GameLeagueItem title='Senior' entry='12' minWeight={51} maxWeight={150} link='/game/senior' />
                        <GameLeagueItem title='Master' entry='15' minWeight={151} maxWeight={1000} link='/game/master' />
                    </div>
                </div>
            </section>
        </main>
    )
});

export default GameLeagueSelectPage;
