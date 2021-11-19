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
  listings?: Maybe<MarketplaceListingResponseType>;
  marketplaceStats?: Maybe<MarketplaceStatsType>;
  resource?: Maybe<ResourceType>;
};


export type Query_ListingsArgs = {
  order?: Maybe<Scalars['String']>;
  page?: Maybe<Scalars['Int']>;
  q?: Maybe<Scalars['String']>;
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
  ipfsHash: Scalars['String'];
  name: Scalars['String'];
  sales?: Maybe<Array<Maybe<ResourceSaleEntry>>>;
  tier: Scalars['Int'];
  tokenId: Scalars['Int'];
  weight: Scalars['Int'];
};

export type Resource = { tokenId: number, name: string, tier: number, ipfsHash: string, weight: number, sales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>> };

export type GetListingsVariables = Exact<{
  tiers?: Maybe<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>>;
  weights?: Maybe<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>>;
  q?: Maybe<Scalars['String']>;
  order?: Maybe<Scalars['String']>;
  page?: Maybe<Scalars['Int']>;
}>;


export type GetListings = { listings?: Maybe<{ totalItems?: Maybe<number>, items?: Maybe<Array<{ listingId: number, amount: number, price: any, seller: string, buyer?: Maybe<string>, closed: boolean, resource?: Maybe<{ tokenId: number, name: string, tier: number, ipfsHash: string, weight: number, sales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>> }> }>> }> };

export type MarketplaceStats = { minElementPrice?: Maybe<any> };

export type GetMarketplaceStatsVariables = Exact<{ [key: string]: never; }>;


export type GetMarketplaceStats = { marketplaceStats?: Maybe<{ minElementPrice?: Maybe<any> }> };

export type GetResourceVariables = Exact<{
  tokenId: Scalars['ID'];
}>;


export type GetResource = { resource?: Maybe<{ tokenId: number, name: string, tier: number, ipfsHash: string, weight: number, sales?: Maybe<Array<Maybe<{ datetime?: Maybe<any>, amount?: Maybe<number>, price?: Maybe<any> }>>> }> };

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
}
    `;
export const MarketplaceStats = gql`
    fragment marketplaceStats on MarketplaceStatsType {
  minElementPrice
}
    `;
export const GetListingsDocument = gql`
    query getListings($tiers: [String], $weights: [String], $q: String, $order: String, $page: Int) {
  listings(tiers: $tiers, weights: $weights, q: $q, order: $order, page: $page) {
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
export const GetResourceDocument = gql`
    query getResource($tokenId: ID!) {
  resource(tokenId: $tokenId) {
    ...resource
  }
}
    ${Resource}`;

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
    getResource(variables: GetResourceVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetResource> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetResource>(GetResourceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getResource');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;