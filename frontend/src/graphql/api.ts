import { getSdk, Sdk } from "./sdk";
import { GraphQLClient } from "graphql-request";

export class Api {
    private readonly client: GraphQLClient;
    private readonly sdk: Sdk;

    constructor(uri: string) {
        this.client = new GraphQLClient(uri);
        this.sdk = getSdk(this.client);
    }

    async getListings(weights?: string[], tiers?: string[], order?: string, page?: number) {
        const r = await this.sdk.getListings({ weights, tiers, order, page });
        return r.listings;
    }
}
