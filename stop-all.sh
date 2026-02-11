#!/bin/bash

# Stop all HPC Monitoring applications

echo "🛑 Stopping HPC Monitoring applications..."

# Kill processes matching the patterns
pkill -f "vite --host 0.0.0.0 --port 3000"
pkill -f "node src/server.js"

# Also kill by specific PIDs if they exist in log files
if [ -f frontend.log ]; then
    FRONTEND_PID=$(lsof -ti:3000)
    if [ ! -z "$FRONTEND_PID" ]; then
        kill -9 $FRONTEND_PID 2>/dev/null
        echo "✅ Stopped frontend (PID: $FRONTEND_PID)"
    fi
fi

if [ -f backend.log ]; then
    BACKEND_PID=$(lsof -ti:3003)
    if [ ! -z "$BACKEND_PID" ]; then
        kill -9 $BACKEND_PID 2>/dev/null
        echo "✅ Stopped backend (PID: $BACKEND_PID)"
    fi
fi

echo "✅ All applications stopped"