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
  GameTournament,
  GameTournamentMethodNames,
  GameTournamentEventsContext,
  GameTournamentEvents
>;
export type GameTournamentEvents =
  | 'AbortTimeoutUpdated'
  | 'EpochUpdated'
  | 'GameAborted'
  | 'GameFinished'
  | 'GameStarted'
  | 'JoinPriceUpdated'
  | 'MaxWeightUpdated'
  | 'MinWeightUpdated'
  | 'OwnershipTransferred'
  | 'Paused'
  | 'PlayerEntered'
  | 'PlayerLeft'
  | 'PlayerPlacedCard'
  | 'PowerPricesUpdated'
  | 'PowerUsed'
  | 'TournamentCreated'
  | 'TournamentFinish'
  | 'TournamentJoin'
  | 'TournamentLeave'
  | 'TournamentStart'
  | 'Unpaused'
  | 'WinAmountsUpdated';
export interface GameTournamentEventsContext {
  AbortTimeoutUpdated(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  EpochUpdated(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  GameAborted(
    parameters: {
      filter?: { gameId?: string | string[]; winner?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  GameFinished(
    parameters: {
      filter?: { gameId?: string | string[]; winner?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  GameStarted(
    parameters: {
      filter?: { gameId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  JoinPriceUpdated(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  MaxWeightUpdated(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  MinWeightUpdated(
    parameters: {
      filter?: {};
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
  Paused(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  PlayerEntered(
    parameters: {
      filter?: { gameId?: string | string[]; player?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  PlayerLeft(
    parameters: {
      filter?: { gameId?: string | string[]; player?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  PlayerPlacedCard(
    parameters: {
      filter?: { gameId?: string | string[]; player?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  PowerPricesUpdated(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  PowerUsed(
    parameters: {
      filter?: { gameId?: string | string[]; player?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  TournamentCreated(
    parameters: {
      filter?: { tournamentId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  TournamentFinish(
    parameters: {
      filter?: { tournamentId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  TournamentJoin(
    parameters: {
      filter?: { tournamentId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  TournamentLeave(
    parameters: {
      filter?: { tournamentId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  TournamentStart(
    parameters: {
      filter?: { tournamentId?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  Unpaused(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
  WinAmountsUpdated(
    parameters: {
      filter?: {};
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void
  ): EventResponse;
}
export type GameTournamentMethodNames =
  | 'new'
  | 'abort'
  | 'abortTimeout'
  | 'addTournament'
  | 'currentGames'
  | 'epoch'
  | 'fee'
  | 'game'
  | 'getPlayerInventory'
  | 'getRoundWinner'
  | 'inGameCount'
  | 'joinPrice'
  | 'joinTournament'
  | 'lastGameTimestamps'
  | 'leaderboard'
  | 'leaderboardPaginated'
  | 'leaveGame'
  | 'leaveTournament'
  | 'maxWeight'
  | 'minWeight'
  | 'owner'
  | 'ownerAbort'
  | 'paused'
  | 'placeCard'
  | 'playerGames'
  | 'playerPlayed'
  | 'playerWins'
  | 'playersCurrentTournaments'
  | 'powerPrices'
  | 'renounceOwnership'
  | 'togglePause'
  | 'transferOwnership'
  | 'updateAbortTimeout'
  | 'updateEpoch'
  | 'updateGameLending'
  | 'updateJoinPrice'
  | 'updateMaxWeight'
  | 'updateMinWeight'
  | 'updatePowerPrices'
  | 'updateWinAmounts'
  | 'usePower'
  | 'waitingCount'
  | 'winAmounts'
  | 'withdrawFee';
export interface UsedPowersResponse {
  used: boolean;
  powerType: string;
  value: string;
}
export interface PlayerResponse {
  addr: string;
  placedCards: [string, string, string, string];
  usedPowers: UsedPowersResponse[];
  lent: [boolean, boolean, boolean, boolean];
}
export interface GameinfoResponse {
  gameId: string;
  player: PlayerResponse[];
  started: boolean;
  finished: boolean;
  turn: string;
  winner: string;
  round: string;
  lastAction: string;
  bank: string;
}
export interface InventoryitemResponse {
  tokenId: string;
  balance: string;
}
export interface LeaderboarditemResponse {
  player: string;
  wins: string;
}
export interface GameTournament {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: constructor
   * @param resource Type: address, Indexed: false
   * @param phi Type: address, Indexed: false
   * @param gameLending Type: address, Indexed: false
   * @param joinPrice_ Type: uint256, Indexed: false
   */
  'new'(
    resource: string,
    phi: string,
    gameLending: string,
    joinPrice_: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  abort(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  abortTimeout(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param playersCount Type: uint256, Indexed: false
   * @param startTime Type: uint256, Indexed: false
   * @param joinDeadline Type: uint256, Indexed: false
   */
  addTournament(
    playersCount: string,
    startTime: string,
    joinDeadline: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   */
  currentGames(parameter0: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  epoch(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  fee(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param gameId Type: uint256, Indexed: false
   */
  game(gameId: string): MethodConstantReturnContext<GameinfoResponse>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param gameId Type: uint256, Indexed: false
   * @param player Type: address, Indexed: false
   */
  getPlayerInventory(
    gameId: string,
    player: string
  ): MethodConstantReturnContext<InventoryitemResponse[]>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param gameId Type: uint256, Indexed: false
   * @param round Type: uint256, Indexed: false
   */
  getRoundWinner(
    gameId: string,
    round: string
  ): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  inGameCount(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  joinPrice(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param tournamentId Type: uint256, Indexed: false
   */
  joinTournament(tournamentId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   */
  lastGameTimestamps(parameter0: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  leaderboard(): MethodConstantReturnContext<LeaderboarditemResponse[]>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param offset Type: uint256, Indexed: false
   * @param count Type: uint256, Indexed: false
   */
  leaderboardPaginated(
    offset: string,
    count: string
  ): MethodConstantReturnContext<LeaderboarditemResponse[]>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  leaveGame(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param tournamentId Type: uint256, Indexed: false
   */
  leaveTournament(tournamentId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  maxWeight(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  minWeight(): MethodConstantReturnContext<string>;
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
   * @param gameId Type: uint256, Indexed: false
   */
  ownerAbort(gameId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  paused(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param tokenId Type: uint256, Indexed: false
   */
  placeCard(tokenId: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param player Type: address, Indexed: false
   */
  playerGames(player: string): MethodConstantReturnContext<string[]>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param player Type: address, Indexed: false
   */
  playerPlayed(player: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param player Type: address, Indexed: false
   */
  playerWins(player: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   */
  playersCurrentTournaments(
    parameter0: string
  ): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   */
  powerPrices(parameter0: string): MethodConstantReturnContext<string>;
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
   */
  togglePause(): MethodReturnContext;
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
   * @param newValue Type: uint256, Indexed: false
   */
  updateAbortTimeout(newValue: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newValue Type: uint256, Indexed: false
   */
  updateEpoch(newValue: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newAddress Type: address, Indexed: false
   */
  updateGameLending(newAddress: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newValue Type: uint256, Indexed: false
   */
  updateJoinPrice(newValue: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newValue Type: uint256, Indexed: false
   */
  updateMaxWeight(newValue: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param newValue Type: uint256, Indexed: false
   */
  updateMinWeight(newValue: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param waterPrice Type: uint256, Indexed: false
   * @param firePrice Type: uint256, Indexed: false
   * @param airPrice Type: uint256, Indexed: false
   * @param earthPrice Type: uint256, Indexed: false
   */
  updatePowerPrices(
    waterPrice: string,
    firePrice: string,
    airPrice: string,
    earthPrice: string
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param amounts Type: uint256[5], Indexed: false
   */
  updateWinAmounts(
    amounts: [string, string, string, string, string, string]
  ): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param powerType Type: uint8, Indexed: false
   */
  usePower(powerType: string | number): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  waitingCount(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   */
  winAmounts(parameter0: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param to Type: address, Indexed: false
   */
  withdrawFee(to: string): MethodReturnContext;
}
