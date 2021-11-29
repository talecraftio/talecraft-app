import RootStore from "./RootStore";
import { action, makeObservable, observable, runInAction, when } from "mobx";
import Web3 from "web3";
import { toast } from "react-toastify";
import store from "store";
import Timeout from "await-timeout";
import {
    chestContract,
    gameContract,
    marketplaceContract,
    phiContract,
    resourceContract,
    stakingContract, timelockContract, vestingContract, vestingFactoryContract
} from "../utils/contracts";
import { MethodReturnContext } from "../utils/contracts/phi";
import { SendOptions } from "ethereum-abi-types-generator";
import { Subscription } from 'web3-core-subscriptions';
import { BlockHeader } from "web3-eth";
import { InventoryItem } from "../../types";
import _ from "lodash";

import JOE_PAIR_ABI from '../utils/contracts/joePair.abi.json';

const TESTNET = false;

export const CHAIN_ID = TESTNET ? 43113 : 43114;
export const DEFAULT_RPC_WS = TESTNET ? 'wss://api.avax-test.network/ext/bc/C/ws' : 'wss://api.avax.network/ext/bc/C/ws';
export const DEFAULT_RPC = TESTNET ? 'https://api.avax-test.network/ext/bc/C/rpc' : 'https://api.avax.network/ext/bc/C/rpc';
export const BLOCK_EXPLORER = TESTNET ? 'https://testnet.snowtrace.io' : 'https://snowtrace.io';

const chainParameters = {
    chainId: `0x${CHAIN_ID.toString(16).padStart(4, '0')}`,
    chainName: `Avalanche ${TESTNET ? 'Fuji' : 'Mainnet'} C-Chain`,
    nativeCurrency: {
        name: 'AVAX',
        symbol: 'AVAX',
        decimals: 18,
    },
    rpcUrls: [DEFAULT_RPC],
    blockExplorerUrls: [BLOCK_EXPLORER],
}

const mainWeb3 = new Web3(new Web3.providers.WebsocketProvider('wss://api.avax.network/ext/bc/C/ws'))

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
    }

    loadProfile = async () => {
        if (!this.address)
            return;
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

    get stakingContract() {
        return stakingContract(this.web3);
    }

    get marketplaceContract() {
        return marketplaceContract(this.web3);
    }

    get gameContract() {
        return gameContract(this.web3);
    }

    get vestingFactoryContract() {
        return vestingFactoryContract(this.web3);
    }

    getVestingContract(address: string) {
        return vestingContract(this.web3, address);
    }

    getTimelockContract(address: string) {
        return timelockContract(this.web3, address);
    }

    sendTransaction = async (tx: MethodReturnContext, options?: Partial<SendOptions>) => {
        let gas;
        try {
            gas = await tx.estimateGas({ from: this.address, ...(options || {}) });
        } catch (e) {
            if ((e.message as string).includes('reverted')) {
                const msg = e.message.replace(/.*{(.*)}.*/sm, '{$1}');
                const data = JSON.parse(msg);
                toast.error(data.message);
                throw e;
            }
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
        })).filter(({ balance }) => balance > 0);
    }

    waitForNextBlock = () => {
        return new Promise<void>(async resolve => {
            const currentBlock = this.lastBlock;
            await when(() => this.lastBlock !== currentBlock);
            resolve();
        });
    }

    getTokenPrice = async () => {
        const contract = new mainWeb3.eth.Contract(JOE_PAIR_ABI as any, '0x86D1b1Ab4812a104BC1Ea1FbD07809DE636E6C6b');
        const token0 = await contract.methods.token0().call();
        const token1 = await contract.methods.token1().call();
        let avaxBalance, tokenBalance;
        const reserves = await contract.methods.getReserves().call();
        if (token0.toLowerCase() == '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'.toLowerCase()) {
            avaxBalance = reserves[0];
            tokenBalance = reserves[1];
        } else {
            avaxBalance = reserves[1];
            tokenBalance = reserves[0];
        }
        return parseInt(avaxBalance) / parseInt(tokenBalance)
    }
}

export default WalletStore;
