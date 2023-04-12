import { ObjModel } from './ObjModel.js'
import SubnetModel from './SubnetModel.js';
import EthtoolModel from './EthtoolModel.js';

export default class NetDevParamsModel extends ObjModel {
  constructor(id, name, type, netns, subnets, mtu, ethtool, xdp, tc) {
    super(id, name, type);
    this.netns = netns;
    this.subnets = subnets;
    this.mtu = mtu;
    this.ethtool = ethtool;
    this.xdp = xdp;
    this.tc = tc;
  }

  toDict(getDictIdbyId) {
    let ret = {};
    if (this.netns) {
      const netns = getDictIdbyId(this.netns);
      if (netns)
        ret.netns = netns;
    }
    if (this.subnets)
      ret.subnets = SubnetModel.listToDict(getDictIdbyId, this.subnets);
    if (this.mtu)
      ret.mtu = parseInt(this.mtu, 10);

    const ethtool = this.ethtool ? this.ethtool.toDict() : null;
    if (ethtool)
      ret.ethtool = ethtool;
    if (this.xdp) {
      const xdp = getDictIdbyId(this.xdp);
      if (xdp)
        ret.xdp = xdp;
    }
    if (this.tc) {
      ret.tc = {};

      if (this.tc.tcIngress) {
        const prog = getDictIdbyId(this.tc.tcIngress);
        if (prog)
          ret.tc.ingress_prog = prog;
      }
      if (this.tc.tcEgress) {
        const prog = getDictIdbyId(this.tc.tcEgress);
        if (prog)
          ret.tc.egress_prog = prog;
      }
    }
    return ret;
  }

  resolve(getIdByDictId) {
    if (this.netns)
      this.netns = getIdByDictId(this.netns);

    if (this.xdp)
      this.xdp = getIdByDictId(this.xdp);

    if (this.tc) {
      if (this.tc.tcIngress)
        this.tc.tcIngress = getIdByDictId(this.tc.tcIngress);
      if (this.tc.tcEgress)
        this.tc.tcEgress = getIdByDictId(this.tc.tcEgress);
    }

    if (this.subnets)
      this.subnets = SubnetModel.listFromDict(getIdByDictId, this.subnets);
  }

  static fromItem(item) {
    return new NetDevParamsModel(`${item.id}.dev`, ObjModel.devName(item.name),
      item.type);
  }

  static fromDict(type, name, params) {
    const ethtool = params.ethtool ? new EthtoolModel(params.ethtool) : null;
    let tc = undefined;
    if (params.tc) {
      tc = {};
      tc.tcIngress = params.tc.ingress_prog;
      tc.tcEgress = params.tc.egress_prog;
    }
    return new NetDevParamsModel(null, name, type, params.netns, params.subnets,
      params.mtu, ethtool, params.xdp, tc);
  }
}
