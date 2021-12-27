import csv
import json

import requests
from brownie import accounts, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenVestingFactory, MarketplaceNew
from brownie.network import Chain, gas_price

from scripts._utils import snowtrace_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/testnetAddresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    gas_price(150000000000)

    deployer = accounts.load('deployer')

    phi: Contract = PHI.deploy({'from': deployer})
    addresses['phi'] = phi.address
    snowtrace_publish(phi)
    phi.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    resource = Resource.deploy(phi.address, {'from': deployer})
    addresses['resource'] = resource.address
    snowtrace_publish(resource)

    chest = ChestSale.deploy(resource.address, phi.address, 1638550800, {'from': deployer})
    addresses['chest'] = chest.address
    snowtrace_publish(chest)
    chest.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    staking = CraftStaking.deploy(
        phi.address,
        phi.address,
        1637332200,
        1645281000,
        7948800000000000000000,
        '0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14',
        [4, 3, 2, 1],
        [1, 2, 3, 4],
        {'from': deployer}
    )
    addresses['staking'] = staking.address
    snowtrace_publish(staking)
    staking.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    marketplace_old = Marketplace.deploy(resource.address, {'from': deployer})
    addresses['marketplaceOld'] = marketplace_old.address
    snowtrace_publish(marketplace_old)

    marketplace = MarketplaceNew.deploy(resource.address, phi.address, {'from': deployer})
    addresses['marketplace'] = marketplace.address
    snowtrace_publish(marketplace)
    marketplace.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    game = Game.deploy(Resource[-1].address, PHI[-1].address, {'from': deployer})
    addresses['game'] = game.address
    snowtrace_publish(game)
    game.startGames(list(range(50)), {'from': deployer})
    game.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    factory = TokenVestingFactory.deploy(deployer.address, {'from': deployer})
    addresses['vestingFactory'] = factory.address
    snowtrace_publish(factory)

    chest = ChestSale[-1]
    phi = PHI[-1]
    resource = Resource[-1]

    resource.initialMint(chest.address, {'from': deployer})

    phi.transfer('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', 15_000_000e18, {'from': deployer})

    with open('../frontend/src/utils/contracts/testnetAddresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))

