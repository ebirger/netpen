# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
# pylint: disable=unbalanced-tuple-unpacking
import pytest
from conftest import get_ns_addr_in_subnet, get_subnets, deploy_script
from conftest import ping, modprobe
from dev.tests.common.utils import gen_examples  # pylint: disable=unused-import


@pytest.mark.skipif(not modprobe('vrf'), reason='Missing vrf support')
def test_vrf(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'vrf'

    deploy_script('%s.sh' % EXAMPLE_NAME)

    green_subnet, blue_subnet = get_subnets(EXAMPLE_NAME, 'green', 'blue')

    assert green_subnet == blue_subnet

    aingreen, anet = get_ns_addr_in_subnet('a', green_subnet)
    bingreen, bnet = get_ns_addr_in_subnet('b', green_subnet)
    cinblue, cnet = get_ns_addr_in_subnet('c', blue_subnet)
    dinblue, dnet = get_ns_addr_in_subnet('d', blue_subnet)

    assert anet != bnet
    assert cnet != dnet
    assert anet in (cnet, dnet)
    assert bnet in (cnet, dnet)

    ping('a', bingreen)
    ping('b', aingreen)
    ping('c', dinblue)
    ping('d', cinblue)
