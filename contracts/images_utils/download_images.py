import csv

import ipfshttpclient

ipfs = ipfshttpclient.Client()

with open('../items.csv') as f:
    csv_reader = csv.reader(f, delimiter=',')
    items = []
    for name, in1, in2, weight, tier, ipfs_hash in csv_reader:
        with open(f'images_hashed/{ipfs_hash}.png', 'wb') as imf:
            imf.write(ipfs.cat(ipfs_hash))
