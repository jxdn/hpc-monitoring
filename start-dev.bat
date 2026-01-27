@echo off
REM HPC Monitoring Development Startup Script for Windows
REM Starts both frontend and backend servers

echo ============================================================
echo   HPC Monitoring - Development Startup
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js found: %NODE_VERSION%
echo.

REM Check if .env file exists
if not exist .env (
    echo Warning: .env file not found
    echo Creating from .env.example...
    copy .env.example .env
    echo Please edit .env with your configuration
    echo.
)

REM Check if node_modules exists for frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
    echo.
)

REM Check if node_modules exists for backend
if not exist backend\node_modules (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ============================================================
echo   Servers Started Successfully!
echo ============================================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000
echo Health:    http://localhost:5000/api/health
echo.
echo Press any key to exit this window (servers will keep running)
pause >nul
