import React, { useState } from 'react';
import useAsyncEffect from "use-async-effect";

interface IAsyncRenderProps {
    children: () => Promise<React.ReactNode>;
    placeholder?: React.ReactNode;
}

const AsyncRender = ({ children, placeholder }: IAsyncRenderProps) => {
    const [ result, setResult ] = useState<React.ReactNode>();

    useAsyncEffect(async () => {
        setResult(await children());
    });

    return (
        <>{result || placeholder}</>
    )
};

export default AsyncRender;
