from itertools import chain
from prettytable import PrettyTable, ALL
from .topology import TopologyMember


class NetNs(TopologyMember):
    REF = 'netns'
    DESC = {'title': 'Network Namespace'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name'],
        'properties': {
            'name': {'type': 'string'},
            'netserver': {'type': 'boolean'},
            'forwarding': {'type': 'boolean'},
        }
    }

    forwarding_sysctls = [
        'net.ipv4.conf.all.forwarding=1',
        'net.ipv6.conf.all.forwarding=2'
    ]

    def __init__(self, topology, name, netserver=False, forwarding=True):
        super().__init__(topology, name)
        self.name = name
        self.netserver = netserver
        self.forwarding = forwarding
        self._devs = []
        self._vrfs = []
        self._next_vrf_id = 10
        self.topology.router.add_ns(self)

    def add_dev(self, o):
        self._devs.append(o)

    def add_vrf(self, o):
        self._vrfs.append(o)
        self._next_vrf_id += 1
        return self._next_vrf_id

    @property
    def devs(self):
        return self._devs

    @property
    def addrs(self):
        return [{'addr': a, 'dev': d}
                for d in self._devs for a in d.addrs]

    def pools(self):
        return list(chain.from_iterable((d.addr_pools.values()
                                         for d in self._devs)))

    def render_bash(self):
        self.p('ip netns add %s' % self.name)
        sysctls = []
        if self.forwarding:
            sysctls += self.forwarding_sysctls
        for sc in sysctls:
            self.p('ip netns exec %s sysctl -w %s' % (self.name, sc))
        if self.netserver:
            self.p('ip netns exec %s netserver' % self.name)

    def render_dot(self):
        if not self._vrfs and not self._devs:
            name_no_dot = self.name.replace('.', '_')
            dotname = '"netns_%s-netns_%s"' % (name_no_dot, name_no_dot)
            self.p('%s [label="%s", shape=record]' % (dotname, self.name))
            return

        self.p('subgraph cluster_netns_%s {' % self.name)
        self.p('label="%s"' % self.name)

        for o in self._vrfs:
            o.render_dot()

        for o in self._devs:
            o.render_dot()
        self.p('}')

    @classmethod
    def from_params(cls, topology, params):
        netserver = params.get('netserver', False)
        forwarding = params.get('forwarding', True)
        return cls(topology, params['name'], netserver=netserver,
                   forwarding=forwarding)

    @classmethod
    def bash_preamble(cls, topology):
        topology.printfn('cat << EOF')
        t = PrettyTable(('Namespace', 'IPv4'), hrules=ALL)
        t.align['IPv4'] = 'l'
        for ns in topology.objects[cls.REF]:
            t.add_row(ns.render_table_row())
        topology.printfn(t)
        topology.printfn('EOF\n\n')

    def render_table_row(self):
        def _render_dev(d):
            if d.addrs:
                return '\n'.join(('%s (%s)' % (a, d.name) for a in d.addrs))
            return d.name
        return [self.name, '\n'.join(_render_dev(d) for d in self._devs)]
