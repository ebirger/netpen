all: tests

PYTEST_FLAGS=$(if $(VERBOSE),-s) $(if $(TEST_KW),-k $(TEST_KW))

tests:
	cd ../../.. && PYTHONPATH=. pytest $(PYTEST_FLAGS) \
		dev/tests/system-tests --verbose
