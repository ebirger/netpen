from .netdev import NetDev
from .topology import TopologyMember


class Dummy(TopologyMember):
    REF = 'dummy'
    DESC = {'title': 'Dummy Device'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'netns'],
        'properties': {
            'name': {'type': 'string'},
            **NetDev.DEV_PROPS
        }
    }

    def __init__(self, topology, name, ns, dev_args=None):
        super().__init__(topology, name)
        dev_args = dev_args or {}
        self.dev = NetDev(topology=topology, name=self.name, owner=self, ns=ns,
                          **dev_args)
        key = f'{self.REF}.{self.name}'
        self.topology.members[f'{key}.dev'] = self.dev
        self.topology.add_l2_dev(self.dev)

    @classmethod
    def from_params(cls, topology, params):
        nsname = params['netns']
        ns = topology.members[nsname]
        dev_args = NetDev.args_from_params(topology, params)
        return cls(topology, params['name'], ns, dev_args=dev_args)

    def render_bash(self):
        self.p(f'ip -net {self.dev.ns.name} link add {self.dev.name} '
               f'type dummy')
        self.dev.render_bash()
