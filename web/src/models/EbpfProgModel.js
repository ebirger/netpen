import { ObjModel } from './ObjModel.js'

const defaultCode = `
#include <linux/bpf.h>

#define SEC(NAME) __attribute__((section(NAME), used))

SEC("prog")
int dropper(struct xdp_md *ctx) {
  return XDP_DROP;
}
`;

export default class EbpfProgModel extends ObjModel {
  constructor(id, name, type, code) {
    super(id, name, type);
    this.code = code || defaultCode;
  }

  toDict() {
    if (!this.code)
      return null;

    return {name: this.name, code: this.code};
  }

  static fromDict(type, params) {
    return new EbpfProgModel(null, params.name, type, params.code);
  }
}
