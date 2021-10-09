import { ObjModel } from './ObjModel.js';
import NetDevParamsModel from './NetDevParamsModel.js';

export default class VethModel extends ObjModel {
  constructor(id, name, type, devparams1, devparams2) {
    super(id, name, type);
    this.desc = `
Veth devices are pairs of virtual Ethernet devices. Traffic sent to one device
is received on the other and vice-versa.
Each device can reside in a different network namespace
`;
    const [bp1, bp2] = VethModel.baseDevParams(this);
    this.devparams1 = devparams1 || bp1;
    this.devparams2 = devparams2 || bp2;
    this.devparams1.name = `${this.name}.dev1`;
    this.devparams2.name = `${this.name}.dev2`;
    this.devparams1.id = `dev1@${this.id}`;
    this.devparams2.id = `dev2@${this.id}`;
  }

  static baseDevParams(item) {
    return [
      new NetDevParamsModel(null, `${item.name}.dev1`, item.type),
      new NetDevParamsModel(null, `${item.name}.dev2`, item.type)
    ];
  }

  getL2Devs() {
    return [this.devparams1, this.devparams2];
  }

  toDict(getDictIdbyId) {
    if (!this.devparams1 || !this.devparams2)
      return null;

    let p1 = this.devparams1.toDict(getDictIdbyId);
    let p2 = this.devparams2.toDict(getDictIdbyId);

    if (!p1 || !p1.netns || !p2 || !p2.netns)
      return null;

    return {
      name: this.name,
      dev1: p1,
      dev2: p2,
    };
  }

  resolve(getIdByDictId) {
    this.devparams1.resolve(getIdByDictId);
    this.devparams2.resolve(getIdByDictId);
  }

  static fromDict(type, params) {
    const name = params.name;
    const devparams1 = NetDevParamsModel.fromDict(type, `${name}.dev1`,
      params.dev1);
    const devparams2 = NetDevParamsModel.fromDict(type, `${name}.dev2`,
      params.dev2);

    return new VethModel(null, params.name, type, devparams1, devparams2);
  }
}
