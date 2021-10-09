# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
# pylint: disable=unbalanced-tuple-unpacking
import subprocess
import pytest
from conftest import get_ns_addr_in_subnet, get_subnets, deploy_script
from conftest import ping, modprobe, ip_cmd, get_subnet, DEF_SUBNET_NAME
from dev.tests.common.utils import gen_examples  # pylint: disable=unused-import


@pytest.mark.skipif(not modprobe('vrf'), reason='Missing vrf support')
def test_vrf(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'vrf'

    deploy_script(f'{EXAMPLE_NAME}.sh')

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


@pytest.mark.skipif(not modprobe('kheaders'), reason='Missing kheaders support')
def test_xdp(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'xdp'

    deploy_script(f'{EXAMPLE_NAME}.sh')

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    xdp2incidr, _xdp2net = get_ns_addr_in_subnet('xdp2', subnet)

    # should fail as xdp program drops all traffix
    with pytest.raises(subprocess.CalledProcessError):
        ping('xdp1', xdp2incidr)

    # remove XDP dropper
    ip_cmd('xdp1', 'link', 'set', 'dev', 'veth1.dev1', 'xdp', 'off',
           use_json=False)

    # should work now
    ping('xdp1', xdp2incidr)
