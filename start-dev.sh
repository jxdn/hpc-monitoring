#!/bin/bash

# HPC Monitoring Development Startup Script
# Starts both frontend and backend servers

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

echo "🚀 Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

echo "🚀 Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Servers Started Successfully!                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Frontend:  http://localhost:3000"
echo "🔌 Backend:   http://localhost:5000"
echo "💚 Health:    http://localhost:5000/api/health"
echo ""
echo "📝 Logs:"
echo "   Frontend: tail -f frontend.log"
echo "   Backend:  tail -f backend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
