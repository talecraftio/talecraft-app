import json

from brownie import accounts, Contract, CraftStaking, PHI

from scripts._utils import sourcify_publish, avascan_publish, snowtrace_publish


def main():
    try:
        with open('../frontend/src/utils/contracts/addresses.ts', 'r') as f:
            addresses = json.loads(f.read()[14:])
    except:
        addresses = {}

    deployer = accounts.load('deployer')

    factory = CraftStaking.deploy(PHI[-1], {'from': deployer})
    addresses['vestingFactory'] = factory.address
    snowtrace_publish(factory)

    with open('../frontend/src/utils/contracts/addresses.ts', 'w') as f:
        f.write('export default ' + json.dumps(addresses))
