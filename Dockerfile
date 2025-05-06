###
# Multi-stage Dockerfile for building and running the Go proxy server with embedded UI
###
# Use Go Alpine image to compile the server
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go.mod, download dependencies
COPY cmd/rabbitmqt/go.mod ./
RUN go mod download

# Copy source code (including ui/ directory) and build
COPY cmd/rabbitmqt/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o rabbitmqt .

# Use a minimal Alpine image for runtime
FROM alpine:3.18 AS runtime

# Install CA certificates for HTTPS proxying
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /app/rabbitmqt ./rabbitmqt

# Expose default HTTP port
EXPOSE 8080

# Run the proxy server
ENTRYPOINT ["./rabbitmqt"]