import { filterObject } from './utils.js';

export const EthtoolOptions = [
  {title: 'RX Checksumming', key: 'rx'},
  {title: 'TX Checksumming', key: 'tx'},
  {title: 'Scatter-gather', key: 'sg'},
  {title: 'TCP Segmentation Offload (TSO)', key: 'tso'},
  {title: 'Generic Segmentation Offload (GSO)', key: 'gso'},
  {title: 'Generic Receive Offload (GRO)', key: 'gro'},
  {title: 'RX VLAN acceleration', key: 'rxvlan'},
  {title: 'TX VLAN acceleration', key: 'txvlan'},
];

export default class EthtoolModel {
  constructor(options) {
    this.options = options;
  }

  toDict() {
    return filterObject(this.options, (k, v) => (v !== null));
  }
}
