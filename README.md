# rabbitmqt

A lightweight HTTP proxy and web UI for RabbitMQ management, with built-in benchmarking tools.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Build from Source](#build-from-source)
  - [Run with Docker](#run-with-docker)
- [Configuration](#configuration)
- [RabbitMQ Setup (Optional)](#rabbitmq-setup-optional)
- [Benchmarking Tool](#benchmarking-tool)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features
- Serves a modern web UI for RabbitMQ management (built with Preact, TailwindCSS, DaisyUI)
- Proxy endpoint with CORS support for the RabbitMQ HTTP API (`/proxy/...`)
- Configurable default target URL and proxy timeout via environment variables
- Benchmarks RabbitMQ performance with configurable producers, consumers, message size, rate, etc.
- Docker and Makefile support for easy setup and testing

## Prerequisites
- Go 1.21+ (for building from source)
- Docker (optional, for containerized deployment and testing)
- Make (optional, for convenience targets)

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/yourusername/rabbitmqt.git
cd rabbitmqt
```

### Build from Source
```bash
# Build the proxy server binary
make build-rabbitmqt

# The binary will be placed in ./output/rabbitmqt
```

### Run the Server
```bash
# Configure the RabbitMQ management API URL (default: empty)
export DEFAULT_URL="http://guest:guest@localhost:15672/api/"

# (Optional) Adjust proxy timeout (default: 5m)
export PROXY_TIMEOUT="2m"

# (Optional) Customize CORS behavior:
export CORS_ALLOW_ORIGIN="*"           # e.g. "https://example.com"
export CORS_ALLOW_METHODS="GET, POST, PUT, DELETE, PATCH, OPTIONS"
export CORS_ALLOW_HEADERS="Content-Type, Authorization"
export CORS_EXPOSE_HEADERS="*"

# Run the server
./output/rabbitmqt
```

The web UI will be available at `http://localhost:8080`.

### Run with Docker
```bash
# Build the Docker image
docker build -t rabbitmqt .

# Run the container (adjust env vars as needed)
docker run -p 8080:8080 \
  -e DEFAULT_URL="http://guest:guest@localhost:15672/api/" \
  -e PROXY_TIMEOUT="2m" \
  # Optional: Customize CORS behavior
  -e CORS_ALLOW_ORIGIN="*" \
  -e CORS_ALLOW_METHODS="GET, POST, PUT, DELETE, PATCH, OPTIONS" \
  -e CORS_ALLOW_HEADERS="Content-Type, Authorization" \
  -e CORS_EXPOSE_HEADERS="*" \
  rabbitmqt
```

## Configuration
- `DEFAULT_URL`: Default RabbitMQ HTTP API base URL injected into the UI (`%%DEFAULT_URL%%` placeholder).  
- `PROXY_TIMEOUT`: HTTP proxy timeout (Go `time.Duration` format, e.g., `120s`, `2m`). Defaults to 5 minutes.
- `CORS_ALLOW_ORIGIN`: Value for `Access-Control-Allow-Origin` header. Defaults to `*`.
- `CORS_ALLOW_METHODS`: Value for `Access-Control-Allow-Methods` header. Defaults to `GET, POST, PUT, DELETE, PATCH, OPTIONS`.
- `CORS_ALLOW_HEADERS`: Value for `Access-Control-Allow-Headers` header. Defaults to `Content-Type, Authorization`.
- `CORS_EXPOSE_HEADERS`: Value for `Access-Control-Expose-Headers` header. Defaults to `*`.

> **Note:** If a `./ui` directory is present in the same working directory as the binary, the server will serve those files instead of the embedded UI.

## RabbitMQ Setup (Optional)
You can run a RabbitMQ container with recommended resource limits and configuration:
```bash
# Start RabbitMQ with limited memory/CPU and custom config
make start-rabbitmq MEMORY=1g CPUS=1

# Run a benchmark against the running broker
make test-rabbitmq RATE=1000 DURATION=30s PRODUCERS=2 CONSUMERS=2 SIZE=1024
```
The broker listens on `5672` (AMQP) and `15672` (management UI).

To stop the broker:
```bash
make stop-rabbitmq
```

## Benchmarking Tool
The repository includes a Go-based benchmarking tool (`tools/rabbitmq-bench`).

```bash
# Run directly with `go run`
cd tools/rabbitmq-bench
go run main.go \
  -url amqp://guest:guest@localhost:5672/ \
  -rate 1000 \
  -duration 1m \
  -producers 2 \
  -consumers 2 \
  -size 4096 \
  -exchange-type direct \
  -publisher-confirm \
  -consumer-confirm
```

## Project Structure
```
.
├── Dockerfile                # Multi-stage build for the proxy server
├── Makefile                  # Build, run, and benchmark targets
├── rabbitmq.conf             # RabbitMQ broker configuration
├── advanced.config           # Advanced RabbitMQ configurations
├── cmd/rabbitmqt/            # Proxy server source code
│   ├── main.go
│   ├── middleware.go
│   └── ui/                   # Static web UI assets (Preact, TailwindCSS)
├── tools/rabbitmq-bench/     # RabbitMQ benchmarking tool (Go)
└── output/                   # Compiled binaries (after `make build-rabbitmqt`)
```

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project does not include a license. Please add a `LICENSE` file to specify terms.