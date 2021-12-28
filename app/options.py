import dbsettings


class InternalOptions(dbsettings.Group):
    marketplace_last_block = dbsettings.IntegerValue()
    last_game_leaderboards_reset = dbsettings.DateTimeValue()
