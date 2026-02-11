#!/bin/bash

# HPC Monitoring Production Startup Script
# Starts both frontend (served) and backend (node) in production mode

# Change to script directory
cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  HPC Monitoring - Production Startup                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "   Please create .env from .env.example"
    exit 1
fi

# Check if node_modules exists for frontend
if [ ! -d node_modules ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo ""
fi

# Check if node_modules exists for backend
if [ ! -d backend/node_modules ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo ""
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend built successfully"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🚀 Starting backend server..."
cd backend
NODE_ENV=production nohup node src/server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend (serve the built files)
echo "🚀 Starting frontend server..."
nohup npm run preview > frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Servers Started Successfully!                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Frontend:  http://localhost:3000"
echo "🔌 Backend:   http://localhost:3003"
echo "💚 Health:    http://localhost:3003/api/health"
echo ""
echo "📝 Logs:"
echo "   Frontend: tail -f frontend.log"
echo "   Backend:  tail -f backend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID