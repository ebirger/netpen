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
        'xdp': {'type': 'string'}
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

    def __init__(self, topology, name, owner, ns, **kwargs):
        self.topology = topology
        self.name = name
        self.owner = owner
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
        return ret

    @property
    def dotname(self):
        return '"netdev_%s_%s-%s_%s"' % (self.ns.name,
                                         self.name.replace('.', '_'),
                                         self.owner.REF, self.owner.name)

    @property
    def main_addr(self):
        return self.addrs[0].split('/')[0]

    def add_addr(self, addr, subnet, pool):
        self.addrs.append(addr)
        self.addr_subnets[addr] = subnet
        self.addr_pools[addr] = pool

    def render_dot(self):
        label = '%s' % self.name
        if self.mtu:
            label += '|mtu=%s' % self.mtu
        if self.addrs:
            label += '|%s' % '|'.join(self.addrs)
        self.p('%s [label="{%s}", shape=record]' % (self.dotname, label))
        if self.xdp:
            xdp = self.topology.members.get(self.xdp)
            if xdp:
                self.p('%s -- %s [label="XDP", style=dashed]' % (xdp.dotname,
                                                                 self.dotname))

    def render_bash_set_state(self, state):
        self.p('ip -net %s link set %s %s' % (self.ns.name, self.name, state))

    def render_bash(self):
        self.render_bash_set_state('up')
        if self.mtu:
            self.p('ip -net %s link set %s mtu %s' % (self.ns.name, self.name,
                                                      self.mtu))
        for a in self.addrs:
            dad = ' nodad' if net_family(a) == socket.AF_INET6 else ''
            self.p('ip %s -net %s addr add %s dev %s%s' % (_flag6(a),
                                                           self.ns.name,
                                                           a, self.name, dad))
        for k, v in self.ethtool.items():
            val = 'on' if v else 'off'
            self.p('ip netns exec %s ethtool -K %s %s %s' % (self.ns.name,
                                                             self.name, k,
                                                             val))
        if self.xdp:
            xdp = self.topology.members.get(self.xdp)
            if xdp:
                prog_var = xdp.bash_ebpf_var
                self.p('ip -net %s link set %s xdp object "$%s"' % (
                    self.ns.name, self.name, prog_var))

        self.topology.done_list.add(self)
