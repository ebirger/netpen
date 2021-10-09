from .topology import TopologyMember
from .netdev import NetDev


class Vrf(TopologyMember):
    REF = 'vrf'
    DESC = {'title': 'Virtual Routing and Forwarding (lite)'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'netns'],
        'properties': {
            'name': {'type': 'string'},
            'add_default_unreach': {'type': 'boolean'},
            'members': {'type': 'array', 'items': {'type': 'string'}},
            **NetDev.DEV_PROPS
        }
    }

    def __init__(self, topology, name, ns, members, default_unreach=True,
                 dev_args=None):
        super().__init__(topology, name)
        dev_args = dev_args or {}
        self.dev = NetDev(topology=topology, name=name, owner=self, ns=ns,
                          ports=members, **dev_args)
        self._default_unreach = default_unreach
        self._vrf_id = ns.add_vrf(self)
        self.dev.vrf = self
        key = f'{self.REF}.{self.name}'
        self.topology.members[f'{key}.dev'] = self.dev
        for p in self.dev.ports:
            self.topology.add_prereq(self, p)
            p.vrf = self

    @classmethod
    def from_params(cls, topology, params):
        member_names = params.get('members') or []
        members = [topology.members[p] for p in member_names]
        dev_args = NetDev.args_from_params(topology, params)
        ns = topology.members[params['netns']]
        def_unreach = params.get('add_default_unreach', True)
        return cls(topology, params['name'], ns, members, def_unreach,
                   dev_args)

    def render_dot(self):
        self.p(f'subgraph cluster_vrf_{self.name} {{')
        self.p(f'label="{self.name} [{self._vrf_id}]"')
        self.p('style=dashed')
        self.p(f'{self.dev.dotname};')
        for p in self.dev.ports:
            self.p(f'{p.dotname};')
        self.p('}')
        self.topology.done_list.add(self)

    def render_bash(self):
        ns_name = self.dev.ns.name
        self.p(f'ip -net {ns_name} link add {self.dev.name} '
               f'type {self.REF} table {self._vrf_id}')

        if self._default_unreach:
            self.p(f'ip -net {ns_name} route add vrf {self.name} unreachable '
                   f'default metric 4278198272')

        self.dev.render_bash()

        for p in self.dev.ports:
            self.p(f'ip -net {ns_name} link set {p.name} '
                   f'master {self.dev.name}')
