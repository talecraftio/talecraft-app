from django.contrib import admin

from app.models import MarketplaceListing


@admin.register(MarketplaceListing)
class MarketplaceListingAdmin(admin.ModelAdmin):
    list_display = 'id', 'listing_id', 'resource', 'seller',
