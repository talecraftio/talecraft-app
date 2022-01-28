import logging
import time
from datetime import timedelta

from django.core.management import BaseCommand
from django.db import transaction
from django.utils import timezone

from talecraft.crypto import lending, web3
from app.models import internal_options as io, Resource, LendingListing


class Command(BaseCommand):
    def handle(self, *args, **options):
        io.lending_last_block = 5287474
        while True:
            try:
                with transaction.atomic():
                    to_block = web3.eth.blockNumber
                    if not io.lending_last_block:
                        io.lending_last_block = to_block

                    if io.lending_last_block < to_block:
                        logging.warning('Last remembered block: {}, current last: {}'.format(io.lending_last_block, to_block))
                        if to_block - io.lending_last_block > 1000:
                            to_block = io.lending_last_block + 1000
                        from_block = io.lending_last_block + 1
                        logging.warning('  Checking blocks {} ~ {}'.format(from_block, to_block))

                        evts = lending.events.NewListing().getLogs(fromBlock=from_block, toBlock=to_block)
                        for evt in evts:
                            logging.warning(f'    NewListing(lender={evt.args.lender}, listingId={evt.args.listingId})')
                            listing = lending.functions.getListing(evt.args.listingId).call()
                            logging.warning(f'      listing={repr(listing)}')
                            LendingListing.objects.create(listing_id=evt.args.listingId,
                                                          resource=Resource.objects.get(token_id=listing[3]),
                                                          duration=timedelta(seconds=listing[1]),
                                                          price=listing[2] / 10**18,
                                                          lender=listing[4])
                            logging.warning(f'    Listing #{evt.args.listingId} created')

                        evts = lending.events.ListingCancelled().getLogs(fromBlock=from_block, toBlock=to_block)
                        for evt in evts:
                            logging.warning(f'    ListingCancelled(listingId={evt.args.listingId})')
                            listing = LendingListing.objects.filter(listing_id=evt.args.listingId).first()
                            if listing:
                                listing.closed = True
                                listing.closed_at = timezone.now()
                                listing.save()
                                logging.warning(f'    Listing #{evt.args.listingId} cancelled')
                            else:
                                logging.warning(f'    Did not find listing #{evt.args.listingId} to cancel')

                        evts = lending.events.Borrow().getLogs(fromBlock=from_block, toBlock=to_block)
                        for evt in evts:
                            logging.warning(f'    Borrow(lender={evt.args.lender}, borrower={evt.args.borrower}, listingId={evt.args.listingId})')
                            listing = LendingListing.objects.filter(listing_id=evt.args.listingId).first()
                            if listing:
                                listing.borrower = evt.args.borrower
                                listing.started = timezone.now()
                                listing.save()
                                logging.warning(f'    Listing #{evt.args.listingId} borrowed')
                            else:
                                logging.warning(f'    Did not find listing #{evt.args.listingId} to finished')

                        io.lending_last_block = to_block
                        if web3.eth.blockNumber != to_block:
                            continue

            except KeyboardInterrupt:
                logging.warning('Stopping...')
                return
            except Exception as e:
                logging.exception(e)
                time.sleep(5)

            time.sleep(.3)
