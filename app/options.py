import dbsettings


class InternalOptions(dbsettings.Group):
    marketplace_last_block = dbsettings.IntegerValue()
