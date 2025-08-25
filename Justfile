# Help
default:
    just --list

# Basic usage
serve:
    workerd serve workerd.capnp

# Basic usage - toml config
serve-toml:
    workerd serve workerd.toml

# With specific binding address
serve-bind:
    workerd serve --socket-addr=127.0.0.1:8080 workerd.capnp

# Compile
compile:
    workerd compile workerd.capnp > iot-edge-workerd     

# Docker build
docker-build:
    ./build-static-workerd.sh

# Docker run
docker-run:
    just docker-rm || true
    docker run -d -p 8080:8080 --name iot-edge-workerd ranckosolutionsinc/iot-edge-workerd:latest

# Remove Docker container
docker-rm:
    docker rm iot-edge-workerd -f

# Push to Docker Hub
docker-push:
    docker push ranckosolutionsinc/iot-edge-workerd:latest

# Docker logs
docker-logs:
    docker logs -f iot-edge-workerd

