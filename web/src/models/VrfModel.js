import { ObjModel } from './ObjModel.js'
import NetDevParamsModel from './NetDevParamsModel.js'
import MasterDevModel from './MasterDevModel.js';

export default class VrfModel extends MasterDevModel {
  constructor(id, name, type, ports, default_unreach, devparams) {
    super(id, name, type, ports, devparams);
    this.desc = `
VRFs allow creating different layer 3 routing domains within a single
network namespace
`;
    this.portsAttr = 'members';
    if (default_unreach === undefined)
      this.default_unreach = true;
    else
      this.default_unreach = default_unreach;
  }

  toDict(getDictIdbyId) {
    let ret = super.toDict(getDictIdbyId);
    if (!ret)
      return null;

    if (this.default_unreach === false)
      ret.add_default_unreach = this.default_unreach;
    return ret;
  }

  static fromDict(type, params) {
    const name = ObjModel.devName(params.name);
    const devparams = NetDevParamsModel.fromDict(type, name, params);
    const def_unreach = params.add_default_unreach

    return new VrfModel(null, params.name, type, params.members, def_unreach,
      devparams);
  }
}
