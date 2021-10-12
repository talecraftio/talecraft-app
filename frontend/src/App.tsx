import React from 'react';
import Web3 from "web3";
import { Route, Switch } from "react-router-dom";
import IndexPage from "./pages/IndexPage";
import Header from "./components/Header";
import { observer } from "mobx-react";
import { useInjection } from "inversify-react";
import SettingsStore from "./stores/SettingsStore";
import classNames from "classnames";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/scss/main.scss';
import Footer from "./components/Footer";
import ModalsContainer from "./modals";
import CardPage from "./pages/CardPage";
import ChestPage from "./pages/ChestPage";
import MarketPage from "./pages/MarketPage";
import StakingPage from "./pages/StakingPage";
import WalletPage from "./pages/WalletPage";
import CraftPage from "./pages/CraftPage";

const App = observer(() => {
    const settingsStore = useInjection(SettingsStore);

    return (
        <>
            <div className={classNames('wrapper')}>
                <Header />
                <Switch>
                    <Route exact path='/' component={IndexPage} />
                    <Route path='/card' component={CardPage} />
                    <Route path='/chest' component={ChestPage} />
                    <Route path='/marketplace' component={MarketPage} />
                    <Route path='/staking' component={StakingPage} />
                    <Route path='/wallet' component={WalletPage} />
                    <Route path='/craft' component={CraftPage} />
                </Switch>
                <div style={{ flex: 1 }} />
                <Footer />
                <ModalsContainer />
            </div>
            <ToastContainer theme={settingsStore.darkTheme ? 'dark' : 'light'} position='bottom-right' />
        </>
    )
});

export default App;
