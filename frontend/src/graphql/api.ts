import { getSdk, Sdk } from "./sdk";
import { GraphQLClient } from "graphql-request";

export class Api {
    private readonly client: GraphQLClient;
    private readonly sdk: Sdk;

    constructor(uri: string) {
        this.client = new GraphQLClient(uri);
        this.sdk = getSdk(this.client);
    }

    async getListings(weights?: string[], tiers?: string[], q?: string, seller?: string, order?: string, page?: number) {
        const r = await this.sdk.getListings({ weights, tiers, order, seller, page, q });
        return r.listings;
    }

    async getMarketplaceStats() {
        const r = await this.sdk.getMarketplaceStats();
        return r.marketplaceStats;
    }

    async getResource(tokenId: string) {
        const r = await this.sdk.getResource({ tokenId });
        return r.resource;
    }

    async getLeaderboard() {
        const r = await this.sdk.leaderboard();
        return r.leaderboard;
    }

    async getChatToken(chatId: string, sig: string) {
        const r = await this.sdk.chatToken({ chatId, sig });
        return r.chatToken;
    }
}

