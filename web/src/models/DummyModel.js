import NetDevParamsModel from './NetDevParamsModel.js';
import NetDevModel from './NetDevModel.js';

export default class DummyModel extends NetDevModel {
  toDict(getDictIdbyId) {
    if (!this.devparams || !this.devparams.netns)
      return;

    return super.toDict(getDictIdbyId);
  }

  static fromDict(type, params) {
    const name = DummyModel.devName(params.name);
    const devparams = NetDevParamsModel.fromDict(type, name, params);

    return new DummyModel(null, params.name, type, devparams);
  }
}
