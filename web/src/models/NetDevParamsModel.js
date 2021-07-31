import { ObjModel } from './ObjModel.js'
import SubnetModel from './SubnetModel.js';
import EthtoolModel from './EthtoolModel.js';

export default class NetDevParamsModel extends ObjModel {
  constructor(id, name, type, netns, subnets, mtu, ethtool, xdp) {
    super(id, name, type);
    this.netns = netns;
    this.subnets = subnets;
    this.mtu = mtu;
    this.ethtool = ethtool;
    this.xdp = xdp;
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
    return ret;
  }

  resolve(getIdByDictId) {
    if (this.netns)
      this.netns = getIdByDictId(this.netns);

    if (this.xdp)
      this.xdp = getIdByDictId(this.xdp);

    if (this.subnets)
      this.subnets = SubnetModel.listFromDict(getIdByDictId, this.subnets);
  }

  static fromItem(item) {
    return new NetDevParamsModel(`${item.id}.dev`, ObjModel.devName(item.name),
      item.type);
  }

  static fromDict(type, name, params) {
    const ethtool = params.ethtool ? new EthtoolModel(params.ethtool) : null;
    return new NetDevParamsModel(null, name, type, params.netns, params.subnets,
      params.mtu, ethtool, params.xdp);
  }
}
