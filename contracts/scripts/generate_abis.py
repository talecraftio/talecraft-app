import json

from brownie import accounts, Contract, PHI, ChestSale, Resource, DuelStaking, Marketplace


def main():
    with open('../frontend/src/utils/contracts/phi.abi.json', 'w') as f:
        json.dump(PHI.abi, f)

    with open('../frontend/src/utils/contracts/resource.abi.json', 'w') as f:
        json.dump(Resource.abi, f)

    with open('../frontend/src/utils/contracts/chest.abi.json', 'w') as f:
        json.dump(ChestSale.abi, f)

    with open('../frontend/src/utils/contracts/staking.abi.json', 'w') as f:
        json.dump(DuelStaking.abi, f)

    with open('../frontend/src/utils/contracts/marketplace.abi.json', 'w') as f:
        json.dump(Marketplace.abi, f)
