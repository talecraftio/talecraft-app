import json

from brownie import accounts, Contract, Resource, Game2, PHI, GameLending

from scripts._utils import snowtrace_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/testnetAddresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    deployer = accounts.load('deployer')

    games = addresses.get('games', {})

    # lending = GameLending.deploy(Resource[-1].address, PHI[-1].address, {'from': deployer})
    # addresses['lending'] = lending.address
    # snowtrace_publish(lending)
    # lending.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    game1 = Game2.deploy(Resource[-1].address, PHI[-1].address, addresses['lending'], 10000000000000000000, 6, 50, {'from': deployer})
    games['0'] = game1.address
    snowtrace_publish(game1)
    game1.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    game2 = Game2.deploy(Resource[-1].address, PHI[-1].address, addresses['lending'], 12000000000000000000, 51, 150, {'from': deployer})
    games['1'] = game2.address
    game2.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    game3 = Game2.deploy(Resource[-1].address, PHI[-1].address, addresses['lending'], 15000000000000000000, 151, 1000, {'from': deployer})
    games['2'] = game3.address
    game3.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    addresses['games'] = games

    with open('../frontend/src/utils/contracts/testnetAddresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))
