import json

from django.core.management import BaseCommand
from django.db import transaction
from web3 import HTTPProvider, Web3

from app.models import Resource
from talecraft.settings import BASE_DIR


class Command(BaseCommand):
    def handle(self, *args, **options):
        with open(BASE_DIR / 'frontend/src/utils/contracts/addresses.ts') as f:
            addresses = json.loads(f.read()[14:])

        with open(BASE_DIR / 'frontend/src/utils/contracts/resource.abi.json') as f:
            resource_abi = json.load(f)

        web3 = Web3(HTTPProvider('https://api.avax.network/ext/bc/C/rpc'))

        contract = web3.eth.contract(address=addresses['resource'], abi=resource_abi)

        resources = contract.functions.getResourceTypes(list(range(1, contract.functions.resourceCount().call() + 1))).call()
        resource_objs = []
        with transaction.atomic():
            for i, (name, weight, tier, ingredients, ipfs) in enumerate(resources, 1):
                res, _ = Resource.objects.update_or_create(token_id=i, defaults=dict(name=name, tier=tier, ipfs_hash=ipfs, weight=weight, id=i))
                res.ingredients.clear()
                if ingredients:
                    res.ingredients.add(*Resource.objects.filter(token_id__in=ingredients))
                resource_objs.append(res)
            # zero id
            zid, _ = Resource.objects.update_or_create(token_id=0, defaults=dict(name='missingno', tier=0, ipfs_hash='', weight=0, id=0))
            resource_objs.append(zid)

            Resource.objects.exclude(token_id__in=[r.token_id for r in resource_objs]).delete()

        print('Done')
