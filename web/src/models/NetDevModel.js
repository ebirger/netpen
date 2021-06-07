import { ObjModel } from './ObjModel.js';
import NetDevParamsModel from './NetDevParamsModel.js';

export default class NetDevModel extends ObjModel {
  constructor(id, name, type, devparams) {
    super(id, name, type);
    const bp = NetDevModel.baseDevParams(this);
    this.devparams = devparams || bp;
    this.devparams.name = ObjModel.devName(name);
    this.devparams.id = this.devId();
  }

  static baseDevParams(item) {
    return NetDevParamsModel.fromItem(item);
  }

  getL2Devs() {
    return [this.devparams];
  }

  toDict(getDictIdbyId) {
    let ret = { name: this.name };

    if (this.devparams)
      ret = {...ret, ...this.devparams.toDict(getDictIdbyId)};

    return ret;
  }

  resolve(getIdByDictId) {
    this.devparams.resolve(getIdByDictId);
  }
}
