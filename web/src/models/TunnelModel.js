import { ObjModel } from './ObjModel.js';
import NetDevParamsModel from './NetDevParamsModel.js';
import SubnetModel from './SubnetModel.js';

export const TunnelTypes = [
  {
    value: 'ipip',
    label: 'IPIP'
  },
  {
    value: 'ip6tnl',
    label: 'IPIP6'
  },
  {
    value: 'vxlan',
    label: 'VXLAN'
  },
  {
    value: 'gre',
    label: 'GRE'
  },
  {
    value: 'wireguard',
    label: 'Wireguard'
  },
  {
    value: 'xfrm',
    label: 'XFRM'
  },
  {
    value: 'l2tp',
    label: 'L2TP'
  }
];

export const XfrmTunnelModes = [
  {
    value: 'xfrm',
    label: 'XFRM Interface'
  },
  {
    value: 'vti',
    label: 'VTI'
  },
  {
    value: 'vti6',
    label: 'VTI6'
  },
];

export default class TunnelModel extends ObjModel {
  constructor(id, name, type, mode, subnets, link1, link2, dev1Mode, dev2Mode,
    getItemById) {
    super(id, name, type);
    this.desc = `
Tunnel devices implement virtual networks on top of other networks
`;
    this.mode = mode;
    this.subnets = subnets;
    this.link1 = link1;
    this.link2 = link2;
    let ns1 = null;
    let ns2 = null;
    this.dev1Mode = dev1Mode || XfrmTunnelModes[0].value;
    this.dev2Mode = dev2Mode || XfrmTunnelModes[0].value;
    if (getItemById) {
      if (link1) {
        const o = getItemById(link1);
        ns1 = o ? o.netns : null;
      }
      if (link2) {
        const o = getItemById(link2);
        ns2 = o ? o.netns : null;
      }
    }
    this.devparams1 = new NetDevParamsModel(null, `${name}.dev1`, type, ns1,
      this.subnets, undefined);
    this.devparams2 = new NetDevParamsModel(null, `${name}.dev2`, type, ns2,
      this.subnets, undefined);
    this.devparams1.id = `dev1@${this.id}`
    this.devparams2.id = `dev2@${this.id}`
  }

  getL2Devs() {
    if (this.mode !== 'vxlan' && this.mode !== 'l2tp')
      return null;

    return [this.devparams1, this.devparams2];
  }

  toDict(getDictIdbyId) {
    if (!this.mode || !this.subnets || !this.link1 || !this.link2)
      return null;

    const link1 = getDictIdbyId(this.link1);
    const link2 = getDictIdbyId(this.link2);

    if (!link1 || !link2)
      return null;

    let ret = {
      name: this.name,
      mode: this.mode,
      subnets: SubnetModel.listToDict(getDictIdbyId, this.subnets),
      link1: link1,
      link2: link2,
    };
    if (this.mode == 'xfrm') {
      ret.dev1 = { mode: this.dev1Mode };
      ret.dev2 = { mode: this.dev2Mode };
    }
    return ret;
  }

  resolve(getIdByDictId, getItemById) {
    if (this.subnets)
      this.subnets = SubnetModel.listFromDict(getIdByDictId, this.subnets);
    if (this.link1) {
      this.link1 = getIdByDictId(this.link1);
      this.devparams1.netns = getItemById(this.link1).netns;
    }
    if (this.link2) {
      this.link2 = getIdByDictId(this.link2);
      this.devparams2.netns = getItemById(this.link2).netns;
    }
  }

  static fromDict(type, params) {
    const dev1Mode = params.dev1 ? params.dev1.mode : null;
    const dev2Mode = params.dev2 ? params.dev2.mode : null;
    return new TunnelModel(null, params.name, type, params.mode, params.subnets,
      params.link1, params.link2, dev1Mode, dev2Mode);
  }
}
