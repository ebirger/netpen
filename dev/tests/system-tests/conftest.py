# pylint: disable=redefined-outer-name
import subprocess
import ipaddress
import json
import yaml
import pytest
from dev.tests.common.utils import EXAMPLES_OUTPUT_DIR, EXAMPLES_DIR
from dev.tests.common.utils import examples_output_dir  # pylint: disable=unused-import


DEF_SUBNET_NAME = 'default'


def kill_all_netns():
    subprocess.run(['sudo', 'ip', '-all', 'netns', 'delete'], check=False)


def load_example(name):
    with open('%s/%s.yml' % (EXAMPLES_DIR, name)) as f:
        return yaml.safe_load(f)


def modprobe(module):
    try:
        subprocess.run(['sudo', 'modprobe', module], check=True)
        return True
    except subprocess.CalledProcessError:
        return False


@pytest.fixture(scope='function')
def cleanup_nets():
    try:
        yield None
    finally:
        kill_all_netns()


def deploy_script(s):
    subprocess.run(['sudo', '%s/%s' % (EXAMPLES_OUTPUT_DIR, s)], check=True)


def ns_cmd(ns, *args):
    cmd = ['sudo', 'ip', 'netns', 'exec', ns] + list(args)
    return subprocess.run(cmd, check=True, capture_output=True)


def ip_cmd(ns, *args, use_json=True):
    cmd = ['sudo', 'ip']
    if use_json:
        cmd += ['-j']
    cmd += ['-net', ns] + list(args)
    o = subprocess.run(cmd, check=True, capture_output=True)
    return json.loads(o.stdout) if use_json else o.stdout


def get_ns_addrs(ns):
    addrs_raw = ip_cmd(ns, 'address')
    return ['%s/%s' % (a['local'], a['prefixlen'])
            for addr_raw in addrs_raw
            for a in addr_raw.get('addr_info', [])]


def is_in_net(net, addr):
    return ipaddress.ip_address(addr.split('/')[0]) in net


def get_subnets(example_name, *subnet_names):
    example = load_example(example_name)
    ret = []
    for sname in subnet_names:
        s = next(s['subnet'] for s in example['items']
                 if 'subnet' in s and s['subnet']['name'] == sname)
        ret.append(ipaddress.ip_network(s['cidr']))
    return ret


def get_subnet(example_name, subnet_name):
    return get_subnets(example_name, subnet_name)[0]


def get_ns_addr_in_subnet(ns, subnet):
    a = next((a for a in get_ns_addrs(ns) if is_in_net(subnet, a)))
    anet = ipaddress.ip_network(a, strict=False)
    return a.split('/')[0], anet


def ping(ns, target):
    print(ns_cmd(ns, 'ping', '-c', '1', '-n', '-q', target))


def get_route_dev(ns, dst):
    return ip_cmd(ns, 'route', 'get', dst)[0]['dev']


def get_xfrm_packet_counts(ns):
    # ip xfrm doesn't support json yet so have to parse this ugliness
    state = ip_cmd(ns, '-s', 'xfrm', 'state', use_json=False).decode()
    ret = []
    saw_lifetime_current = False
    for line in state.split('\n'):
        if saw_lifetime_current:
            _bytes_raw, packets_raw = line.strip().split(', ', 2)
            ret.append(int(packets_raw.split('(', 1)[0]))
            saw_lifetime_current = False
        if 'lifetime current' in line.strip():
            saw_lifetime_current = True
    return ret
