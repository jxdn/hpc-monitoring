#!/bin/bash

# Stop all HPC Monitoring applications

echo "🛑 Stopping HPC Monitoring applications..."

# Kill processes by port
FRONTEND_PID=$(lsof -ti:3000)
BACKEND_PID=$(lsof -ti:3001)

if [ ! -z "$FRONTEND_PID" ]; then
    kill -9 $FRONTEND_PID 2>/dev/null
    echo "✅ Stopped frontend (PID: $FRONTEND_PID, Port: 3000)"
else
    echo "ℹ️  Frontend not running (Port: 3000)"
fi

if [ ! -z "$BACKEND_PID" ]; then
    kill -9 $BACKEND_PID 2>/dev/null
    echo "✅ Stopped backend (PID: $BACKEND_PID, Port: 3001)"
else
    echo "ℹ️  Backend not running (Port: 3001)"
fi

# Also kill any remaining processes matching patterns
pkill -f "vite.*3000" 2>/dev/null
pkill -f "node src/server.js" 2>/dev/null

echo "✅ All applications stopped"