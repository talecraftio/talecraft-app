import React, { useState } from 'react';
import useStateRef from 'react-usestateref';
import { Link } from 'react-router-dom';
import DDSlick from "../../components/DDSlick";
import { useInjection } from "inversify-react";
import { Api } from "../../graphql/api";
import { MarketplaceListingType, MarketplaceStats } from "../../graphql/sdk";
import useAsyncEffect from "use-async-effect";
import { IMAGES_CDN } from "../../utils/const";
import ReactPaginate from "react-paginate";
import Timeout from "await-timeout";
import _ from "lodash";
import WalletStore from "../../stores/WalletStore";
import { toBN } from "../../utils/number";

interface IMarketPageProps {
}

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

const MarketIndexPage = ({}: IMarketPageProps) => {
    const api = useInjection(Api);
    const walletStore = useInjection(WalletStore);

    const [ sort, setSort, sortRef ] = useStateRef<'price' | '-price'>('price');
    const [ tiers, setTiers, tiersRef ] = useStateRef<string[]>([]);
    const [ weights, setWeights, weightsRef ] = useStateRef<string[]>([]);
    const [ q, setQ, qRef ] = useStateRef<string>('')
    const [ owned, setOwned, ownedRef ] = useStateRef(false);
    const [ page, setPage, pageRef ] = useStateRef(0);
    const [ items, setItems ] = useState<MarketplaceListingType[]>([]);
    const [ pagesCount, setPagesCount ] = useState(0);
    const [ loading, setLoading ] = useState(false);
    const [ stats, setStats ] = useState<MarketplaceStats>();

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

    const toggleOwned = () => {
        setOwned(!owned);
        setPage(0);
        loadPage();
    }

    const loadPage = async (page_ = pageRef.current) => {
        await Timeout.set(0);
        setLoading(true);
        const r = await api.getListings(
            weightsRef.current,
            tiersRef.current,
            qRef.current,
            ownedRef.current && walletStore.address ? walletStore.address : '',
            sortRef.current,
            page_
        );
        setItems(r.items);
        setPagesCount(Math.ceil(r.totalItems / 16));
        setLoading(false);
    }

    const debouncedLoadPage = _.debounce(() => { setPage(0); loadPage(); }, 300);

    useAsyncEffect(async () => {
        loadPage();
        setStats(await api.getMarketplaceStats());
    }, []);

    return (
        <main className="main">
            <section className="intro-section" style={{ backgroundImage: `url(${require('url:../../images/intro-market-bg.webp')})` }}>
                <div className="container">
                    <div className="intro">
                        <div className="intro__wrap">
                            <button className="btn primary" type="button">Marketplace</button>
                        </div>
                        <div className="intro-bar">
                            <div className="intro-bar__bg">
                                <img src={require('url:../../images/loading-bar.png')} alt="" />
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
                    {/*<div className='market-notice'>
                        We have moved to a new marketplace contract. You can withdraw listed tokens from the old contract <Link to='/oldMarketplaceWithdraw'>here</Link>.
                    </div>*/}
                    <div className="market-head">
                        <div className="select-wrap">
                            <DDSlick selected={sort} onChange={val => { setSort(val); setPage(0); loadPage() }}>
                                <option value="price">LowestPrice</option>
                                <option value="-price">HighestPrice</option>
                            </DDSlick>
                        </div>
                        <div className='stats'>Element Floor Price{': '}{toBN(stats?.minElementPrice).toFixed(6)} CRAFT</div>
                        <div style={{ flexGrow: 1 }} />
                        <div className="select-wrap">
                            <div className="form-search-wrap">
                                <form className="form-search" action="#">
                                    <div className="form-search__wrap">
                                        <input
                                            className="form__input"
                                            type="search"
                                            name="search"
                                            id="search"
                                            placeholder="Type your search here"
                                            value={q}
                                            onChange={e => { setQ(e.target.value); debouncedLoadPage(); }}
                                        />
                                        <button className="form-search__btn" type="submit">
                                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                                <path
                                                    d="M13.4401 1.91992C7.42506 1.91992 2.56006 6.78492 2.56006 12.7999C2.56006 18.8149 7.42506 23.6799 13.4401 23.6799C15.5876 23.6799 17.5751 23.0499 19.2601 21.9799L27.1201 29.8399L29.8401 27.1199L22.0801 19.3799C23.4751 17.5499 24.3201 15.2824 24.3201 12.7999C24.3201 6.78492 19.4551 1.91992 13.4401 1.91992ZM13.4401 4.47992C18.0476 4.47992 21.7601 8.19242 21.7601 12.7999C21.7601 17.4074 18.0476 21.1199 13.4401 21.1199C8.83256 21.1199 5.12006 17.4074 5.12006 12.7999C5.12006 8.19242 8.83256 4.47992 13.4401 4.47992Z"
                                                    fill="#98753D"/>
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
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
                                        <div className="filter__item">
                                            <div className="filter__head">
                                                <span className="filter__title">Misc</span>
                                            </div>
                                            <div className="filter__body">
                                                {walletStore.address && (
                                                    <div className="form__checkbox">
                                                        <input className="form__checkbox-input" type="checkbox" id='self-chk' onChange={() => toggleOwned()} checked={owned} />
                                                        <label className="form__checkbox-label" htmlFor='self-chk'>Sold by you</label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="market-wrap">
                            {loading && <p className='market__status'>Loading...</p>}
                            <div className="cards-wrap">
                                {!loading && !items.length && <p className='market__status'>No items found</p>}
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
                                                <p className="card__descr"><span>Price: </span>{item.price ? toBN(item.price).toFixed(6) : '0'} CRAFT</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {items.length && (
                                <ReactPaginate
                                    containerClassName='pagination'
                                    pageCount={pagesCount}
                                    pageRangeDisplayed={3}
                                    marginPagesDisplayed={3}
                                    onPageChange={({ selected }) => { setPage(selected); loadPage(); }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
};

export default MarketIndexPage;
