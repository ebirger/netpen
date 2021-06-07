import NetDevModel from './NetDevModel.js';

export default class MasterDevModel extends NetDevModel {
  constructor(id, name, type, ports, devparams) {
    super(id, name, type, devparams);
    this.ports = ports;
    this.portsAttr = 'ports';
  }

  toDict(getDictIdbyId) {
    if (!this.ports || !this.devparams.netns)
      return null;

    let ret = super.toDict(getDictIdbyId);
    if (!ret)
      return null;

    if (this.ports) {
      ret[this.portsAttr] = this.ports.map(
        (p) => getDictIdbyId(p)).filter((p) => p);
    }
    return ret;
  }

  resolve(getIdByDictId) {
    super.resolve(getIdByDictId);
    if (this.ports)
      this.ports = this.ports.map((p) => getIdByDictId(p));
  }
}
