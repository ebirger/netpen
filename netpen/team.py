from .topology import TopologyMember
from .netdev import NetDev


class Team(TopologyMember):
    REF = 'team'
    DESC = {'title': 'Team Interface'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'netns'],
        'properties': {
            'name': {'type': 'string'},
            'mode': {'type': 'string', 'enum': ['broadcast', 'roundrobin',
                                                'random']},
            'ports': {'type': 'array', 'items': {'type': 'string'}},
            **NetDev.DEV_PROPS
        }
    }

    def __init__(self, topology, name, ns, ports, mode, dev_args=None):
        super().__init__(topology, name)
        dev_args = dev_args or {}
        self.dev = NetDev(topology=topology, name=name, owner=self, ns=ns,
                          ports=ports, **dev_args)
        self.mode = mode
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
        mode = params.get('mode', 'roundrobin')
        return cls(topology, params['name'], ns, ports, mode, dev_args)

    def render_dot(self):
        for p in self.dev.ports:
            self.p(f'{self.dev.dotname} -- {p.dotname} [color="blue"]')

    def render_bash(self):
        self.p(f'ip -net {self.dev.ns.name} link add {self.dev.name} '
               f'type {self.REF}')
        self.p(f'ip netns exec {self.dev.ns.name} teamnl {self.dev.name} '
               f'setoption mode {self.mode}')

        self.dev.render_bash()

        for p in self.dev.ports:
            p.render_bash_set_state('down')
            self.p(f'ip -net {self.dev.ns.name} link set {p.name} '
                   f'master {self.dev.name}')
            p.render_bash_set_state('up')
