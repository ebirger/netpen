all: screenshots

screenshots: $(patsubst %.yml,%.png,$(wildcard *.yml))

%.png: %.yml
	google-chrome \
          --headless \
          --disable-gpu \
          --window-size=1280,968 \
          --screenshot=$@ \
          --virtual-time-budget=10000 \
          --hide-scrollbars \
          http://localhost:8199/examples/$<

.PHONY: screenshots
