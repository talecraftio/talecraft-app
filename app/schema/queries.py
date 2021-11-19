from decimal import Decimal

import graphene
from django.db.models import Q
from graphene_django import DjangoListField

from app.models import MarketplaceListing, Resource
from app.schema.types import MarketplaceListingResponseType, MarketplaceStatsType, ResourceType


class Query(graphene.ObjectType):
    listings = graphene.Field(MarketplaceListingResponseType,
                              tiers=graphene.List(graphene.String, required=False),
                              weights=graphene.List(graphene.String, required=False),
                              q=graphene.String(required=False),
                              seller=graphene.String(required=False),
                              order=graphene.String(required=False),
                              page=graphene.Int())
    marketplace_stats = graphene.Field(MarketplaceStatsType)
    resource = graphene.Field(ResourceType, token_id=graphene.ID())

    @classmethod
    def resolve_listings(cls, root, info, tiers=None, weights=None, q='', seller='', order='price', page=0):
        weights_q = Q()
        weights_cnt = 0
        tiers_q = Q()
        tiers_cnt = 0
        if weights:
            for weight in weights:
                if weight == '0-49':
                    weights_q |= Q(resource__weight__lt=50)
                elif weight == '50-99':
                    weights_q |= Q(resource__weight__gte=50, resource__weight__lt=100)
                elif weight == '100-199':
                    weights_q |= Q(resource__weight__gte=100, resource__weight__lt=200)
                elif weight == '200-399':
                    weights_q |= Q(resource__weight__gte=200, resource__weight__lt=400)
                weights_cnt += 1
        if tiers:
            for tier in tiers:
                tiers_q |= Q(resource__tier=tier)
                tiers_cnt += 1
        qs = MarketplaceListing.objects.filter(closed=False)
        if weights_cnt:
            qs = qs.filter(weights_q)
        if tiers_cnt:
            qs = qs.filter(tiers_q)
        if q:
            qs = qs.filter(resource__name__icontains=q)
        if seller:
            qs = qs.filter(seller__iexact=seller)
        qs = qs.order_by(order)

        return {
            'items': qs[page*16:(page+1)*16],
            'total_items': qs.count(),
        }

    @classmethod
    def resolve_marketplace_stats(cls, root, info):
        qs = MarketplaceListing.objects.filter(closed=False)
        elements = [qs.filter(resource__token_id=i).order_by('price').first() for i in range(1, 5)]
        return {
            'min_element_price': Decimal(min([e.price for e in elements if e] or [0])),
        }

    @classmethod
    def resolve_resource(cls, root, info, token_id):
        return Resource.objects.filter(token_id=token_id).first()
