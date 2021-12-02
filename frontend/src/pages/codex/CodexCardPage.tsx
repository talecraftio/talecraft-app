import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { RouteComponentProps } from "react-router";
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import CodexLink from "../../components/CodexLink";
import { Tree, TreeNode } from "react-organizational-chart";
import { IMAGES_CDN, IMAGES_FULL_CDN } from "../../utils/const";
import { ResourcetypeResponse } from "../../utils/contracts/resource";
import { MapInteraction } from 'react-map-interaction';
import Minimap from 'react-minimap';
import MapInteractionCSS from '../../components/MapInteractionCSS';
import { Link } from 'react-router-dom';
import _ from "lodash";
import useStateRef from "react-usestateref";
import { toBN } from "../../utils/number";
import { Api } from "../../graphql/api";
import { ResourceType } from "../../graphql/sdk";

interface RouteParams {
    tokenId: string;
}

interface ICodexCardPageProps extends RouteComponentProps<RouteParams> {}

const RecipeTreeNode = ({ tokenId, resourceTypes }: { tokenId: string, resourceTypes: (ResourcetypeResponse & { id: number })[] }) => {
    const resourceType = resourceTypes[tokenId];

    return (
        <TreeNode
            label={<Link to={`/codex/${tokenId}`} className='card-wrapper'>
                <img className='card-image' src={`${IMAGES_CDN}/${resourceType.ipfsHash}.webp`}/>
                <div className='card-meta'>
                    #{resourceType.id} {resourceType.name}
                </div>
            </Link>}
        >
            {resourceType.ingredients.map((rt, i) => <RecipeTreeNode tokenId={rt} resourceTypes={resourceTypes} key={i} />)}
        </TreeNode>
    )
}

