from collections import defaultdict
from itertools import combinations
import math
import networkx as nx


class Ipam():
    def __init__(self, topology):
        self.topology = topology
        self.subnets = []

    def add_subnet(self, subnet):
        self.subnets.append(subnet)

    def _calculate_vlan_connectivity(self):
        nodes_by_tag = defaultdict(set)
        for n in self.topology.l2_graph.nodes():
            tag = self.topology.l2_graph.nodes[n].get('vlan_tag')
            if tag:
                nodes_by_tag[tag].add(n)
        for tag, nodes in nodes_by_tag.items():
            for a, b in combinations(nodes, 2):
                if b.link in nx.neighbors(self.topology.l2_graph, a.link):
                    self.topology.add_l2_conn(a, b)

    def _assign_subnet_addrs(self, subnet):
        g = self.topology.l2_graph
        subnet_l2_domains = [l2d for l2d in nx.connected_components(g)
                             if any((subnet in d.subnets for d in l2d))]
        if not subnet_l2_domains:
            return
        prefixlen_diff = math.ceil(math.log2(len(subnet_l2_domains)))
        subnets = list(subnet.net.subnets(prefixlen_diff=prefixlen_diff))
        for l2d in subnet_l2_domains:
            pool = subnets.pop()
            hosts = pool.hosts()
            for d in l2d:
                if subnet not in d.subnets:
                    continue
                if d.master:
                    continue
                addr = f'{next(hosts)}/{pool.prefixlen}'
                d.add_addr(addr, subnet, pool)

    def assign_addrs(self):
        self._calculate_vlan_connectivity()
        for s in self.subnets:
            self._assign_subnet_addrs(s)
