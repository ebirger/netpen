FROM python:3.8

WORKDIR /usr/src/app

COPY netpen/requirements.txt /tmp/netpen_requirements.txt
COPY dev/rest/requirements.txt /tmp/rest_requirements.txt

RUN pip install --no-cache-dir -r /tmp/netpen_requirements.txt
RUN pip install --no-cache-dir -r /tmp/rest_requirements.txt

WORKDIR /app

ENV FLASK_APP=./dev/rest/__main__.py

CMD python3 -m flask run --host 0.0.0.0
