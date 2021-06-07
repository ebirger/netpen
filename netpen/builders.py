from collections import defaultdict


_BUILDERS = defaultdict(set)
BUILDERS = []


def add_builder(builder, prio):
    global BUILDERS
    _BUILDERS[prio].add(builder)
    prios = list(_BUILDERS.keys())
    prios.sort()
    BUILDERS = []
    for p in prios:
        BUILDERS += _BUILDERS[p]


def get_builders():
    return BUILDERS
