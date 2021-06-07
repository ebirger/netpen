from .topology import TopologyMember
from .netdev import NetDev
from .xfrm import Xfrm


class Tunnel(TopologyMember):
    REF = 'tunnel'
    TUNNEL_MODE = None
    NOARP = True
    DEV_SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'mode': {'type': 'string'}
        }
    }
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'mode', 'subnets', 'link1', 'link2'],
        'properties': {
            'name': {'type': 'string'},
            'mode': {'type': 'string'},
            'subnets': {'type': 'array', 'items': {'type': 'string'}},
            'link1': {'type': 'string'},
            'link2': {'type': 'string'},
            'dev1': DEV_SCHEMA,
            'dev2': DEV_SCHEMA
        }
    }

    def __init__(self, topology, name, subnets, link1_dev, link2_dev,
                 _dev1=None, _dev2=None):
        super().__init__(topology, name)
        self.dev1 = NetDev(topology=topology, name='%s.dev1' % name,
                           owner=self, subnets=subnets, ns=link1_dev.ns,
                           noarp=self.NOARP)
        self.dev2 = NetDev(topology=topology, name='%s.dev2' % name,
                           owner=self, subnets=subnets, ns=link2_dev.ns,
                           noarp=self.NOARP)
        self.dev1.tss[self.dev2] = subnets
        self.dev2.tss[self.dev1] = subnets
        self.link1 = link1_dev
        self.link2 = link2_dev
        key = '%s.%s' % (self.REF, self.name)
        self.topology.members['%s.dev1' % key] = self.dev1
        self.topology.members['%s.dev2' % key] = self.dev2
        self.topology.add_l2_dev(self.dev1)
        self.topology.add_l2_dev(self.dev2)
        self.topology.add_prereq(self, self.link1)
        self.topology.add_prereq(self, self.link2)

    @classmethod
    def all_subclasses(cls):
        ret = []

        for c in cls.__subclasses__():
            ret.append(c)
            ret.extend(c.all_subclasses())

        return ret

    @classmethod
    def from_params(cls, topology, params):
        subnets = [topology.members[s] for s in params['subnets']]

        link1 = topology.members[params['link1']]
        link2 = topology.members[params['link2']]

        ctor = next((c for c in cls.all_subclasses()
                     if c.TUNNEL_MODE == params['mode']))

        dev1 = params.get('dev1')
        dev2 = params.get('dev2')

        return ctor(topology, params['name'], subnets, link1, link2, dev1,
                    dev2)

    def render_dot(self):
        self.p('%s -- %s [color="red"]' % (self.dev1.dotname,
                                           self.link1.dotname))
        self.p('%s -- %s [color="red"]' % (self.dev2.dotname,
                                           self.link2.dotname))
        self.p('%s -- %s [color="red"]' % (self.link1.dotname,
                                           self.link2.dotname))
        self.p('%s -- %s [color="green", label="%s"]' % (self.dev1.dotname,
                                                         self.dev2.dotname,
                                                         self.TUNNEL_MODE))


class IpIp(Tunnel):
    TUNNEL_MODE = 'ipip'
    DESC = {'title': 'IPIP based tunnel'}

    def render_bash(self):
        self.p('ip -net %s link add %s type %s '
               'remote %s local %s' % (self.dev1.ns.name, self.dev1.name,
                                       self.TUNNEL_MODE,
                                       self.link2.main_addr,
                                       self.link1.main_addr))
        self.dev1.render_bash()

        self.p('ip -net %s link add %s type %s '
               'remote %s local %s' % (self.dev2.ns.name, self.dev2.name,
                                       self.TUNNEL_MODE,
                                       self.link1.main_addr,
                                       self.link2.main_addr))
        self.dev2.render_bash()


class IpIp6(IpIp):
    TUNNEL_MODE = 'ip6tnl'
    DEV_PFX = 'ipip6'
    DESC = {'title': 'IPIP6 based tunnel'}


class VxLan(Tunnel):
    TUNNEL_MODE = 'vxlan'
    DESC = {'title': 'VXLAN based tunnel'}
    LAST_VNI = 1
    NOARP = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.topology.add_l2_conn(self.dev1, self.dev2)

    @classmethod
    def _alloc_vni(cls):
        ret = cls.LAST_VNI
        cls.LAST_VNI += 1
        return ret

    def render_bash(self):
        vni = self._alloc_vni()
        self.p('ip -net %s link add %s type %s '
               'id %s remote %s local %s dstport 0' % (self.dev1.ns.name,
                                                       self.dev1.name,
                                                       self.TUNNEL_MODE, vni,
                                                       self.link2.main_addr,
                                                       self.link1.main_addr))
        self.dev1.render_bash()

        self.p('ip -net %s link add %s type %s '
               'id %s remote %s local %s dstport 0' % (self.dev2.ns.name,
                                                       self.dev2.name,
                                                       self.TUNNEL_MODE, vni,
                                                       self.link1.main_addr,
                                                       self.link2.main_addr))
        self.dev2.render_bash()


class Gre(Tunnel):
    TUNNEL_MODE = 'gre'
    DESC = {'title': 'GRE based tunnel'}
    LAST_KEY = 1

    @classmethod
    def _alloc_key(cls):
        ret = cls.LAST_KEY
        cls.LAST_KEY += 1
        return ret

    def render_bash(self):
        key = self._alloc_key()
        self.p('ip -net %s link add %s type %s '
               'remote %s local %s key %s' % (self.dev1.ns.name,
                                              self.dev1.name,
                                              self.TUNNEL_MODE,
                                              self.link2.main_addr,
                                              self.link1.main_addr,
                                              key))
        self.dev1.render_bash()

        self.p('ip -net %s link add %s type %s '
               'remote %s local %s key %s' % (self.dev2.ns.name,
                                              self.dev2.name,
                                              self.TUNNEL_MODE,
                                              self.link1.main_addr,
                                              self.link2.main_addr,
                                              key))
        self.dev2.render_bash()


