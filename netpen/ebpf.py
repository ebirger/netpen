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
    def from_params(cls, topology, params):
        return cls(topology, params['name'], params['code'])

    def render_bash(self):
        dirname_var = self._bash_ebpf_dirname_var
        self.p(f'{dirname_var}=$(mktemp -d)')
        self.p(f'{self.name}_ebpf_src="${dirname_var}/{self.name}.c"')
        self.p(f'{self.bash_ebpf_var}="${dirname_var}/{self.name}.bpf.o"')
        self.p(f'cat > "${self.name}_ebpf_src" << "EOF"')
        self.p(self.code)
        self.p('EOF\n\n')

        self.p(f'clang \\\n'
               f'  -idirafter /usr/include/x86_64-linux-gnu \\\n'
               f'  -D__TARGET_ARCH_x86 \\\n'
               f'  -Wno-compare-distinct-pointer-types \\\n'
               f'  -c "${self.name}_ebpf_src" \\\n'
               f'  -target bpf \\\n'
               f'  -mcpu=v3 \\\n'
               f'  -O2 \\\n'
               f'  -mlittle-endian \\\n'
               f'  -o "${self.bash_ebpf_var}"')

        self.p(f'echo Built "${self.bash_ebpf_var}"')

    @property
    def dotname(self):
        name = self.name.replace('.', '_')
        return f'"ebpf_{name}-{self.REF}_{name}"'

    def render_dot(self):
        label = f'{self.name} [eBPF]'
        self.p(f'{self.dotname} [label="{label}", shape=record]')
