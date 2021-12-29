import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /**
   * The `DateTime` scalar type represents a DateTime
   * value as specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  DateTime: any;
  /** The `Decimal` scalar type represents a python Decimal. */
  Decimal: any;
};

export type GameLeaderboardItemType = {
  address: Scalars['String'];
  league: Scalars['Int'];
  played?: Maybe<Scalars['Int']>;
  wins?: Maybe<Scalars['Int']>;
};

export type LeaderboardItemType = {
  address: Scalars['String'];
  maxTier: Scalars['Int'];
  tier0: Scalars['Int'];
  tier1: Scalars['Int'];
  tier2: Scalars['Int'];
  tier3: Scalars['Int'];
  tier4: Scalars['Int'];
  tier5: Scalars['Int'];
  weight: Scalars['Int'];
};

export type MarketplaceListingResponseType = {
  items?: Maybe<Array<MarketplaceListingType>>;
  totalItems?: Maybe<Scalars['Int']>;
};

export type MarketplaceListingType = {
  amount: Scalars['Int'];
  buyer?: Maybe<Scalars['String']>;
  closed: Scalars['Boolean'];
  listingId: Scalars['Int'];
  price: Scalars['Decimal'];
  resource?: Maybe<ResourceType>;
  seller: Scalars['String'];
};

export type MarketplaceStatsType = {
  minElementPrice?: Maybe<Scalars['Decimal']>;
};

export type Query = {
  chatToken?: Maybe<Scalars['String']>;
  gameLeaderboard?: Maybe<Array<GameLeaderboardItemType>>;
  leaderboard?: Maybe<Array<LeaderboardItemType>>;
  listings?: Maybe<MarketplaceListingResponseType>;
  marketplaceStats?: Maybe<MarketplaceStatsType>;
  resource?: Maybe<ResourceType>;
  resources?: Maybe<Array<ResourceType>>;
  settings?: Maybe<SettingsType>;
};


export type Query_ChatTokenArgs = {
  chatId?: Maybe<Scalars['String']>;
  sig?: Maybe<Scalars['String']>;
};


