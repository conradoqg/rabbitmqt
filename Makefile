# Docker image tag (override with `make docker-build IMAGE=repo/my-project:tag`)
IMAGE ?= rabbitmqt:latest
BIN   ?= output/rabbitmqt

# Configurable parameters for Benchmarking
RATE ?= 0
DURATION ?=
PRODUCERS ?= 1
CONSUMERS ?= 1
SIZE ?= 4096
EXCHANGE_TYPE ?= direct
PUBLISHER_CONFIRM ?= false
CONSUMER_CONFIRM ?= false
MEMORY ?= 2048m
CPUS   ?= 0.5

.PHONY: build build-linux run test fmt vet docker-build docker-run docker-push clean
.PHONY: start-rabbitmq wait-rabbitmq test-rabbitmq stop-rabbitmq test-rabbitmq-tmux

build:
	@echo "Building $(BIN)..."
	@mkdir -p output
	@GOCACHE=$$PWD/.gocache go build -o $(BIN) ./cmd/rabbitmqt

build-linux:
	@echo "Building linux/amd64 binary..."
	@mkdir -p output
	@GOCACHE=$$PWD/.gocache CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o $(BIN)-linux-amd64 ./cmd/rabbitmqt

run: build
	@./$(BIN) --config=config.yaml --listen=:8080

test:
	@GOCACHE=$$PWD/.gocache go test ./...

fmt:
	@go fmt ./...

vet:
	@go vet ./...

docker-build:
	@echo "Building Docker image $(IMAGE)..."
	@docker build -t $(IMAGE) .

docker-run:
	@docker run --rm -p 8080:8080 $(IMAGE)

docker-push:
	@docker push $(IMAGE)

clean: stop-rabbitmq
	@rm -rf output .gocache

start-rabbitmq:
	docker run --name rabbitmq-limited -d --rm \
	--user 999:999 \
	--memory=$(MEMORY) --cpus=$(CPUS) \
	-v $(CURDIR)/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro \
	-v $(CURDIR)/advanced.config:/etc/rabbitmq/advanced.config:ro \
	-p 5672:5672 -p 15672:15672 \
	rabbitmq:3-management

test-rabbitmq:
	@echo "Running benchmark (will stop RabbitMQ when done)..."
	cd tools/rabbitmq-bench && go run main.go -url amqp://guest:guest@localhost:5672/ \
		-rate $(RATE) \
		$(if $(DURATION),-duration $(DURATION)) \
		-producers $(PRODUCERS) -consumers $(CONSUMERS) \
		-size $(SIZE) \
		-exchange-type $(EXCHANGE_TYPE) \
		-publisher-confirm $(PUBLISHER_CONFIRM) -consumer-confirm $(CONSUMER_CONFIRM)
	@echo "Benchmark finished, stopping RabbitMQ..."
	@docker stop rabbitmq-limited

stop-rabbitmq:
	-docker stop rabbitmq-limited

test-rabbitmq-tmux:
	@which tmux >/dev/null 2>&1 || { echo "Error: tmux not installed"; exit 1; }
	@echo "Cleaning up any existing RabbitMQ container/session..."
	@docker rm -f rabbitmq-limited 2>/dev/null || true
	@echo "Starting tmux session 'rabbitmq-bench'..."
	@tmux kill-session -t rabbitmq-bench 2>/dev/null || true
	@tmux new-session -d -s rabbitmq-bench \
		'docker run --name rabbitmq-limited --user 999:999 --memory=$(MEMORY) --cpus=$(CPUS) \
			-v $(CURDIR)/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro \
			-v $(CURDIR)/advanced.config:/etc/rabbitmq/advanced.config:ro \
			-p 5672:5672 -p 15672:15672 rabbitmq:3-management'
	@tmux split-window -v -t rabbitmq-bench:0 -p 33 'sleep 2 && docker stats rabbitmq-limited'
	@tmux split-window -h -t rabbitmq-bench:0.1 -p 50 \
			'cd tools/rabbitmq-bench && go run main.go -url amqp://guest:guest@localhost:5672/ \
			-rate $(RATE) \
			$(if $(DURATION),-duration $(DURATION)) \
			-producers $(PRODUCERS) -consumers $(CONSUMERS) \
			-size $(SIZE) \
			-exchange-type $(EXCHANGE_TYPE) \
			-publisher-confirm $(PUBLISHER_CONFIRM) -consumer-confirm $(CONSUMER_CONFIRM)'
	@tmux attach -t rabbitmq-bench
	@echo "Stopping RabbitMQ container..."
	@docker stop rabbitmq-limited || true

