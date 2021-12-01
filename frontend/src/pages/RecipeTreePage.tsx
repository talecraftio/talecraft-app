import React, { CSSProperties, useState } from 'react';
import { ResourceListItem } from "../graphql/sdk";
import useAsyncEffect from "use-async-effect";
import { useInjection } from "inversify-react";
import { Api } from "../graphql/api";
import { useAsyncMemo } from "use-async-memo";
import SelectSearch, { fuzzySearch } from "react-select-search";
import { IMAGES_CDN } from "../utils/const";
import Tree from 'react-d3-tree';

interface IRecipeTreePageProps {
}

const RecipeTreePage = ({}: IRecipeTreePageProps) => {
    const api = useInjection(Api);

    const [ selectedResource, setSelectedResource ] = useState<number>();
    const [ treeData, setTreeData ] = useState<any>();
    const [ nodeInfoStyle, setNodeInfoStyle ] = useState<CSSProperties>({});
    const [ nodeInfoChildren, setNodeInfoChildren ] = useState<React.ReactNode>();

    useAsyncEffect(async () => {
        if (!selectedResource)
            return;

        const chartData = await api.getTreeChart(selectedResource.toString());
        console.log(chartData);
        chartData.reverse();
        chartData.forEach(item => {
            let parentIdx = -1;
            for (let i=0; i < chartData.length; i++) {
                const si = chartData[i];
                if (si.id === item.parentId) {
                    parentIdx = i;
                    break;
                }
            }
            if (parentIdx !== -1) {
                if (typeof chartData[parentIdx].children === 'undefined')
                    chartData[parentIdx].children = [];
                chartData[parentIdx].children.push(item);
            }
        })
        chartData.reverse();
        console.log(chartData[0]);
        setTreeData(chartData[0]);
    }, [selectedResource])

    const resourceList = useAsyncMemo(async () => {
        const rl = await api.getResourceList();
        const data = [
            {
                name: 'No tier',
                type: 'group',
                items: rl.filter(r => r.tier === 0),
            },
            {
                name: 'Stone tier',
                type: 'group',
                items: rl.filter(r => r.tier === 1),
            },
            {
                name: 'Iron tier',
                type: 'group',
                items: rl.filter(r => r.tier === 2),
            },
            {
                name: 'Silver tier',
                type: 'group',
                items: rl.filter(r => r.tier === 3),
            },
            {
                name: 'Gold tier',
                type: 'group',
                items: rl.filter(r => r.tier === 4),
            },
            {
                name: 'Phi Stone tier',
                type: 'group',
                items: rl.filter(r => r.tier === 5),
            },
        ];
        return data;
    }, []);

    return (
        <main className="main" style={{ fontSize: 14, color: 'white' }}>
            <div className='container' style={{ marginTop: 150, color: 'white' }}>
                <h1 style={{ marginBottom: 20 }}>Recipe search</h1>
                <SelectSearch
                    options={resourceList || []}
                    placeholder='Select item'
                    search
                    filterOptions={options => (value: string) => options.map((gr: any) => {
                        return {
                            name: gr.name,
                            type: 'group',
                            items: gr.items.filter(op => op.value?.toString().includes(value) || op.name.toLowerCase().includes(value.toLowerCase()))
                        }
                    })}
                    renderOption={(domProps, option: any, snapshot, className) => (
                        <button className={className} {...domProps}>
                            <img src={`${IMAGES_CDN}/${option.ipfs}.webp`} height={30} /> #{option.value} {option.name}
                        </button>
                    )}
                    onChange={value => setSelectedResource(value)}
                />
                {treeData && (
                    <div className='recipe-tree'>
                        <Tree
                            data={treeData}
                            orientation='vertical'
                            pathFunc='step'
                            renderCustomNodeElement={({ nodeDatum }) => (
                                <g
                                    className='node-wrapper'
                                    onMouseEnter={e => {
                                        setNodeInfoStyle({ opacity: 1, left: e.clientX + 20, top: e.clientY });
                                        setNodeInfoChildren(<>
                                            #{nodeDatum.attributes.tokenId} {nodeDatum.name}
                                            <div className="more">
                                                Weight: {nodeDatum.attributes.weight}<br/>
                                                Tier: {['None', 'Stone', 'Iron', 'Silver', 'Gold', 'Phi Stone'][nodeDatum.attributes.tier as number]}
                                            </div>
                                        </>)
                                    }}
                                    onMouseMove={e => setNodeInfoStyle({ opacity: 1, left: e.pageX + 20, top: e.pageY })}
                                    onMouseLeave={e => setNodeInfoStyle({ opacity: 0, left: e.pageX + 20, top: e.pageY })}
                                >
                                    <image
                                        className='node-image'
                                        href={`${IMAGES_CDN}/${nodeDatum.attributes.ipfs}.webp`}
                                        x={-40}
                                        y={-60}
                                        width={80}
                                    />
                                </g>
                            )}

                        />
                        <div className='node-info' style={nodeInfoStyle}>
                            {nodeInfoChildren}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
};

export default RecipeTreePage;
