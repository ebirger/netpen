from collections import defaultdict
import networkx as nx
from art import text2art
import jsonschema
from .router import Router
from .ipam import Ipam
from .builders import get_builders


class TopologyMember():
    DEV_PFX = None
    REF = None
    DESC = None
    SCHEMA = None

    @classmethod
    def dev_pfx(cls):
        return cls.DEV_PFX or cls.REF

    def __init__(self, topology, name=None):
        self.topology = topology
        topology.objects[self.__class__.REF].append(self)
        self.name = name
        if name:
            key = f'{self.REF}.{self.name}'
            topology.members[key] = self

    def p(self, *args, **kwargs):
        self.topology.printfn(*args, **kwargs)

    @classmethod
    def from_params(cls, topology, params):
        pass

    @classmethod
    def bash_preamble(cls, topology):
        pass

    def render_dot(self):
        pass

    def render_bash(self):
        pass


class Topology():
    def __init__(self):
        self.members = {}
        self.objects = defaultdict(list)
        self.router = Router(self)
        self.l2_graph = nx.Graph()
        self.prereqs = nx.DiGraph()
        self.ipam = Ipam(self)
        self.printfn = print
        self.settings = {}

    @property
    def builders(self):
        return get_builders()

    def load(self, doc):
        self.settings = doc.get('settings') or {}
        done_items = set()
        for attempt in range(2):
            for b in self.builders:
                insts = [i[b.REF] for i in doc.get('items', []) if b.REF in i]
                for params in insts:
                    name = f'{b.REF}.{params["name"]}'
                    if name in done_items:
                        continue
                    jsonschema.validate(params, b.SCHEMA)
                    try:
                        b.from_params(self, params)
                        done_items.add(name)
                    except KeyError:
                        # don't fail at first pass to allow referenced
                        # resources to be built
                        if attempt != 0:
                            raise

        self.ipam.assign_addrs()

    def add_l2_dev(self, dev, **kwargs):
        self.l2_graph.add_node(dev, **kwargs)

    def add_l2_conn(self, dev1, dev2):
        self.add_l2_dev(dev1)
        self.add_l2_dev(dev2)
        self.l2_graph.add_edge(dev1, dev2)

    def add_prereq(self, obj, prereq):
        self.prereqs.add_edge(obj, prereq)

    def render_bash(self):
        fail_on_err = ' -e' if self.settings.get('fail_on_error', True) else ''
        verbose = ' -x' if self.settings.get('verbose', False) else ''
        self.printfn(f'#!/bin/bash{fail_on_err}{verbose}\n')

        title = self.settings.get('title') or 'netpen'
        self.printfn('cat << "EOF"')
        self.printfn(text2art(title))
        self.printfn('EOF\n\n')

        preambles = {getattr(cls, 'bash_preamble', None)
                     for cls in self.builders
                     if self.objects[cls.REF]}
        for m in preambles:
            if m:
                m(self)

        self.printfn('sysctl -w net.ipv4.route.mtu_expires=15\n')

        self.done_list = set()

        while True:
            missing = False
            for cls in self.builders:
                todo = set(self.objects[cls.REF]) - self.done_list
                printed_header = False
                for o in todo:
                    try:
                        prereqs = set(nx.dfs_predecessors(self.prereqs, o))
                    except KeyError:
                        prereqs = set()
                    if prereqs - self.done_list:
                        missing = True
                        continue
                    if not printed_header:
                        self.printfn(f'\n# {cls.REF}')
                        printed_header = True
                    o.render_bash()
                    self.done_list.add(o)
            if not missing:
                break

        self.router.render_bash()

    def render_dot(self):
        self.printfn('graph G {')
        self.printfn('rankdir = "TB"')
        self.done_list = set()
        for cls in self.builders:
            subgraph = getattr(cls, 'SUBGRAPH', False)
            if subgraph:
                self.printfn(f'subgraph cluster_{cls.REF} {{')
                self.printfn(f'label="{subgraph}"')
            for o in self.objects[cls.REF]:
                if o in self.done_list:
                    continue
                f = getattr(o, 'render_dot')
                if not f:
                    continue
                f()
                self.done_list.add(o)
            if subgraph:
                self.printfn('}')
        self.printfn('}')
