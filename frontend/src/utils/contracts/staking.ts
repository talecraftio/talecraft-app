import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import {
  PromiEvent,
  TransactionReceipt,
  EventResponse,
  EventData,
  Web3ContractContext,
} from 'ethereum-abi-types-generator';

export interface CallOptions {
  from?: string;
  gasPrice?: string;
  gas?: number;
}

export interface SendOptions {
  from: string;
  value?: number | string | BN | BigNumber;
  gasPrice?: string;
  gas?: number;
}

export interface EstimateGasOptions {
  from?: string;
  value?: number | string | BN | BigNumber;
  gas?: number;
}

export interface MethodPayableReturnContext {
  send(options: SendOptions): PromiEvent<TransactionReceipt>;
  send(
    options: SendOptions,
    callback: (error: Error, result: any) => void
  ): PromiEvent<TransactionReceipt>;
  estimateGas(options: EstimateGasOptions): Promise<number>;
  estimateGas(
    options: EstimateGasOptions,
    callback: (error: Error, result: any) => void
  ): Promise<number>;
  encodeABI(): string;
}

export interface MethodConstantReturnContext<TCallReturn> {
  call(): Promise<TCallReturn>;
  call(options: CallOptions): Promise<TCallReturn>;
  call(
    options: CallOptions,
    callback: (error: Error, result: TCallReturn) => void
  ): Promise<TCallReturn>;
  encodeABI(): string;
}

export interface MethodReturnContext extends MethodPayableReturnContext {}

export type ContractContext = Web3ContractContext<
  Staking,
  StakingMethodNames,
  StakingEventsContext,
  StakingEvents
>;
export type StakingEvents =
  | 'CreatePool'
  | 'Deposit'
  | 'EmergencyWithdraw'
  | 'OwnershipTransferred'
  | 'UpdatePoolAllocation'
  | 'Withdraw';
export interface StakingEventsContext {
  CreatePool(
    parameters: {
      filter?: {
        stakingToken?: string | string[];
        rewardToken?: string | string[];
        allocation?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  Deposit(
    parameters: {
      filter?: { user?: string | string[]; pid?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  EmergencyWithdraw(
    parameters: {
      filter?: { user?: string | string[]; pid?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  OwnershipTransferred(
    parameters: {
      filter?: {
        previousOwner?: string | string[];
        newOwner?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  UpdatePoolAllocation(
    parameters: {
      filter?: { pid?: string | string[]; allocation?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  Withdraw(
    parameters: {
      filter?: { user?: string | string[]; pid?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
}
export type StakingMethodNames =
  | 'new'
  | 'FEE_BASE'
  | 'addAllocation'
  | 'blockDeltaFeeStage'
  | 'bonusMultiplier'
  | 'claimLeftovers'
  | 'deposit'
  | 'emergencyWithdraw'
  | 'endBlock'
  | 'feeRecipient'
  | 'feeStage'
  | 'getMultiplier'
  | 'getPendingRewards'
  | 'owner'
  | 'poolInfo'
  | 'renounceOwnership'
  | 'rewardToken'
  | 'setBlockDeltaFeeStage'
  | 'setEndBlock'
  | 'setFeeRecipient'
  | 'setFeeStage'
  | 'setMultiplier'
  | 'setStartBlock'
  | 'setTokenPerBlock'
  | 'startBlock'
  | 'tokenPerBlock'
  | 'totalAllocPoint'
  | 'transferOwnership'
  | 'updatePool'
  | 'userInfo'
  | 'withdraw';
export interface PoolInfoResponse {
  token: string;
  supply: string;
  allocPoint: string;
  lastRewardBlock: string;
  accTokenPerShare: string;
  totalAllocation: string;
  totalReward: string;
}
export interface UserInfoResponse {
  amount: string;
  rewardDebt: string;
  rewardDebtAtBlock: string;
  lastWithdrawBlock: string;
  firstDepositBlock: string;
  lastDepositBlock: string;
}
export interface Staking {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: constructor
   * @param _rewardToken Type: address, Indexed: false
   * @param _stakingToken Type: address, Indexed: false
   * @param _startBlock Type: uint256, Indexed: false
   * @param _endBlock Type: uint256, Indexed: false
   * @param _allocation Type: uint256, Indexed: false
   * @param _feeRecipient Type: address, Indexed: false
   * @param _feeStage Type: uint256[], Indexed: false
   * @param _blockDeltaFeeStage Type: uint256[], Indexed: false
   */
  'new'(
    _rewardToken: string,
    _stakingToken: string,
    _startBlock: string,
    _endBlock: string,
    _allocation: string,
    _feeRecipient: string,
    _feeStage: string[],
    _blockDeltaFeeStage: string[]
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  FEE_BASE(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _amount Type: uint256, Indexed: false
   */
  addAllocation(_pid: string, _amount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   */
  blockDeltaFeeStage(parameter0: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  bonusMultiplier(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  claimLeftovers(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _amount Type: uint256, Indexed: false
   */
  deposit(_pid: string, _amount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  emergencyWithdraw(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  endBlock(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  feeRecipient(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   */
  feeStage(parameter0: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _from Type: uint256, Indexed: false
   * @param _to Type: uint256, Indexed: false
   */
  getMultiplier(
    _from: string,
    _to: string
  ): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _user Type: address, Indexed: false
   */
  getPendingRewards(
    _pid: string,
    _user: string
  ): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  owner(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   */
  poolInfo(parameter0: string): MethodConstantReturnContext<PoolInfoResponse>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  renounceOwnership(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  rewardToken(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _blockDeltas Type: uint256[], Indexed: false
   */
  setBlockDeltaFeeStage(_blockDeltas: string[]): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _block Type: uint256, Indexed: false
   */
  setEndBlock(_block: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _feeRecipient Type: address, Indexed: false
   */
  setFeeRecipient(_feeRecipient: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _feeStage Type: uint256[], Indexed: false
   */
  setFeeStage(_feeStage: string[]): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _multiplier Type: uint256, Indexed: false
   */
  setMultiplier(_multiplier: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _block Type: uint256, Indexed: false
   */
  setStartBlock(_block: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _amount Type: uint256, Indexed: false
   */
  setTokenPerBlock(_amount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  startBlock(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  tokenPerBlock(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  totalAllocPoint(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newOwner Type: address, Indexed: false
   */
  transferOwnership(newOwner: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  updatePool(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   * @param parameter1 Type: address, Indexed: false
   */
  userInfo(
    parameter0: string,
    parameter1: string
  ): MethodConstantReturnContext<UserInfoResponse>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _amount Type: uint256, Indexed: false
   */
  withdraw(_pid: string, _amount: string): MethodReturnContext;
}
