import csv

from brownie import accounts, Contract, Resource


BATCH_SIZE = 30


def main():
    deployer = accounts.load('deployer')

    with open('items.csv') as f:
        csv_reader = csv.reader(f, delimiter=',')
        token_id = 0
        lines = list(csv_reader)[::-1]
        items = {}
        for name, in1, in2, weight, tier, ipfs in lines:
            token_id += 1
            name = name.strip()
            in1 = in1.strip().lower()
            in2 = in2.strip().lower()

            items[name.lower()] = {
                'token_id': token_id,
                'name': name,
                'recipe': [items[in1]['token_id'], items[in2]['token_id']] if tier != 'no tier' else [],
                'weight': weight,
                'tier': ['no tier', 'stone tier', 'iron tier', 'silver tier', 'gold tier', 'phi stone tier'].index(tier),
                'ipfs': ipfs,
            }

    contract: Contract = Resource[-1]
    for i in range(0, len(items), BATCH_SIZE):
        contract.registerResourceTypes([
            [
                item['name'],
                item['weight'],
                item['tier'],
                item['recipe'],
                item['ipfs']
            ] for item in list(items.values())[i:i+BATCH_SIZE] if item['tier'] > 0
        ], {'from': deployer})

    contract.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

