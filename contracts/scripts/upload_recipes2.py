import csv

from brownie import accounts, Contract, Resource, network


BATCH_SIZE = 30


def main():
    # deployer = accounts.load('deployer')

    OLD_FILES = ['items.csv', 'items2.csv', 'items3.csv']
    NEW_FILE = 'items4.csv'

    token_id = 0
    items = {}

    for fn in OLD_FILES:
        with open(fn) as f:
            csv_reader = csv.reader(f, delimiter=',')
            lines = list(csv_reader)
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

    with open(NEW_FILE) as f:
        csv_reader = csv.reader(f, delimiter=',')
        lines = list(csv_reader)
        items2 = {}
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

            items2[name.lower()] = {
                'token_id': token_id,
                'name': name,
                'recipe': [items[in1]['token_id'], items[in2]['token_id']] if tier != 'no tier' else [],
                'weight': int(weight),
                'tier': ['no tier', 'stone tier', 'iron tier', 'silver tier', 'gold tier', 'phi stone tier'].index(tier),
                'ipfs': ipfs,
            }

    contract: Contract = Resource[-1]
    for i in range(0*BATCH_SIZE, len(items2), BATCH_SIZE):
        # contract.registerResourceTypes([
        #     [
        #         item['name'],
        #         item['weight'],
        #         item['tier'],
        #         item['recipe'],
        #         item['ipfs']
        #     ] for item in list(items2.values())[i:i+BATCH_SIZE] if item['tier'] > 0
        # ], {'from': deployer})
        print([
            [
                item['name'],
                item['weight'],
                item['tier'],
                item['recipe'],
                item['ipfs']
            ] for item in list(items2.values())[i:i+BATCH_SIZE] if item['tier'] > 0
        ])

    # contract.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})

