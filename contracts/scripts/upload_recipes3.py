import csv

from brownie import accounts, Contract, Resource, network


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

    with open('items2.csv') as f:
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
                'weight': weight,
                'tier': ['no tier', 'stone tier', 'iron tier', 'silver tier', 'gold tier', 'phi stone tier'].index(tier),
                'ipfs': ipfs,
            }

    contract: Contract = Resource[-1]
    for i in range(0*BATCH_SIZE, len(items2), BATCH_SIZE):
        contract.registerResourceTypes([
            [
                item['name'],
                item['weight'],
                item['tier'],
                item['recipe'],
                item['ipfs']
            ] for item in list(items2.values())[i:i+BATCH_SIZE] if item['tier'] > 0
        ], {'from': deployer})
        # print([
        #     [
        #         item['name'],
        #         item['weight'],
        #         item['tier'],
        #         item['recipe'],
        #         item['ipfs']
        #     ] for item in list(items2.values())[i:i+BATCH_SIZE] if item['tier'] > 0
        # ])

    # contract.transferOwnership('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', {'from': deployer})


[['el salvador', 122, 4, [185, 138], 'QmQjVtgqkBo4nXLfqqLaQcLfgTvEpzkZf1JgEuVY6YewUw'],['do kwon', 166, 5, [186, 97], 'QmU835kNA9tiGvTxxdz1chpchoWr5hEJnqMK8XpKMDqUnB'],['hydrocarbon', 24, 2, [182, 181], 'QmaEdgHJKQSNgBsEF7kXixxpr2bhmgivRxaWpD1pGLaVzK'],['natural gas', 78, 4, [188, 108], 'QmWubJaL8u1CDqAh7gKQMuTbKSoZ2cNJ2JdEZb2ZfMSqAs'],['gas', 306, 5, [189, 155], 'QmWhvuJ4e7vUGjHLUfe5jMisgUQK4C9jQrKB2i4LUkNuz5'],['theta', 41, 3, [82, 27], 'QmPCqVDFVw1Kbd8gdKHKnqAwDbqVcRA38FMU3KKYaGq63W'],['node', 347, 5, [190, 191], 'QmbcPfS3ec7jRLhKKpiT3kmQTyuTqqgWwY1iwyaGyNj6Hx'],['volcano miner', 469, 5, [192, 186], 'QmTnrNmbieidsWP9U5JBeCgzhKXEVRB5WEPkWRvgVB3PGW']]
