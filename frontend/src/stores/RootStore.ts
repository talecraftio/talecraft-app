import { createBrowserHistory, History } from 'history';
import { syncHistoryWithStore } from "mobx-react-router";
import { Container } from "inversify";
import { wrapHistory } from "oaf-react-router";
import { HistoryStore, RouterStore } from "./index";
import SettingsStore from "./SettingsStore";
import WalletStore from "./WalletStore";
import { ModalStore } from "./ModalStore";
import { Api } from "../graphql/api";

class RootStore {
    public historyStore: History;
    public routerStore: RouterStore;
    public settingsStore: SettingsStore;
    public walletStore: WalletStore;
    public modalStore: ModalStore;

    public container: Container;

    constructor() {
        const browserHistory = createBrowserHistory();
        wrapHistory(browserHistory, {
            smoothScroll: true,
            primaryFocusTarget: 'body',
        });

        this.routerStore = new RouterStore();
        this.settingsStore = new SettingsStore(this);
        this.walletStore = new WalletStore(this);
        this.modalStore = new ModalStore(this);
        this.historyStore = syncHistoryWithStore(browserHistory, this.routerStore);

        this.container = new Container();
        this.container.bind(RouterStore).toConstantValue(this.routerStore);
        this.container.bind(HistoryStore).toConstantValue(this.historyStore);
        this.container.bind(SettingsStore).toConstantValue(this.settingsStore);
        this.container.bind(WalletStore).toConstantValue(this.walletStore);
        this.container.bind(ModalStore).toConstantValue(this.modalStore);
        this.container.bind(Api).toDynamicValue(() => this.api);
    }

    get api() {
        return new Api(process.env.ENVIRONMENT === 'build' ? '/graphql' : 'http://dev.bennnnsss.com:39100/graphql');
    }
}

export default RootStore;
