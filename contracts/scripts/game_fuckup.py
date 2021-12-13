from brownie import accounts, network, Contract, PHI, ChestSale, Resource, CraftStaking, Marketplace, Game, \
    TokenVestingFactory, MarketplaceNew


def main():
    resource = Resource.at('0xcc367e92c1b2BB0eB503F67654F3581c086eD2fc')
    game = Game.at('0xFCc7E0eCDfF8b1DE9222d1cc4Aae74c24f121cA1')
    res = network.web3.eth.contract(address='0xcc367e92c1b2BB0eB503F67654F3581c086eD2fc', abi=Resource.abi)
    ledger = {}
    for evt in res.events.TransferSingle().getLogs(fromBlock=8148073, toBlock=8153400):
        from_ = evt.args['from']
        to_ = evt.args['to']
        id_ = evt.args['id']
        val_ = evt.args['value']
        if '0xFCc7E0eCDfF8b1DE9222d1cc4Aae74c24f121cA1' in (from_, to_):
            ledger.setdefault(from_, {}).setdefault(id_, 0)
            ledger.setdefault(to_, {}).setdefault(id_, 0)
            ledger[from_][id_] -= val_
            ledger[to_][id_] += val_
    for evt in res.events.TransferBatch().getLogs(fromBlock=8148073, toBlock=8153400):
        from_ = evt.args['from']
        to_ = evt.args['to']
        if '0xFCc7E0eCDfF8b1DE9222d1cc4Aae74c24f121cA1' in (from_, to_):
            for id_, val_ in zip(evt.args['ids'], evt.args['values']):
                ledger.setdefault(from_, {}).setdefault(id_, 0)
                ledger.setdefault(to_, {}).setdefault(id_, 0)
                ledger[from_][id_] -= val_
                ledger[to_][id_] += val_
    for addr in list(ledger.keys()):
        for tid, amount in list(ledger[addr].items()):
            if not amount:
                del ledger[addr][tid]
        if not ledger[addr]:
            del ledger[addr]
    print(ledger)
    # for tid in resource.ownedTokens('0xFCc7E0eCDfF8b1DE9222d1cc4Aae74c24f121cA1'):
    #     print(tid, resource.balanceOf('0xFCc7E0eCDfF8b1DE9222d1cc4Aae74c24f121cA1', tid))
    # print(resource.__dict__.keys())
    # for i, g in enumerate(game.getAllGames()):
    #     print(g)
    #     if g[3] and not g[4]:
    #         print(i)


{
    '0xFCc7E0eCDfF8b1DE9222d1cc4Aae74c24f121cA1': {6: 2, 98: 1, 20: 1, 27: 1, 11: 1},
    '0xa79C5621e0C85587068F8e91D3D15488DF6C3c1c': {20: -1},
    '0xEd3b5e0B8aC3C8C445366e8acAce17a903820E57': {98: -1},
    '0x74af136Cff87698d996b75c7F2fACB51A3400fBd': {6: -1},
    '0xc285080bEd6ba0FaA88bE57Cc5347dA8eD0701C5': {27: -1},
    '0x60248F0456eD1CC70e94A266aEFB74f5504c0810': {11: -1},
    '0x8Af4B87B25FED8123021B7d6F88186F1E5400688': {6: -1}
}
