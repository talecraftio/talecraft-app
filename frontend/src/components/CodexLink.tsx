import React from 'react';
import { IMAGES_CDN } from "../utils/const";
import { Link } from "react-router-dom";
import { ResourcetypeResponse } from "../utils/contracts/resource";

interface ICodexLinkProps {
    item: (ResourcetypeResponse & { id: number });
}

const CodexLink = ({ item }: ICodexLinkProps) => {
    return (
        <Link to={`/codex/${item.id}`} className='codex-link'>
            <img src={`${IMAGES_CDN}/${item.ipfsHash}.webp`} />
            #{item.id} {item.name} ({item.weight})
        </Link>
    )
};

export default CodexLink;
