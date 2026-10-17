@echo off
title Albion Artisan Calculator - Developer Launcher
echo ========================================================
echo   Launching Albion Artisan Calculator (Browser / Dev Mode)
echo ========================================================
echo.

:: Start Django Backend (with automatic SQLite migration)
echo [1/2] Starting Django Backend on http://127.0.0.1:8000 ...
start "Albion Backend (Django)" cmd /k "cd /d "%~dp0backend" && ..\.venv\Scripts\python.exe manage.py migrate && ..\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

:: Start Vite Frontend
echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "Albion Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo Both servers are running! Browser opening at http://localhost:5173
echo ========================================================
pause
