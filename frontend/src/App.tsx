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
import MarketIndexPage from "./pages/marketplace/MarketIndexPage";
import StakingPage from "./pages/StakingPage";
import WalletPage from "./pages/WalletPage";
import CraftPage from "./pages/CraftPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import MarketItemPage from "./pages/marketplace/MarketItemPage";
import VestingPage from "./pages/VestingPage";
import CodexIndexPage from "./pages/codex/CodexIndexPage";
import CodexCardPage from "./pages/codex/CodexCardPage";
import GamePage from "./pages/game/GamePage";
import GameLeagueSelectPage from "./pages/game/GameLeagueSelectPage";
import GameLeaderboardPage from "./pages/game/GameLeaderboardPage";
import ChatTestPage from "./pages/tools/ChatTestPage";
import LendingPage from "./pages/LendingPage";
import MaintenancePage from "./pages/MaintenancePage";

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
                    <Route exact path='/marketplace' component={MarketIndexPage} />
                    <Route path='/marketplace/:listingId' component={MarketItemPage} />
                    <Route path='/staking' component={StakingPage} />
                    <Route path='/wallet' component={WalletPage} />
                    <Route path='/craft' component={CraftPage} />
                    <Route path='/leaderboard' component={LeaderboardsPage} />
                    <Route exact path='/game' component={GameLeagueSelectPage} />
                    <Route exact path={['/game/junior', '/game/senior', '/game/master']} component={GamePage} />
                    <Route exact path={['/game/junior/leaderboard', '/game/senior/leaderboard', '/game/master/leaderboard']} component={GameLeaderboardPage} />
                    <Route path='/______lending' component={LendingPage} />
                    <Route path='/lending' component={MaintenancePage} />
                    <Route path='/_vesting' component={VestingPage} />
                    <Route exact path='/codex' component={CodexIndexPage} />
                    <Route exact path='/codex/:tokenId' component={CodexCardPage} />
                    <Route path='/_chatTest' component={ChatTestPage} />
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
