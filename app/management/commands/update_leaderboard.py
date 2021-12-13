import json
import logging
from time import sleep

from django.core.management import BaseCommand
from web3 import HTTPProvider, Web3

from app.models import Resource, LeaderboardItem
from talecraft.settings import BASE_DIR


class Command(BaseCommand):
    def handle(self, *args, **options):
        with open(BASE_DIR / 'frontend/src/utils/contracts/addresses.ts') as f:
            addresses = json.loads(f.read()[14:])

        with open(BASE_DIR / 'frontend/src/utils/contracts/marketplace.abi.json') as f:
            marketplace_abi = json.load(f)

        with open(BASE_DIR / 'frontend/src/utils/contracts/resource.abi.json') as f:
            resource_abi = json.load(f)

        web3 = Web3(HTTPProvider('https://api.avax.network/ext/bc/C/rpc'))
        resources = {
            r.token_id: (r.weight, r.tier)
            for r in Resource.objects.exclude(token_id=0).order_by('token_id')
        }

        exclude_addresses = [
            '0x0000000000000000000000000000000000000000',
            '0xF536Cb8037ab72249404f14E507b7b660d052F9D',
            '0x23BBba252DA45fEac8A22F0497bD2954D67b3cD0',
            addresses['chest'],
            addresses['marketplace'],
            addresses['game'],
        ]

        resource = web3.eth.contract(address=addresses['resource'], abi=resource_abi)
        marketplace = web3.eth.contract(address=addresses['marketplace'], abi=marketplace_abi)

        while True:
            players = resource.functions.getPlayers().call()
            for player in players:
                if player in exclude_addresses:
                    continue
                balances = resource.functions.balanceOfBatch([player] * len(resources), list(range(1, len(resources) + 1))).call()
                weight = 0
                max_tier = 0
                for i, balance in enumerate(balances, 1):
                    weight += balance * resources[i][0]
                    if balance > 0:
                        max_tier = max(max_tier, resources[i][1])
                marketplace_balances = marketplace.functions.getLockedTokens(player).call()
                for tid, amount, *_ in marketplace_balances:
                    weight += amount * resources[tid][0]
                    if amount > 0:
                        max_tier = max(max_tier, resources[tid][1])
                pending_crafts = resource.functions.getCrafts(resource.functions.pendingCrafts(player).call()).call()
                for tid, *_ in pending_crafts:
                    weight += resources[tid][0]
                    max_tier = max(max_tier, resources[tid][1])
                LeaderboardItem.objects.update_or_create(address=player,
                                                         defaults={'weight': weight, 'max_tier': max_tier})
            logging.warning('Updated')
            sleep(60)
