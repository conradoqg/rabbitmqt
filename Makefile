# Makefile for running RabbitMQ with limited resources and benchmarking with Go

# Configurable parameters
RATE ?= 100     # messages per second
DURATION ?=     # duration of the test (empty for indefinite)
producers ?= 1  # number of concurrent producers
consumers ?= 1  # number of concurrent consumers

.PHONY: start-rabbitmq wait-rabbitmq test-rabbitmq stop-rabbitmq clean
.PHONY: test-rabbitmq-tmux

start-rabbitmq:
		docker run --name rabbitmq-limited -d --rm \
		--user 999:999 \
		--memory=256m --cpus=0.5 \
		-p 5672:5672 -p 15672:15672 \
		rabbitmq:3-management

wait-rabbitmq:
	@echo "Waiting for RabbitMQ to become available..."
	@until docker exec rabbitmq-limited rabbitmqctl status > /dev/null 2>&1; do sleep 1; done
	@echo "RabbitMQ is ready."

test-rabbitmq: start-rabbitmq
	@echo "Running benchmark (will stop RabbitMQ when done)..."
		docker run --rm --link rabbitmq-limited:rabbitmq \
		-v $(CURDIR)/rabbitmq-bench:/bench -w /bench golang:latest \
		go run main.go -url amqp://guest:guest@rabbitmq:5672/ \
			-rate $(RATE) $(if $(DURATION),-duration $(DURATION)) \
			-producers $(producers) -consumers $(consumers)
	@echo "Benchmark finished, stopping RabbitMQ..."
	@docker stop rabbitmq-limited

stop-rabbitmq:
	-docker stop rabbitmq-limited

# Run benchmark in a 3-pane tmux session:
# Top: docker stats, Middle: container logs, Bottom: go bench
test-rabbitmq-tmux:
	@which tmux >/dev/null 2>&1 || { echo "Error: tmux not installed"; exit 1; }
	@echo "Cleaning up any existing RabbitMQ container/session..."
	@docker rm -f rabbitmq-limited 2>/dev/null || true
	@echo "Starting tmux session 'rabbitmq-bench'..."
	@tmux kill-session -t rabbitmq-bench 2>/dev/null || true
	# Pane 0: run RabbitMQ (attached, shows logs)
	@tmux new-session -d -s rabbitmq-bench \
		'docker run --name rabbitmq-limited --user 999:999 --memory=512m --cpus=0.1 \
			-p 5672:5672 -p 15672:15672 rabbitmq:3-management'
	# Pane 1: stats
	@tmux split-window -v -t rabbitmq-bench:0 -p 33 'docker stats rabbitmq-limited'
	# Pane 2: run the bench command only (locally)
	@tmux split-window -v -t rabbitmq-bench:0.1 -p 50 'cd rabbitmq-bench && go run main.go -url amqp://guest:guest@localhost:5672/ -rate $(RATE) $(if $(DURATION),-duration $(DURATION)) -producers $(producers) -consumers $(consumers)'
	@tmux select-layout -t rabbitmq-bench tiled
	@tmux attach -t rabbitmq-bench
	# After tmux session exits, stop RabbitMQ container
	@echo "Stopping RabbitMQ container..."
	@docker stop rabbitmq-limited || true

clean: stop-rabbitmq