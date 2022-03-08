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
            'mode': {'type': 'string'},
            'netns': {'type': 'string'},
            'mtu': {'type': 'integer'}
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
    LAST_TUN_KEY = 1

    def __init__(self, topology, name, subnets, link1_dev, link2_dev,
                 dev1=None, dev2=None):
        super().__init__(topology, name)

        dev1 = dev1 or {}
        dev2 = dev2 or {}

        dev1_ns = dev1.get('ns') or link1_dev.ns
        dev2_ns = dev2.get('ns') or link2_dev.ns

        self.dev1 = NetDev(topology=topology, name=f'{name}.dev1',
                           owner=self, subnets=subnets, ns=dev1_ns,
                           noarp=self.NOARP, link=link1_dev,
                           mtu=dev1.get('mtu'))
        self.dev2 = NetDev(topology=topology, name=f'{name}.dev2',
                           owner=self, subnets=subnets, ns=dev2_ns,
                           noarp=self.NOARP, link=link2_dev,
                           mtu=dev2.get('mtu'))
        self.dev1.tss[self.dev2] = subnets
        self.dev2.tss[self.dev1] = subnets
        self.link1 = link1_dev
        self.link2 = link2_dev
        self.tun_key = self._alloc_tun_key()
        key = f'{self.REF}.{self.name}'
        self.topology.members[f'{key}.dev1'] = self.dev1
        self.topology.members[f'{key}.dev2'] = self.dev2
        self.topology.add_l2_dev(self.dev1)
        self.topology.add_l2_dev(self.dev2)
        self.topology.add_prereq(self, self.link1)
        self.topology.add_prereq(self, self.link2)

    @classmethod
    def _alloc_tun_key(cls):
        ret = cls.LAST_TUN_KEY
        cls.LAST_TUN_KEY += 1
        return ret

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

        for d in (dev1, dev2):
            if d and (ns := d.get('netns')):
                d['ns'] = topology.members[ns]

        return ctor(topology, params['name'], subnets, link1, link2, dev1,
                    dev2)

    def _bash_tunnel_params(self):
        pass

    def _render_dev_bash(self, dev, local_link, remote_link):
        s = f'ip -net {local_link.ns.name} link add {dev.name} ' \
            f'type {self.TUNNEL_MODE} '
        s += f'remote {remote_link.main_addr} local {local_link.main_addr}'
        # pylint: disable=assignment-from-no-return
        tp = self._bash_tunnel_params()
        s += f' {tp}' if tp else ''
        self.p(s)

    def render_bash(self):
        self._render_dev_bash(self.dev1, self.link1, self.link2)
        self.dev1.render_bash()

        self._render_dev_bash(self.dev2, self.link2, self.link1)
        self.dev2.render_bash()

    def render_dot(self):
        self.p(f'{self.dev1.dotname} -- {self.link1.dotname} [color="red"]')
        self.p(f'{self.dev2.dotname} -- {self.link2.dotname} [color="red"]')
        self.p(f'{self.link1.dotname} -- {self.link2.dotname} [color="red"]')
        self.p(f'{self.dev1.dotname} -- {self.dev2.dotname} '
               f'[color="green", label="{self.TUNNEL_MODE}"]')


class IpIp(Tunnel):
    TUNNEL_MODE = 'ipip'
    DESC = {'title': 'IPIP based tunnel'}


class IpIp6(IpIp):
    TUNNEL_MODE = 'ip6tnl'
    DEV_PFX = 'ipip6'
    DESC = {'title': 'IPIP6 based tunnel'}


class VxLan(Tunnel):
    TUNNEL_MODE = 'vxlan'
    DESC = {'title': 'VXLAN based tunnel'}
    NOARP = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.topology.add_l2_conn(self.dev1, self.dev2)

    def _bash_tunnel_params(self):
        return f'id {self.tun_key} dstport 0'


class Gre(Tunnel):
    TUNNEL_MODE = 'gre'
    DESC = {'title': 'GRE based tunnel'}

    def _bash_tunnel_params(self):
        return f'key {self.tun_key}'


class Wireguard(Tunnel):
    TUNNEL_MODE = 'wireguard'
    DESC = {'title': 'Wireguard based tunnel'}
    SCHEMA = Tunnel.SCHEMA

    def __init__(self, topology, name, subnets, link1_dev, link2_dev,
                 dev1=None, dev2=None):
        Tunnel.__init__(self, topology, name, subnets, link1_dev, link2_dev,
                        dev1, dev2)

        self.addrs = [s.cidr for s in subnets]

    def _render_bash_add_dev(self, ns, dev):
        self.p(f'ip -net {ns.name} link add {dev.name} type wireguard')

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
        self.p(f'''
ip netns exec {ns.name} wg set "{dev.name}" listen-port {local_port} \\
    private-key "{priv_key}" peer "$(cat \"{pub_key}\")" \\
    allowed-ips {allowed_ips} \\
    endpoint {peer}:{remote_port}''')

    def render_bash(self):
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

        Tunnel.__init__(self, topology, name, subnets, link1_dev, link2_dev,
                        dev1, dev2)

        dev1 = dev1 or {}
        dev2 = dev2 or {}

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
        self.p(f'ip -net {link.ns.name} link add {dev.name} type xfrm '
               f'if_id {xparams.if_id}')

    def _render_vti_bash(self, mode, dev, local_link, remote_link, xparams):
        p = f'remote {remote_link.main_addr} local {local_link.main_addr} ' \
            f'key {xparams.mark} dev {local_link.name}'
        self.p(f'ip -net {local_link.ns.name} link add {dev.name} '
               f'type {mode} {p}')

    def _render_xdev_bash(self, mode, dev, local_link, remote_link, xparams):
        if mode == 'xfrm':
            self._render_xfrmi_bash(dev, local_link, xparams)
        elif mode in ('vti', 'vti6'):
            self._render_vti_bash(mode, dev, local_link, remote_link, xparams)

    def render_bash(self):
        Xfrm.render_bash(self)

        self._render_xdev_bash(self.dev1_mode, self.dev1, self.link1,
                               self.link2, self._xparams1)
        self._render_xdev_bash(self.dev2_mode, self.dev2, self.link2,
                               self.link1, self._xparams2)

        self.dev1.render_bash()
        self.dev2.render_bash()


class L2tp(Tunnel):
    TUNNEL_MODE = 'l2tp'
    DESC = {'title': 'L2TP based tunnel'}
    LAST_TUN_SESS_ID = 1
    NOARP = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tun_sess_id = self._alloc_tun_sess_id()
        self.topology.add_l2_conn(self.dev1, self.dev2)

    @classmethod
    def _alloc_tun_sess_id(cls):
        # some kernel versions expect unique session ids even across
        # different tunnels
        ret = cls.LAST_TUN_SESS_ID
        cls.LAST_TUN_SESS_ID += 1
        return ret

    def _render_dev_bash(self, dev, local_link, remote_link):
        self.p('# l2tp requires an underlay route to exist before '
               'creating the tunnel')
        self.topology.router.render_bash_route(dev.ns, remote_link.main_addr)

        self.p(f'ip -net {local_link.ns.name} l2tp add tunnel '
               f'remote {remote_link.main_addr} '
               f'local {local_link.main_addr} '
               f'tunnel_id {self.tun_sess_id} '
               f'peer_tunnel_id {self.tun_sess_id} '
               f'encap ip')

        self.p(f'ip -net {local_link.ns.name} l2tp add session '
               f'name {dev.name} tunnel_id {self.tun_sess_id} '
               f'session_id 1 peer_session_id 1')
