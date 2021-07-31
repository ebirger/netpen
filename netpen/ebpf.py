from .topology import TopologyMember


class EbpfProg(TopologyMember):
    REF = 'ebpfprog'
    SCHEMA = {
        'type': 'object',
        'additionalProperties': False,
        'required': ['name', 'code'],
        'properties': {
            'name': {'type': 'string'},
            'kernel_source_dir': {'type': 'string'},
            'code': {'type': 'string'}
        }
    }
    SUBGRAPH = 'eBPF Programs'

    def __init__(self, topology, name, code):
        super().__init__(topology, name)
        self.code = code
        self._bash_ebpf_dirname_var = '%s_ebpf_dirname' % self.name
        self.bash_ebpf_var = '%s_ebpf_dst' % self.name

    @classmethod
    def bash_preamble(cls, topology):
        hf = '/sys/kernel/kheaders.tar.xz'
        topology.printfn('[ ! -f %s ] && modprobe kheaders' % hf)
        topology.printfn('hdrs_dir=$(mktemp -d)')
        topology.printfn('pushd "$hdrs_dir" && tar -xf %s && popd' % hf)

    @classmethod
    def from_params(cls, topology, params):
        return cls(topology, params['name'], params['code'])

    def render_bash(self):
        self.p('%s=$(mktemp -d)' % self._bash_ebpf_dirname_var)
        self.p('%s_ebpf_src="$%s/%s.c"' % (self.name,
                                           self._bash_ebpf_dirname_var,
                                           self.name))
        self.p('%s="$%s/%s.o"' % (self.bash_ebpf_var,
                                  self._bash_ebpf_dirname_var,
                                  self.name))
        self.p('cat > "$%s_ebpf_src" << "EOF"' % self.name)
        self.p(self.code)
        self.p('EOF\n\n')

        self.p('cat > "$%s/fixup.h" << "EOF"' % self._bash_ebpf_dirname_var)
        self.p('#include <linux/types.h>')
        self.p('#ifdef asm_inline')
        self.p('#undef asm_inline')
        self.p('#define asm_inline asm')
        self.p('#endif')
        self.p('#define volatile(x...) volatile("")')
        self.p('EOF\n\n')

        self.p('clang -nostdinc \\\n'
               '  -isystem /usr/lib/gcc/x86_64-linux-gnu/9/include \\\n'
               '  -I"$hdrs_dir"/arch/x86/include \\\n'
               '  -I"$hdrs_dir"/arch/x86/include/generated \\\n'
               '  -I"$hdrs_dir"/include \\\n'
               '  -I"$hdrs_dir"/arch/x86/include/uapi \\\n'
               '  -I"$hdrs_dir"/arch/x86/include/generated/uapi \\\n'
               '  -I"$hdrs_dir"/include/uapi \\\n'
               '  -I"$hdrs_dir"/include/generated/uapi \\\n'
               '  -include "$hdrs_dir"/include/linux/kconfig.h \\\n'
               '  -include "$%s/fixup.h" \\\n'
               '  -fno-stack-protector \\\n'
               '  -D__KERNEL__ -D__BPF_TRACING__ -Wno-unused-value \\\n'
               '  -Wno-pointer-sign -D__TARGET_ARCH_x86 \\\n'
               '  -Wno-compare-distinct-pointer-types \\\n'
               '  -Wno-gnu-variable-sized-type-not-at-end \\\n'
               '  -Wno-address-of-packed-member -Wno-tautological-compare \\\n'
               '  -Wno-unknown-warning-option  \\\n'
               '  -O2 -emit-llvm -Xclang -disable-llvm-passes -c \\\n'
               '  "$%s_ebpf_src" -o - | \\\n'
               '  opt -O2 -mtriple=bpf-pc-linux | llvm-dis | \\\n'
               '  llc -march=bpf  -filetype=obj \\\n'
               '  -o "$%s"' % (self._bash_ebpf_dirname_var,
                               self.name, self.bash_ebpf_var))
        self.p('echo Built "$%s"' % self.bash_ebpf_var)

    @property
    def dotname(self):
        name = self.name.replace('.', '_')
        return '"ebpf_%s-%s_%s"' % (name, self.REF, name)

    def render_dot(self):
        label = '%s [eBPF]' % self.name
        self.p('%s [label="%s", shape=record]' % (self.dotname, label))
