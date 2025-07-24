#!/bin/bash

# FlowChat Setup Script
echo "🚀 Setting up FlowChat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend environment file..."
    cp backend/env.example backend/.env
    print_warning "Please edit backend/.env and add your OpenAI API key"
else
    print_status "Backend environment file already exists"
fi

if [ ! -f "frontend/.env" ]; then
    print_status "Creating frontend environment file..."
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
EOF
    print_status "Frontend environment file created"
else
    print_status "Frontend environment file already exists"
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" backend/.env; then
    print_warning "Please add your OpenAI API key to backend/.env"
    echo "You can get an API key from: https://platform.openai.com/api-keys"
fi

# Create logs directory
mkdir -p backend/logs
print_status "Created logs directory"

# Build and start services
print_status "Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "Services are running!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   Health Check: http://localhost:5000/health"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker-compose down"
    echo ""
    print_warning "Don't forget to add your OpenAI API key to backend/.env"
else
    print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

print_status "Setup complete! 🎉" 