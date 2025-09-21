@echo off
setlocal enabledelayedexpansion

REM =============================================
REM Mocko Designs - Local Testing Script (Windows)
REM =============================================

echo [92m🚀 Starting Mocko Designs Local Test Environment...[0m

REM Function to check if command exists
where node >nul 2>&1
if errorlevel 1 (
    echo [91m❌ Node.js is not installed[0m
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [91m❌ npm is not installed[0m
    exit /b 1
)

echo [92m✅ Prerequisites check completed[0m

REM Check if MongoDB is running
echo [94m📊 Checking MongoDB connection...[0m
netstat -an | find ":27017" >nul
if errorlevel 1 (
    echo [93m⚠️ MongoDB is not running on port 27017[0m
    echo [93mPlease start MongoDB before continuing[0m
    pause
) else (
    echo [92m✅ MongoDB is running on port 27017[0m
)

REM Check for port conflicts
echo [94m🔍 Checking for port conflicts...[0m

netstat -an | find ":3000" >nul
if not errorlevel 1 (
    echo [93m⚠️ Port 3000 is already in use (Frontend)[0m
    set /p choice="Continue anyway? (y/n): "
    if /i not "!choice!"=="y" exit /b 1
)

netstat -an | find ":5000" >nul
if not errorlevel 1 (
    echo [93m⚠️ Port 5000 is already in use (Backend)[0m
    set /p choice="Continue anyway? (y/n): "
    if /i not "!choice!"=="y" exit /b 1
)

REM Create logs directory
if not exist "logs" mkdir logs

REM Install dependencies
echo [94m📦 Installing dependencies...[0m

echo [93mInstalling backend dependencies...[0m
cd server\consolidated-server
call npm install
if errorlevel 1 (
    echo [91m❌ Failed to install backend dependencies[0m
    exit /b 1
)

echo [93mInstalling frontend dependencies...[0m
cd ..\..\client
call npm install
if errorlevel 1 (
    echo [91m❌ Failed to install frontend dependencies[0m
    exit /b 1
)

cd ..

REM Set up environment files
echo [94m⚙️ Setting up environment configuration...[0m

if not exist "server\consolidated-server\.env" (
    echo [93mCreating backend .env file...[0m
    if exist "server\consolidated-server\.env.example" (
        copy "server\consolidated-server\.env.example" "server\consolidated-server\.env" >nul
    )
)

REM Start services
echo [94m🚀 Starting services...[0m

REM Start backend
echo [93mStarting backend server...[0m
cd server\consolidated-server
start "Backend Server" cmd /c "npm run dev > ..\..\logs\backend.log 2>&1"

REM Wait for backend to be ready
cd ..\..
echo [93mWaiting for backend to be ready...[0m
timeout /t 10 /nobreak >nul

REM Check if backend is responding
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [91m❌ Backend may not have started properly[0m
    echo [93mChecking logs/backend.log for details...[0m
) else (
    echo [92m✅ Backend is ready[0m
)

REM Start frontend
echo [93mStartalling frontend server...[0m
cd client
start "Frontend Server" cmd /c "npm run dev > ..\logs\frontend.log 2>&1"

REM Wait for frontend to be ready
cd ..
echo [93mWaiting for frontend to be ready...[0m
timeout /t 15 /nobreak >nul

REM Check if frontend is responding
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo [91m❌ Frontend may not have started properly[0m
    echo [93mChecking logs/frontend.log for details...[0m
) else (
    echo [92m✅ Frontend is ready[0m
)

REM Success message
echo.
echo [92m🎉 Mocko Designs is now running locally![0m
echo.
echo [94m📍 Frontend: http://localhost:3000[0m
echo [94m📍 Backend API: http://localhost:5000[0m
echo [94m📍 Health Check: http://localhost:5000/health[0m
echo.
echo [93m📝 Logs:[0m
echo    Backend: type logs\backend.log
echo    Frontend: type logs\frontend.log
echo.
echo [93m🛑 To stop services:[0m
echo    Close the Backend Server and Frontend Server windows
echo    Or press Ctrl+C in those windows
echo.

pause