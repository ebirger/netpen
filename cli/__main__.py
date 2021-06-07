import sys
import argparse
import yaml
import jsonschema
from netpen.topology import Topology


t = Topology()


def _render(f, fmt):
    t.printfn = lambda s: f.write('%s\n' % s)

    if fmt == 'bash':
        t.render_bash()
    elif fmt == 'dot':
        t.render_dot()


def _gen(args):
    with open(args.infile) as f:
        y = yaml.safe_load(f)

    try:
        t.load(y)
    except jsonschema.exceptions.ValidationError as ex:
        print(ex)
        sys.exit(1)

    if args.output:
        with open(args.output, 'w') as f:
            _render(f, args.format)
    else:
        _render(sys.stdout, args.format)


def _desc(args):
    ent = next((b for b in t.builders if b.REF == args.type))
    print('%s: %s' % (ent.REF, ent.DESC['title']))
    print('Schema:')
    s = yaml.dump(ent.SCHEMA, default_flow_style=False)
    print('    %s' % s.replace('\n', '\n    '))


def _types(_):
    print('Possible Entity Types:')
    for b in t.builders:
        if not b.DESC:
            continue
        print('- %s' % b.REF)


def build_parser():
    parser = argparse.ArgumentParser(prog='netpen')

    sub_parser = parser.add_subparsers(title='Commands', dest='command_name')
    p = sub_parser.add_parser('types', help='List entity types')
    p.set_defaults(func=_types)
    p = sub_parser.add_parser('desc', help='Describe Specific entity')
    p.add_argument('type', metavar='TYPE', help='Entity type',
                   choices=[b.REF for b in t.builders if b.DESC])
    p.set_defaults(func=_desc)
    p = sub_parser.add_parser('gen', help='Generate Output')
    p.add_argument('infile', metavar='INPUT_FILE', help='Input file name')
    p.add_argument('-o', '--output', metavar='OUTPUT_FILE',
                   help='Output file name (default stdout)')
    p.add_argument('--format', help='Output format', choices=['bash', 'dot'],
                   default='bash')
    p.set_defaults(func=_gen)
    return parser


def main():
    parser = build_parser()
    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        sys.exit(1)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
