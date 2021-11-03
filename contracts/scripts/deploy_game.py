import json

from brownie import accounts, Contract, Resource, Marketplace, Game

from scripts._utils import sourcify_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/addresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    deployer = accounts.load('deployer')

    game = Game.deploy(Resource[-1].address, {'from': deployer})
    addresses['game'] = game.address
    sourcify_publish(game)

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))
