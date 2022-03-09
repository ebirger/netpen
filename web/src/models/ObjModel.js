export class ObjModel {
  constructor(id, name, type) {
    this.name = name;
    this.type = type;
    this.id = id || this.genId();
  }

  displayName() {
    return `${this.type}.${this.name}`;
  }

  genId() {
    /* Must not be parsable to int otherwise insertion order isn't keps */
    return `id-${Math.floor(Math.random() * 65536).toString()}`;
  }

  dictId() {
    return `${this.type}.${this.name}`;
  }

  resolve() {
  }

  static devName(name) {
    return `${name}.dev`;
  }

  devId() {
    return `dev@${this.id}`;
  }

  getL2Devs() {
    return null;
  }

  getL3Devs() {
    const l2 = this.getL2Devs();
    if (!l2)
      return [];
    return l2.filter((o) => (o.subnets && o.subnets.length > 0));
  }

  toDict() {
    return null;
  }

  static fromDict(type, params) {
    return new ObjModel(null, params.name, type);
  }
}

export function serializeObjList(objlist) {
  let items = [];

  function getDictIdbyId(id) {
    const elems = id.split('@');
    if (elems.length == 1)
      return objlist[id] ? objlist[id].dictId() : null;
    let base = objlist[elems[1]];
    if (!base)
      return null;
    base = base.dictId()
    return `${base}.${elems[0]}`;
  }

  for (const value of Object.values(objlist)) {
    let o = {};
    let v = value.toDict(getDictIdbyId);
    if (v == null)
      continue;

    o[value.type] = v;
    items = items.concat(o);
  }

  return items;
}

export function getObjsByType(objlist, type) {
  return Object.values(objlist).filter((o) => (o.type === type));
}

export function getL3Devs(objlist) {
  let o = [];

  for (const value of Object.values(objlist)) {
    const l3 = value.getL3Devs();

    if (l3)
      o = o.concat(l3);
  }

  return o;
}

export function getL2Devs(objlist) {
  let o = [];

  for (const value of Object.values(objlist)) {
    let d = value.getL2Devs();

    if (d)
      o = o.concat(d);
  }

  return o;
}

export function getItemById(objlist, id) {
  const elems = id.split('@');
  if (elems.length == 1)
    return objlist[id];
  const m = objlist[elems[1]];
  if (!m)
    return null;
  switch (elems[0]) {
  case 'dev':
    return m.devparams;
  case 'dev1':
    return m.devparams1;
  case 'dev2':
    return m.devparams2;
  }
  return null;
}
