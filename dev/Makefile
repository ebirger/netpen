dev:
	docker-compose -f docker-compose.yml up

# Build or rebuild docker containers.
build-dev:
ifeq (,$(wildcard /usr/bin/yarn))
	cd ../web; \
	sudo apt-get update && sudo apt-get install -y yarn || \
	apt-get update && sudo apt-get install -y yarn || \
	sudo pacman --needed --noconfirm -S yarn || \
	pacman --needed --noconfirm -S yarn; \
	yarn install && \
	yarn build; \
	cd ../dev
endif
	docker-compose -f docker-compose.yml build

# Use this target instead of `dev` to support VPN 
# configs (OpenVPN or other).
dev-ext:
	docker-compose -f docker-compose-ext-net.yml up

# Build or rebuild docker containers (external network version).
# A feature to specify the subnet from the command-line 
# may be added. The below subnet address may need to be 
# different for your network.
build-dev-ext:
ifeq (,$(wildcard /usr/bin/yarn))
	cd ../web; \
	sudo apt-get update && sudo apt-get install -y yarn || \
	apt-get update && sudo apt-get install -y yarn || \
	sudo pacman --needed --noconfirm -S yarn || \
	pacman --needed --noconfirm -S yarn; \
	yarn install && \
	yarn build; \
	cd ../dev
endif
	docker network create --subnet 10.0.12.1/24 netpen-docker-compose-net; \
	docker-compose -f docker-compose-ext-net.yml build

.PHONY: \
	dev \
	build-dev \
	dev-ext \
	build-dev-ext

validation-tests system-tests:
	$(MAKE) -C tests/$@
.PHONY: validation-tests system-tests

pycodestyle:
	pycodestyle ../netpen/*.py
	pycodestyle ../cli/*.py
	pycodestyle --ignore=E402 ../lambdas/*.py
	pycodestyle ../dev/rest/*.py
	pycodestyle --ignore=E501 ../dev/tests/*/*.py
.PHONY: pycodestyle

lint:
	PYTHONPATH=netpen pylint --rcfile pylint.cfg ../netpen/*.py
	PYTHONPATH=netpen pylint --rcfile pylint.cfg ../cli/*.py
	PYTHONPATH=netpen pylint --rcfile pylint.cfg ../lambdas/*.py
	PYTHONPATH=netpen pylint --rcfile pylint.cfg ../dev/rest/*.py
	PYTHONPATH=netpen pylint --rcfile pylint.cfg ../dev/tests/*/*.py
.PHONY: lint
