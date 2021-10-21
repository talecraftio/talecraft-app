import csv
import json

import requests
from brownie import accounts, Contract, PHI, ChestSale, Resource, DuelStaking, Marketplace
from brownie.network import Chain

from scripts._utils import sourcify_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/addresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    deployer = accounts.load('deployer')

    phi: Contract = PHI.deploy({'from': deployer})
    addresses['phi'] = phi.address
    sourcify_publish(phi)

    resource = Resource.deploy(phi.address, {'from': deployer})
    addresses['resource'] = resource.address
    sourcify_publish(resource)

    chest = ChestSale.deploy(resource.address, phi.address, {'from': deployer})
    addresses['chest'] = chest.address
    sourcify_publish(chest)

    current_block = len(Chain())
    staking = DuelStaking.deploy(
        phi.address,
        phi.address,
        current_block,
        current_block + 302400,
        1 * 302400,
        deployer.address,
        [0, 0, 0, 0],
        [1, 2, 3, 4],
        {'from': deployer}
    )
    addresses['staking'] = staking.address
    sourcify_publish(staking)

    marketplace = Marketplace.deploy(resource.address, {'from': deployer})
    addresses['marketplace'] = marketplace.address
    sourcify_publish(marketplace)

    resource.initialMint(chest.address)
    phi.approve(staking.address, 1000e18)
    staking.deposit(0, 1000e18)
    phi.transfer('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', 5_000_000e18)

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))

