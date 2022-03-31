import json

from brownie import accounts, Contract, Game2, GameLending, network, GameTournament, Resource, PHI

from scripts._utils import snowtrace_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/addresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}
    network.gas_price(100000000000)

    deployer = accounts.load('talecraft-deployer')

    games = addresses.get('games', {})

    # lending = GameLending.deploy(addresses['resource'], addresses['phi'], {'from': deployer})
    # addresses['lending'] = lending.address
    # snowtrace_publish(lending)
    # lending.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    # game1 = Game2.deploy(addresses['resource'], addresses['phi'], addresses['lending'], 0, 6, 50, {'from': deployer})
    # games['0'] = game1.address
    # # snowtrace_publish(game1)
    # game1.transferOwnership('0xd7d99E93804EBCdCbA544E4D7b7E543b73561454', {'from': deployer})
    #
    # game2 = Game2.deploy(addresses['resource'], addresses['phi'], addresses['lending'], 0, 51, 150, {'from': deployer})
    # games['1'] = game2.address
    # game2.transferOwnership('0xd7d99E93804EBCdCbA544E4D7b7E543b73561454', {'from': deployer})
    #
    # game3 = Game2.deploy(addresses['resource'], addresses['phi'], addresses['lending'], 0, 151, 1000, {'from': deployer})
    # games['2'] = game3.address
    # game3 = Game2.at(games['2'])
    # game3.transferOwnership('0xd7d99E93804EBCdCbA544E4D7b7E543b73561454', {'from': deployer})
    #
    # addresses['games'] = games


    tournament = GameTournament[-1]  # .deploy(Resource[-1].address, PHI[-1].address, addresses['lending'], 0, {'from': deployer})
    tournament.updateWinAmounts([10000000000000000000,20000000000000000000,40000000000000000000,80000000000000000000,160000000000000000000], {'from': deployer})
    # snowtrace_publish(tournament)
    # addresses['gameTournament'] = tournament.address
    tournament.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))
