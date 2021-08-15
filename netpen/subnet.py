import ipaddress
from .topology import TopologyMember


class Subnet(TopologyMember):
    REF = 'subnet'
    DESC = {'title': 'IPv4 Subnet'}
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name'],
        'properties': {
            'name': {'type': 'string'},
            'cidr': {'type': 'string'}
        }
    }

    def __init__(self, topology, name, cidr):
        super().__init__(topology, name)
        self.net = ipaddress.ip_network(cidr, strict=False)
        self.topology.ipam.add_subnet(self)

    @property
    def cidr(self):
        return str(self.net)

    @classmethod
    def from_params(cls, topology, params):
        return cls(topology, params['name'], params['cidr'])
