# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY worker.js ./

# Build the worker bundle
RUN npx esbuild app.js --bundle --format=esm --target=es2022 --outfile=worker-bundle.js

# Runtime stage - using distroless for minimal size with glibc support
FROM gcr.io/distroless/cc-debian12

WORKDIR /app

# Copy workerd binary (download this separately)
COPY workerd ./workerd

# Copy the bundled worker and config
COPY --from=builder /app/worker-bundle.js ./worker.js
COPY app.capnp ./workerd.capnp

# Expose port
EXPOSE 8080

# Run workerd
ENTRYPOINT ["./workerd", "serve", "./workerd.capnp"] 
