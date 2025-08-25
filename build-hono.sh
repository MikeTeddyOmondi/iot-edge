#!/bin/bash
set -e

echo "🚀 Building IoT Edge Service with Hono..."

# Download workerd if not exists
if [ ! -f "workerd" ]; then
    echo "📦 Downloading workerd..."
    wget -q https://github.com/cloudflare/workerd/releases/latest/download/workerd-linux-64.gz
    gunzip workerd-linux-64.gz
    mv workerd-linux-64 workerd
    chmod +x workerd
fi

# Install npm dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Bundle the worker with esbuild
echo "🔨 Building worker bundle..."
npx esbuild app.js --bundle --format=esm --target=es2022 --outfile=worker-bundle.js --external:hono

# Replace the original worker.js with the bundle for Docker
cp worker-bundle.js worker.js

echo "🐳 Building Docker image..."
docker build -t ranckosolutionsinc/iot-edge-workerd:hono .

echo "✅ Build complete!"
echo "🔧 To run: docker run -p 8080:8080 ranckosolutionsinc/iot-edge-workerd:hono"
echo "🌐 Access the service at http://localhost:8080"
