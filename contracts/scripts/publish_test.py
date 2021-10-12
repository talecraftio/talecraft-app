from brownie import accounts, Contract, PHI, ChestSale, Resource

from contracts.scripts._utils import sourcify_publish


def main():
    sourcify_publish(PHI[-1])
