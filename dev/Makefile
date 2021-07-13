dev:
	docker network create --subnet 10.0.12.1/24 netpen-docker-compose-net || true
	docker-compose -f docker-compose.yml up
.PHONY: dev

build-dev:
	docker network create --subnet 10.0.12.1/24 netpen-docker-compose-net || true
	docker-compose -f docker-compose.yml build
.PHONY: build-dev

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
