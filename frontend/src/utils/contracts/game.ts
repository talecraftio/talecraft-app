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
  Game,
  GameMethodNames,
  GameEventsContext,
  GameEvents
>;
export type GameEvents =
  | 'Approval'
  | 'CreatedNewGame'
  | 'GameFinished'
  | 'GameStarted'
  | 'OwnershipTransferred'
  | 'PlayerEntered'
  | 'PlayerExited'
  | 'PlayerPlacedCard'
  | 'TokensExchanged'
  | 'Transfer';
export interface GameEventsContext {
  Approval(
    parameters: {
      filter?: { owner?: string | string[]; spender?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  CreatedNewGame(
    parameters: {
      filter?: { gameId?: string | string[]; poolSlot?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  GameFinished(
    parameters: {
      filter?: {
        gameId?: string | string[];
        poolSlot?: string | string[];
        winner?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  GameStarted(
    parameters: {
      filter?: { gameId?: string | string[]; poolSlot?: string | string[] };
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
  PlayerEntered(
    parameters: {
      filter?: {
        gameId?: string | string[];
        poolSlot?: string | string[];
        player?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  PlayerExited(
    parameters: {
      filter?: {
        gameId?: string | string[];
        poolSlot?: string | string[];
        player?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  PlayerPlacedCard(
    parameters: {
      filter?: {
        gameId?: string | string[];
        poolSlot?: string | string[];
        player?: string | string[];
      };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  TokensExchanged(
    parameters: {
      filter?: { player?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  Transfer(
    parameters: {
      filter?: { from?: string | string[]; to?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
}
export type GameMethodNames =
  | 'new'
  | 'AVAX_PER_TOKEN'
  | 'allowance'
  | 'approve'
  | 'balanceOf'
  | 'burn'
  | 'decimals'
  | 'decreaseAllowance'
  | 'enterGame'
  | 'exchangeTokens'
  | 'exitGame'
  | 'getAllGames'
  | 'getGameById'
  | 'getGameByPoolSlot'
  | 'getLastGameId'
  | 'increaseAllowance'
  | 'name'
  | 'onERC1155BatchReceived'
  | 'onERC1155Received'
  | 'owner'
  | 'placeCard'
  | 'renounceOwnership'
  | 'setWhitelistedContractAddress'
  | 'startGames'
  | 'supportsInterface'
  | 'symbol'
  | 'totalSupply'
  | 'transfer'
  | 'transferFrom'
  | 'transferOwnership'
  | 'whitelistedContractAddress';
export interface Player1Response {
  addr: string;
  placedCards: [string, string, string, string];
}
export interface Player2Response {
  addr: string;
  placedCards: [string, string, string, string];
}
export interface Game50Response {
  gameId: string;
  player1: Player1Response;
  player2: Player2Response;
  started: boolean;
  finished: boolean;
  turn: string;
  winner: string;
  round: string;
}
export interface GameResponse {
  gameId: string;
  player1: Player1Response;
  player2: Player2Response;
  started: boolean;
  finished: boolean;
  turn: string;
  winner: string;
  round: string;
}
export interface Game {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: constructor
   * @param resource Type: address, Indexed: false
   */
  'new'(resource: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  AVAX_PER_TOKEN(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param owner Type: address, Indexed: false
   * @param spender Type: address, Indexed: false
   */
  allowance(
    owner: string,
    spender: string
  ): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param spender Type: address, Indexed: false
   * @param amount Type: uint256, Indexed: false
   */
  approve(spender: string, amount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param account Type: address, Indexed: false
   */
  balanceOf(account: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param amount Type: uint256, Indexed: false
   */
  burn(amount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  decimals(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param spender Type: address, Indexed: false
   * @param subtractedValue Type: uint256, Indexed: false
   */
  decreaseAllowance(
    spender: string,
    subtractedValue: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param poolSlot Type: uint256, Indexed: false
   */
  enterGame(poolSlot: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  exchangeTokens(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param poolSlot Type: uint256, Indexed: false
   */
  exitGame(poolSlot: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  getAllGames(): MethodConstantReturnContext<Game50Response[]>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param gameId Type: uint256, Indexed: false
   */
  getGameById(gameId: string): MethodConstantReturnContext<GameResponse>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param poolSlot Type: uint256, Indexed: false
   */
  getGameByPoolSlot(
    poolSlot: string
  ): MethodConstantReturnContext<GameResponse>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  getLastGameId(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param spender Type: address, Indexed: false
   * @param addedValue Type: uint256, Indexed: false
   */
  increaseAllowance(spender: string, addedValue: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  name(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   * @param parameter1 Type: address, Indexed: false
   * @param parameter2 Type: uint256[], Indexed: false
   * @param parameter3 Type: uint256[], Indexed: false
   * @param parameter4 Type: bytes, Indexed: false
   */
  onERC1155BatchReceived(
    parameter0: string,
    parameter1: string,
    parameter2: string[],
    parameter3: string[],
    parameter4: string | number[]
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   * @param parameter1 Type: address, Indexed: false
   * @param parameter2 Type: uint256, Indexed: false
   * @param parameter3 Type: uint256, Indexed: false
   * @param parameter4 Type: bytes, Indexed: false
   */
  onERC1155Received(
    parameter0: string,
    parameter1: string,
    parameter2: string,
    parameter3: string,
    parameter4: string | number[]
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  owner(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param poolSlot Type: uint256, Indexed: false
   * @param tokenId Type: uint256, Indexed: false
   */
  placeCard(poolSlot: string, tokenId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  renounceOwnership(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param addr Type: address, Indexed: false
   */
  setWhitelistedContractAddress(addr: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param poolSlots Type: uint256[], Indexed: false
   */
  startGames(poolSlots: string[]): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param interfaceId Type: bytes4, Indexed: false
   */
  supportsInterface(
    interfaceId: string | number[]
  ): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  symbol(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  totalSupply(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param recipient Type: address, Indexed: false
   * @param amount Type: uint256, Indexed: false
   */
  transfer(recipient: string, amount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param sender Type: address, Indexed: false
   * @param recipient Type: address, Indexed: false
   * @param amount Type: uint256, Indexed: false
   */
  transferFrom(
    sender: string,
    recipient: string,
    amount: string
  ): MethodReturnContext;
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
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  whitelistedContractAddress(): MethodConstantReturnContext<string>;
}
