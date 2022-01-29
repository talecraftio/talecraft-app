from brownie import Resource, accounts

data = {'0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14': ([54], [1]),
        '0x8D469074d3382B14e70631af100b22331597296E': ([144], [1]),
        '0x02C2E408e560f07281993118f4Eb735Ae5d0f710': ([154], [1]),
        '0xE571FC966254E8BedD7dCDb349D2cB98B5A5F6f8': ([150, 151, 145, 163, 5, 9], [1, 1, 1, 1, 1, 1]),
        '0x0163AaeD3d39A5bEEfBbA02a68198D0bE9812ab1': ([43], [1]),
        '0x3B10E95302532a843c2F61B5b3575aD26bd64165': ([173, 164, 5], [1, 1, 1]),
        '0xb4dAF6E909123986457B25bca639cf9c9F8365b8': ([160], [1]),
        '0x922ac8257e513829Dd5C80F2B5a3368e78c71e7F': ([54, 163, 56], [1, 1, 1]),
        '0x0dE150f4024C14d00e5BF5cf2d2700b5350b83eD': ([66], [1]),
        '0x48C72ea99ef4bd99052b4cB79712A58D1A71ac6F': ([169], [1]),
        '0xdFbC6dD3FEfD3515a7288640a8b071Db07DEC73b': ([166, 15, 161], [1, 1, 1]),
        '0x52caD5f444d800D8bF97F969958Fdb40c95B7Cf6': ([174], [1]),
        '0xFC40D46E3D686A44B683F6d804E9939B62dF2Ec0': ([2, 53, 154], [1, 1, 1]),
        '0x398210e01C3229ed8FfF89a8232C5Fa6496D4210': ([5, 6], [1, 1]),
        '0x503e1EDc9fe07A1E04DaD4aBF16c3ee294f9e5cb': ([147], [1]),
        '0xcd9FA6be1810C600BAD0806aCeb01a86564d9C04': ([70, 100, 80], [1, 1, 1]),
        '0x7B5A4A5c94F9a8588B442f8b8f70D5751ff99700': ([63, 50, 54, 52, 62], [1, 1, 1, 1, 1]),
        '0x0e9A3783b52F0da68edc33BC5E1D9Fa1759fc8E0': ([150, 35, 5, 2, 1], [1, 1, 1, 2, 1]),
        '0xB1a9829EDaCeb06C7ccC48d0FAA787CDA9A0f9F8': ([152, 174, 9, 82, 5], [1, 1, 1, 1, 1]),
        '0x2C0bBdfFB1dB56Ed9142527a3bedec8Dda37AFc3': ([20, 8, 161], [1, 1, 1]),
        '0x072961ECDff5cC6Cc30F874E69ED43a930D50409': ([39, 123], [1, 1]),
        '0x2Eb7028D83f496cd9A9cfaEAc843b6938F271Ae3': ([154, 161, 5], [1, 3, 1]),
        '0x417B7D276DD33c940169D1fb1A05e2ccfb48eEb3': ([9, 15, 38], [5, 1, 1]),
        '0xdDDAB7A3A487Ef59eFBeE9CDACc6024F441206C9': ([160, 36], [1, 1]),
        '0x87BfDcf0b344aC97418bFAea763aB3Fe27bA0496': ([61], [1]),
        '0x33AcE79CED15c9431c2f55881633ceDe6DDFFAAa': ([72, 59], [1, 1]),
        '0x60248F0456eD1CC70e94A266aEFB74f5504c0810': ([49, 46, 51], [1, 1, 1])}


def main():
    deployer = accounts.load('talecraft-deployer', '')

    resource = Resource[-1]

    for addr, vals in data.items():
        tids, amounts = vals
        resource.safeBatchTransferFrom('0xd4AE6402155Ec508C6Ca7Dd833fd355c6eDd1c14', addr, tids, amounts, b'',
                                       {'from': deployer})
        print(f'{addr} done')
