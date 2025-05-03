# Makefile for running RabbitMQ with limited resources and benchmarking with Go

# Configurable parameters
RATE ?= 0       # messages per second (0 for no throttling)
DURATION ?=     # duration of the test (empty for indefinite)
PRODUCERS ?= 1  # number of concurrent producers
CONSUMERS ?= 1  # number of concurrent consumers
SIZE ?= 4096   # message size in bytes (larger sizes increase broker CPU usage)
EXCHANGE_TYPE ?= direct  # AMQP exchange type (direct, topic, fanout)
PUBLISHER_CONFIRM ?= false  # enable publisher confirms (false|true)
CONSUMER_CONFIRM ?= false   # enable consumer confirms/manualacks (false|true)

# RabbitMQ container resource limits (override with make MEMORY=<mem> CPUS=<cpus>)
MEMORY ?= 2048m  # container memory limit (e.g. 512m, 1g)
CPUS   ?= 0.5    # container CPU quota in cores (e.g. 1, 2)

.PHONY: start-rabbitmq wait-rabbitmq test-rabbitmq stop-rabbitmq clean
.PHONY: test-rabbitmq-tmux

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
		cd rabbitmq-bench && go run main.go -url amqp://guest:guest@localhost:5672/ \
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

# Run benchmark in a 3-pane tmux session:
# Top: RabbitMQ logs (docker run), Bottom-left: docker stats, Bottom-right: go bench
test-rabbitmq-tmux:
	@which tmux >/dev/null 2>&1 || { echo "Error: tmux not installed"; exit 1; }
	@echo "Cleaning up any existing RabbitMQ container/session..."
	@docker rm -f rabbitmq-limited 2>/dev/null || true
	@echo "Starting tmux session 'rabbitmq-bench'..."
	@tmux kill-session -t rabbitmq-bench 2>/dev/null || true
	# Pane 0: run RabbitMQ (attached, shows logs)
	@tmux new-session -d -s rabbitmq-bench \
		'docker run --name rabbitmq-limited --user 999:999 --memory=$(MEMORY) --cpus=$(CPUS) \
			-v $(CURDIR)/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro \
			-v $(CURDIR)/advanced.config:/etc/rabbitmq/advanced.config:ro \
			-p 5672:5672 -p 15672:15672 rabbitmq:3-management'
	# Pane 1: docker stats (bottom-left)
	@tmux split-window -v -t rabbitmq-bench:0 -p 33 'sleep 2 && docker stats rabbitmq-limited'
	# Pane 2: run the bench command only (locally) (bottom-right)
	@tmux split-window -h -t rabbitmq-bench:0.1 -p 50 \
		'cd rabbitmq-bench && go run main.go -url amqp://guest:guest@localhost:5672/ \
			-rate $(RATE) \
			$(if $(DURATION),-duration $(DURATION)) \
			-producers $(PRODUCERS) -consumers $(CONSUMERS) \
			-size $(SIZE) \
			-exchange-type $(EXCHANGE_TYPE) \
			-publisher-confirm $(PUBLISHER_CONFIRM) -consumer-confirm $(CONSUMER_CONFIRM)'
	@tmux attach -t rabbitmq-bench
	# After tmux session exits, stop RabbitMQ container
	@echo "Stopping RabbitMQ container..."
	@docker stop rabbitmq-limited || true

clean: stop-rabbitmq