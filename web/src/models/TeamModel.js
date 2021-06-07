import { ObjModel } from './ObjModel.js'
import NetDevParamsModel from './NetDevParamsModel.js'
import MasterDevModel from './MasterDevModel.js';

export default class TeamModel extends MasterDevModel {
  constructor(id, name, type, ports, mode, devparams) {
    super(id, name, type, ports, devparams);
    this.mode = mode;
  }

  toDict(getDictIdbyId) {
    let ret = super.toDict(getDictIdbyId);
    if (!ret)
      return null;

    if (this.mode)
      ret.mode = this.mode;
    return ret;
  }

  static fromDict(type, params) {
    const name = ObjModel.devName(params.name);
    const devparams = NetDevParamsModel.fromDict(type, name, params);

    return new TeamModel(null, params.name, type, params.ports, params.mode,
      devparams);
  }
}
