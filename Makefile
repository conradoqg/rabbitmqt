# Makefile for running RabbitMQ with limited resources and benchmarking with Go

# Configurable parameters
RATE ?= 100     # messages per second
DURATION ?=     # duration of the test (empty for indefinite)

.PHONY: start-rabbitmq wait-rabbitmq test-rabbitmq stop-rabbitmq clean
.PHONY: test-rabbitmq-tmux

start-rabbitmq:
		docker run --name rabbitmq-limited -d --rm \
		--user 999:999 \
		--memory=256m --cpus=0.05 \
		-p 5672:5672 -p 15672:15672 \
		rabbitmq:3-management

wait-rabbitmq:
	@echo "Waiting for RabbitMQ to become available..."
	@until docker exec rabbitmq-limited rabbitmqctl status > /dev/null 2>&1; do sleep 1; done
	@echo "RabbitMQ is ready."

test-rabbitmq: start-rabbitmq wait-rabbitmq
	@echo "Running benchmark (will stop RabbitMQ when done)..."
	cd rabbitmq-bench && go run main.go -url amqp://guest:guest@localhost:5672/ -rate $(RATE) $(if $(DURATION),-duration $(DURATION)); \
		echo "Benchmark finished, stopping RabbitMQ..."; \
		docker stop rabbitmq-limited

stop-rabbitmq:
	-docker stop rabbitmq-limited

# Run benchmark in a 3-pane tmux session:
# Top: docker stats, Middle: container logs, Bottom: go bench
test-rabbitmq-tmux: start-rabbitmq wait-rabbitmq
	@which tmux >/dev/null 2>&1 || { echo "Error: tmux not installed"; exit 1; }
	@echo "Starting tmux session 'rabbitmq-bench'..."
	# Kill existing session if present
	@tmux kill-session -t rabbitmq-bench 2>/dev/null || true
	# Setup tmux session with stats, logs & benchmark panes
	@tmux new-session -d -s rabbitmq-bench 'docker stats rabbitmq-limited'
	@tmux split-window -v -t rabbitmq-bench:0 -p 33 'docker logs -f rabbitmq-limited'
	@tmux split-window -v -t rabbitmq-bench:0.1 -p 50 "bash -lc \"trap 'docker stop rabbitmq-limited; tmux kill-session -t rabbitmq-bench' INT; cd rabbitmq-bench && go run main.go -url amqp://guest:guest@localhost:5672/ -rate $(RATE) $(if $(DURATION),-duration $(DURATION)); echo 'Benchmark finished, stopping RabbitMQ...'; docker stop rabbitmq-limited; tmux kill-session -t rabbitmq-bench\""
	@tmux select-layout -t rabbitmq-bench tiled
	@tmux attach -t rabbitmq-bench

clean: stop-rabbitmq