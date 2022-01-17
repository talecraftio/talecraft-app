from decimal import Decimal
from uuid import uuid4

import graphene
from constance import config
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q, F
from eth_account.messages import encode_defunct
from graphene_django import DjangoListField
from graphql import GraphQLError
from web3 import Web3, HTTPProvider

from app.models import MarketplaceListing, Resource, LeaderboardItem, GameChat, GameLeaderboardItem, GameInfo, \
    GamePlayer
from app.schema.types import MarketplaceListingResponseType, MarketplaceStatsType, ResourceType, LeaderboardItemType, \
    GameLeaderboardItemType, SettingsType, GameStatsType
from talecraft.crypto import web3, games


class Query(graphene.ObjectType):
    listings = graphene.Field(MarketplaceListingResponseType,
                              tiers=graphene.List(graphene.String, required=False),
                              weights=graphene.List(graphene.String, required=False),
                              q=graphene.String(required=False),
                              seller=graphene.String(required=False),
                              order=graphene.String(required=False),
                              page=graphene.Int())
    marketplace_stats = graphene.Field(MarketplaceStatsType)
    resources = DjangoListField(ResourceType)
    resource = graphene.Field(ResourceType, token_id=graphene.ID())
    leaderboard = DjangoListField(LeaderboardItemType)
    game_leaderboard = DjangoListField(GameLeaderboardItemType)
    chat_token = graphene.String(chat_id=graphene.String(), sig=graphene.String())
    game_stats = graphene.Field(GameStatsType)
    settings = graphene.Field(SettingsType)

    @classmethod
    def resolve_listings(cls, root, info, tiers=None, weights=None, q='', seller='', order='per_item', page=0):
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
        qs = MarketplaceListing.objects.filter(closed=False).annotate(per_item=F('price') / F('amount'))
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
        elements = [qs.filter(resource__token_id=i).annotate(per_item=F('price') / F('amount')).order_by('per_item').first() for i in range(1, 5)]
        return {
            'min_element_price': Decimal(min([e.price for e in elements if e] or [0])),
        }

    @classmethod
    def resolve_resources(cls, root, info):
        return Resource.objects.order_by('token_id')

    @classmethod
    def resolve_resource(cls, root, info, token_id):
        return Resource.objects.filter(token_id=token_id).first()

    @classmethod
    def resolve_leaderboard(cls, root, info):
        return LeaderboardItem.objects.order_by('-weight')

    @classmethod
    def resolve_game_leaderboard(cls, root, info):
        return GameLeaderboardItem.objects.exclude(_wins=F('_wins_offset'), _played=F('_played_offset'))

    @classmethod
    def resolve_chat_token(cls, root, info, chat_id, sig):
        h = encode_defunct(text=f'JoinChat:{chat_id}')
        address = web3.eth.account.recover_message(h, signature=sig)
        prefix, *rest = chat_id.split('.')
        if prefix == 'game':
            league, game_id = rest
            game_contract = games[league]
            game = game_contract.functions.game(int(game_id)).call()
            print(game)
            if address not in (game[1][0][0], game[1][1][0]) or not game[2]:
                raise GraphQLError('You cannot join this game')
            chat_token = str(uuid4())
            GameChat.objects.get_or_create(chat_id=chat_id)
            cache.set(f'chat_token:{chat_token}', chat_id)
            return chat_token
        else:
            raise GraphQLError('Invalid chat id prefix')

    @classmethod
    def resolve_settings(cls, root, info):
        return {
            'chest_sale_active': config.CHEST_SALE_ACTIVE,
        }

    @classmethod
    def resolve_game_stats(cls, root, info):
        return {
            'junior': {
                'waiting': GamePlayer.objects.filter(game__league=0, game__started=False).count(),
                'in_game': GamePlayer.objects.filter(game__league=0, game__started=True, game__finished=False).count(),
            },
            'senior': {
                'waiting': GamePlayer.objects.filter(game__league=1, game__started=False).count(),
                'in_game': GamePlayer.objects.filter(game__league=1, game__started=True, game__finished=False).count(),
            },
            'master': {
                'waiting': GamePlayer.objects.filter(game__league=2, game__started=False).count(),
                'in_game': GamePlayer.objects.filter(game__league=2, game__started=True, game__finished=False).count(),
            },
        }
