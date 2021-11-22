import json
import logging
import time

from django.core.management import BaseCommand
from django.db import transaction
from django.utils import timezone
from web3 import Web3, HTTPProvider

from talecraft.settings import BASE_DIR
from app.models import internal_options as io, Resource, MarketplaceListing


class Command(BaseCommand):
    def handle(self, *args, **options):
        with open(BASE_DIR / 'frontend/src/utils/contracts/addresses.ts') as f:
            addresses = json.loads(f.read()[14:])

        with open(BASE_DIR / 'frontend/src/utils/contracts/marketplace.abi.json') as f:
            marketplace_abi = json.load(f)

        web3 = Web3(HTTPProvider('https://api.avax-test.network/ext/bc/C/rpc'))

        while True:
            try:
                with transaction.atomic():
                    contract = web3.eth.contract(address=addresses['marketplace'], abi=marketplace_abi)

                    to_block = web3.eth.blockNumber
                    if not io.marketplace_last_block:
                        io.marketplace_last_block = to_block

                    if io.marketplace_last_block < to_block:
                        logging.warning('Last remembered block: {}, current last: {}'.format(io.marketplace_last_block, to_block))
                        if to_block - io.marketplace_last_block > 1000:
                            to_block = io.marketplace_last_block + 1000
                        from_block = io.marketplace_last_block + 1
                        logging.warning('  Checking blocks {} ~ {}'.format(from_block, to_block))

                        evts = contract.events.NewListing().getLogs(fromBlock=from_block, toBlock=to_block)
                        for evt in evts:
                            logging.warning(f'    NewListing(seller={evt.args.seller}, listingId={evt.args.listingId})')
                            listing = contract.functions.getListing(evt.args.listingId).call()
                            logging.warning(f'      listing={repr(listing)}')
                            MarketplaceListing.objects.create(listing_id=evt.args.listingId,
                                                              resource=Resource.objects.get(token_id=listing[0]),
                                                              amount=listing[1],
                                                              price=listing[2] / 10**18,
                                                              seller=listing[3])
                            logging.warning(f'    Listing #{evt.args.listingId} created')

                        evts = contract.events.ListingCancelled().getLogs(fromBlock=from_block, toBlock=to_block)
                        for evt in evts:
                            logging.warning(f'    ListingCancelled(listingId={evt.args.listingId})')
                            listing = MarketplaceListing.objects.filter(listing_id=evt.args.listingId).first()
                            if listing:
                                listing.closed = True
                                listing.closed_at = timezone.now()
                                listing.save()
                                logging.warning(f'    Listing #{evt.args.listingId} cancelled')
                            else:
                                logging.warning(f'    Did not find listing #{evt.args.listingId} to cancel')

                        evts = contract.events.Trade().getLogs(fromBlock=from_block, toBlock=to_block)
                        for evt in evts:
                            logging.warning(f'    Trade(seller={evt.args.seller}, buyer={evt.args.buyer}, listingId={evt.args.listingId})')
                            listing = MarketplaceListing.objects.filter(listing_id=evt.args.listingId).first()
                            if listing:
                                listing.buyer = evt.args.buyer
                                listing.closed = True
                                listing.closed_at = timezone.now()
                                listing.save()
                                logging.warning(f'    Listing #{evt.args.listingId} finished')
                            else:
                                logging.warning(f'    Did not find listing #{evt.args.listingId} to finished')

                        io.marketplace_last_block = to_block
                        if web3.eth.blockNumber != to_block:
                            continue

            except KeyboardInterrupt:
                logging.warning('Stopping...')
                return
            except Exception as e:
                logging.exception(e)
                time.sleep(5)

            time.sleep(.3)
