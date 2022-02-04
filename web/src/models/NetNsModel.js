import {ObjModel} from './ObjModel.js'

export default class NetNsModel extends ObjModel {
  constructor(id, name, type, netserver, forwarding, enableLo) {
    super(id, name, type, true);
    this.desc = `
Network namespaces are isolated copies of the network stack, each with its
own set of network interfaces, routes, firewall rules, etc.
`;
    this.netserver = netserver;
    if (forwarding === undefined)
      this.forwarding = true;
    else
      this.forwarding = forwarding;
    this.enableLo = enableLo;
  }

  toDict() {
    let ret = {name: this.name};

    if (this.netserver)
      ret.netserver = true;

    if (this.forwarding === false)
      ret.forwarding = true;

    if (this.enableLo)
      ret.enable_lo = true;

    return ret;
  }

  static fromDict(type, params) {
    return new NetNsModel(null, params.name, type, params.netserver,
      params.forwarding, params.enable_lo);
  }
}
