from brownie import Resource, accounts

data = {'0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14': ([54], [1]),
        '0x48C72ea99ef4bd99052b4cB79712A58D1A71ac6F': ([169], [1]),
        '0x181d3d058D0F6f522c57bFeEf08EEc64145C5D8b': ([173], [1]),
        '0x53c4DAC24419C4A2223cbD2E8A8B6c9037941592': ([82], [1]),
        '0x503e1EDc9fe07A1E04DaD4aBF16c3ee294f9e5cb': ([147], [1]),
        '0x922ac8257e513829Dd5C80F2B5a3368e78c71e7F': ([56], [1])}


def main():
    deployer = accounts.load('talecraft-deployer', '')

    resource = Resource[-1]

    for addr, vals in data.items():
        tids, amounts = vals
        resource.safeBatchTransferFrom('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', addr, tids, amounts, b'',
                                       {'from': deployer})
        print(f'{addr} done')