export type Query_ListingsArgs = {
  order?: Maybe<Scalars['String']>;
  page?: Maybe<Scalars['Int']>;
  q?: Maybe<Scalars['String']>;
  seller?: Maybe<Scalars['String']>;
  tiers?: Maybe<Array<Maybe<Scalars['String']>>>;
  weights?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type Query_ResourceArgs = {
  tokenId?: Maybe<Scalars['ID']>;
};

export type ResourceSaleEntry = {
  amount?: Maybe<Scalars['Int']>;
  datetime?: Maybe<Scalars['DateTime']>;
  price?: Maybe<Scalars['Decimal']>;
};

export type ResourceType = {
  currentSales?: Maybe<Array<Maybe<ResourceSaleEntry>>>;
  ingredients?: Maybe<Array<Maybe<Scalars['Int']>>>;
  ipfsHash: Scalars['String'];
  name: Scalars['String'];
  sales?: Maybe<Array<Maybe<ResourceSaleEntry>>>;
  tier: Scalars['Int'];
  tokenId: Scalars['Int'];
  weight: Scalars['Int'];
};

export type SettingsType = {
  chestSaleActive?: Maybe<Scalars['Boolean']>;
};

export type Resource = { tokenId: number, name: string, tier: number, ipfsHash: string, weight: number, ingredients?: Maybe<Array<Maybe<number>>>, sales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>>, currentSales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>> };

export type LeaderboardItem = { address: string, weight: number, maxTier: number, tier0: number, tier1: number, tier2: number, tier3: number, tier4: number, tier5: number };

export type GameLeaderboardItem = { address: string, wins?: Maybe<number>, played?: Maybe<number>, league: number };

export type GetListingsVariables = Exact<{
  tiers?: Maybe<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>>;
  weights?: Maybe<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>>;
  q?: Maybe<Scalars['String']>;
  seller?: Maybe<Scalars['String']>;
  order?: Maybe<Scalars['String']>;
  page?: Maybe<Scalars['Int']>;
}>;


export type GetListings = { listings?: Maybe<{ totalItems?: Maybe<number>, items?: Maybe<Array<{ listingId: number, amount: number, price: any, seller: string, buyer?: Maybe<string>, closed: boolean, resource?: Maybe<{ tokenId: number, name: string, tier: number, ipfsHash: string, weight: number, ingredients?: Maybe<Array<Maybe<number>>>, sales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>>, currentSales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>> }> }>> }> };

export type MarketplaceStats = { minElementPrice?: Maybe<any> };

export type GetMarketplaceStatsVariables = Exact<{ [key: string]: never; }>;


export type GetMarketplaceStats = { marketplaceStats?: Maybe<{ minElementPrice?: Maybe<any> }> };

export type GetResourceTypesVariables = Exact<{ [key: string]: never; }>;


export type GetResourceTypes = { resources?: Maybe<Array<{ tokenId: number, name: string, tier: number, ipfsHash: string, weight: number, ingredients?: Maybe<Array<Maybe<number>>>, sales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>>, currentSales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>> }>> };

export type GetResourceVariables = Exact<{
  tokenId: Scalars['ID'];
}>;


export type GetResource = { resource?: Maybe<{ tokenId: number, name: string, tier: number, ipfsHash: string, weight: number, ingredients?: Maybe<Array<Maybe<number>>>, sales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>>, currentSales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>> }> };

export type LeaderboardVariables = Exact<{ [key: string]: never; }>;


export type Leaderboard = { leaderboard?: Maybe<Array<{ address: string, weight: number, maxTier: number, tier0: number, tier1: number, tier2: number, tier3: number, tier4: number, tier5: number }>> };

export type GameLeaderboardVariables = Exact<{ [key: string]: never; }>;


export type GameLeaderboard = { gameLeaderboard?: Maybe<Array<{ address: string, wins?: Maybe<number>, played?: Maybe<number>, league: number }>> };

export type ChatTokenVariables = Exact<{
  chatId: Scalars['String'];
  sig: Scalars['String'];
}>;


export type ChatToken = { chatToken?: Maybe<string> };

export type SettingsVariables = Exact<{ [key: string]: never; }>;


export type Settings = { settings?: Maybe<{ chestSaleActive?: Maybe<boolean> }> };

export const Resource = gql`
    fragment resource on ResourceType {
  tokenId
  name
  tier
  ipfsHash
  weight
  sales {
    datetime
    amount
    price
  }
  currentSales {
    datetime
    amount
    price
  }
  ingredients
}
    `;
export const LeaderboardItem = gql`
    fragment leaderboardItem on LeaderboardItemType {
  address
  weight
  maxTier
  tier0
  tier1
  tier2
  tier3
  tier4
  tier5
}
    `;
export const GameLeaderboardItem = gql`
    fragment gameLeaderboardItem on GameLeaderboardItemType {
  address
  wins
  played
  league
}
    `;
export const MarketplaceStats = gql`
    fragment marketplaceStats on MarketplaceStatsType {
  minElementPrice
}
    `;
export const GetListingsDocument = gql`
    query getListings($tiers: [String], $weights: [String], $q: String, $seller: String, $order: String, $page: Int) {
  listings(
    tiers: $tiers
    weights: $weights
    q: $q
    seller: $seller
    order: $order
    page: $page
  ) {
    totalItems
    items {
      listingId
      resource {
        ...resource
      }
      amount
      price
      seller
      buyer
      closed
    }
  }
}
    ${Resource}`;
export const GetMarketplaceStatsDocument = gql`
    query getMarketplaceStats {
  marketplaceStats {
    ...marketplaceStats
  }
}
    ${MarketplaceStats}`;
export const GetResourceTypesDocument = gql`
    query getResourceTypes {
  resources {
    ...resource
  }
}
    ${Resource}`;
export const GetResourceDocument = gql`
    query getResource($tokenId: ID!) {
  resource(tokenId: $tokenId) {
    ...resource
  }
}
    ${Resource}`;
export const LeaderboardDocument = gql`
    query leaderboard {
  leaderboard {
    ...leaderboardItem
  }
}
    ${LeaderboardItem}`;
export const GameLeaderboardDocument = gql`
    query gameLeaderboard {
  gameLeaderboard {
    ...gameLeaderboardItem
  }
}
    ${GameLeaderboardItem}`;
export const ChatTokenDocument = gql`
    query chatToken($chatId: String!, $sig: String!) {
  chatToken(chatId: $chatId, sig: $sig)
}
    `;
export const SettingsDocument = gql`
    query settings {
  settings {
    chestSaleActive
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getListings(variables?: GetListingsVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetListings> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetListings>(GetListingsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getListings');
    },
    getMarketplaceStats(variables?: GetMarketplaceStatsVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetMarketplaceStats> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMarketplaceStats>(GetMarketplaceStatsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getMarketplaceStats');
    },
    getResourceTypes(variables?: GetResourceTypesVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetResourceTypes> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetResourceTypes>(GetResourceTypesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getResourceTypes');
    },
    getResource(variables: GetResourceVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetResource> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetResource>(GetResourceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getResource');
    },
    leaderboard(variables?: LeaderboardVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<Leaderboard> {
      return withWrapper((wrappedRequestHeaders) => client.request<Leaderboard>(LeaderboardDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'leaderboard');
    },
    gameLeaderboard(variables?: GameLeaderboardVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GameLeaderboard> {
      return withWrapper((wrappedRequestHeaders) => client.request<GameLeaderboard>(GameLeaderboardDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'gameLeaderboard');
    },
    chatToken(variables: ChatTokenVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ChatToken> {
      return withWrapper((wrappedRequestHeaders) => client.request<ChatToken>(ChatTokenDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'chatToken');
    },
    settings(variables?: SettingsVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<Settings> {
      return withWrapper((wrappedRequestHeaders) => client.request<Settings>(SettingsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'settings');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;