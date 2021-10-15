import Web3 from "web3";

import CHEST_ABI from './chest.abi.json';
import PHI_ABI from './phi.abi.json';
import RESOURCE_ABI from './resource.abi.json';
import STAKING_ABI from './staking.abi.json';

import { ContractContext as ChestContract } from './chest';
import { ContractContext as ResourceContract } from './resource';
import { ContractContext as PhiContract } from './phi';
import { ContractContext as StakingContract } from './staking';

import ADDRESSES from './addresses';

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

export { ADDRESSES };
