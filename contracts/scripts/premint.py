from brownie import accounts, network, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenVestingFactory, MarketplaceNew


def main():
    network.gas_price(30000000000)

    deployer = accounts.load('talecraft-deployer', '')

    resource = Resource.at('0xcc367e92c1b2BB0eB503F67654F3581c086eD2fc')

    owed = {}
    with open('owed.csv') as f:
        data = [l.strip().split(',') for l in f.readlines()]
        for addr, token_id, amount in data:
            owed.setdefault(addr, {})[int(token_id)] = int(amount)

        to = []
        tid = []
        amnt = []

        for addr, rest in owed.items():
            for token_id, amount in rest.items():
                balance = resource.balanceOf(addr, token_id)
                if balance != amount:
                    print(f'{addr}: should be {amount}, actual {balance}')
