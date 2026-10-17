@echo off
title Albion Artisan Calculator - Local & Developer Launcher
cd /d "%~dp0"

echo ========================================================
echo   Albion Artisan Calculator - Local & Developer Mode
echo ========================================================
echo.

:: 1. First-Time Auto-Setup: Create Python .venv if missing
if not exist ".venv\Scripts\python.exe" (
    echo [First-Time Setup] Creating Python virtual environment (.venv)...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Python 3.10+ was not found on your PATH.
        echo Please install Python from https://www.python.org/downloads/ and check "Add Python to PATH".
        pause
        exit /b 1
    )
    echo [First-Time Setup] Installing backend dependencies...
    ".venv\Scripts\python.exe" -m pip install --upgrade pip
    ".venv\Scripts\pip.exe" install -r "backend\requirements.txt"
    echo.
)

:: 2. First-Time Auto-Setup: Install frontend node_modules if missing
if not exist "frontend\node_modules" (
    echo [First-Time Setup] Installing frontend packages (npm install)...
    pushd "%~dp0frontend"
    call npm install
    popd
    echo.
)

:: 3. Start Django Backend (with automatic SQLite migration)
echo [1/2] Starting Django Backend on http://127.0.0.1:8000 ...
start "Albion Backend (Django)" cmd /k "cd /d "%~dp0backend" && ..\.venv\Scripts\python.exe manage.py migrate && ..\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

:: 4. Start Vite Frontend
echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "Albion Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo Both servers are running! Browser opening at http://localhost:5173
echo ========================================================
pause
