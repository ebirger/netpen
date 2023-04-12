# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
# pylint: disable=unbalanced-tuple-unpacking
import subprocess
import pytest
from conftest import get_ns_addr_in_subnet, get_subnets, deploy_script
from conftest import ping, modprobe, ip_cmd, get_subnet, DEF_SUBNET_NAME
from conftest import get_devname_by_alias, tc_cmd
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


def test_xdp(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'xdp'

    deploy_script(f'{EXAMPLE_NAME}.sh')

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    xdp2incidr, _xdp2net = get_ns_addr_in_subnet('xdp2', subnet)

    # should fail as xdp program drops all traffix
    with pytest.raises(subprocess.CalledProcessError):
        ping('xdp1', xdp2incidr)

    # remove XDP dropper
    dev = get_devname_by_alias('xdp1', 'veth1.dev1')
    ip_cmd('xdp1', 'link', 'set', 'dev', dev, 'xdp', 'off',
           use_json=False)

    # should work now
    ping('xdp1', xdp2incidr)


def test_ebpf_tc_ingress(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'ebpf_tc_ingress'

    deploy_script(f'{EXAMPLE_NAME}.sh')

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    tc2incidr, _ = get_ns_addr_in_subnet('tc2', subnet)

    # should fail as tc program drops all traffix
    with pytest.raises(subprocess.CalledProcessError):
        ping('tc1', tc2incidr)

    # remove TC dropper
    dev = get_devname_by_alias('tc1', 'veth1.dev1')
    tc_cmd('tc1', 'filter', 'del', 'dev', dev, 'ingress', 'prio', '1',
           use_json=False)

    # should work now
    ping('tc1', tc2incidr)


def test_ebpf_tc_egress(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'ebpf_tc_egress'

    deploy_script(f'{EXAMPLE_NAME}.sh')

    subnet = get_subnet(EXAMPLE_NAME, DEF_SUBNET_NAME)

    tc2incidr, _ = get_ns_addr_in_subnet('tc2', subnet)

    # should fail as tc program drops all traffix
    with pytest.raises(subprocess.CalledProcessError):
        ping('tc1', tc2incidr)

    # remove TC dropper
    dev = get_devname_by_alias('tc1', 'veth1.dev1')
    tc_cmd('tc1', 'filter', 'del', 'dev', dev, 'egress', 'prio', '1',
           use_json=False)

    # should work now
    ping('tc1', tc2incidr)


def test_vxlan_bridge(gen_examples, cleanup_nets):
    EXAMPLE_NAME = 'vxlan_bridge'

    deploy_script(f'{EXAMPLE_NAME}.sh')

    def_subnet, overlay_subnet = get_subnets(EXAMPLE_NAME, 'default', 'overlay')

    assert def_subnet != overlay_subnet

    z1_in_o, z1_o_net = get_ns_addr_in_subnet('zone1', overlay_subnet)
    z2_in_o, z2_o_net = get_ns_addr_in_subnet('zone2', overlay_subnet)
    br_in_o, br_o_net = get_ns_addr_in_subnet('br', overlay_subnet)

    assert z1_o_net == z2_o_net == br_o_net

    ping('zone1', z2_in_o)
    ping('zone1', br_in_o)
    ping('zone2', br_in_o)
    ping('br', z1_in_o)
