#!/bin/bash

# HPC Monitoring - Stop Docker Services
# This script stops all running containers but preserves volumes/data

echo "🛑 Stopping HPC Monitoring services..."
echo ""

docker-compose down

echo ""
echo "✓ All services stopped"
echo ""
echo "Notes:"
echo "  - Containers stopped, but data volumes are preserved"
echo "  - To remove volumes too, run: ./docker-clean.sh"
echo "  - To start again, run: ./docker-start-dev.sh or ./docker-start-prod.sh"
