import json

from brownie import accounts, Contract, Resource, Marketplace, Game, PHI

from scripts._utils import snowtrace_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/addresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    deployer = accounts.load('deployer')

    game = Game.deploy(Resource[-1].address, PHI[-1].address, {'from': deployer})
    game.startGames([0, 1, 2], {'from': deployer})
    addresses['game'] = game.address
    snowtrace_publish(game)
    game.enterGame(0, {'from': deployer})
    print('1 join')
    game.enterGame(0, {'from': deployer})
    print('2 joins')
    game.enterGame(0, {'from': deployer})
    print('3 joins')
    game.enterGame(0, {'from': deployer})
    print('4 joins')
    game.enterGame(0, {'from': deployer})
    print('5 joins')
    game.enterGame(0, {'from': deployer})
    print('6 joins')
    game.enterGame(0, {'from': deployer})
    print('7 joins')
    game.enterGame(0, {'from': deployer})
    print('8 joins')
    # game.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))
