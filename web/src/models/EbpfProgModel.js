import { ObjModel } from './ObjModel.js'

const defaultCode = {xdp: `#include <linux/bpf.h>

#define SEC(NAME) __attribute__((section(NAME), used))

SEC("prog")
int dropper(struct xdp_md *ctx) {
  return XDP_DROP;
}
`, tc: `#include <linux/bpf.h>
#include <linux/pkt_cls.h>

#define SEC(NAME) __attribute__((section(NAME), used))

SEC("tc")
int dropper(struct __sk_buff *skb) {
  return TC_ACT_SHOT;
}

char __license[] SEC("license") = "Dual MIT/GPL";
`};

export default class EbpfProgModel extends ObjModel {
  constructor(id, name, type, code, exampleType) {
    super(id, name, type);
    this.desc = `
eBPF programs allow injecting custom kernel functionality at different
hooking points.
Currently XDP/TC attachments are supported
`;
    this.exampleType = exampleType;
    this.setCode(code);
  }

  toDict() {
    return {name: this.name, code: this.getCode()};
  }

  setCode(code) {
    this.code = code;

    if (code == defaultCode.xdp) {
      this.code = undefined;
      this.exampleType = "xdp";
    } else if (code == defaultCode.tc) {
      this.code = undefined;
      this.exampleType = "tc";
    } else if (!code && !this.exampleType)
      this.exampleType = "xdp";
  }

  getCode() {
    return this.code ? this.code : defaultCode[this.exampleType];
  }

  isExample() {
    return !this.code || this.code == defaultCode[this.exampleType];
  }

  static fromDict(type, params) {
    return new EbpfProgModel(null, params.name, type, params.code);
  }
}
