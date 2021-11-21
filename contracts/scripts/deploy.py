import csv
import json

import requests
from brownie import accounts, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenVestingFactory
from brownie.network import Chain

from scripts._utils import snowtrace_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/addresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    deployer = accounts.load('talecraft-deployer')

    # phi: Contract = PHI.deploy({'from': deployer})
    # addresses['phi'] = phi.address
    # snowtrace_publish(phi)
    # phi.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})
    #
    # resource = Resource.deploy(phi.address, {'from': deployer})
    # addresses['resource'] = resource.address
    # snowtrace_publish(resource)
    #
    # chest = ChestSale.deploy(resource.address, phi.address, 1638316800, {'from': deployer})
    # addresses['chest'] = chest.address
    # snowtrace_publish(chest)
    # chest.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})
    #
    # staking = CraftStaking.deploy(
    #     phi.address,
    #     phi.address,
    #     1637332200,
    #     1645281000,
    #     7948800000000000000000,
    #     '0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14',
    #     [4, 3, 2, 1],
    #     [1, 2, 3, 4],
    #     {'from': deployer}
    # )
    # addresses['staking'] = staking.address
    # snowtrace_publish(staking)
    # staking.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})
    #
    # marketplace = Marketplace.deploy(resource.address, {'from': deployer})
    # addresses['marketplace'] = marketplace.address
    # snowtrace_publish(marketplace)
    #
    # game = Game.deploy(resource.address, {'from': deployer})
    # addresses['game'] = game.address
    # snowtrace_publish(game)
    # game.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})
    #
    # factory = TokenVestingFactory.deploy(deployer.address, {'from': deployer})
    # addresses['vestingFactory'] = factory.address
    # snowtrace_publish(factory)
    #
    # resource.initialMint(chest.address, {'from': deployer})


    PHI[-1].transfer('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', 30_000_000e18, {'from': deployer})

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))

