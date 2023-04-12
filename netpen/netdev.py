import ipaddress
import socket


def net_family(net):
    if isinstance(ipaddress.ip_network(net, strict=False),
                  ipaddress.IPv6Network):
        return socket.AF_INET6
    return socket.AF_INET


def _flag6(net):
    return '-6' if net_family(net) == socket.AF_INET6 else ''


class NetDev():
    DEV_PROPS = {
        'netns': {'type': 'string'},
        'subnets': {'type': 'array', 'items': {'type': 'string'}},
        'mtu': {'type': 'integer'},
        'ethtool': {'type': 'object'},
        'xdp': {'type': 'string'},
        'tc': {
            'type': 'object',
            'properties': {
                'ingress_prog': {'type': 'string'},
                'egress_prog': {'type': 'string'}
            }
        }
    }
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['netns'],
        'properties': DEV_PROPS
    }

    @staticmethod
    def set_peers(d1, d2):
        d1.peer = d2
        d2.peer = d1

    def __init__(self, topology, alias, owner, ns, **kwargs):
        self.topology = topology
        self.owner = owner
        self.name = owner.alloc_name()
        self.alias = alias
        self.ns = ns
        self.ns.add_dev(self)
        self.mtu = kwargs.get('mtu')
        subnets = kwargs.get('subnets') or []
        self.addrs = []
        self.addr_subnets = {}
        self.addr_pools = {}
        self.peer = None
        self.master = None
        self.vrf = None
        self.link = kwargs.get('link')
        self.ports = kwargs.get('ports') or []
        self.subnets = subnets
        self.noarp = kwargs.get('noarp') or False
        self.ethtool = kwargs.get('ethtool') or {}
        self.xdp = kwargs.get('xdp')
        self.tc = kwargs.get('tc')
        self.tss = {}

    def p(self, *args, **kwargs):
        self.topology.printfn(*args, **kwargs)

    @classmethod
    def args_from_params(cls, topology, params):
        ret = {}
        subnets = params.get('subnets')
        if subnets:
            ret['subnets'] = [topology.members[s] for s in subnets]
        mtu = params.get('mtu')
        if mtu:
            ret['mtu'] = mtu
        ethtool = params.get('ethtool')
        if ethtool:
            ret['ethtool'] = ethtool
        xdp = params.get('xdp')
        if xdp:
            ret['xdp'] = xdp
        if tc := params.get('tc'):
            ret['tc'] = tc
        return ret

    @property
    def dotname(self):
        name_ = self.name.replace('.', '_')
        ns_name = self.ns.name
        return f'"netdev_{ns_name}_{name_}-{self.owner.REF}_{self.owner.name}"'

    @property
    def main_addr(self):
        return self.addrs[0].split('/')[0]

    def add_addr(self, addr, subnet, pool):
        self.addrs.append(addr)
        self.addr_subnets[addr] = subnet
        self.addr_pools[addr] = pool

    @property
    def tc_ingress_prog(self):
        if not self.tc or not (p := self.tc.get('ingress_prog')):
            return None
        return self.topology.members.get(p)

    @property
    def tc_egress_prog(self):
        if not self.tc or not (p := self.tc.get('egress_prog')):
            return None
        return self.topology.members.get(p)

    def render_dot(self):
        label = f'{self.name}'
        if self.mtu:
            label += f'|mtu={self.mtu}'
        if self.addrs:
            addrs_str = '|'.join(self.addrs)
            label += f'|{addrs_str}'
        self.p(f'{self.dotname} [label="{{{label}}}", shape=record]')
        if self.xdp:
            xdp = self.topology.members.get(self.xdp)
            if xdp:
                self.p(f'{xdp.dotname} -- {self.dotname} '
                       f'[label="XDP", style=dashed]')
        if ing_prog := self.tc_ingress_prog:
            self.p(f'{ing_prog.dotname} -- {self.dotname} '
                   f'[label="TC_INGRESS", style=dashed]')
        if eg_prog := self.tc_egress_prog:
            self.p(f'{eg_prog.dotname} -- {self.dotname} '
                   f'[label="TC_EGRESS", style=dashed]')

    def render_bash_set_state(self, state):
        self.p(f'ip -net {self.ns.name} link set {self.name} {state}')

    def _render_bash_tc(self):
        ing_prog = self.tc_ingress_prog
        eg_prog = self.tc_egress_prog

        if not ing_prog and not eg_prog:
            return

        ns_name = self.ns.name
        name = self.name

        self.p(f'tc -net {ns_name} qdisc add dev {name} clsact')
        if ing_prog:
            prog_var = ing_prog.bash_ebpf_var
            self.p(f'tc -net {ns_name} filter add dev {name} ingress prio 1 '
                   f'handle 1 bpf da obj "${prog_var}" sec tc')
        if eg_prog:
            prog_var = eg_prog.bash_ebpf_var
            self.p(f'tc -net {ns_name} filter add dev {name} egress prio 1 '
                   f'handle 1 bpf da obj "${prog_var}" sec tc')

    def render_bash(self):
        ns_name = self.ns.name
        name = self.name

        if self.link and self.link.ns != self.ns:
            self.p(f'ip -net {self.link.ns.name} link set {self.name} '
                   f'netns {self.ns.name}')

        self.p(f'ip -net {self.ns.name} link set {self.name} '
               f'alias {self.alias}')

        self.render_bash_set_state('up')
        if self.mtu:
            self.p(f'ip -net {ns_name} link set {name} mtu {self.mtu}')
        for a in self.addrs:
            dad = ' nodad' if net_family(a) == socket.AF_INET6 else ''
            self.p(f'ip {_flag6(a)} -net {ns_name} addr add {a} '
                   f'dev {name}{dad}')
        for k, v in self.ethtool.items():
            if isinstance(v, str):
                v = v in ('y', 'Y', 'yes', 'Yes', 'YES', 'true', 'True',
                          'TRUE', 'on', 'On', 'ON')
            val = 'on' if v else 'off'
            self.p(f'ip netns exec {ns_name} ethtool -K {name} {k} {val}')
        if self.xdp:
            xdp = self.topology.members.get(self.xdp)
            if xdp:
                prog_var = xdp.bash_ebpf_var
                self.p(f'ip -net {ns_name} link set {name} '
                       f'xdp object "${prog_var}"')

        if self.tc:
            self._render_bash_tc()

        self.topology.done_list.add(self)
