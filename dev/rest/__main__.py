from lambdas.api import render
from flask import Flask, request
from flask_cors import CORS, cross_origin


app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


def call_render(fmt):
    ev = {'httpMethod': 'POST', 'body': request.data}
    return render(fmt, ev)


@app.route('/v1/dot', methods=['POST'])
@cross_origin()
def dot():
    return call_render('dot')['body']


@app.route('/v1/bash', methods=['POST'])
@cross_origin()
def bash():
    return call_render('bash')['body']
