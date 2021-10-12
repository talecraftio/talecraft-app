import csv
import json

import requests
from brownie import accounts, Contract, PHI, ChestSale, Resource

from scripts._utils import sourcify_publish


def main():
    try:
        with open('addresses.json', 'r') as f:
            addresses = json.load(f)
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

    resource.initialMint(chest.address)

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))

