PWD:=$(shell pwd)
DOCKER_IMG_NAME:=netpen-build
BIN:=netpen
TARGET:=out/$(BIN)

all: $(TARGET)

out:
	mkdir -p $@

$(DOCKER_IMG_NAME):
	docker build -t "$(DOCKER_IMG_NAME)" -f Dockerfile ..

$(TARGET): $(DOCKER_IMG_NAME) out
	docker run --rm -v "$(PWD)/out:/out/" $(DOCKER_IMG_NAME)

.PHONY: $(DOCKER_IMG_NAME) $(TARGET)
