from .topology import TopologyMember
from .netdev import NetDev


class Bridge(TopologyMember):
    REF = 'bridge'
    DESC = {'title': 'Bridge Interface'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'netns'],
        'properties': {
            'name': {'type': 'string'},
            'ports': {'type': 'array', 'items': {'type': 'string'}},
            **NetDev.DEV_PROPS
        }
    }

    def __init__(self, topology, name, ns, ports, dev_args=None):
        super().__init__(topology, name)
        dev_args = dev_args or {}
        self.dev = NetDev(topology=topology, name=name, owner=self, ns=ns,
                          ports=ports, **dev_args)
        key = f'{self.REF}.{self.name}'
        self.topology.members[f'{key}.dev'] = self.dev
        for p in self.dev.ports:
            p.master = self
            self.topology.add_l2_conn(self.dev, p)
            self.topology.add_prereq(self, p)

    @classmethod
    def from_params(cls, topology, params):
        port_names = params.get('ports') or []
        ports = [topology.members[p] for p in port_names]
        dev_args = NetDev.args_from_params(topology, params)
        ns = topology.members[params['netns']]
        return cls(topology, params['name'], ns, ports, dev_args)

    def render_dot(self):
        for p in self.dev.ports:
            self.p(f'{self.dev.dotname} -- {p.dotname} [color="blue"]')

    def render_bash(self):
        self.p(f'ip -net {self.dev.ns.name} link add {self.dev.name} '
               f'type {self.REF} ')
        self.dev.render_bash()

        for p in self.dev.ports:
            self.p(f'ip -net {self.dev.ns.name} link set {p.name} master '
                   f'{self.dev.name}')
