from decimal import Decimal

import graphene
from graphene_django import DjangoObjectType, DjangoListField

from app.models import Resource, MarketplaceListing, LeaderboardItem, GameChatMessage, GameLeaderboardItem


def paginated_type(name, cls):
    _ = type(name, (graphene.ObjectType,), {
        'total_items': graphene.Int(),
        'items': DjangoListField(cls),
    })
    return _


class ResourceSaleEntry(graphene.ObjectType):
    datetime = graphene.DateTime()
    amount = graphene.Int()
    price = graphene.Decimal()


class ResourceType(DjangoObjectType):
    sales = graphene.List(ResourceSaleEntry)
    current_sales = graphene.List(ResourceSaleEntry)
    ingredients = graphene.List(graphene.Int)

    @staticmethod
    def resolve_sales(resource: Resource, info):
        sales = MarketplaceListing.objects.filter(resource=resource, closed=True, buyer__isnull=False).order_by('-closed_at')
        return [{
            'datetime': l.closed_at,
            'amount': Decimal(l.amount),
            'price': Decimal(l.price),
        } for l in sales]

    @staticmethod
    def resolve_current_sales(resource: Resource, info):
        sales = MarketplaceListing.objects.filter(resource=resource, closed=False).order_by('-pk')
        return [{
            'datetime': l.closed_at,
            'amount': Decimal(l.amount),
            'price': Decimal(l.price),
        } for l in sales]

    @staticmethod
    def resolve_ingredients(resource: Resource, info):
        return resource.ingredients

    class Meta:
        model = Resource
        fields = 'token_id', 'name', 'tier', 'ipfs_hash', 'weight', 'sales', 'current_sales', 'ingredients'


class MarketplaceListingType(DjangoObjectType):
    resource = graphene.Field(ResourceType)
    per_item = graphene.Decimal()

    @staticmethod
    def resolve_per_item(listing: MarketplaceListing, info):
        return Decimal(listing.price / listing.amount)

    class Meta:
        model = MarketplaceListing
        fields = 'listing_id', 'resource', 'amount', 'price', 'seller', 'buyer', 'closed', 'per_item',


MarketplaceListingResponseType = paginated_type('MarketplaceListingResponseType', MarketplaceListingType)


class MarketplaceStatsType(graphene.ObjectType):
    min_element_price = graphene.Decimal()


class LeaderboardItemType(DjangoObjectType):
    class Meta:
        model = LeaderboardItem
        fields = 'address', 'weight', 'max_tier', 'tier0', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5',


class GameLeaderboardItemType(DjangoObjectType):
    played = graphene.Int()
    wins = graphene.Int()

    class Meta:
        model = GameLeaderboardItem
        fields = 'address', 'played', 'wins', 'league',


class GameChatMessageType(DjangoObjectType):
    class Meta:
        model = GameChatMessage
        fields = 'id', 'author', 'datetime', 'text',


class SettingsType(graphene.ObjectType):
    chest_sale_active = graphene.Boolean()
