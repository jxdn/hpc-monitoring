#!/bin/bash

# HPC Monitoring - Start Production Environment with Docker
# This script starts all services in production mode with optimized builds

echo "🚀 Starting HPC Monitoring in PRODUCTION mode..."
echo ""
echo "Services starting:"
echo "  - VictoriaMetrics (http://localhost:9090)"
echo "  - MySQL (localhost:6033)"
echo "  - Backend API (http://localhost:3001) - optimized"
echo "  - Frontend (http://localhost:3000) - optimized build"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating .env from .env.example..."
    cp .env.example .env
    echo "   ✓ Created .env file"
    echo "   Please review and update .env with your configuration"
    echo ""
fi

# Set production environment variables
export NODE_ENV=production
export BUILD_TARGET=production

# Start services in detached mode with docker-compose
docker-compose --profile prod up --build -d

echo ""
echo "✓ All services started in background"
echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Check status:     docker-compose ps"
echo "  Stop services:    ./docker-stop.sh"
echo "  View backend logs: docker-compose logs -f backend-prod"
echo "  View frontend logs: docker-compose logs -f frontend-prod"
