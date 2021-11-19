from django.core.management import BaseCommand

from app.models import MarketplaceListing, internal_options


class Command(BaseCommand):
    def handle(self, *args, **options):
        MarketplaceListing.objects.all().delete()
        internal_options.marketplace_last_block = None