const CodexCardPage = observer(({ match: { params: { tokenId } } }: ICodexCardPageProps) => {
    const walletStore = useInjection(WalletStore);
    const api = useInjection(Api);

    const rootNode = useRef<HTMLImageElement>();
    const map = useRef<MapInteraction>();
    const treeWrapper = useRef<HTMLDivElement>();
    const recipeChart = useRef<HTMLDivElement>();
    const [ baseCounts, setBaseCounts ] = useState([0, 0, 0, 0]);
    const [ serverResourceType, setServerResourceType ] = useState<ResourceType>();

    const tid = parseInt(tokenId);
    const resourceType = walletStore.resourceTypes[tid];

    useEffect(() => {
        if (!walletStore.initialized)
            return;

        const baseCounts = [0, 0, 0, 0];

        const countBaseElements = (tokenId: number) => {
            if (tokenId <= 4)
                baseCounts[tokenId - 1]++;
            walletStore.resourceTypes[tokenId].ingredients.forEach(iid => countBaseElements(parseInt(iid)));
        }

        countBaseElements(parseInt(tokenId));
        setBaseCounts(baseCounts);

        api.getResource(tokenId).then(rt => setServerResourceType(rt));
    }, [walletStore.initialized, tokenId]);

    return (
        <main className="main codex" style={{ color: 'white' }}>
            <div className='container' style={{ marginTop: 150 }}>
                {walletStore.initialized ? (
                    <>
                        <h1>Codex</h1>
                        <div className="card-wrap">
                            <div className="card card_market">
                                <div className="card__wrapper">
                                    <div className="card__wrap">
                                        <div className="card__image"><img src={`${IMAGES_FULL_CDN}/${resourceType.ipfsHash}.png`} alt="" /></div>
                                    </div>
                                    <div className="card__body">
                                        <p className="card__text">#{resourceType.id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card-info">
                                <h2 className="section-title">{resourceType.name}</h2>
                                <div className="card-table">
                                    <div className="card-row"><span>Tier</span><span>{['None', 'Stone', 'Iron', 'Silver', 'Gold', 'Phi Stone'][parseInt(resourceType.tier)]}</span></div>
                                    <div className="card-row"><span>Reward multiplier</span><span>{['0', '0.5', '0.75', '1', '1.5', '2'][parseInt(resourceType.tier)]}x</span></div>
                                    <div className="card-row"><span>Weight</span><span>{resourceType.weight}</span></div>
                                    <div className="card-row"><span>Sold times</span><span>{serverResourceType?.sales.length}</span></div>
                                    <div className="card-row"><span>Active marketplace positions</span><span>{serverResourceType?.currentSales.length}</span></div>
                                    <div className="card-row"><span>Highest sale price</span><span>{serverResourceType?.currentSales.length ? Math.max(...serverResourceType.currentSales.map(s => parseInt(s.price) / s.amount)).toFixed(6) : '0'} AVAX</span></div>
                                    <div className="card-row"><span>Lowest sale price</span><span>{serverResourceType?.currentSales.length ? Math.min(...serverResourceType.currentSales.map(s => parseInt(s.price) / s.amount)).toFixed(6) : '0'} AVAX</span></div>
                                </div>
                            </div>
                        </div>
                        <h2>Recipe</h2>
                        {resourceType.ingredients.length > 0 ? (
                            <div>
                                <div className='recipe-row'>
                                    <CodexLink item={walletStore.resourceTypes[resourceType.ingredients[0]]} />
                                    <span style={{ margin: '0 10px' }}>+</span>
                                    <CodexLink item={walletStore.resourceTypes[resourceType.ingredients[1]]} />
                                </div>
                                <div className='recipe-chart' ref={recipeChart}>
                                    <MapInteractionCSS
                                        ref={map}
                                        showControls
                                        controlsClass='chart-controls'
                                        defaultValue={{ scale: 2, translation: { x: 0, y: 0 } }}
                                        key={tokenId}
                                    >
                                        <div className="tree-wrapper" ref={treeWrapper}>
                                            <Tree
                                                label={<div className='card-wrapper'>
                                                    <img
                                                        className='card-image'
                                                        ref={ref => {
                                                            rootNode.current = ref;
                                                            const int = setInterval(() => {
                                                                if (!rootNode.current || !map.current || !treeWrapper.current || !recipeChart.current)
                                                                    return;
                                                                setTimeout(() => {
                                                                    const rootRect = rootNode.current.getBoundingClientRect();
                                                                    const chartRect = recipeChart.current.getBoundingClientRect();
                                                                    const x = rootRect.x - map.current.state.value.translation.x - chartRect.x;
                                                                    map.current.setState({ value: { scale: 2, translation: { x: -x - rootRect.width + chartRect.width / 2, y: 200 } } })
                                                                }, 10);
                                                                clearInterval(int);
                                                            }, 10)
                                                        }}
                                                        src={`${IMAGES_CDN}/${resourceType.ipfsHash}.webp`}
                                                    />
                                                    <div className='card-meta'>
                                                        #{resourceType.id} {resourceType.name}
                                                    </div>
                                                </div>}
                                            >
                                                <RecipeTreeNode tokenId={resourceType.ingredients[0]} resourceTypes={walletStore.resourceTypes} />
                                                <RecipeTreeNode tokenId={resourceType.ingredients[1]} resourceTypes={walletStore.resourceTypes} />
                                            </Tree>
                                        </div>
                                    </MapInteractionCSS>
                                </div>
                                Base elements cost: {baseCounts[0]}x Earth, {baseCounts[1]}x Water, {baseCounts[2]}x Fire, {baseCounts[3]}x Air
                            </div>
                        ) : <div>No recipe</div>}
                        <h2>Recipes using this element</h2>
                        {walletStore.resourceTypes.filter(rt => rt.ingredients.includes(tokenId)).map(rt => (
                            <div className='recipe-row' key={rt.id}>
                                <CodexLink item={walletStore.resourceTypes[rt.ingredients[0]]} />
                                <span style={{ margin: '0 10px' }}>+</span>
                                <CodexLink item={walletStore.resourceTypes[rt.ingredients[1]]} />
                                <span style={{ margin: '0 10px' }}> = </span>
                                <CodexLink item={rt} />
                            </div>
                        ))}
                    </>
                ) : (
                    <h1>Loading...</h1>
                )}
            </div>
        </main>
    )
});

export default CodexCardPage;
