import React from 'react';

interface IStakingPageProps {
}

const StakingPage = ({}: IStakingPageProps) => {
    return (

        <main className="main">
            <section className="intro-section" style={{ backgroundImage: `url(${require('url:../images/intro-4.webp')})` }}>
                <div className="video-bg">
                    {/*<video width="100%" height="auto" preload="auto" autoPlay muted>
                        <source src={require('url:../video/video1.mp4')} type="video/mp4" />
                    </video>*/}
                </div>
                <div className="container">
                    <div className="intro">
                        <div className="intro__wrap">
                            <button className="btn primary up" type="button">Staking</button>
                        </div>
                        <div className="intro-bar">
                            <div className="intro-bar__bg">
                                <img src={require('url:../images/loading-bar.png')} alt="" />
                                <div className="intro-bar__fill-wrapper">
                                    <div className="intro-bar__fill" style={{ width: '90.7%' }}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="staking-section">
                <div className="container">
                    <div className="staking-wrap">
                        <div className="staking">
                            <div className="staking__wrap">
                                <h2 className="section-title text-center">Earn PHI</h2>
                                <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                                <h4 className="section-subtitle">Stake PHI</h4>
                                <div className="staking__row">
                                    <p className="staking__category">APR:</p>
                                    <p className="staking__count">63.52%</p>
                                </div>
                                <div className="staking__row">
                                    <p className="staking__count">
                                        <span>PHI earned</span>0 USD
                                    </p>
                                    <button className="btn up" type="button">HARVEST</button>
                                </div>
                                <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                                <div className="staking__btn">
                                    <button className="btn primary up" type="button">enable</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
};

export default StakingPage;
