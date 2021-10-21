import React, { useState } from 'react';
import useStateRef from 'react-usestateref';
import { Link } from 'react-router-dom';
import DDSlick from "../components/DDSlick";
import { useInjection } from "inversify-react";
import { Api } from "../graphql/api";
import { MarketplaceListingType } from "../graphql/sdk";
import useAsyncEffect from "use-async-effect";
import { IMAGES_CDN } from "../utils/const";
import ReactPaginate from "react-paginate";
import Timeout from "await-timeout";

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

const TIERS = [
    [ 'Stone Tier', '1' ],
    [ 'Iron Tier', '2' ],
    [ 'Silver Tier', '3' ],
    [ 'Gold Tier', '4' ],
    [ 'Phi Stone Tier', '5' ],
];

const WEIGHTS = [
    '0-49',
    '50-99',
    '100-199',
    '200-399',
]

const MarketPage = ({}: IMarketPageProps) => {
    const api = useInjection(Api);

    const [ sort, setSort, sortRef ] = useStateRef<'price' | '-price'>('-price');
    const [ tiers, setTiers, tiersRef ] = useStateRef<string[]>([]);
    const [ weights, setWeights, weightsRef ] = useStateRef<string[]>([]);
    const [ page, setPage, pageRef ] = useStateRef(0);
    const [ items, setItems ] = useState<MarketplaceListingType[]>([]);
    const [ pagesCount, setPagesCount ] = useState(0);
    const [ loading, setLoading ] = useState(false);

    const toggleTier = (val: string) => {
        if (tiers.includes(val)) {
            setTiers(tiers.filter(i => i !== val));
        } else {
            setTiers(tiers.concat([val]));
        }
        setPage(0);
        loadPage();
    }

    const toggleWeight = (val: string) => {
        if (weights.includes(val)) {
            setWeights(weights.filter(i => i !== val));
        } else {
            setWeights(weights.concat([val]));
        }
        setPage(0);
        loadPage();
    }

    const loadPage = async (page_ = pageRef.current) => {
        await Timeout.set(0);
        setLoading(true);
        const r = await api.getListings(weightsRef.current, tiersRef.current, sortRef.current, page_);
        setItems(r.items);
        setPagesCount(Math.ceil(r.totalItems / 16));
        setLoading(false);
    }

    useAsyncEffect(() => loadPage(), []);

    return (
        <main className="main">
            <section className="intro-section" style={{ backgroundImage: `url(${require('url:../images/intro-market-bg.webp')})` }}>
                <div className="container">
                    <div className="intro">
                        <div className="intro__wrap">
                            <button className="btn primary" type="button">Marketplace</button>
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
                            <DDSlick selected={sort} onChange={val => { setSort(val); setPage(0) }}>
                                <option value="-price">LowestPrice</option>
                                <option value="price">HighestPrice</option>
                            </DDSlick>
                        </div>
                    </div>
                    <div className="market-content">
                        <div className="market-sidebar">
                            <div className="filter">
                                <form className="form" action="#">
                                    <h2 className="section-title">Filter</h2>
                                    <div className="filter__wrap">
                                        <div className="filter__item">
                                            <div className="filter__head">
                                                <span className="filter__title">Tier</span>
                                            </div>
                                            <div className="filter__body">
                                                {TIERS.map(([ name, value ]) => (
                                                    <div className="form__checkbox" key={value}>
                                                        <input className="form__checkbox-input" type="checkbox" id={value} onChange={() => toggleTier(value)} checked={tiers.includes(value)} />
                                                        <label className="form__checkbox-label" htmlFor={value}>{name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="filter__item">
                                            <div className="filter__head">
                                                <span className="filter__title">Weight</span>
                                            </div>
                                            <div className="filter__body">
                                                {WEIGHTS.map(weight => (
                                                    <div className="form__checkbox" key={weight}>
                                                        <input className="form__checkbox-input" type="checkbox" id={weight} onChange={() => toggleWeight(weight)} checked={weights.includes(weight)} />
                                                        <label className="form__checkbox-label" htmlFor={weight}>{weight}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="market-wrap">
                            {loading && <p className='market__status'>Loading...</p>}
                            <div className="cards-wrap">
                                {items.map(item => (
                                    <Link className="card card_market" to={`/marketplace/${item.listingId}`} key={item.listingId}>
                                        <div className="card__wrapper">
                                            <div className="card__wrap">
                                                <div className="card__image">
                                                    <img src={`${IMAGES_CDN}/${item.resource.ipfsHash}.webp`} alt="" />
                                                </div>
                                            </div>
                                            <div className="card__body">
                                                <p className="card__text">{item.amount}x #{item.resource.tokenId}</p>
                                                <p className="card__descr"><span>Price: </span>{item.price} AVAX</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <ReactPaginate
                                containerClassName='pagination'
                                pageCount={pagesCount}
                                pageRangeDisplayed={3}
                                marginPagesDisplayed={3}
                                onPageChange={({ selected }) => { setPage(selected); loadPage(); }}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
};

export default MarketPage;
