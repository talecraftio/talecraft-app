import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import classNames from "classnames";
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import { observer } from "mobx-react";
import { trimAddress } from "../utils/address";

interface IHeaderProps {
}

const Header = observer(({}: IHeaderProps) => {
    const walletStore = useInjection(WalletStore);

    const [ burger, setBurger ] = useState(false);

    return (
        <header className="header">
            <div className="container">
                <Link className="logo" to="/">
                    <div className="logo__img">
                        <img src={require('url:../images/logo.png')} alt="alt" />
                    </div>
                </Link>
                <nav className={classNames('nav', { active: burger })}>
                    <div className="nav__wrap">
                        <ul className="nav__list">
                            <li className="nav__items"><NavLink className="nav__link" exact to="/" onClick={() => setBurger(false)}>Home</NavLink></li>
                            {walletStore.connected && (
                                <>
                                    <li className="nav__items"><NavLink className="nav__link" to="/chest" onClick={() => setBurger(false)}>Chest</NavLink></li>
                                    <li className="nav__items"><NavLink className="nav__link" to="/craft" onClick={() => setBurger(false)}>Craft</NavLink></li>
                                    {/*<li className="nav__items"><NavLink className="nav__link" to="/staking" onClick={() => setBurger(false)}>Staking</NavLink></li>*/}
                                </>
                            )}
                            <li className="nav__items"><NavLink className="nav__link" to="/marketplace" onClick={() => setBurger(false)}>MarketPlace</NavLink></li>
                            {walletStore.connected && <li className="nav__items"><NavLink className="nav__link" to="/wallet" onClick={() => setBurger(false)}>My Collection</NavLink></li>}
                            {walletStore.connected && <li className="nav__items"><NavLink className="nav__link" to="/loyalty" onClick={() => setBurger(false)}>Loyalty</NavLink></li>}
                            <li className="nav__items"><a className="nav__link" target="_blank" href="https://docs.talecraft.io/crafting-guideline" onClick={() => setBurger(false)}>Guideline</a></li>
                        </ul>
                    </div>
                    <div className="nav__wrap">
                        <ul className="nav__list">
                            {/*{walletStore.connected && <li className="nav__items"><NavLink className="nav__link" to="/game" onClick={() => setBurger(false)}>PLAY GAME</NavLink></li>}*/}
                            <li className="nav__items">
                                {walletStore.connected ? (
                                    <a className='nav__link desctop' onClick={() => walletStore.resetWallet()}>{trimAddress(walletStore.address)}</a>
                                ) : (
                                    <a className="nav__link desctop" onClick={() => walletStore.connect()}>Connect wallet</a>
                                )}
                            </li>
                        </ul>
                    </div>
                </nav>
                {walletStore.connected ? (
                    <a className='nav__link mobile-link' onClick={() => walletStore.resetWallet()}>{trimAddress(walletStore.address)}</a>
                ) : (
                    <a className="nav__link mobile-link" onClick={() => walletStore.connect()}>Connect wallet</a>
                )}
                <div className="burger" onClick={() => setBurger(!burger)}>
                    <span/><span/><span/>
                </div>
            </div>
        </header>
    )
});

export default Header;
