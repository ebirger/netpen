from itertools import chain
from prettytable import PrettyTable, HRuleStyle
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
            'enable_lo': {'type': 'boolean'},
        }
    }

    forwarding_sysctls = [
        'net.ipv4.conf.all.forwarding=1',
        'net.ipv6.conf.all.forwarding=2'
    ]

    def __init__(self, topology, name, netserver=False, forwarding=True,
                 enable_lo=False):
        super().__init__(topology, name)
        self.name = name
        self.netserver = netserver
        self.forwarding = forwarding
        self.enable_lo = enable_lo
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

    def _render_bash_move_local_iprule_pref(self):
        for v6flag in ('', '-6'):
            self.p(f'ip {v6flag} -net {self.name} rule del pref 0')
            self.p(f'ip {v6flag} -net {self.name} rule add pref 32765 '
                   f'from all lookup local')

    def render_bash(self):
        self.p(f'ip netns add {self.name}')
        sysctls = []
        if self.forwarding:
            sysctls += self.forwarding_sysctls
        for sc in sysctls:
            self.p(f'ip netns exec {self.name} sysctl -w {sc}')
        if self.netserver:
            self.p(f'ip netns exec {self.name} netserver')
        if self.enable_lo:
            self.p(f'ip -net {self.name} link set lo up')
        if self._vrfs:
            self._render_bash_move_local_iprule_pref()

    def render_dot(self):
        if not self._vrfs and not self._devs:
            name_no_dot = self.name.replace('.', '_')
            dotname = f'"netns_{name_no_dot}-netns_{name_no_dot}"'
            self.p(f'{dotname} [label="{self.name}", shape=record]')
            return

        self.p(f'subgraph cluster_netns_{self.name} {{')
        self.p(f'label="{self.name}"')

        for o in self._vrfs:
            o.render_dot()

        for o in self._devs:
            o.render_dot()
        self.p('}')

    @classmethod
    def from_params(cls, topology, params):
        netserver = params.get('netserver', False)
        forwarding = params.get('forwarding', True)
        enable_lo = params.get('enable_lo', False)
        return cls(topology, params['name'], netserver=netserver,
                   forwarding=forwarding, enable_lo=enable_lo)

    @classmethod
    def bash_preamble(cls, topology):
        topology.printfn('cat << EOF')
        t = PrettyTable(('Namespace', 'IPv4'), hrules=HRuleStyle.ALL)
        t.align['IPv4'] = 'l'
        for ns in topology.objects[cls.REF]:
            t.add_row(ns.render_table_row())
        topology.printfn(t)
        topology.printfn('EOF\n\n')

    def render_table_row(self):
        def _render_dev(d):
            if d.addrs:
                return '\n'.join((f'{a} - {d.name} ({d.alias}))'
                                 for a in d.addrs))
            return f'{d.name} ({d.alias})'
        return [self.name, '\n'.join(_render_dev(d) for d in self._devs)]
