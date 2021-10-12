import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DDSlick from "../components/DDSlick";

interface IMarketPageProps {
}

const CardItem = ({ image }: { image: string }) => (
    <Link className="card card_market" to="/card">
        <div className="card__wrapper">
            <div className="card__wrap">
                <div className="card__image"><img src={image} alt="" /></div>
            </div>
            <div className="card__body">
                <p className="card__text">#4444</p>
                <p className="card__descr"><span>Price: </span>1.38 AVAX</p>
            </div>
        </div>
    </Link>
)

const MarketPage = ({}: IMarketPageProps) => {
    const [ statusFilter, setStatusFilter ] = useState<'sale' | 'notsale'>('sale');
    const [ sort, setSort ] = useState<'lowestprice' | 'highestprice'>('lowestprice');

    return (
        <main className="main">
            <section className="intro-section" style={{ backgroundImage: `url(${require('url:../images/intro-market-bg.webp')})` }}>
                <div className="container">
                    <div className="intro">
                        <div className="intro__wrap">
                            <button className="btn primary" type="button">Market Place</button>
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
            <section className="market-section">
                <div className="container">
                    <div className="market-head">
                        <div className="select-wrap">
                            <DDSlick selected={statusFilter} onChange={setStatusFilter}>
                                <option value="sale">For Sale</option>
                                <option value="notsale">Not for Sale</option>
                            </DDSlick>
                        </div>
                        <div className="select-wrap">
                            <DDSlick selected={sort} onChange={setSort}>
                                <option value="lowestprice">LowestPrice</option>
                                <option value="highestprice">HighestPrice</option>
                            </DDSlick>
                        </div>
                    </div>
                    <div className="market-content">
                        <div className="market-sidebar">
                            <div className="filter">
                                <form className="form" action="#">
                                    <h2 className="section-title">Filter </h2>
                                    <div className="filter__wrap">
                                        <div className="filter__item">
                                            <div className="filter__head">
                                                <span className="filter__title">Tier</span>
                                            </div>
                                            <div className="filter__body">
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="1" name="1" />
                                                    <label className="form__checkbox-label" htmlFor="1">Stone Tier</label>
                                                </div>
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="2" name="2" />
                                                    <label className="form__checkbox-label" htmlFor="2">Iron Tier</label>
                                                </div>
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="3" name="3" />
                                                    <label className="form__checkbox-label" htmlFor="3">Silver Tier</label>
                                                </div>
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="4" name="4" />
                                                    <label className="form__checkbox-label" htmlFor="4">Gold Tier</label>
                                                </div>
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="5" name="5" />
                                                    <label className="form__checkbox-label" htmlFor="5">Phi Stone Tier</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="filter__item">
                                            <div className="filter__head">
                                                <span className="filter__title">Weight</span>
                                            </div>
                                            <div className="filter__body">
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="2-1" name="2-1" />
                                                    <label className="form__checkbox-label" htmlFor="2-1">0-50</label>
                                                </div>
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="2-2" name="2-2" />
                                                    <label className="form__checkbox-label" htmlFor="2-2">51-99</label>
                                                </div>
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="2-3" name="2-3" />
                                                    <label className="form__checkbox-label" htmlFor="2-3">100-199</label>
                                                </div>
                                                <div className="form__checkbox">
                                                    <input className="form__checkbox-input" type="checkbox" id="2-4" name="2-4" />
                                                    <label className="form__checkbox-label" htmlFor="2-4">200-400</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="market-wrap">
                            <div className="cards-wrap">
                                <CardItem image={require('url:../../../contracts/images_utils/images/Earth.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Air.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Astronaut.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Avax.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/banana_bread.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/banana.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Beehive.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Beer.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Bird.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Bitcoin.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Boat.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Bone.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Bread.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Brick.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Bull.png')} />
                                <CardItem image={require('url:../../../contracts/images_utils/images/Cake.png')} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
};

export default MarketPage;
