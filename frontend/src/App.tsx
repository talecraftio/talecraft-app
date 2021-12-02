import React from 'react';
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
import PlayerInfoPage from "./pages/tools/PlayerInfoPage";
import MarketListingPage from "./pages/MarketListingPage";
import LoyaltyPage from "./pages/LoyaltyPage";
import VestingPage from "./pages/VestingPage";
import GameInfoPage from "./pages/tools/GameInfoPage";
import CodexIndexPage from "./pages/codex/CodexIndexPage";
import CodexCardPage from "./pages/codex/CodexCardPage";
import LottieTest from "./pages/tools/LottieTest";

const App = observer(() => {
    const settingsStore = useInjection(SettingsStore);

    return (
        <>
            <div className={classNames('wrapper')}>
                <Header />
                <Switch>
                    <Route exact path='/' component={IndexPage} />
                    <Route path='/card/:tokenId' component={CardPage} />
                    <Route path='/chest' component={ChestPage} />
                    <Route exact path='/marketplace' component={MarketPage} />
                    <Route path='/marketplace/:listingId' component={MarketListingPage} />
                    <Route path='/staking' component={StakingPage} />
                    <Route path='/wallet' component={WalletPage} />
                    <Route path='/craft' component={CraftPage} />
                    <Route path='/_playerWeights' component={PlayerInfoPage} />
                    <Route path='/_gameInfo' component={GameInfoPage} />
                    {/*<Route path='/game' component={GamePage} />*/}
                    <Route path='/loyalty' component={LoyaltyPage} />
                    <Route path='/_vesting' component={VestingPage} />
                    <Route exact path='/codex' component={CodexIndexPage} />
                    <Route exact path='/codex/:tokenId' component={CodexCardPage} />
                    <Route path='/_lottieTest' component={LottieTest} />
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
