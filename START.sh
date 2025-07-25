#!/bin/bash

# ChatMe Startup Script
echo "🚀 Starting ChatMe Application..."

# Check if required tools are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Kill any existing processes on required ports
echo "🔧 Checking for existing processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:9000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
PORT=9000 npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

# Start backend
echo "🔧 Starting backend server..."
cd backend
export OPENAI_API_KEY="your_openai_api_key_here"
export NODE_ENV=development
PORT=5001 npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start main server
echo "🌐 Starting main server..."
node server.js &
MAIN_PID=$!

# Wait for all servers to start
sleep 3

echo "✅ ChatMe is starting up!"
echo "📱 Landing page: http://localhost:8080"
echo "💬 FlowChat app: http://localhost:8080/flowchat"
echo ""
echo "⏳ Please wait a moment for all services to fully start..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down ChatMe..."
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    kill $MAIN_PID 2>/dev/null || true
    echo "✅ ChatMe stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🎉 ChatMe is ready!"
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait 