#!/bin/bash

# =============================================
# Mocko Designs - Local Testing Script
# =============================================

echo "🚀 Starting Mocko Designs Local Test Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists mongod; then
    echo -e "${YELLOW}⚠️ MongoDB is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please ensure MongoDB is running on localhost:27017${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Check if MongoDB is running
echo -e "${BLUE}📊 Checking MongoDB connection...${NC}"
if nc -z localhost 27017; then
    echo -e "${GREEN}✅ MongoDB is running on port 27017${NC}"
else
    echo -e "${YELLOW}⚠️ MongoDB is not running on port 27017${NC}"
    echo -e "${YELLOW}Please start MongoDB before continuing${NC}"
    read -p "Press Enter to continue anyway..."
fi

# Check for port conflicts
echo -e "${BLUE}🔍 Checking for port conflicts...${NC}"

if port_in_use 3000; then
    echo -e "${YELLOW}⚠️ Port 3000 is already in use (Frontend)${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if port_in_use 5000; then
    echo -e "${YELLOW}⚠️ Port 5000 is already in use (Backend)${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"

echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd server/consolidated-server
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd ../../client
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

cd ..

# Set up environment files
echo -e "${BLUE}⚙️ Setting up environment configuration...${NC}"

if [ ! -f "server/consolidated-server/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cp server/consolidated-server/.env.example server/consolidated-server/.env
fi

if [ ! -f "client/.env.local" ]; then
    echo -e "${YELLOW}Creating frontend .env.local file...${NC}"
    # File already exists from our previous setup
fi

# Health check function
health_check() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"

# Start backend
echo -e "${YELLOW}Starting backend server...${NC}"
cd server/consolidated-server
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../../backend.pid

# Wait for backend to be ready
cd ../..
if ! health_check "Backend" "http://localhost:5000/health"; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
cd client
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid

# Wait for frontend to be ready
cd ..
if ! health_check "Frontend" "http://localhost:3000"; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Success message
echo
echo -e "${GREEN}🎉 Mocko Designs is now running locally!${NC}"
echo
echo -e "${BLUE}📍 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}📍 Backend API: http://localhost:5000${NC}"
echo -e "${BLUE}📍 Health Check: http://localhost:5000/health${NC}"
echo
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend: tail -f logs/backend.log"
echo -e "   Frontend: tail -f logs/frontend.log"
echo
echo -e "${YELLOW}🛑 To stop services:${NC}"
echo -e "   Run: ./scripts/stop-local.sh"
echo -e "   Or: kill \$(cat backend.pid frontend.pid)"
echo

# Keep script running and monitor services
echo -e "${BLUE}👀 Monitoring services... (Ctrl+C to stop)${NC}"

monitor_services() {
    while true; do
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "${RED}❌ Backend service stopped unexpectedly${NC}"
            break
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${RED}❌ Frontend service stopped unexpectedly${NC}"
            break
        fi
        
        sleep 5
    done
}

# Handle Ctrl+C gracefully
cleanup() {
    echo
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    # Clean up PID files
    rm -f backend.pid frontend.pid
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start monitoring
monitor_services