from pprint import pprint

from brownie import ChestSale, Resource

def main():
    with open('Resource.flat.sol', 'w') as f:
        f.write(Resource.get_verification_info()['flattened_source'])
        pprint(Resource.get_verification_info())
