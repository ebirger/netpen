# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
# pylint: disable=unbalanced-tuple-unpacking
import pytest
from conftest import get_ns_addr_in_subnet, get_subnet, get_subnets
from conftest import ping, modprobe, get_route_dev, get_xfrm_packet_counts
from conftest import deploy_script
from dev.tests.common.utils import gen_examples  # pylint: disable=unused-import


DEF_SUBNET_NAME = 'default'


def test_router(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'router'

    deploy_script('%s.sh' % EXAMPLE_NAME)

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    _aincidr, anet = get_ns_addr_in_subnet('a', subnet)
    bincidr, bnet = get_ns_addr_in_subnet('b', subnet)

    assert anet != bnet

    ping('a', bincidr)


def test_bridge(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'bridge'

    deploy_script('%s.sh' % EXAMPLE_NAME)

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    aincidr, anet = get_ns_addr_in_subnet('a', subnet)
    bincidr, bnet = get_ns_addr_in_subnet('b', subnet)
    brincidr, brnet = get_ns_addr_in_subnet('br', subnet)

    assert anet == bnet
    assert bnet == brnet

    ping('a', bincidr)
    ping('b', aincidr)
    ping('a', brincidr)
    ping('b', brincidr)


def test_vlan(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'vlan'

    deploy_script('%s.sh' % EXAMPLE_NAME)

    def_subnet, vlan_subnet = get_subnets(EXAMPLE_NAME, DEF_SUBNET_NAME, 'vlan')

    aincidr, anet = get_ns_addr_in_subnet('a', def_subnet)
    bincidr, bnet = get_ns_addr_in_subnet('b', def_subnet)

    avlan, avlannet = get_ns_addr_in_subnet('a', vlan_subnet)
    bvlan, bvlannet = get_ns_addr_in_subnet('b', vlan_subnet)

    assert anet == bnet
    assert avlannet == bvlannet

    assert get_route_dev('a', bincidr) == 'atob.dev1'
    assert get_route_dev('a', bvlan) == 'atob.dev1.15'

    assert get_route_dev('b', aincidr) == 'atob.dev2'
    assert get_route_dev('b', avlan) == 'atob.dev2.15'

    ping('a', bincidr)
    ping('a', bvlan)
    ping('b', aincidr)
    ping('b', avlan)


def test_macvlan(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'macvlan'

    deploy_script('%s.sh' % EXAMPLE_NAME)

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    _aincidr, anet = get_ns_addr_in_subnet('a', subnet)
    cincidr, cnet = get_ns_addr_in_subnet('c', subnet)
    dincidr, dnet = get_ns_addr_in_subnet('d', subnet)
    eincidr, enet = get_ns_addr_in_subnet('e', subnet)

    assert anet == cnet == dnet == enet

    ping('a', cincidr)
    ping('a', dincidr)
    ping('a', eincidr)


@pytest.mark.skipif(not modprobe('team'), reason='Missing team support')
def test_team(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'team'

    deploy_script('%s.sh' % EXAMPLE_NAME)

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    _aincidr, anet = get_ns_addr_in_subnet('a', subnet)
    bincidr, bnet = get_ns_addr_in_subnet('b', subnet)

    assert anet == bnet

    ping('a', bincidr)


def test_xfrm_transport(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'xfrm_transport'

    deploy_script('%s.sh' % EXAMPLE_NAME)

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    aincidr, anet = get_ns_addr_in_subnet('a', subnet)
    bincidr, bnet = get_ns_addr_in_subnet('b', subnet)

    assert anet == bnet

    ping('a', bincidr)
    ping('b', aincidr)
    assert get_xfrm_packet_counts('a') == [2, 2]
    assert get_xfrm_packet_counts('b') == [2, 2]
