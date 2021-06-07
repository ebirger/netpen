import {ObjModel} from './ObjModel.js'

export default class NetNsModel extends ObjModel {
  constructor(id, name, type, netserver, forwarding) {
    super(id, name, type, true);
    this.netserver = netserver;
    if (forwarding === undefined)
      this.forwarding = true;
    else
      this.forwarding = forwarding;
  }

  toDict() {
    let ret = {name: this.name, forwarding: this.forwarding};

    if (this.netserver)
      ret.netserver = true;

    return ret;
  }

  static fromDict(type, params) {
    return new NetNsModel(null, params.name, type, params.netserver,
      params.forwarding);
  }
}
