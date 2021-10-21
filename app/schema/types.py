import graphene
from graphene_django import DjangoObjectType, DjangoListField

from app.models import Resource, MarketplaceListing


def paginated_type(name, cls):
    _ = type(name, (graphene.ObjectType,), {
        'total_items': graphene.Int(),
        'items': DjangoListField(cls),
    })
    return _


class ResourceType(DjangoObjectType):
    class Meta:
        model = Resource
        fields = 'token_id', 'name', 'tier', 'ipfs_hash', 'weight',


class MarketplaceListingType(DjangoObjectType):
    resource = graphene.Field(ResourceType)

    class Meta:
        model = MarketplaceListing
        fields = 'listing_id', 'resource', 'amount', 'price', 'seller', 'buyer', 'closed',


MarketplaceListingResponseType = paginated_type('MarketplaceListingResponseType', MarketplaceListingType)
