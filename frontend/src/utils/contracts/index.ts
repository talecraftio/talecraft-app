import Web3 from "web3";

import CHEST_ABI from './chest.abi.json';
import PHI_ABI from './phi.abi.json';
import RESOURCE_ABI from './resource.abi.json';
import STAKING_ABI from './staking.abi.json';
import MARKETPLACE_ABI from './marketplace.abi.json';
import GAME_ABI from './game.abi.json';
import GAME2_ABI from './game2.abi.json';
import VESTING_FACTORY_ABI from './vesting/factory.abi.json';
import VESTING_ABI from './vesting/vesting.abi.json';
import TIMELOCK_ABI from './vesting/timelock.abi.json';

import { ContractContext as ChestContract } from './chest';
import { ContractContext as ResourceContract } from './resource';
import { ContractContext as PhiContract } from './phi';
import { ContractContext as StakingContract } from './staking';
import { ContractContext as MarketplaceContract } from './marketplace';
import { ContractContext as GameContract } from './game';
import { ContractContext as Game2Contract } from './game2';
import { ContractContext as VestingFactoryContract } from './vesting/factory';
import { ContractContext as VestingContract } from './vesting/vesting';
import { ContractContext as TimelockContract } from './vesting/timelock';

import MAINNET_ADDRESSES from './addresses';
import TESTNET_ADDRESSES from './testnetAddresses';

const ADDRESSES = process.env.TESTNET ? TESTNET_ADDRESSES : MAINNET_ADDRESSES;

export function chestContract(web3: Web3) {
    return new web3.eth.Contract(CHEST_ABI as any, ADDRESSES.chest) as any as ChestContract;
}

export function phiContract(web3: Web3) {
    return new web3.eth.Contract(PHI_ABI as any, ADDRESSES.phi) as any as PhiContract;
}

export function resourceContract(web3: Web3) {
    return new web3.eth.Contract(RESOURCE_ABI as any, ADDRESSES.resource) as any as ResourceContract;
}

export function stakingContract(web3: Web3) {
    return new web3.eth.Contract(STAKING_ABI as any, ADDRESSES.staking) as any as StakingContract;
}

export function stakingContractX7(web3: Web3) {
    return new web3.eth.Contract(STAKING_ABI as any, ADDRESSES.staking_x7) as any as StakingContract;
}

export function marketplaceContract(web3: Web3) {
    return new web3.eth.Contract(MARKETPLACE_ABI as any, ADDRESSES.marketplace) as any as MarketplaceContract;
}

export function gameContract(web3: Web3) {
    return new web3.eth.Contract(GAME_ABI as any, ADDRESSES.game) as any as GameContract;
}

export function game2Contract(web3: Web3, address: string) {
    return new web3.eth.Contract(GAME2_ABI as any, address) as any as Game2Contract;
}

export function vestingFactoryContract(web3: Web3) {
    return new web3.eth.Contract(VESTING_FACTORY_ABI as any, ADDRESSES.vestingFactory) as any as VestingFactoryContract;
}

export function vestingFactory2Contract(web3: Web3) {
    return new web3.eth.Contract(VESTING_FACTORY_ABI as any, ADDRESSES.vestingFactory2) as any as VestingFactoryContract;
}

export function vestingContract(web3: Web3, address: string) {
    return new web3.eth.Contract(VESTING_ABI as any, address) as any as VestingContract;
}

export function timelockContract(web3: Web3, address: string) {
    return new web3.eth.Contract(TIMELOCK_ABI as any, address) as any as TimelockContract;
}


export { ADDRESSES, VestingContract, TimelockContract };
