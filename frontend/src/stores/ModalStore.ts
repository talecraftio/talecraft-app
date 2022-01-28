import { action, makeObservable, observable, runInAction } from "mobx";
import defer from "defer-promise";
import RootStore from "./RootStore";

export enum ModalsEnum {
    _,
    Transfer,
    Sell,
    Lend
}

export interface ModalEntry {
    key: ModalsEnum;
    data?: any;
}

export class ModalStore {
    activeModals = observable.array<ModalEntry>([]);
    visibleModals = observable.array<number>([]);

    constructor(private readonly rootStore: RootStore) {
        makeObservable(this);
        // makeAutoObservable(this);
    }

    @action showModal (key: ModalsEnum, data?: any) {
        let modalId = this.activeModals.length;
        this.activeModals.push({ key, data });
        setTimeout(() => runInAction(() => this.visibleModals.push(modalId)), 0);
        return modalId;
    }

    @action hideModal(id: number) {
        this.visibleModals.remove(id);
        setTimeout(() => runInAction(() => this.activeModals.replace(this.activeModals.filter((_, i) => i !== id))), 400);
    }

    @action hideAllModals() {
        this.activeModals.clear();
    }
}
