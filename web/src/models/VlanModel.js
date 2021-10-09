import { ObjModel } from './ObjModel.js';
import NetDevParamsModel from './NetDevParamsModel.js';
import NetDevModel from './NetDevModel.js';

export default class VlanModel extends NetDevModel {
  constructor(id, name, type, link, tag, devparams) {
    super(id, name, type, devparams);
    this.desc = `
VLAN devices implement 802.1q tagging
`;
    this.link = link;
    this.tag = tag;
  }

  toDict(getDictIdbyId) {
    if (!this.link || !this.tag)
      return null;

    const linkDictId = getDictIdbyId(this.link);
    if (!linkDictId)
      return null;

    let ret = super.toDict(getDictIdbyId);
    if (!ret)
      return null;

    ret.link = linkDictId;
    ret.tag = parseInt(this.tag, 10);
    return ret;
  }

  resolve(getIdByDictId) {
    super.resolve(getIdByDictId);
    if (this.link)
      this.link = getIdByDictId(this.link);
  }

  static fromDict(type, params) {
    const name = ObjModel.devName(params.name);
    const devparams = NetDevParamsModel.fromDict(type, name, params);

    return new VlanModel(null, params.name, type, params.link, params.tag,
      devparams);
  }
}
