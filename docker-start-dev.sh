#!/bin/bash

# HPC Monitoring - Start Development Environment with Docker
# This script starts all services in development mode with hot-reload enabled

echo "🚀 Starting HPC Monitoring in DEVELOPMENT mode..."
echo ""
echo "Services starting:"
echo "  - VictoriaMetrics (http://localhost:9090)"
echo "  - MySQL (localhost:6033)"
echo "  - Backend API (http://localhost:3001) - with hot-reload"
echo "  - Frontend (http://localhost:3000) - with hot-reload"
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

# Set development environment variables
export NODE_ENV=development
export BUILD_TARGET=development

# Start services with docker-compose
docker-compose --profile dev up --build

echo ""
echo "To stop: Press Ctrl+C or run ./docker-stop.sh"
