export const Types = [
  {
    value: 'netns',
    label: 'Network Namespace',
  },
  {
    value: 'subnet',
    label: 'Subnet',
  },
  {
    value: 'veth',
    label: 'Veth',
  },
  {
    value: 'tunnel',
    label: 'Tunnel Device',
  },
  {
    value: 'vlan',
    label: 'VLAN',
  },
  {
    value: 'bridge',
    label: 'Bridge',
  },
  {
    value: 'macvlan',
    label: 'MacVlan',
  },
  {
    value: 'team',
    label: 'Team',
  },
  {
    value: 'dummy',
    label: 'Dummy Device',
  },
  {
    value: 'vrf',
    label: 'VRF',
  },
  {
    value: 'xfrm_transport',
    label: 'XFRM Transport',
  },
  {
    value: 'ebpfprog',
    label: 'eBPF Program',
  },
];

export function GetTypeName(type) {
  let t;
  for (t in Types) {
    if (Types[t].value === type)
      return Types[t].label;
  }
  return null;
}
