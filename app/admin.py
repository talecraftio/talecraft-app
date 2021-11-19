from django.contrib import admin

from app.models import MarketplaceListing, Resource


@admin.register(MarketplaceListing)
class MarketplaceListingAdmin(admin.ModelAdmin):
    list_display = 'id', 'listing_id', 'resource', 'seller',


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = 'name', 'token_id', 'weight', 'ipfs_hash',
