import React from 'react';
import { useInjection } from "inversify-react";
import { useAsyncMemo } from "use-async-memo";
import { EXCLUDE_TOKENS, IMAGES_CDN } from "../../utils/const";
import { Link } from 'react-router-dom';
import { observer } from "mobx-react";
import WalletStore from "../../stores/WalletStore";
import CodexLink from "../../components/CodexLink";

interface ICodexIndexPageProps {
}

const CodexIndexPage = observer(({}: ICodexIndexPageProps) => {
    const walletStore = useInjection(WalletStore);

    const resourceList = useAsyncMemo(async () => {
        return [
            {
                name: 'No tier',
                items: walletStore.resourceTypes.filter(r => r.tier === '0' && r.id !== 0),
            },
            {
                name: 'Stone tier',
                items: walletStore.resourceTypes.filter(r => r.tier === '1'),
            },
            {
                name: 'Iron tier',
                items: walletStore.resourceTypes.filter(r => r.tier === '2'),
            },
            {
                name: 'Silver tier',
                items: walletStore.resourceTypes.filter(r => r.tier === '3'),
            },
            {
                name: 'Gold tier',
                items: walletStore.resourceTypes.filter(r => r.tier === '4'),
            },
            {
                name: 'Phi Stone tier',
                items: walletStore.resourceTypes.filter(r => r.tier === '5'),
            },
        ];
    }, [walletStore.resourceTypes]);

    return (
        <main className="main codex" style={{ fontSize: 14, color: 'white' }}>
            <div className='container' style={{ marginTop: 150 }}>
                <h1>Codex</h1>
                {resourceList?.map(group => (
                    <React.Fragment key={group.name}>
                        <h2>{group.name}</h2>
                        <ul className='card-group'>
                            {group.items.filter(item => !EXCLUDE_TOKENS.includes(item.id.toString())).map(item => (
                                <li key={item.id}>
                                    <CodexLink item={item} />
                                </li>
                            ))}
                        </ul>
                    </React.Fragment>
                ))}
            </div>
        </main>
    )
});

export default CodexIndexPage;
