from brownie import accounts, network, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, TokenVestingFactory, MarketplaceNew


def main():
    network.gas_price(30000000000)

    deployer = accounts.load('talecraft-deployer', '')

    resource = Resource.at('0xcc367e92c1b2BB0eB503F67654F3581c086eD2fc')

    owed = {}
    with open('owed.csv') as f:
        data = [l.strip().split(',') for l in f.readlines()]
        for addr, token_id, amount in data:
            owed.setdefault(addr, {})[int(token_id)] = int(amount)

        to = []
        tid = []
        amnt = []

        start = False
        for addr, rest in owed.items():
            if addr == '0x5E1DDBF30651D056d744BA2124a1aB9183Cb74C9':
                start = True
            if not start:
                continue
            to.append(addr)
            tid_ = []
            amnt_ = []
            for token_id, amount in rest.items():
                tid_.append(token_id)
                amnt_.append(amount)
            tid.append(tid_)
            amnt.append(amnt_)

            if len(to) >= 5:
                resource.premint(to, tid, amnt, {'from': deployer})
                print(list(to))
                to = []
                tid = []
                amnt = []

        if len(to) > 0:
            resource.premint(to, tid, amnt, {'from': deployer})
            print(list(to))
