all: tests

PYTEST_FLAGS=$(if $(VERBOSE),-s)

tests:
	cd ../../.. && PYTHONPATH=. pytest $(PYTEST_FLAGS) \
		dev/tests/system-tests --verbose
