import RootStore from "./RootStore";
import { action, makeObservable, observable, runInAction, when } from "mobx";
import Web3 from "web3";
import { toast } from "react-toastify";
import store from "store";
import Timeout from "await-timeout";
import { chestContract, phiContract, resourceContract } from "../utils/contracts";
import { MethodReturnContext } from "../utils/contracts/phi";
import { SendOptions } from "ethereum-abi-types-generator";
import { Subscription } from 'web3-core-subscriptions';
import { BlockHeader } from "web3-eth";
import { InventoryItem } from "../../types";
import _ from "lodash";

export const CHAIN_ID = 43113;
export const DEFAULT_RPC_WS = 'wss://api.avax-test.network/ext/bc/C/ws';
export const DEFAULT_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
export const BLOCK_EXPLORER = 'https://cchain.explorer.avax-test.network';

const chainParameters = {
    chainId: `0x${CHAIN_ID.toString(16).padStart(4, '0')}`,
    chainName: 'Avalanche FUJI C-Chain',
    nativeCurrency: {
        name: 'AVAX',
        symbol: 'AVAX',
        decimals: 18,
    },
    rpcUrls: [DEFAULT_RPC],
    blockExplorerUrls: [BLOCK_EXPLORER],
}

class WalletStore {
    @observable initialized: boolean = false;
    @observable address: string;
    @observable connected: boolean = false;
    @observable lastBlock: number;
    // @observable profile: Profile;

    private rawProvider: any = new Web3.providers.WebsocketProvider(DEFAULT_RPC_WS);
    private newBlockSubscription: Subscription<BlockHeader>;

    constructor(private rootStore: RootStore) {
        makeObservable(this);
        this.newBlockSubscription = this.web3.eth.subscribe('newBlockHeaders').on('data', block => this.updateCurrentBlock(block));
        this.initialize();
    }

    @action private updateCurrentBlock = (block) => {
        this.lastBlock = block?.number;
        // this.loadProfile();
    }

    private initialize = async () => {
        await Timeout.set(10);
        if (store.get('connected')) {
            await this.connect();
        }
        runInAction(() => this.initialized = true);
        // const info = await this.rootStore.api.getInfo();
        // runInAction(() => this.info = info);
    }

    loadProfile = async () => {
        if (!this.address)
            return;
        // const profile = await this.rootStore.api.getProfile(this.address);
        // runInAction(() => this.profile = profile);
    }

    resetWallet = async (chainId?: string) => {
        if (parseInt(chainId, 16) == CHAIN_ID)
            return;
        runInAction(() => { this.connected = false; this.address = undefined });
        this.rawProvider?.off?.('accountsChanged', this.resetWallet)
        this.rawProvider?.off?.('chainChanged', this.resetWallet);
        this.rawProvider?.off?.('disconnected', this.resetWallet);
        this.rawProvider = new Web3.providers.HttpProvider(DEFAULT_RPC);
        store.remove('tokenAddress');
        store.remove('token');
        store.remove('connected');
    }

    connect = async () => {
        if (this.connected)
            return true;

        this.rawProvider = window['ethereum'];
        if (!this.rawProvider) {
            toast.error('Metamask is not installed');
            return false;
        }
        return await this.initProvider();
    }

    initProvider = async () => {
        await this.rawProvider.enable();
        let chainId = await this.web3.eth.getChainId();

        try {
            await this.rawProvider.request({ method: 'wallet_addEthereumChain', params: [ chainParameters ] });
            chainId = await this.web3.eth.getChainId();
        } catch (e) {}

        if (chainId !== CHAIN_ID) {
            toast.error(`Please switch to ${chainParameters.chainName} network`);
            await this.resetWallet();
            return false;
        }

        const accounts = await this.web3.eth.getAccounts();
        // if (store.get('address') !== accounts[0] || !store.get('token')) {
        //     const { nonce, signature } = await generateSignature('SignIn', accounts[0]);
        //     const token = await this.rootStore.api.signIn(nonce, signature);
        //     store.set('address', accounts[0]);
        //     store.set('token', token);
        // }
        runInAction(() => { this.address = accounts[0]; this.connected = true });
        await this.loadProfile();
        store.set('connected', true);
        this.rawProvider?.on?.('accountsChanged', this.resetWallet)
        this.rawProvider?.on?.('chainChanged', this.resetWallet);
        this.rawProvider?.on?.('disconnected', this.resetWallet);
        return true;
    }

    get web3(): Web3 {
        return new Web3(this.rawProvider);
    }

    signMessage = async (message: string, address?: string) => {
        return await this.web3.eth.personal.sign(message, address || this.address, '');
    }

    get chestContract() {
        return chestContract(this.web3);
    }

    get phiContract() {
        return phiContract(this.web3);
    }

    get resourceContract() {
        return resourceContract(this.web3);
    }

    // updateProfile = async (input: ProfileInputType, removeAvatar: boolean, avatar: File | null) => {
    //     const { nonce, signature } = await generateSignature('UpdateProfile', this.address);
    //     const newProfile = await this.rootStore.api.updateProfile(input, removeAvatar, avatar, nonce, signature);
    //     runInAction(() => this.profile = newProfile);
    // }
    //
    // get nftContract(): NFTContractContext {
    //     return new this.web3.eth.Contract(NFTContractAbi as any, ADDRESSES.nft) as any;
    // }
    //
    // get paymentTokenContract(): PaymentTokenContractContext {
    //     return new this.web3.eth.Contract(PaymentTokenContractAbi as any, ADDRESSES.payment_token) as any;
    // }

    sendTransaction = async (tx: MethodReturnContext, options?: Partial<SendOptions>) => {
        let gas;
        try {
            gas = await tx.estimateGas({ from: this.address, ...(options || {}) });
        } catch (e) {
            console.error('estimate', e);
            toast.warning('Unable to estimate gas limit, please check transaction confirmation window')
        }
        return tx.send({ from: this.address, gas, gasPrice: '25000000000', ...(options || {}) });
    }

    getInventory = async (): Promise<InventoryItem[]> => {
        if (!this.address)
            return [];
        const contract = this.resourceContract;
        const ownedTokens = await contract.methods.ownedTokens(this.address).call();
        const balances = await contract.methods.balanceOfBatch(_.range(ownedTokens.length).map(_ => this.address), ownedTokens).call();
        const resourceInfos = await contract.methods.getResourceTypes(ownedTokens).call();
        return ownedTokens.map((tokenId, i) => ({
            info: resourceInfos[i],
            tokenId,
            balance: parseInt(balances[i]),
        }));
    }

    waitForNextBlock = () => {
        return new Promise<void>(async resolve => {
            const currentBlock = this.lastBlock;
            await when(() => this.lastBlock !== currentBlock);
            resolve();
        });
    }
}

export default WalletStore;
