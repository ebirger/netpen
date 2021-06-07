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
        key = '%s.%s' % (self.REF, self.name)
        self.topology.members['%s.dev' % key] = self.dev
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
        self.p('subgraph cluster_vrf_%s {' % self.name)
        self.p('label="%s [%s]"' % (self.name, self._vrf_id))
        self.p('style=dashed')
        self.p('%s;' % self.dev.dotname)
        for p in self.dev.ports:
            self.p('%s;' % p.dotname)
        self.p('}')
        self.topology.done_list.add(self)

    def render_bash(self):
        self.p('ip -net %s link add %s type %s table %s' % (self.dev.ns.name,
                                                            self.dev.name,
                                                            self.REF,
                                                            self._vrf_id))

        if self._default_unreach:
            self.p('ip -net %s route add vrf %s unreachable default metric '
                   '4278198272' % (self.dev.ns.name, self.name))

        self.dev.render_bash()

        for p in self.dev.ports:
            self.p('ip -net %s link set %s master %s' % (self.dev.ns.name,
                                                         p.name,
                                                         self.dev.name))
