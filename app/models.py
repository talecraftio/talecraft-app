from django.db import models

from app.options import InternalOptions


internal_options = InternalOptions()


class Resource(models.Model):
    token_id = models.PositiveBigIntegerField(db_index=True)
    name = models.CharField(max_length=64)
    tier = models.PositiveSmallIntegerField(db_index=True)
    ipfs_hash = models.CharField(max_length=64)
    ingredients = models.ManyToManyField('self', symmetrical=False)
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
    price = models.DecimalField(max_digits=128, decimal_places=18)
    seller = models.CharField(max_length=64)
    buyer = models.CharField(max_length=64, null=True, blank=True)
    closed = models.BooleanField(default=False, db_index=True)
    closed_at = models.DateTimeField(db_index=True, null=True, blank=True)


class LeaderboardItem(models.Model):
    address = models.CharField(max_length=64)
    weight = models.PositiveIntegerField()
    max_tier = models.PositiveSmallIntegerField()
    tier0 = models.PositiveIntegerField(default=0)
    tier1 = models.PositiveIntegerField(default=0)
    tier2 = models.PositiveIntegerField(default=0)
    tier3 = models.PositiveIntegerField(default=0)
    tier4 = models.PositiveIntegerField(default=0)
    tier5 = models.PositiveIntegerField(default=0)


class GameLeaderboardItem(models.Model):
    league = models.PositiveSmallIntegerField()
    address = models.CharField(max_length=64)
    _played = models.PositiveIntegerField()
    _wins = models.PositiveIntegerField()
    _played_offset = models.PositiveIntegerField(default=0)
    _wins_offset = models.PositiveIntegerField(default=0)

    @property
    def played(self):
        return self._played - self._played_offset

    @property
    def wins(self):
        return self._wins - self._wins_offset


class GameChat(models.Model):
    chat_id = models.CharField(max_length=16, db_index=True)


class GameChatMessage(models.Model):
    chat = models.ForeignKey(GameChat, on_delete=models.CASCADE, related_name='messages')
    author = models.CharField(max_length=64)
    datetime = models.DateTimeField(auto_now_add=True)
    text = models.TextField()

