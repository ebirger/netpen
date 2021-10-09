import { ObjModel } from './ObjModel.js'
import NetDevParamsModel from './NetDevParamsModel.js'
import MasterDevModel from './MasterDevModel.js';

export default class BridgeModel extends MasterDevModel {
  constructor(id, name, type, ports, devparams) {
    super(id, name, type, ports, devparams);
    this.desc = `
Bridge devices creates a single layer 2 network from multiple devices (ports)
`;
  }
  static fromDict(type, params) {
    const name = ObjModel.devName(params.name);
    const devparams = NetDevParamsModel.fromDict(type, name, params);

    return new BridgeModel(null, params.name, type, params.ports, devparams);
  }
}
