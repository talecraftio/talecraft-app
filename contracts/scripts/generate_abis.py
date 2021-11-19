import json

from brownie import accounts, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenTimelock, TokenVesting, TokenVestingFactory


def main():
    with open('../frontend/src/utils/contracts/phi.abi.json', 'w') as f:
        json.dump(PHI.abi, f)

    with open('../frontend/src/utils/contracts/resource.abi.json', 'w') as f:
        json.dump(Resource.abi, f)

    with open('../frontend/src/utils/contracts/chest.abi.json', 'w') as f:
        json.dump(ChestSale.abi, f)

    with open('../frontend/src/utils/contracts/staking.abi.json', 'w') as f:
        json.dump(CraftStaking.abi, f)

    with open('../frontend/src/utils/contracts/marketplace.abi.json', 'w') as f:
        json.dump(Marketplace.abi, f)

    with open('../frontend/src/utils/contracts/game.abi.json', 'w') as f:
        json.dump(Game.abi, f)

    with open('../frontend/src/utils/contracts/vesting/timelock.abi.json', 'w') as f:
        json.dump(TokenTimelock.abi, f)

    with open('../frontend/src/utils/contracts/vesting/vesting.abi.json', 'w') as f:
        json.dump(TokenVesting.abi, f)

    with open('../frontend/src/utils/contracts/vesting/factory.abi.json', 'w') as f:
        json.dump(TokenVestingFactory.abi, f)
