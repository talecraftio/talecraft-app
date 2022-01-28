import React, { useState } from 'react';
import DDSlick from "../components/DDSlick";
import { toBN } from "../utils/number";
import { useInjection } from "inversify-react";
import { Api } from "../graphql/api";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import useStateRef from "react-usestateref";
import { LendingListingType } from "../graphql/sdk";
import Timeout from "await-timeout";
import _ from "lodash";
import useAsyncEffect from "use-async-effect";
import { IMAGES_CDN, MAX_UINT256 } from "../utils/const";
import { observer } from "mobx-react";
import { ADDRESSES } from "../utils/contracts";
import { toast } from "react-toastify";
import ReactPaginate from "react-paginate";
import classNames from "classnames";
import { Redirect } from "react-router";

interface ILendingPageProps {
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

const ListItem = observer(({ item }: { item: LendingListingType }) => {
    const walletStore = useInjection(WalletStore);

    const [ loading, setLoading ] = useState(false);

    const onBorrow = async () => {
        setLoading(true);
        try {
            if (toBN(await walletStore.phiContract.methods.balanceOf(walletStore.address).call()).lt(item.price)) {
                toast.error('Insufficient CRAFT');
                return;
            }
            if (toBN(await walletStore.phiContract.methods.allowance(walletStore.address, ADDRESSES.lending).call()).lt(item.price)) {
                const tx = await walletStore.sendTransaction(walletStore.phiContract.methods.approve(ADDRESSES.lending, MAX_UINT256));
                toast.success(
                    <>
                        CRAFT was successfully approved<br/>
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }
            const tx = await walletStore.sendTransaction(walletStore.gameLendingContract.methods.borrowListing(item.listingId.toString()));
            toast.success(
                <>
                    Token was borrowed successfully<br/>
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
        } catch (e) {
            console.log(e);
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }

    const onCancel = async () => {
        setLoading(true);
        try {
            const tx = await walletStore.sendTransaction(walletStore.gameLendingContract.methods.cancelList(item.listingId.toString()));
            toast.success(
                <>
                    Token was retrieved successfully<br/>
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
        } catch (e) {
            console.log(e);
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='lending__item'>
            <img src={`${IMAGES_CDN}/${item.resource.ipfsHash}.webp`} alt="" className="lending__item__img"/>
            <div className="lending__item__info">
                <div className="lending__item__info__row">
                    <span>#{item.resource.tokenId} {item.resource.name}</span>
                </div>
                <div className="lending__item__info__row">
                    <span><img src={require('../images/duration.webp')} /> {item.duration} s <span className="tooltip">Rent duration</span></span>
                    <span><img src={require('../images/weight.webp')} /> {item.resource.weight} <span className="tooltip">Card weight</span></span>
                </div>
            </div>
            <div className="lending__item__price">
                <span>{toBN(item.price).toFixed(2)} CRAFT</span>
                {item.lender === walletStore.address ? (
                    item.started ? (
                        +new Date() - (+new Date(item.started) + item.duration * 1000) > 0 ? (
                            <button className='btn' disabled={loading} onClick={onCancel}>Retrieve</button>
                        ) : (
                            'Borrowed'
                        )
                    ) : (
                        <button className='btn' disabled={loading} onClick={onCancel}>Cancel listing</button>
                    )
                ) : (
                    item.borrower === walletStore.address ? (
                        +new Date() - (+new Date(item.started) + item.duration * 1000) > 0 ? (
                            'Finished'
                        ) : (
                            'Borrowed'
                        )
                    ) : (
                        <button className='btn' disabled={loading} onClick={onBorrow}>Borrow</button>
                    )
                )}
            </div>
        </div>
    )
});

const LendingPage = observer(({}: ILendingPageProps) => {
    const api = useInjection(Api);
    const walletStore = useInjection(WalletStore);

    const [ sort, setSort, sortRef ] = useStateRef<'price' | '-price'>('price');
    const [ tiers, setTiers, tiersRef ] = useStateRef<string[]>([]);
    const [ weights, setWeights, weightsRef ] = useStateRef<string[]>([]);
    const [ q, setQ, qRef ] = useStateRef<string>('')
    const [ special, setSpecial, specialRef ] = useStateRef<'listed' | 'borrowed' | 'retrievable'>();
    const [ page, setPage, pageRef ] = useStateRef(0);
    const [ items, setItems ] = useState<LendingListingType[]>([]);
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

    const toggleSpecial = (value: 'listed' | 'borrowed' | 'retrievable') => {
        setSpecial(special == value ? undefined : value);
        setPage(0);
        loadPage();
    }

    const loadPage = async (page_ = pageRef.current) => {
        await Timeout.set(0);
        !items.length && setLoading(true);
        const r = await api.getBorrowListings(
            weightsRef.current,
            tiersRef.current,
            qRef.current,
            specialRef.current && walletStore.address ? walletStore.address : '',
            specialRef.current,
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
    }, [walletStore.lastBlock]);

    if (!walletStore.initialized)
        return null;

    if (!walletStore.connected) {
        toast.error('You must connect your wallet in order to access this page');
        return <Redirect to='/' />;
    }

    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <h1>Cards Lending</h1>
                <div className="market-head market-head-top form">
                    <div className="form__checkbox">
                        <input className="form__checkbox-input" type="checkbox" id='misc2' name='misc' disabled={special && special !== 'retrievable'} onClick={() => toggleSpecial('retrievable')} checked={special == 'retrievable'}  />
                        <label className="form__checkbox-label" htmlFor='misc2'>Retrievable</label>
                    </div>
                    <div style={{ flexGrow: 1 }} />
                    <div className="form__checkbox">
                        <input className="form__checkbox-input" type="checkbox" id='misc3' name='misc' disabled={special && special !== 'borrowed'} onClick={() => toggleSpecial('borrowed')} checked={special == 'borrowed'}  />
                        <label className="form__checkbox-label" htmlFor='misc3'>Borrowed by you</label>
                    </div>
                    <div/>
                </div>
                <div className="market-head">
                    <div className="select-wrap">
                        <DDSlick selected={sort} onChange={val => { setSort(val); setPage(0); loadPage() }}>
                            <option value="price">LowestPrice</option>
                            <option value="-price">HighestPrice</option>
                        </DDSlick>
                    </div>
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
                                                <>
                                                    <div className="form__checkbox">
                                                        <input className="form__checkbox-input" type="checkbox" id='misc1' name='misc' value='listed' onChange={() => toggleSpecial('listed')} checked={special == 'listed'} disabled={special && special !== 'listed'} />
                                                        <label className="form__checkbox-label" htmlFor='misc1'>Listed by you</label>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="market-wrap">
                        <div className="lending-wrap">
                            {loading && <p className='market__status'>Loading...</p>}
                            {items.map((item, i) => <ListItem item={item} key={i} />)}
                        </div>
                        {items.length > 0 ? (
                            <ReactPaginate
                                containerClassName='pagination'
                                pageCount={pagesCount}
                                pageRangeDisplayed={3}
                                marginPagesDisplayed={3}
                                onPageChange={({ selected }) => { setPage(selected); loadPage(); }}
                            />
                        ) : <p className='market__status'>Nothing to show</p>}
                    </div>
                </div>
            </div>
        </main>
    )
});

export default LendingPage;