class Wireguard(Tunnel):
    TUNNEL_MODE = 'wireguard'
    DESC = {'title': 'Wireguard based tunnel'}
    SCHEMA = Tunnel.SCHEMA

    def __init__(self, topology, name, subnets, link1_dev, link2_dev,
                 _dev1=None, _dev2=None):
        Tunnel.__init__(self, topology, name, subnets, link1_dev, link2_dev)

        self.addrs = [s.cidr for s in subnets]

    def _render_bash_add_dev(self, ns, dev):
        self.p('ip -net "%s" link add "%s" type wireguard' % (ns.name,
                                                              dev.name))

    def _render_bash_wg_keys(self):
        self.p('u=$(umask)')
        self.p('umask 077')
        self.p('key1=$(mktemp)')
        self.p('key2=$(mktemp)')
        self.p('umask "$u"')
        self.p('wg genkey | tee "$key1" | wg pubkey > "$key1.pub"')
        self.p('wg genkey | tee "$key2" | wg pubkey > "$key2.pub"')
        return (('$key1', '$key1.pub'), ('$key2', '$key2.pub'))

    def _render_bash_wg_config(self, ns, dev, peer, local_port,
                               remote_port, keys_local, keys_remote):
        allowed_ips = ','.join(self.addrs)
        priv_key, _ = keys_local
        _, pub_key = keys_remote
        self.p('''
ip netns exec %s wg set "%s" listen-port %s \\
    private-key "%s" peer "$(cat \"%s\")" allowed-ips %s \\
    endpoint %s:%s''' % (ns.name, dev.name, local_port, priv_key, pub_key,
                         allowed_ips, peer, remote_port))

    def render_bash(self):
        Tunnel.render_bash(self)

        self._render_bash_add_dev(self.link1.ns, self.dev1)
        self._render_bash_add_dev(self.link2.ns, self.dev2)

        keys1, keys2 = self._render_bash_wg_keys()

        P1 = 51280
        P2 = 8172
        self._render_bash_wg_config(self.link1.ns, self.dev1,
                                    self.link2.main_addr, P1, P2, keys1, keys2)
        self._render_bash_wg_config(self.link2.ns, self.dev2,
                                    self.link1.main_addr, P2, P1, keys2, keys1)

        self.dev1.render_bash()
        self.dev2.render_bash()


class XfrmTunnel(Xfrm, Tunnel):
    TUNNEL_MODE = 'xfrm'
    DESC = {'title': 'XFRM Tunnel'}
    DEV_PFX = 'xfrm'
    LAST_IF_ID = 1
    LAST_MARK = 1

    def __init__(self, topology, name, subnets, link1_dev, link2_dev,
                 dev1=None, dev2=None):

        Tunnel.__init__(self, topology, name, subnets, link1_dev, link2_dev)

        dev1 = dev1 or {}
        dev1 = dev2 or {}

        self.dev1_mode = dev1.get('mode') or 'xfrm'
        self.dev2_mode = dev2.get('mode') or 'xfrm'

        dev1_if_id, dev1_mark = self._alloc_keys(self.dev1_mode)
        dev2_if_id, dev2_mark = self._alloc_keys(self.dev2_mode)

        addrs = [s.cidr for s in subnets]

        xparams1 = Xfrm.XFRM_PARAMS(link=self.link1, addrs=addrs,
                                    spi=self._alloc_spi(), if_id=dev1_if_id,
                                    mark=dev1_mark)
        xparams2 = Xfrm.XFRM_PARAMS(link=self.link2, addrs=addrs,
                                    spi=self._alloc_spi(), if_id=dev2_if_id,
                                    mark=dev2_mark)

        Xfrm.__init__(self, xparams1, xparams2)

    def _alloc_keys(self, mode):
        if_id = None
        mark = None
        if mode == 'xfrm':
            if_id = self._alloc_if_id()
        elif mode in ('vti', 'vti6'):
            mark = self._alloc_mark()
        return if_id, mark

    def _alloc_mark(self):
        ret = self.LAST_MARK
        self.LAST_MARK += 1
        return ret

    def _alloc_if_id(self):
        ret = self.LAST_IF_ID
        self.LAST_IF_ID += 1
        return ret

    def _render_xfrmi_bash(self, dev, link, xparams):
        self.p('ip -net "%s" link add "%s" type xfrm if_id %s' %
               (link.ns.name, dev.name, xparams.if_id))

    def _render_vti_bash(self, mode, dev, local_link, remote_link, xparams):
        p = 'remote %s local %s key %s dev %s' % (remote_link.main_addr,
                                                  local_link.main_addr,
                                                  xparams.mark,
                                                  local_link.name)
        self.p('ip -net "%s" link add "%s" type %s %s' %
               (local_link.ns.name, dev.name, mode, p))

    def _render_dev_bash(self, mode, dev, local_link, remote_link, xparams):
        if mode == 'xfrm':
            self._render_xfrmi_bash(dev, local_link, xparams)
        elif mode in ('vti', 'vti6'):
            self._render_vti_bash(mode, dev, local_link, remote_link, xparams)

    def render_bash(self):
        Xfrm.render_bash(self)
        Tunnel.render_bash(self)

        self._render_dev_bash(self.dev1_mode, self.dev1, self.link1,
                              self.link2, self._xparams1)
        self._render_dev_bash(self.dev2_mode, self.dev2, self.link2,
                              self.link1, self._xparams2)

        self.dev1.render_bash()
        self.dev2.render_bash()
