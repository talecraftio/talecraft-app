from brownie import accounts, network, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenVestingFactory, MarketplaceNew


def main():
    resource_ = Resource.at('0xae1ed7a45bEe39566D728EF4aE312A3517ed3A8C')
    marketplace_ = MarketplaceNew.at('0xF536Cb8037ab72249404f14E507b7b660d052F9D')
    marketplace_old_ = Marketplace.at('0x23BBba252DA45fEac8A22F0497bD2954D67b3cD0')

    owed = {}
    for player in resource_.getPlayers():
        if player in ['0xABE1B93E8b6C2176B18fcde71FBe2482a0d3A543', '0x0000000000000000000000000000000000000000']:
            continue

        balances = resource_.balanceOfBatch([player] * 160, list(range(1, 161)))
        for token_id, balance in enumerate(balances, start=1):
            owed.setdefault(player, {})[token_id] = balance

        # old
        listings = marketplace_old_.getListingsBySeller(player)
        for listing in listings:
            listing = marketplace_old_.getListing(listing)
            if listing[5]:
                continue
            owed[player][listing[0]] += listing[1]

        # new
        listings = marketplace_.getListingsBySeller(player)
        for listing in listings:
            listing = marketplace_.getListing(listing)
            if listing[5]:
                continue
            owed[player][listing[0]] += listing[1]

        crafts = resource_.pendingCrafts(player)
        for craft in resource_.getCrafts(crafts):
            if craft[2]:
                continue
            owed[player][craft[0]] += 1

    with open('owed.csv', 'w') as f:
        for player, rest in owed.items():
            for token_id, amount in rest.items():
                if amount > 0:
                    f.write(f'{player},{token_id},{amount}\n')
    print(len(owed))
