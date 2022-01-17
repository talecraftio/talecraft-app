import logging
import time

from django.core.management import BaseCommand
from django.db import transaction
from django.utils import timezone

from talecraft.crypto import marketplace, web3, games
from app.models import internal_options as io, Resource, MarketplaceListing, GameInfo, GamePlayer


class Command(BaseCommand):
    def handle(self, *args, **options):
        while True:
            try:
                with transaction.atomic():
                    to_block = web3.eth.blockNumber
                    if not io.games_last_block:
                        io.games_last_block = 8521077

                    if io.games_last_block < to_block:
                        logging.warning('Last remembered block: {}, current last: {}'.format(io.games_last_block, to_block))
                        if to_block - io.games_last_block > 10000:
                            to_block = io.games_last_block + 10000
                        from_block = io.games_last_block + 1
                        logging.warning('  Checking blocks {} ~ {}'.format(from_block, to_block))

                        for i, league in enumerate(games.keys()):
                            evts = games[league].events.PlayerEntered().getLogs(fromBlock=from_block, toBlock=to_block)
                            for evt in evts:
                                logging.warning(f'    PlayerEntered(gameId={evt.args.gameId}, player={evt.args.player})')
                                game, _ = GameInfo.objects.get_or_create(league=i, game_id=evt.args.gameId)
                                GamePlayer.objects.create(game=game, address=evt.args.player)

                            evts = games[league].events.PlayerLeft().getLogs(fromBlock=from_block, toBlock=to_block)
                            for evt in evts:
                                logging.warning(f'    PlayerLeft(gameId={evt.args.gameId}, player={evt.args.player})')
                                game = GameInfo.objects.get(league=i, game_id=evt.args.gameId)
                                GamePlayer.objects.filter(game=game, address=evt.args.player).delete()

                            evts = games[league].events.GameStarted().getLogs(fromBlock=from_block, toBlock=to_block)
                            for evt in evts:
                                logging.warning(f'    GameStarted(gameId={evt.args.gameId})')
                                game = GameInfo.objects.get(league=i, game_id=evt.args.gameId)
                                game.started = True
                                game.save()

                            evts = games[league].events.GameFinished().getLogs(fromBlock=from_block, toBlock=to_block)
                            for evt in evts:
                                logging.warning(f'    GameFinished(gameId={evt.args.gameId}, winner={evt.args.winner})')
                                game = GameInfo.objects.get(league=i, game_id=evt.args.gameId)
                                game.winner = evt.args.winner
                                game.finished = True
                                game.save()

                            evts = games[league].events.GameAborted().getLogs(fromBlock=from_block, toBlock=to_block)
                            for evt in evts:
                                logging.warning(f'    GameAborted(gameId={evt.args.gameId}, winner={evt.args.winner})')
                                game = GameInfo.objects.get(league=i, game_id=evt.args.gameId)
                                game.winner = evt.args.winner
                                game.finished = True
                                game.save()

                        io.games_last_block = to_block
                        if web3.eth.blockNumber != to_block:
                            continue

            except KeyboardInterrupt:
                logging.warning('Stopping...')
                return
            except Exception as e:
                logging.exception(e)
                time.sleep(5)

            time.sleep(.3)
