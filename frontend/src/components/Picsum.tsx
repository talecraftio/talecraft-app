import React from 'react';

interface IPicsumProps {
    width: number;
    height?: number;
}

const Picsum = ({ width, height }: IPicsumProps) => {
    return (
        <img src={`https://picsum.photos/${width}/${height || width}?_=${Math.random()}`} />
    )
};

export default Picsum;
