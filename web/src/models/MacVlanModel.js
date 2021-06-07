import NetDevParamsModel from './NetDevParamsModel.js';
import NetDevModel from './NetDevModel.js';

export default class MacVlanModel extends NetDevModel {
  constructor(id, name, type, link, devparams) {
    super(id, name, type, devparams);
    this.link = link;
  }

  toDict(getDictIdbyId) {
    const linkDictId = this.link ? getDictIdbyId(this.link) : null;

    if (!linkDictId)
      return null;

    let ret = super.toDict(getDictIdbyId);
    if (!ret)
      return null;

    ret.link = linkDictId;
    return ret;
  }

  resolve(getIdByDictId) {
    super.resolve(getIdByDictId);
    if (this.link)
      this.link = getIdByDictId(this.link);
  }

  static fromDict(type, params) {
    const name = MacVlanModel.devName(params.name);
    const devparams = NetDevParamsModel.fromDict(type, name, params);

    return new MacVlanModel(null, params.name, type, params.link, devparams);
  }
}
