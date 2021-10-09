import os
import sys
here = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(here, "../deps"))
sys.path.append(os.path.join(here, "../"))
import json
import yaml
import jsonschema
from netpen.topology import Topology


class PrintFn():
    def __init__(self):
        self.o = ''

    def __call__(self, s):
        self.o += f'{s}\n'


def output(rc, body, typ='octet-stream'):
    if typ == 'json':
        body = json.dumps(body, indent=2)
    return {
        "statusCode": rc,
        "headers": {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            "Content-Type": f'application/{typ}'
        },
        "body": body
    }


def render(fmt, event):
    if event['httpMethod'] == 'OPTIONS':
        # preflight CORS check
        return output(200, {}, 'json')

    o = yaml.safe_load(event['body'])
    print(json.dumps(o, indent=2))
    t = Topology()
    try:
        t.load(o)
    except jsonschema.exceptions.ValidationError as ex:
        print(ex)
        return output(400, {'error': ex}, 'json')

    t.printfn = PrintFn()
    if fmt == 'dot':
        t.render_dot()
    elif fmt == 'bash':
        t.render_bash()
    print(t.printfn.o)
    sys.stdout.flush()
    return output(200, t.printfn.o)


# pylint: disable=unused-argument
def single(event, context):
    path = event['path']
    if path == '/v1/dot':
        return render('dot', event)
    if path == '/v1/bash':
        return render('bash', event)
    return output(404, {'error': 'unknown path'})
