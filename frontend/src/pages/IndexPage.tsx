import React, { useRef, useState } from 'react';
import Carousel from "react-multi-carousel";
import classNames from "classnames";
import { ADDRESSES } from "../utils/contracts";

interface IIndexPageProps {
}

const IndexPage = ({}: IIndexPageProps) => {
    const carousel = useRef<Carousel>(null);

    const [ swiperSlide, setSwiperSlide ] = useState(0);

    const goToSwiperSlide = i => {
        const currentSlide = carousel.current.state.currentSlide;
        if (currentSlide % 5 > i % 5) {
            carousel.current.goToSlide(Math.ceil(currentSlide / 5) * 5 + i);
        } else {
            carousel.current.goToSlide(Math.floor(currentSlide / 5) * 5 + i);
        }
    }

    return (
        <main className="main">
            <section className="intro-section index-section" style={{ backgroundImage: `url(${require('url:../images/intro-1.webp')})` }}>
                <div className="container">
                    <div className="intro-row">
                        {/*<div className="intro-img desctop"><img src={require('url:../images/logo.png')} alt="" /></div>*/}
                    </div>
                    <div className="intro intro_main">
                        <div className="intro__wrap">
                            <div className="intro__baner">
                                <span className="intro__text">The Middle Age</span>
                            </div>
                            <a className="btn primary up intro-btn" href={`https://traderjoexyz.com/#/trade?outputCurrency=${ADDRESSES.phi}`} target='_blank'>Buy CRAFT</a>
                            <div className="intro__baner">
                                <span className="intro__text">Metaverse</span>
                            </div>
                        </div>
                        <div className="intro-bar">
                            <div className="intro-bar__bg">
                                <img src={require('url:../images/loading-bar.png')} alt="" />
                                <div className="intro-bar__fill-wrapper">
                                    <div className="intro-bar__fill" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="video-section">
                <div className="container">
                    <div className="video-wrap">
                        <div className="video-text">
                            <h2 className="section-title">The First Crafting Game on Avalanche</h2>
                            <p className="base-text">TaleCraft is a Gaming NFT project on Avalanche. It is a card game
                                that you can mint NFT by making various crafts with 4 main cards of element and sell
                                these cards on the marketplace. In the TaleCraft, the 4 main elements are given in
                                chests that will be sold weekly. So the cards are limited. It has a deflationary
                                structure in itself. The cards used in each crafting are burnt.</p>
                        </div>
                        <div className="card__img">
                            <img src="https://talecraft.b-cdn.net/TALE.gif" alt="" style={{ width: 300, height: 442 }} />
                        </div>
                    </div>
                </div>
            </section>
            <section className="cards-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">Cards</h2>
                    <div className="title-img"><img src={require('url:../images/border.png')} alt="alt" /></div>
                    <div className="slider-wrap">
                        {/*<Swiper*/}
                        {/*    slidesPerView={1}*/}
                        {/*    spaceBetween={10}*/}
                        {/*    modules={[Navigation]}*/}
                        {/*    // loop*/}
                        {/*    navigation={{*/}
                        {/*        prevEl: '.swiper-button-prev',*/}
                        {/*    }}*/}
                        {/*    breakpoints={{*/}
                        {/*        600: {*/}
                        {/*            slidesPerView: 3,*/}
                        {/*            spaceBetween: 24,*/}
                        {/*        },*/}
                        {/*        992: {*/}
                        {/*            slidesPerView: 4,*/}
                        {/*            spaceBetween: 24,*/}
                        {/*        },*/}
                        {/*        1200: {*/}
                        {/*            slidesPerView: 5,*/}
                        {/*            spaceBetween: 24,*/}
                        {/*        },*/}
                        {/*    }}*/}
                        {/*    className="card-slider"*/}
                        {/*    onSlideChange={swiper => setSwiperSlide(swiper.activeIndex)}*/}
                        {/*    onClick={swiper => { swiper.slideTo(swiper.clickedIndex); console.log(swiper.clickedIndex) }}*/}
                        {/*>*/}
                            <Carousel
                                arrows
                                draggable
                                infinite
                                slidesToSlide={1}
                                swipeable
                                className='card-slider'
                                responsive={{
                                    mobile: {
                                        breakpoint: {
                                            min: 0,
                                            max: 600,
                                        },
                                        items: 1,
                                        partialVisibilityGutter: 24,
                                    },
                                    tablet: {
                                        breakpoint: {
                                            min: 600,
                                            max: 992,
                                        },
                                        items: 3,
                                        partialVisibilityGutter: 24,
                                    },
                                    desktop: {
                                        breakpoint: {
                                            min: 992,
                                            max: 1200,
                                        },
                                        items: 4,
                                        partialVisibilityGutter: 24,
                                    },
                                    desktopLarge: {
                                        breakpoint: {
                                            min: 1200,
                                            max: 99999,
                                        },
                                        items: 5,
                                        partialVisibilityGutter: 24,
                                    },
                                }}
                                customLeftArrow={<button className="carousel-button-prev" type="button"><img src={require('url:../images/arrow.png')} alt="" /></button>}
                                customRightArrow={<button className="carousel-button-next" type="button"><img src={require('url:../images/arrow.png')} alt="" /></button>}
                                beforeChange={arg => setSwiperSlide(arg % 5)}
                                ref={carousel}
                            >
                                <div className={classNames("swiper-slide", swiperSlide === 0 && 'swiper-slide-active')} onClick={() => goToSwiperSlide(0)}>
                                    <div className='stone'>
                                        <div className="stone__wrap">
                                            <div className="stone__img"><img src={require('url:../images/stone-1.png')} alt="" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className={classNames("swiper-slide", swiperSlide === 1 && 'swiper-slide-active')} onClick={() => goToSwiperSlide(1)}>
                                    <div className='stone'>
                                        <div className="stone__wrap">
                                            <div className="stone__img"><img src={require('url:../images/stone-2.png')} alt="" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className={classNames("swiper-slide", swiperSlide === 2 && 'swiper-slide-active')} onClick={() => goToSwiperSlide(2)}>
                                    <div className='stone'>
                                        <div className="stone__wrap">
                                            <div className="stone__img"><img src={require('url:../images/stone-3.png')} alt="" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className={classNames("swiper-slide", swiperSlide === 3 && 'swiper-slide-active')} onClick={() => goToSwiperSlide(3)}>
                                    <div className='stone'>
                                        <div className="stone__wrap">
                                            <div className="stone__img"><img src={require('url:../images/stone-4.png')} alt="" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className={classNames("swiper-slide", swiperSlide === 4 && 'swiper-slide-active')} onClick={() => goToSwiperSlide(4)}>
                                    <div className='stone'>
                                        <div className="stone__wrap">
                                            <div className="stone__img"><img src={require('url:../images/stone-5.png')} alt="" /></div>
                                        </div>
                                    </div>
                                </div>
                            </Carousel>

                        {/*</Swiper>*/}
                    </div>
                    <div className="card">
                        <div className="card__wrap">
                            <div className="card__img">
                                <img src={require('url:../images/card1.png')} alt="" />
                                <div className="card__stone">
                                    <img src={[
                                        require('url:../images/stone-1.png'),
                                        require('url:../images/stone-2.png'),
                                        require('url:../images/stone-3.png'),
                                        require('url:../images/stone-4.png'),
                                        require('url:../images/stone-5.png'),
                                    ][swiperSlide]} alt="" />
                                </div>
                            </div>
                            <div className="card__row">
                                <h3 className="section-title">{['Stone', 'Iron', 'Silver', 'Gold', 'Phi Stone'][swiperSlide]} Tier</h3>
                                <span className="card__text">
                                    {swiperSlide === 0 && <>These are the first tier cards that can be created with 4 elements,
                                        after opening the Alchemist Chest, members can craft both of the 4 elements in combination to
                                        produce the stone level card, members can craft to the iron tier by combining the stone tier cards.</>}
                                    {swiperSlide === 1 && <>These cards are second-level cards.  Iron tier cards are crafted with stone tier cards.
                                        Users can create silver level cards with these cards. Although iron level cards are second level cards,
                                        holding them can give you a win.  people can buy these cards from you in the market at a high price.
                                        For silver and gold level cards, they can buy these cards from you.</>}
                                    {swiperSlide === 2 && <>Silver level cards are third level cards.  Crafting time is longer than iron and stone tiers.
                                        With these cards, gold level cards can be produced. Silver level cards may be the preferred cards for crafting time in the marketplace.
                                        People who do not want to start from scratch to craft gold level cards may want to buy your cards from the market.</>}
                                    {swiperSlide === 3 && <>Gold tier cards are fourth tier cards. They are very few in addition to this they are very important cards.
                                        You must have these cards in order to have the philosopher's stone card level.
                                        In addition, the crafting time of these cards is quite high compared to silver, iron, stone levels.
                                        However, it is quite reasonable for the value it creates.</>}
                                    {swiperSlide === 4 && <>These cards are the most important cards of this pack.
                                        Crafting time and cost are quite high.  At the same time, the value it creates is incredibly high.
                                        Usually contains metaverse items.  It has a very remarkable place in the marketplace.
                                        Are the highest cards an alchemist can create.  It has a unique structure.</>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="features-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">Features</h2>
                    <div className="title-img">
                        <img src={require('url:../images/border.png')} alt="alt" />
                    </div>
                    <div className="features-wrap">
                        <div className="feature">
                            <div className="feature__wrap">
                                <div className="feature__img">
                                    <img src={require('url:../images/f-1.png')} alt="" />
                                </div>
                                <div className="feature__body">
                                    <h4 className="section-subtitle">Chest</h4>
                                    <p className="base-text">Alchemist's chest is a system where 4 main elements are sold per week.
                                        You only need 4 main elements to mint cards in TaleCraft. These are Air-Water-Earth-Fire.
                                        These 4 elements are supplied by weekly sales. 25,000 chests are put on sale every week.
                                        1 Chest includes 1 main element NFT 1 Chest Price = 10 $CRAFT + 0.1 AVAX fee</p>
                                </div>
                            </div>
                        </div>
                        <div className="feature">
                            <div className="feature__wrap">
                                <div className="feature__img">
                                    <img src={require('url:../images/f-2.png')} alt="" />
                                </div>
                                <div className="feature__body">
                                    <h4 className="section-subtitle">MarketPlace</h4>
                                    <p className="base-text">TaleCraft will initially deal with various NFT marketplace platforms,
                                        such as Babylon, YetiSwap, etc., also TaleCraft has its own marketplace.  </p>
                                </div>
                            </div>
                        </div>
                        <div className="feature">
                            <div className="feature__wrap">
                                <div className="feature__img"><img src={require('url:../images/f-3.png')} alt="" /></div>
                                <div className="feature__body">
                                    <h4 className="section-subtitle">Crafting</h4>
                                    <p className="base-text">Users will open chests with the $CRAFT token,<br/>
                                        one of the 4 elemental NFTs will come out of the chests<br/>
                                        and craft the elemental NFTs from the chests to craft NFTs at higher tiers.</p>
                                </div>
                            </div>
                        </div>
                        <div className="feature">
                            <div className="feature__wrap">
                                <div className="feature__img"><img src={require('url:../images/f-4.png')} alt="" /></div>
                                <div className="feature__body">
                                    <h4 className="section-subtitle">Staking</h4>
                                    <p className="base-text">Crafter fees spent on Crafting will be collected in a pool
                                        and rewarded for those who stake $CRAFT in the Crafter pool. This way, $CRAFT holders
                                        will be rewarded.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="roadmap-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">Roadmap</h2>
                    <div className="roadmap-wrap">
                        <div className="roadmap-row">
                            <div className="roadmap">
                                <div className="roadmap__wrap">
                                    <h3 className="section-subtitle">Q3 Phase-2021</h3>
                                    <ul className="base-text">
                                        <li>Social Media Release</li>
                                        <li>Website Relase</li>
                                        <li>Seed Round</li>
                                        <li>Private Round</li>
                                        <li>IDO Platform Partnerships</li>
                                        <li>ICO Platform Partnerhips</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="roadmap-row">
                            <div className="roadmap">
                                <div className="roadmap__wrap">
                                    <h3 className="section-subtitle">Q4 Phase-2021</h3>
                                    <ul className="base-text">
                                        <li>Token Generation Event (TGE)</li>
                                        <li>CoinMarketCap and CoinGecko Listing</li>
                                        <li>DEX Listing</li>
                                        <li>Partnerships with other Binance Smart Chain Projects</li>
                                        <li>Audit</li>
                                        <li>Launch of App</li>
                                        <li>Launch of First Package</li>
                                        <li>First Sale of Alchemist Chest</li>
                                        <li>Launch of Crafter Pool</li>
                                        <li>First Weekly Reward and Burn</li>
                                        <li>Guideline-Calculator</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="roadmap-row">
                            <div className="roadmap">
                                <div className="roadmap__wrap">
                                    <h3 className="section-subtitle">Q1 Phase-2022</h3>
                                    <ul className="base-text">
                                        <li>Special MarketPlace</li>
                                        <li>New Package Upgrade for Alchemist Card</li>
                                        <li>Launch of Artist Package Platform</li>
                                        <li>First Airdrop</li>
                                        <li>CEX Listing</li>
                                        <li>Cross-Chain extending</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="backed-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">Backed By</h2>
                    <div className="cards-wrap">
                        <div className="card__image"><img src={require('url:../images/partners.png')} alt=""/></div>
                    </div>
                </div>
            </section>
            <section className="secured-section section-padding">
                <div className="container">
                    <h2 className="section-title text-center">Secured By</h2>
                    <div className="cards-wrap">
                        <div className="card">
                            <div className="card__wrap">
                                <div className="card__image"><img src={require('url:../images/hashex.png')} alt="" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="decor-img"><img src={require('url:../images/decor.png')} alt="" /></div>
        </main>
    )
};

export default IndexPage;
