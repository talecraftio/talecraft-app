import React, { useEffect, useRef } from 'react';
import store from 'store';

interface IBackgroundAudioProps {
}

const BackgroundAudio = ({}: IBackgroundAudioProps) => {
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        if (audioRef.current) {
            // const p = new Permissions();
            audioRef.current.muted = store.get('muted', true);
            audioRef.current.play();
        }
    }, [audioRef]);

    const onToggle = () => {
        audioRef.current.muted = !audioRef.current.muted;
        store.set('muted', audioRef.current.muted);
    }

    return (
        <>
            {/*<audio ref={audioRef} autoPlay src={require('url:../images/Fantasy_Medieval_Music_No_Copyright_EPIC_FOLK_CELTIC_MUSIC_NO_COPYRIGHT.mp3')} loop />*/}
            {/*<button onClick={onToggle}>unmute</button>*/}
        </>
    )
};

export default BackgroundAudio;
