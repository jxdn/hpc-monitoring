#!/bin/bash

# HPC Monitoring - Clean Docker Environment
# This script stops all containers and removes volumes (data will be lost!)

echo "🗑️  Cleaning HPC Monitoring Docker environment..."
echo ""
echo "⚠️  WARNING: This will delete all data volumes!"
echo "   - VictoriaMetrics data"
echo "   - MySQL database"
echo "   - Backend cache and logs"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Stopping containers and removing volumes..."
docker-compose down -v

echo ""
echo "Removing unused Docker images..."
docker image prune -f --filter "label=com.docker.compose.project=hpcmonitoring-openondemand"

echo ""
echo "✓ Cleanup complete"
echo ""
echo "All containers, volumes, and images have been removed."
echo "To start fresh, run: ./docker-start-dev.sh or ./docker-start-prod.sh"
