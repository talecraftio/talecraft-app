import json

from django.conf import settings
from web3 import Web3, HTTPProvider

with open(settings.BASE_DIR / 'frontend/src/utils/contracts' / ('testnetAddresses.ts' if settings.TESTNET else 'addresses.ts')) as f:
    addresses = json.loads(f.read()[14:])

with open(settings.BASE_DIR / 'frontend/src/utils/contracts/marketplace.abi.json') as f:
    marketplace_abi = json.load(f)

with open(settings.BASE_DIR / 'frontend/src/utils/contracts/resource.abi.json') as f:
    resource_abi = json.load(f)

with open(settings.BASE_DIR / 'frontend/src/utils/contracts/game2.abi.json') as f:
    game_abi = json.load(f)

with open(settings.BASE_DIR / 'frontend/src/utils/contracts/gameLending.abi.json') as f:
    lending_abi = json.load(f)

with open(settings.BASE_DIR / 'frontend/src/utils/contracts/chest.abi.json') as f:
    chest_abi = json.load(f)

ETH_RPC = 'https://api.avax-test.network/ext/bc/C/rpc' if settings.TESTNET else 'https://api.avax.network/ext/bc/C/rpc'
web3 = Web3(HTTPProvider(ETH_RPC))

resource = web3.eth.contract(address=addresses['resource'], abi=resource_abi)
marketplace = web3.eth.contract(address=addresses['marketplace'], abi=marketplace_abi)
games = {
    'junior': web3.eth.contract(address=addresses['games']['0'], abi=game_abi),
    'senior': web3.eth.contract(address=addresses['games']['1'], abi=game_abi),
    'master': web3.eth.contract(address=addresses['games']['2'], abi=game_abi),
}
lending = web3.eth.contract(address=addresses['lending'], abi=lending_abi)
chest = web3.eth.contract(address=addresses['chest'], abi=chest_abi)
