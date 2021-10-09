import { ObjModel } from './ObjModel.js';

export default class XfrmTransportModel extends ObjModel {
  constructor(id, name, type, link1, link2) {
    super(id, name, type, true);
    this.desc = `
XFRM transport encrypts traffic flowing between different network devices
`;
    this.link1 = link1;
    this.link2 = link2;
  }

  toDict(getDictIdbyId) {
    const link1 = this.link1 ? getDictIdbyId(this.link1) : null;
    const link2 = this.link2 ? getDictIdbyId(this.link2) : null;

    if (!link1 || !link2)
      return null;

    return {
      name: this.name,
      link1: link1,
      link2: link2,
    };
  }

  resolve(getIdByDictId) {
    if (this.link1)
      this.link1 = getIdByDictId(this.link1);
    if (this.link2)
      this.link2 = getIdByDictId(this.link2);
  }

  static fromDict(type, params) {
    return new XfrmTransportModel(null, params.name, type, params.link1,
      params.link2);
  }
}
