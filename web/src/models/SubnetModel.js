import { ObjModel } from './ObjModel.js'

export default class SubnetModel extends ObjModel {
  constructor(id, name, type, cidr) {
    super(id, name, type);
    this.desc = `
Subnet items represent IPv4/IPv6 address blocks.
Addresses for network interfaces are allocated from their
assigned subnet items
`;
    this.cidr = cidr;
  }

  static listToDict(getDictIdbyId, subnets) {
    return subnets.map((s) => getDictIdbyId(s)).filter((o) => (o));
  }

  static listFromDict(getIdByDictId, subnets) {
    return subnets.map((s) => getIdByDictId(s));
  }

  toDict() {
    if (!this.cidr)
      return null;

    return {name: this.name, cidr: this.cidr};
  }

  static fromDict(type, params) {
    return new SubnetModel(null, params.name, type, params.cidr);
  }
}
