CWD=$(shell pwd)

CONTAINER_NAME=netpen-web

$(CONTAINER_NAME):
	docker build -t netpen-web .
.PHONY: $(CONTAINER_NAME)

build: $(CONTAINER_NAME)
	docker run -it -v $(CWD):/app $<

serve: $(CONTAINER_NAME)
	docker run -it -v $(CWD):/app -p 3000:3000 $< yarn start
