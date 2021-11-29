import React, { useEffect, useRef, useState } from 'react';
import store from 'store';
import { BsVolumeMuteFill, BsVolumeUpFill } from "react-icons/bs";

interface IBackgroundAudioProps {
}

const BackgroundAudio = ({}: IBackgroundAudioProps) => {
    const audioRef = useRef<HTMLAudioElement>();

    const [ muted, setMuted ] = useState(false);

    useEffect(() => {
        if (!audioRef)
            return;

        audioRef.current.volume = .1;
        audioRef.current.muted = store.get('muted', false);
        setMuted(audioRef.current.muted);

        const playAttempt = setInterval(async () => {
            try {
                await audioRef.current.play();
                clearInterval(playAttempt);
            } catch (e) {

            }
        }, 500);
    }, [audioRef]);

    const onToggle = () => {
        setMuted(!muted);
        store.set('muted', !audioRef.current.muted);
        audioRef.current.muted = !audioRef.current.muted;
    }

    return (
        <>
            <audio ref={audioRef} autoPlay src={require('url:../images/Fantasy_Medieval_Music_No_Copyright_EPIC_FOLK_CELTIC_MUSIC_NO_COPYRIGHT.mp3')} loop />
            <a className='nav__link' onClick={onToggle} style={{ lineHeight: '12px' }}>
                {audioRef.current?.muted ? <BsVolumeUpFill/> : <BsVolumeMuteFill/>}
            </a>
        </>
    )
};

export default BackgroundAudio;
