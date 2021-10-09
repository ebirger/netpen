from collections import namedtuple
import random
from itertools import product
from .topology import TopologyMember


class Xfrm():
    XFRM_PARAMS = namedtuple('XFRM_PARAMS', 'link addrs spi if_id mark')
    LAST_SPI = 1
    MODE = 'tunnel'

    def __init__(self, xparams1, xparams2):
        self._xparams1 = xparams1
        self._xparams2 = xparams2
        self._key = self._gen_key()

    def _alloc_spi(self):
        ret = self.LAST_SPI
        self.LAST_SPI += 1
        return ret

    @staticmethod
    def _gen_key():
        return hex(random.getrandbits(160))

    def _render_bash_xfrm_state(self, ns, src, dst, spi, if_id=None):
        params = dict(ns=ns, src=src, dst=dst, spi=spi, mode=self.MODE)
        params['if_id'] = f'if_id {if_id}' if if_id else ''
        params['key_aead'] = self._key
        if self.MODE == 'tunnel':
            params['sel'] = 'flag af-unspec'
        else:
            params['sel'] = f'sel src "{src}" dst "{dst}"'
        self.p('''
ip -net "%(ns)s" xfrm state add src "%(src)s" dst "%(dst)s" \\
    spi "%(spi)s" proto esp aead 'rfc4106(gcm(aes))' \\
    "%(key_aead)s" 128 mode %(mode)s %(if_id)s \\
    %(sel)s''' % params)

    def _render_bash_xfrm_policy(self, ns, direc, src, dst, tmpl_src, tmpl_dst,
                                 if_id=None, mark=None):
        params = dict(ns=ns, direc=direc, src=src, dst=dst, tmpl_src=tmpl_src,
                      tmpl_dst=tmpl_dst, mode=self.MODE)
        if if_id:
            params['disc'] = f'if_id {if_id}'
        elif mark:
            params['disc'] = f'mark {mark}'
        else:
            params['disc'] = ''
        self.p('''
ip -net "%(ns)s" xfrm policy add dir %(direc)s \\
    src "%(src)s" dst "%(dst)s" \\
    tmpl src "%(tmpl_src)s" dst "%(tmpl_dst)s" proto esp mode %(mode)s %(disc)s
''' % params)

    def _render_bash_xfrm_policies(self, ns, overlay_local, overlay_remote,
                                   local_ip, remote_ip, if_id=None, mark=None):
        self._render_bash_xfrm_policy(ns, 'out', overlay_local, overlay_remote,
                                      local_ip, remote_ip, if_id, mark)
        self._render_bash_xfrm_policy(ns, 'in', overlay_remote, overlay_local,
                                      remote_ip, local_ip, if_id, mark)
        self._render_bash_xfrm_policy(ns, 'fwd', overlay_remote, overlay_local,
                                      remote_ip, local_ip, if_id, mark)

    def _render_bash_xfrm_ns(self, ns, local_ip, remote_ip,
                             overlay_local_addrs, overlay_remote_addrs,
                             spi_out, spi_in, if_id=None, mark=None):
        laddrs_str = ','.join(overlay_local_addrs)
        raddrs_str = ','.join(overlay_remote_addrs)
        label = f'{laddrs_str} <-> {raddrs_str}'

        self.p(f'\n# {ns}: states {label}')
        self._render_bash_xfrm_state(ns, local_ip, remote_ip, spi_out, if_id)
        self._render_bash_xfrm_state(ns, remote_ip, local_ip, spi_in, if_id)
        self.p(f'\n# {ns}: policies {label}')
        all_tss = product(overlay_local_addrs, overlay_remote_addrs)
        for overlay_local, overlay_remote in all_tss:
            self._render_bash_xfrm_policies(ns, overlay_local, overlay_remote,
                                            local_ip, remote_ip, if_id, mark)

    def render_bash(self):
        if self.MODE == 'tunnel':
            overlay_addrs1 = self._xparams1.addrs
            overlay_addrs2 = self._xparams2.addrs
        else:
            overlay_addrs1 = [self._xparams1.link.main_addr]
            overlay_addrs2 = [self._xparams2.link.main_addr]

        self._render_bash_xfrm_ns(self._xparams1.link.ns.name,
                                  self._xparams1.link.main_addr,
                                  self._xparams2.link.main_addr,
                                  overlay_addrs1,
                                  overlay_addrs2,
                                  self._xparams1.spi,
                                  self._xparams2.spi,
                                  self._xparams1.if_id,
                                  self._xparams1.mark)

        self._render_bash_xfrm_ns(self._xparams2.link.ns.name,
                                  self._xparams2.link.main_addr,
                                  self._xparams1.link.main_addr,
                                  overlay_addrs2,
                                  overlay_addrs1,
                                  self._xparams2.spi,
                                  self._xparams1.spi,
                                  self._xparams2.if_id,
                                  self._xparams2.mark)


class XfrmTransport(Xfrm, TopologyMember):
    REF = 'xfrm_transport'
    MODE = 'transport'
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'link1', 'link2'],
        'properties': {
            'name': {'type': 'string'},
            'link1': {'type': 'string'},
            'link2': {'type': 'string'}
        }
    }

    def __init__(self, topology, name, link1_dev, link2_dev):
        TopologyMember.__init__(self, topology, name)

        self.link1 = link1_dev
        self.link2 = link2_dev

        addrs = self.link1.addrs + self.link2.addrs
        xparams1 = Xfrm.XFRM_PARAMS(link=self.link1, addrs=addrs,
                                    spi=self._alloc_spi(), if_id=None,
                                    mark=None)
        xparams2 = Xfrm.XFRM_PARAMS(link=self.link2, addrs=addrs,
                                    spi=self._alloc_spi(), if_id=None,
                                    mark=None)
        Xfrm.__init__(self, xparams1, xparams2)

    @classmethod
    def from_params(cls, topology, params):
        link1 = topology.members[params['link1']]
        link2 = topology.members[params['link2']]

        return cls(topology, params['name'], link1, link2)

    def render_dot(self):
        self.p(f'{self.link1.dotname} -- {self.link2.dotname} '
               f'[color="green", label="xfrm"]')
