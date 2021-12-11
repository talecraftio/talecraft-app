from brownie import accounts, network, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenVestingFactory, MarketplaceNew


def main():
    network.gas_price(30000000000)

    deployer = accounts.load('talecraft-deployer', '')

    resource = Resource.at('0xcc367e92c1b2BB0eB503F67654F3581c086eD2fc')

    resource.finishPremint({'from': deployer})
    resource.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})
