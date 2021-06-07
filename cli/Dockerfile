FROM ubuntu:18.04

VOLUME /out

RUN apt-get update && apt-get install -y software-properties-common \
    build-essential python3-pip

# Install python requirements before copying the app
# to avoid redoing them on every file change
COPY netpen/requirements.txt /usr/src/app/
COPY cli/requirements.txt /usr/src/app/cli/
WORKDIR /usr/src/app
RUN pip3 install -r requirements.txt
RUN pip3 install -r cli/requirements.txt

COPY . /usr/src/app/

CMD cli/build.sh
