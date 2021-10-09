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
        self._bash_ebpf_dirname_var = f'{self.name}_ebpf_dirname'
        self.bash_ebpf_var = f'{self.name}_ebpf_dst'

    @classmethod
    def bash_preamble(cls, topology):
        hf = '/sys/kernel/kheaders.tar.xz'
        topology.printfn(f'[ ! -f {hf} ] && modprobe kheaders')
        topology.printfn('hdrs_dir=$(mktemp -d)')
        topology.printfn(f'pushd "$hdrs_dir" && tar -xf {hf} && popd')

    @classmethod
    def from_params(cls, topology, params):
        return cls(topology, params['name'], params['code'])

    def render_bash(self):
        dirname_var = self._bash_ebpf_dirname_var
        self.p(f'{dirname_var}=$(mktemp -d)')
        self.p(f'{self.name}_ebpf_src="${dirname_var}/{self.name}.c"')
        self.p(f'{self.bash_ebpf_var}="${dirname_var}/{self.name}.o"')
        self.p(f'cat > "${self.name}_ebpf_src" << "EOF"')
        self.p(self.code)
        self.p('EOF\n\n')

        self.p(f'cat > "${dirname_var}/fixup.h" << "EOF"')
        self.p('#include <linux/types.h>')
        self.p('#ifdef asm_inline')
        self.p('#undef asm_inline')
        self.p('#define asm_inline asm')
        self.p('#endif')
        self.p('#define volatile(x...) volatile("")')
        self.p('EOF\n\n')

        self.p(f'clang -nostdinc \\\n'
               f'  -isystem /usr/lib/gcc/x86_64-linux-gnu/9/include \\\n'
               f'  -I"$hdrs_dir"/arch/x86/include \\\n'
               f'  -I"$hdrs_dir"/arch/x86/include/generated \\\n'
               f'  -I"$hdrs_dir"/include \\\n'
               f'  -I"$hdrs_dir"/arch/x86/include/uapi \\\n'
               f'  -I"$hdrs_dir"/arch/x86/include/generated/uapi \\\n'
               f'  -I"$hdrs_dir"/include/uapi \\\n'
               f'  -I"$hdrs_dir"/include/generated/uapi \\\n'
               f'  -include "$hdrs_dir"/include/linux/kconfig.h \\\n'
               f'  -include "${dirname_var}/fixup.h" \\\n'
               f'  -fno-stack-protector \\\n'
               f'  -D__KERNEL__ -D__BPF_TRACING__ -Wno-unused-value \\\n'
               f'  -Wno-pointer-sign -D__TARGET_ARCH_x86 \\\n'
               f'  -Wno-compare-distinct-pointer-types \\\n'
               f'  -Wno-gnu-variable-sized-type-not-at-end \\\n'
               f'  -Wno-address-of-packed-member -Wno-tautological-compare \\\n'
               f'  -Wno-unknown-warning-option  \\\n'
               f'  -O2 -emit-llvm -Xclang -disable-llvm-passes -c \\\n'
               f'  "${self.name}_ebpf_src" -o - | \\\n'
               f'  opt -O2 -mtriple=bpf-pc-linux | llvm-dis | \\\n'
               f'  llc -march=bpf  -filetype=obj \\\n'
               f'  -o "${self.bash_ebpf_var}"')
        self.p(f'echo Built "${self.bash_ebpf_var}"')

    @property
    def dotname(self):
        name = self.name.replace('.', '_')
        return f'"ebpf_{name}-{self.REF}_{name}"'

    def render_dot(self):
        label = f'{self.name} [eBPF]'
        self.p(f'{self.dotname} [label="{label}", shape=record]')
