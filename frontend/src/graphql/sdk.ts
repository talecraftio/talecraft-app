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
  price: Scalars['Int'];
  resource?: Maybe<ResourceType>;
  seller: Scalars['String'];
};

export type Query = {
  listings?: Maybe<MarketplaceListingResponseType>;
};


export type Query_ListingsArgs = {
  order?: Maybe<Scalars['String']>;
  page?: Maybe<Scalars['Int']>;
  tiers?: Maybe<Array<Maybe<Scalars['String']>>>;
  weights?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type ResourceType = {
  ipfsHash: Scalars['String'];
  name: Scalars['String'];
  tier: Scalars['Int'];
  tokenId: Scalars['Int'];
  weight: Scalars['Int'];
};

export type Resource = { tokenId: number, name: string, tier: number, ipfsHash: string, weight: number };

export type GetListingsVariables = Exact<{
  tiers?: Maybe<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>>;
  weights?: Maybe<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>>;
  order?: Maybe<Scalars['String']>;
  page?: Maybe<Scalars['Int']>;
}>;


export type GetListings = { listings?: Maybe<{ totalItems?: Maybe<number>, items?: Maybe<Array<{ listingId: number, amount: number, price: number, seller: string, buyer?: Maybe<string>, closed: boolean, resource?: Maybe<{ tokenId: number, name: string, tier: number, ipfsHash: string, weight: number }> }>> }> };

export const Resource = gql`
    fragment resource on ResourceType {
  tokenId
  name
  tier
  ipfsHash
  weight
}
    `;
export const GetListingsDocument = gql`
    query getListings($tiers: [String], $weights: [String], $order: String, $page: Int) {
  listings(tiers: $tiers, weights: $weights, order: $order, page: $page) {
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

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getListings(variables?: GetListingsVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetListings> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetListings>(GetListingsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getListings');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;