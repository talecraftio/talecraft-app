import React from 'react';

interface IIntroSectionProps {
    background: string;
    title: React.ReactNode | string;
}

const IntroSection = ({ background, title }: IIntroSectionProps) => {
    return (
        <section className="intro-section" style={{ backgroundImage: `url(${background})` }}>
            <div className="container">
                <div className="intro">
                    <div className="intro__wrap">
                        <button className="btn primary" type="button">{title}</button>
                    </div>
                    <div className="intro-bar">
                        <div className="intro-bar__bg"><img src={require('url:../images/loading-bar.png')} alt="" />
                            <div className="intro-bar__fill-wrapper">
                                <div className="intro-bar__fill"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
};

export default IntroSection;
