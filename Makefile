TARGET=netpen

all: $(TARGET)

cli/out/$(TARGET): netpen
	$(MAKE) -C cli

$(TARGET): cli/out/$(TARGET)

dev lint pycodestyle validation-tests system-tests:
	$(MAKE) -C dev $@

screenshots:
	$(MAKE) -C examples $@

.PHONY: $(TARGET) dev lint pycodestyle validation-tests system-tests screenshots
