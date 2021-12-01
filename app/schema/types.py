from decimal import Decimal

import graphene
from graphene_django import DjangoObjectType, DjangoListField

from app.models import Resource, MarketplaceListing


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

    @staticmethod
    def resolve_sales(resource: Resource, info):
        sales = MarketplaceListing.objects.filter(resource=resource, closed=True, buyer__isnull=False).order_by('-closed_at')
        return [{
            'datetime': l.closed_at,
            'amount': Decimal(l.amount),
            'price': Decimal(l.price),
        } for l in sales[:10]]

    class Meta:
        model = Resource
        fields = 'token_id', 'name', 'tier', 'ipfs_hash', 'weight', 'sales',


class MarketplaceListingType(DjangoObjectType):
    resource = graphene.Field(ResourceType)

    class Meta:
        model = MarketplaceListing
        fields = 'listing_id', 'resource', 'amount', 'price', 'seller', 'buyer', 'closed',


MarketplaceListingResponseType = paginated_type('MarketplaceListingResponseType', MarketplaceListingType)


class MarketplaceStatsType(graphene.ObjectType):
    min_element_price = graphene.Decimal()


class ChartNodeAttributesType(graphene.ObjectType):
    ipfs = graphene.String()
    weight = graphene.Int()
    tier = graphene.Int()
    token_id = graphene.Int()


class ChartNodeType(graphene.ObjectType):
    name = graphene.String()
    id = graphene.String()
    parent_id = graphene.String()
    attributes = graphene.Field(ChartNodeAttributesType)


class ResourceListType(graphene.ObjectType):
    name = graphene.String()
    value = graphene.Int()
    tier = graphene.Int()
    ipfs = graphene.String()
