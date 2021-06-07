import NetNsModel from './/NetNsModel.js';
import VethModel from './VethModel.js';
import VlanModel from './VlanModel.js';
import MacVlanModel from './MacVlanModel.js';
import SubnetModel from './SubnetModel.js';
import TunnelModel from './TunnelModel.js';
import BridgeModel from './BridgeModel.js';
import TeamModel from './TeamModel.js';
import DummyModel from './DummyModel.js';
import VrfModel from './VrfModel.js';
import XfrmTransportModel from './XfrmTransportModel.js';
import { getItemById } from './ObjModel.js'; 

export const objModels = {
  netns: NetNsModel,
  veth: VethModel,
  vlan: VlanModel,
  macvlan: MacVlanModel,
  subnet: SubnetModel,
  bridge: BridgeModel,
  team: TeamModel,
  tunnel: TunnelModel,
  dummy: DummyModel,
  vrf: VrfModel,
  xfrm_transport: XfrmTransportModel,
};

export function loadObjList(l) {
  let o = {};

  l.items.forEach((v) => {
    const type = Object.keys(v)[0];
    const params = v[type];
    const val = objModels[type].fromDict(type, params);
    o[val.id] = val;
  });

  function getIdByDictId(dictId) {
    let m = Object.values(o).find((o) => (o.dictId() === dictId));
    if (m)
      return m.id;
    const tokens = dictId.split('.');
    const base = tokens.slice(0, -1).join('.')
    m = Object.values(o).find((o) => (o.dictId() === base));
    if (m)
      return `${tokens[tokens.length - 1]}@${m.id}`;
    return null;
  }

  Object.values(o).forEach((v) => {
    v.resolve(getIdByDictId, (id) => getItemById(o, id));
  });
  return o;
}
