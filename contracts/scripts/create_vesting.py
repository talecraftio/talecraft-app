from brownie import accounts, TokenVestingFactory


def main():
    deployer = accounts.load('talecraft-deployer', '')
    print(deployer.address)
    factory = TokenVestingFactory.at('0x2DAB3390adf79237aF1331bb7Eb4295defE6DA30')
