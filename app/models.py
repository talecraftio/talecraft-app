from django.db import models

from app.options import InternalOptions


internal_options = InternalOptions()


class Resource(models.Model):
    token_id = models.PositiveBigIntegerField(db_index=True)
    name = models.CharField(max_length=64)
    tier = models.PositiveSmallIntegerField(db_index=True)
    ipfs_hash = models.CharField(max_length=64)
    ingredients = models.ManyToManyField('self')
    weight = models.PositiveIntegerField()


class MarketplaceListing(models.Model):
    listing_id = models.PositiveBigIntegerField(db_index=True)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.PositiveBigIntegerField()
    price = models.PositiveBigIntegerField()
    seller = models.CharField(max_length=64)
    buyer = models.CharField(max_length=64, null=True, blank=True)
    closed = models.BooleanField(default=False, db_index=True)
