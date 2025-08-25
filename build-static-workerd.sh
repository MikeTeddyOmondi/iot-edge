#!/bin/bash
# build-static-workerd.sh

# Build workerd statically (if building from source)
# Or download pre-built static binary

# Download workerd if not exists
if [ ! -f "workerd" ]; then
    echo "📦 Downloading workerd..."
    wget -q https://github.com/cloudflare/workerd/releases/latest/download/workerd-linux-64.gz
    gunzip workerd-linux-64.gz
    mv workerd-linux-64 workerd
    chmod +x workerd
fi

# Get CA certificates from Alpine
# docker run --rm alpine:latest cat /etc/ssl/certs/ca-certificates.crt > ca-certificates.crt

# Build scratch image
# docker build -f Dockerfile.scratch -t ranckosolutionsinc/iot-edge-workerd:scratch .

# Build alpine/debian image
docker build -f Dockerfile -t ranckosolutionsinc/iot-edge-workerd:latest .
