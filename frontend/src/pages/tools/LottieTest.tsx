import React, { useMemo, useRef, useState } from 'react';
import Lottie, { useLottie, LottieRef, LottieRefCurrentProps } from "lottie-react";

interface ILottieTestProps {
}

const LottieTest = ({}: ILottieTestProps) => {
    const [ state, setState ] = useState<number>(0);

    return (
        <main className="main codex" style={{ color: 'white' }}>
            <div className='container' style={{ marginTop: 150 }}>
                <div style={{ position: 'relative' }}>
                    {loadingAnim}
                </div>
                <div style={{ position: 'relative' }}>
                    {winAnim}
                </div>
                <div style={{ position: 'relative' }}>
                    {loseAnim}
                </div>
            </div>
        </main>
    )
};

export default LottieTest;
