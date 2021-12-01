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

    def as_tree_json(self, parent=None):
        res = [
            {
                'name': self.name,
                'id': f'{parent}_{self.token_id}',
                'parent_id': parent,
                'attributes': {
                    'ipfs': self.ipfs_hash,
                    'weight': self.weight,
                    'tier': self.tier,
                    'token_id': self.token_id,
                },
            },
        ]
        for ingredient in self.ingredients.filter(token_id__lt=self.token_id):
            res.extend(ingredient.as_tree_json(f'{parent}_{self.token_id}'))
        return res


    def __str__(self):
        return self.name


class MarketplaceListing(models.Model):
    listing_id = models.PositiveBigIntegerField(db_index=True)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.PositiveBigIntegerField()
    price = models.DecimalField(max_digits=128, decimal_places=0)
    seller = models.CharField(max_length=64)
    buyer = models.CharField(max_length=64, null=True, blank=True)
    closed = models.BooleanField(default=False, db_index=True)
    closed_at = models.DateTimeField(db_index=True, null=True, blank=True)
