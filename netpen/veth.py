from .netdev import NetDev
from .topology import TopologyMember


class Veth(TopologyMember):
    REF = 'veth'
    DESC = {'title': 'Virtual Ethernet (Veth) with IPv4 addresses'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'dev1', 'dev2'],
        'properties': {
            'name': {'type': 'string'},
            'dev1': NetDev.SCHEMA,
            'dev2': NetDev.SCHEMA
        }
    }

    def __init__(self, topology, name, ns1, ns2, dev1_args=None,
                 dev2_args=None):
        super().__init__(topology, name)
        dev1_args = dev1_args or {}
        dev2_args = dev2_args or {}
        self.dev1 = NetDev(topology=topology, name='%s.dev1' % name,
                           owner=self, ns=ns1, **dev1_args)
        self.dev2 = NetDev(topology=topology, name='%s.dev2' % name,
                           owner=self, ns=ns2, **dev2_args)
        NetDev.set_peers(self.dev1, self.dev2)
        key = '%s.%s' % (self.REF, self.name)
        self.topology.members['%s.dev1' % key] = self.dev1
        self.topology.members['%s.dev2' % key] = self.dev2
        self.topology.add_l2_conn(self.dev1, self.dev2)

    @classmethod
    def from_params(cls, topology, params):
        d1 = params['dev1']
        d2 = params['dev2']

        ns1 = topology.members[d1['netns']]
        ns2 = topology.members[d2['netns']]

        d1_args = NetDev.args_from_params(topology, d1)
        d2_args = NetDev.args_from_params(topology, d2)

        return cls(topology, params['name'], ns1, ns2,
                   dev1_args=d1_args, dev2_args=d2_args)

    def render_bash(self):
        self.p('ip link add %s netns %s type veth '
               'peer name %s netns %s' % (self.dev1.name, self.dev1.ns.name,
                                          self.dev2.name, self.dev2.ns.name))
        self.dev1.render_bash()
        self.dev2.render_bash()

    def render_dot(self):
        self.p('%s -- %s' % (self.dev1.dotname, self.dev2.dotname))
