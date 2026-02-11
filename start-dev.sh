#!/bin/bash

# HPC Monitoring Development Startup Script
# Starts both frontend and backend servers

# Change to script directory
cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  HPC Monitoring - Development Startup                   ║"
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
    echo "⚠️  Warning: .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo "   Please edit .env with your configuration"
    echo ""
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

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing processes on ports 3000 and 3001
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 2

echo "🚀 Starting backend server..."
cd backend
node src/server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 4

echo "🚀 Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3
echo "🔍 Checking frontend..."
sleep 2

# Verify servers are running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check backend.log for errors."
    cat backend.log
    exit 1
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check frontend.log for errors."
    cat frontend.log
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Servers Started Successfully!                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Frontend:  http://localhost:3000/status/"
echo "🔌 Backend:   http://localhost:3001"
echo "💚 Health:    http://localhost:3001/api/health"
echo ""
echo "📝 Logs:"
echo "   Frontend: tail -f frontend.log"
echo "   Backend:  tail -f backend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Output process IDs
echo "📌 Process IDs:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""

# Keep script running to manage child processes
wait $BACKEND_PID $FRONTEND_PID
