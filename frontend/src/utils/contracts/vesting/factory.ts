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
  Factory,
  FactoryMethodNames,
  FactoryEventsContext,
  FactoryEvents
>;
export type FactoryEvents =
  | 'DeployedTimelockContract'
  | 'DeployedVestingContract';
export interface FactoryEventsContext {
  DeployedTimelockContract(
    parameters: {
      filter?: {
        timelock?: string | string[];
        beneficiary?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  DeployedVestingContract(
    parameters: {
      filter?: {
        vesting?: string | string[];
        beneficiary?: string | string[];
        owner?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
}
export type FactoryMethodNames =
  | 'new'
  | 'DEFAULT_CLIFF'
  | 'DEFAULT_DURATION'
  | 'DEFAULT_REVOCABLE'
  | 'defaultOwner'
  | 'deployDefaultVestingContract'
  | 'deployDefaultVestingContractAndDepositTokens'
  | 'deployMultipleTimelockContractAndDepositTokens'
  | 'deployMultipleVestingContractAndDepositTokens'
  | 'deployTimelockContract'
  | 'deployTimelockContractAndDepositTokens'
  | 'deployVestingContract'
  | 'deployVestingContractAndDepositTokens'
  | 'timelockContracts'
  | 'vestingContracts';
export interface Factory {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: constructor
   * @param _defaultOwner Type: address, Indexed: false
   */
  'new'(_defaultOwner: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  DEFAULT_CLIFF(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  DEFAULT_DURATION(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  DEFAULT_REVOCABLE(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  defaultOwner(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _beneficiary Type: address, Indexed: false
   * @param _start Type: uint256, Indexed: false
   */
  deployDefaultVestingContract(
    _beneficiary: string,
    _start: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _beneficiary Type: address, Indexed: false
   * @param _start Type: uint256, Indexed: false
   * @param _token Type: address, Indexed: false
   * @param amount Type: uint256, Indexed: false
   */
  deployDefaultVestingContractAndDepositTokens(
    _beneficiary: string,
    _start: string,
    _token: string,
    amount: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _beneficiaries Type: address[], Indexed: false
   * @param _owner Type: address, Indexed: false
   * @param _releaseTime Type: uint256, Indexed: false
   * @param _revocable Type: bool, Indexed: false
   * @param _token Type: address, Indexed: false
   * @param amount Type: uint256, Indexed: false
   */
  deployMultipleTimelockContractAndDepositTokens(
    _beneficiaries: string[],
    _owner: string,
    _releaseTime: string,
    _revocable: boolean,
    _token: string,
    amount: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _owner Type: address, Indexed: false
   * @param _beneficiaries Type: address[], Indexed: false
   * @param _start Type: uint256, Indexed: false
   * @param _cliff Type: uint256, Indexed: false
   * @param _duration Type: uint256, Indexed: false
   * @param _revocable Type: bool, Indexed: false
   * @param _token Type: address, Indexed: false
   * @param amountEach Type: uint256, Indexed: false
   */
  deployMultipleVestingContractAndDepositTokens(
    _owner: string,
    _beneficiaries: string[],
    _start: string,
    _cliff: string,
    _duration: string,
    _revocable: boolean,
    _token: string,
    amountEach: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _beneficiary Type: address, Indexed: false
   * @param _owner Type: address, Indexed: false
   * @param _releaseTime Type: uint256, Indexed: false
   * @param _revocable Type: bool, Indexed: false
   */
  deployTimelockContract(
    _beneficiary: string,
    _owner: string,
    _releaseTime: string,
    _revocable: boolean
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _beneficiary Type: address, Indexed: false
   * @param _owner Type: address, Indexed: false
   * @param _releaseTime Type: uint256, Indexed: false
   * @param _revocable Type: bool, Indexed: false
   * @param _token Type: address, Indexed: false
   * @param amountEach Type: uint256, Indexed: false
   */
  deployTimelockContractAndDepositTokens(
    _beneficiary: string,
    _owner: string,
    _releaseTime: string,
    _revocable: boolean,
    _token: string,
    amountEach: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _owner Type: address, Indexed: false
   * @param _beneficiary Type: address, Indexed: false
   * @param _start Type: uint256, Indexed: false
   * @param _cliff Type: uint256, Indexed: false
   * @param _duration Type: uint256, Indexed: false
   * @param _revocable Type: bool, Indexed: false
   */
  deployVestingContract(
    _owner: string,
    _beneficiary: string,
    _start: string,
    _cliff: string,
    _duration: string,
    _revocable: boolean
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _owner Type: address, Indexed: false
   * @param _beneficiary Type: address, Indexed: false
   * @param _start Type: uint256, Indexed: false
   * @param _cliff Type: uint256, Indexed: false
   * @param _duration Type: uint256, Indexed: false
   * @param _revocable Type: bool, Indexed: false
   * @param _token Type: address, Indexed: false
   * @param amount Type: uint256, Indexed: false
   */
  deployVestingContractAndDepositTokens(
    _owner: string,
    _beneficiary: string,
    _start: string,
    _cliff: string,
    _duration: string,
    _revocable: boolean,
    _token: string,
    amount: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _beneficiary Type: address, Indexed: false
   */
  timelockContracts(
    _beneficiary: string
  ): MethodConstantReturnContext<string[]>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _beneficiary Type: address, Indexed: false
   */
  vestingContracts(_beneficiary: string): MethodConstantReturnContext<string[]>;
}
