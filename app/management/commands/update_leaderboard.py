import logging
from datetime import datetime, timedelta
from time import sleep

from django.core.management import BaseCommand
from django.db.models import F

from app.models import internal_options as io, Resource, LeaderboardItem, GameLeaderboardItem
from talecraft.crypto import addresses, resource, marketplace, games, lending


class Command(BaseCommand):
    def handle(self, *args, **options):
        resources = {
            r.token_id: (r.weight, r.tier)
            for r in Resource.objects.exclude(token_id=0).order_by('token_id')
        }

        exclude_addresses = [
            '0x0000000000000000000000000000000000000000',
            '0xF536Cb8037ab72249404f14E507b7b660d052F9D',
            '0x23BBba252DA45fEac8A22F0497bD2954D67b3cD0',
            addresses['chest'],
            addresses['marketplace'],
            addresses['games']['0'],
            addresses['games']['1'],
            addresses['games']['2'],
            addresses['lending'],
        ]

        while True:
            logging.warning('Leaderboard update started')
            logging.warning('  Global leaderboard')
            logging.warning('    Fetching players list...')
            players = resource.functions.getPlayers().call()
            for i, player in enumerate(players):
                logging.warning(f'    Player {i+1}/{len(players)}: {player}')
                if player in exclude_addresses:
                    continue
                logging.warning('      Fetching balances...')
                balances = resource.functions.balanceOfBatch([player] * len(resources), list(range(1, len(resources) + 1))).call()
                weight = 0
                max_tier = 0
                tier_weights = [0, 0, 0, 0, 0, 0]
                for tid, balance in enumerate(balances, 1):
                    if tid <= 4:
                        continue
                    weight += balance * resources[tid][0]
                    tier_weights[resources[tid][1]] += balance * resources[tid][0]
                    if balance > 0:
                        max_tier = max(max_tier, resources[tid][1])
                # marketplace_balances = marketplace.functions.getLockedTokens(player).call()
                # for tid, amount, *_ in marketplace_balances:
                #     if tid <= 4:
                #         continue
                #     weight += amount * resources[tid][0]
                #     tier_weights[resources[tid][1]] += amount * resources[tid][0]
                #     if amount > 0:
                #         max_tier = max(max_tier, resources[tid][1])
                logging.warning('      Fetching crafts...')
                pending_crafts = resource.functions.getCrafts(resource.functions.pendingCrafts(player).call()).call()
                for tid, *_ in pending_crafts:
                    if tid <= 4:
                        continue
                    weight += resources[tid][0]
                    tier_weights[resources[tid][1]] += resources[tid][0]
                    max_tier = max(max_tier, resources[tid][1])
                logging.warning('      Fetching lending...')
                listing_ids = lending.functions.getLenderHeldListings(player).call()
                listings = lending.functions.getListings(listing_ids).call()
                for lid, dur, pr, tid, *_ in listings:
                    if tid <= 4:
                        continue
                    weight += resources[tid][0]
                    tier_weights[resources[tid][1]] += resources[tid][0]
                    max_tier = max(max_tier, resources[tid][1])

                logging.warning('      Saving...')
                LeaderboardItem.objects.update_or_create(address=player,
                                                         defaults={'weight': weight, 'max_tier': max_tier,
                                                                   'tier0': tier_weights[0],
                                                                   'tier1': tier_weights[1],
                                                                   'tier2': tier_weights[2],
                                                                   'tier3': tier_weights[3],
                                                                   'tier4': tier_weights[4],
                                                                   'tier5': tier_weights[5]})
            LeaderboardItem.objects.filter(address__in=exclude_addresses).delete()
            logging.warning('Global leaderboards updated')

            now = datetime.utcnow()
            if not io.last_game_leaderboards_reset or io.last_game_leaderboards_reset < now - timedelta(2):
                if now.weekday() == 4 and now.hour >= 17:
                    GameLeaderboardItem.objects.update(_wins_offset=F('_wins'), _played_offset=F('_played'))
                    io.last_game_leaderboards_reset = now
                    logging.warning('Game leaderboards reset')

            for i, league in enumerate(games.keys()):
                leaderboard = {
                    player: wins for player, wins in games[league].functions.leaderboard().call()
                }
                for evt in games[league].events.PlayerEntered().getLogs(fromBlock=8521077, toBlock='latest'):
                    leaderboard.setdefault(evt.args.player, 0)
                for player, wins in leaderboard.items():
                    played = len(games[league].functions.playerGames(player).call())
                    if played == 0 and wins == 0:
                        continue
                    GameLeaderboardItem.objects.update_or_create(address=player, league=i, defaults={'_wins': wins, '_played': played})

            logging.warning('Game leaderboards updated')

            sleep(60)
