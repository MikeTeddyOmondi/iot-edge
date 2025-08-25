FROM debian:12-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY workerd ./workerd
RUN chmod +x ./workerd

COPY worker.js ./worker.js
COPY workerd.toml ./workerd.toml
COPY workerd.capnp ./workerd.capnp

EXPOSE 8080
# ENTRYPOINT ["./workerd", "serve", "./workerd.toml"]
ENTRYPOINT ["./workerd", "serve", "./workerd.capnp"]
