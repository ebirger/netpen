from itertools import combinations, chain
import networkx as nx
from .utils import flag6


class Router():
    def __init__(self, topology):
        self.topology = topology
        self.nss = []

    def add_ns(self, ns):
        self.nss.append(ns)

    @staticmethod
    def _is_routeable(src, dst, dst_subnet):
        if src.ns.name == dst.ns.name and src.vrf == dst.vrf:
            return True
        if any((p.peer and p.peer.name == dst.name for p in src.ports)):
            return True
        if src.peer and src.peer.name == dst.name:
            return True
        tss = src.tss.get(dst)
        if tss and dst_subnet in tss:
            return True
        return False

    def _dev_graph(self, all_devs, dst_subnet):
        graph = nx.Graph()
        for src, dst in combinations(all_devs, 2):
            if self._is_routeable(src, dst, dst_subnet):
                graph.add_edge(src, dst)
                graph.add_edge(dst, src)

        return graph

    @staticmethod
    def _select_src(dev, dst_subnet):
        src = None
        for a in dev.addrs:
            subnet = dev.addr_subnets.get(a)
            if subnet.net.version != dst_subnet.net.version:
                continue
            if not src or (subnet and subnet == dst_subnet):
                src = a
        if src:
            src = src.split('/')[0]
        return src

    @staticmethod
    def _dst_score(dev, distance, dst_subnet):
        has_subnet = dst_subnet in dev.subnets
        # smaller is better. prefer shorter distances and shared subnets
        return distance * 10 + int(not has_subnet)

    @staticmethod
    def _get_pool_info(ns, pool):
        for d in ns.devs:
            for a, p in d.addr_pools.items():
                if p == pool:
                    return d, d.addr_subnets[a]
        return None, None

    def _calc_rts_to_pool(self, all_devs, this_ns, other_ns, pool, pools_info):
        dst_dev, dst_subnet = pools_info[(other_ns, pool)]

        dev_graph = self._dev_graph(all_devs, dst_subnet)
        try:
            paths = dict(nx.single_target_shortest_path(dev_graph, dst_dev))
        except nx.exception.NodeNotFound:
            return None

        spf = [(s, self._dst_score(s, len(paths[s]), dst_subnet))
               for s in this_ns.devs if s in paths]

        if not spf:
            # No Path
            return None

        best_dev, score = min(spf, key=lambda t: t[1])

        via = paths[best_dev][1]
        src = self._select_src(best_dev, dst_subnet)
        if not src:
            return None

        return (this_ns, pool, best_dev, via, src, score)

    def _calc_ns_rts(self, all_devs, this_ns, pools_info):
        local_pools = this_ns.pools()
        remote_pools = [(other_ns, pool)
                        for other_ns, pool in pools_info.keys()
                        if other_ns != this_ns and
                        pool not in local_pools]

        return {rt for other_ns, pool in remote_pools
                if (rt := self._calc_rts_to_pool(all_devs, this_ns, other_ns,
                                                 pool, pools_info))}

    @staticmethod
    def _dedup_rts(rts):
        deduped = {}
        for rt in rts:
            ns, addr, *_ = rt
            deduped[(ns, addr)] = rt
        return deduped.values()

    def _calc_rts(self):
        all_devs = list(chain.from_iterable(ns.devs for ns in self.nss))
        all_devs = [d for d in all_devs if d.addrs]

        pools = [(ns, pool) for ns in self.nss for pool in ns.pools()]
        pools_info = {p: self._get_pool_info(*p) for p in pools}

        rts = chain.from_iterable(self._calc_ns_rts(all_devs, ns, pools_info)
                                  for ns in self.nss)
        return self._dedup_rts(rts)

    def _render_bash_route(self, ns, addr, dev, via, src, score):
        s = 'ip %s -net %s route add %s dev %s metric %s' % (flag6(addr),
                                                             ns.name, addr,
                                                             dev.name, score)
        if not dev.noarp:
            s += ' via %s' % via.main_addr

        s += ' src %s' % src
        self.topology.printfn(s)

    def render_bash(self):
        self.topology.printfn('\n# routes')

        for rt in self._calc_rts():
            self._render_bash_route(*rt)
