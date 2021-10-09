# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument
# pylint: disable=unbalanced-tuple-unpacking
import pytest
from conftest import ns_cmd
from dev.tests.common.utils import deploy_yaml


FEATURES = [
    ('rx', 'rx-checksumming'),
    ('tx', 'tx-checksumming'),
    ('tso', 'tcp-segmentation-offload'),
    ('sg', 'scatter-gather'),
    ('gso', 'generic-segmentation-offload'),
    ('gro', 'generic-receive-offload'),
    ('rxvlan', 'rx-vlan-offload'),
    ('txvlan', 'tx-vlan-offload'),
]


@pytest.mark.parametrize('feature,featurek', FEATURES)
def test_features(feature, featurek, cleanup_nets):
    NS1_NAME = 'test_feature1'
    NS2_NAME = 'test_feature2'
    VETH_NAME = 'test'
    YAML_TMPL = '''
items:
  - netns:
      name: %(ns1)s

  - netns:
      name: %(ns2)s

  - veth:
      name: %(veth)s
      dev1:
        netns: netns.%(ns1)s
        ethtool:
          %(feature)s: on
      dev2:
        netns: netns.%(ns2)s
        ethtool:
          %(feature)s: off
'''

    t = YAML_TMPL % {'ns1': NS1_NAME, 'ns2': NS2_NAME, 'veth': VETH_NAME,
                     'feature': feature}

    deploy_yaml(t)

    def _get_feature(ns, dev):
        output = ns_cmd(ns, 'ethtool', '-k', dev).stdout.decode()
        s = next((line for line in output.split('\n') if featurek in line))
        return s.split(':')[1].strip()

    assert _get_feature(NS1_NAME, f'{VETH_NAME}.dev1') == 'on'
    assert _get_feature(NS2_NAME, f'{VETH_NAME}.dev2') == 'off'
