from .builders import add_builder
from .veth import Veth
from .xfrm import XfrmTransport
from .tunnel import Tunnel
from .netns import NetNs
from .subnet import Subnet
from .vlan import Vlan
from .dummy import Dummy
from .macvlan import MacVlan
from .bridge import Bridge
from .team import Team
from .vrf import Vrf
from .ebpf import EbpfProg


add_builder(EbpfProg, 0)
add_builder(NetNs, 1)
add_builder(Subnet, 2)
add_builder(Veth, 3)
add_builder(Vlan, 4)
add_builder(MacVlan, 4)
add_builder(Dummy, 4)
add_builder(Team, 5)
add_builder(Bridge, 5)
add_builder(Vrf, 5)
add_builder(Tunnel, 6)
add_builder(XfrmTransport, 6)
