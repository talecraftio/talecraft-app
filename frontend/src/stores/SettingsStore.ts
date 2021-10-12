import { action, makeAutoObservable, makeObservable, observable, runInAction } from "mobx";
import store from 'store';
import RootStore from "./RootStore";

class SettingsStore {
    @observable darkTheme: boolean = store.get('darkTheme', true);

    constructor(private rootStore: RootStore) {
        makeAutoObservable(this);
    }

    @action toggleTheme() {
        runInAction(() => this.darkTheme = !this.darkTheme);
        store.set('darkTheme', this.darkTheme);
    }
}

export default SettingsStore;
