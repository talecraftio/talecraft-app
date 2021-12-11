import csv
import json

import requests
from brownie import accounts, network, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenVestingFactory, MarketplaceNew
from brownie.network import Chain, gas_price

from scripts._utils import snowtrace_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/addresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    deployer = accounts.load('talecraft-deployer', '')

    # phi: Contract = PHI.deploy({'from': deployer})
    # addresses['phi'] = phi.address
    # snowtrace_publish(phi)
    # phi.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    phi = PHI.at('0x8aE8be25C23833e0A01Aa200403e826F611f9CD2')
    resource = Resource.at('0x212BF21Aa9D5e5c89a43cAC378b4b0ec13165784')
    chest = ChestSale.at('0xe115A920c0eDC5B7dF8a94f7F39BE967aD6063D6')


    resource = Resource.deploy(phi.address, {'from': deployer})
    addresses['resource'] = resource.address
    snowtrace_publish(resource)

    chest = ChestSale.deploy(resource.address, phi.address, 1639242000, {'from': deployer})
    addresses['chest'] = chest.address
    snowtrace_publish(chest)
    chest.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

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

    marketplace = MarketplaceNew.deploy(resource.address, phi.address, {'from': deployer})
    addresses['marketplace'] = marketplace.address
    snowtrace_publish(marketplace)
    marketplace.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    # game = Game.deploy(resource.address, {'from': deplo yer})
    # addresses['game'] = game.address
    # snowtrace_publish(game)
    # game.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    # factory = TokenVestingFactory.deploy(deployer.address, {'from': deployer})
    # addresses['vestingFactory'] = factory.address
    # snowtrace_publish(factory)

    # resource.initialMint(chest.address, {'from': deployer})

    # phi.transfer('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', 30_000_000e18, {'from': deployer})

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))

