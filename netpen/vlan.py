from .netdev import NetDev
from .topology import TopologyMember


class Vlan(TopologyMember):
    REF = 'vlan'
    DESC = {'title': 'VLAN 802.1q'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'tag', 'link'],
        'properties': {
            'name': {'type': 'string'},
            'tag': {'type': 'integer'},
            'link': {'type': 'string'},
            **NetDev.DEV_PROPS
        }
    }

    def __init__(self, topology, name, ns, tag, link_dev, dev_args=None):
        super().__init__(topology, name)
        devname = '%s.%s' % (link_dev.name, tag)
        dev_args = dev_args or {}
        self.tag = tag
        self.link = link_dev
        self.dev = NetDev(topology=topology, name=devname, owner=self, ns=ns,
                          link=self.link, **dev_args)
        key = '%s.%s' % (self.REF, self.name)
        self.topology.members['%s.dev' % key] = self.dev
        self.topology.add_l2_dev(self.dev, vlan_tag=self.tag)
        self.topology.add_prereq(self, self.link)

    @classmethod
    def from_params(cls, topology, params):
        link = topology.members[params['link']]
        nsname = params.get('netns')
        ns = topology.members[nsname] if nsname else link.ns
        dev_args = NetDev.args_from_params(topology, params)
        return cls(topology, params['name'], ns, params['tag'], link,
                   dev_args=dev_args)

    def render_bash(self):
        self.p('ip -net %s link add %s link %s '
               'type vlan id %s' % (self.link.ns.name, self.dev.name,
                                    self.link.name, self.tag))
        self.p('ip -net %s link set %s netns %s' % (self.link.ns.name,
                                                    self.dev.name,
                                                    self.dev.ns.name))
        self.dev.render_bash()

    def render_dot(self):
        self.p('%s -- %s [color="blue", label="%s"]' % (self.dev.dotname,
                                                        self.link.dotname,
                                                        'VLAN %s' % self.tag))
