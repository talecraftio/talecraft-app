import React, { useEffect, useState } from 'react';

interface ITimerProps {
    tillTimestamp: number;
}

const Timer = ({ tillTimestamp }: ITimerProps) => {
    const [ now, setNow ] = useState(+new Date() / 1000);

    useEffect(() => {
        const int = setInterval(() => setNow(+new Date() / 1000), 100);
        return () => clearInterval(int);
    });

    const diff = tillTimestamp - now;
    let minutes = 0, seconds = 0;
    if (diff > 0) {
        minutes = Math.floor(diff / 60);
        seconds = Math.floor(diff % 60);
    }

    return <span className={diff < 30 ? 'red' : ''}>{`${minutes}:${seconds.toString().padStart(2, '0')}`}</span>;
};

export default Timer;
