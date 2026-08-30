@echo off
REM Start Both Replio Backend and Frontend in Separate Windows

cd /d "%~dp0"

echo Starting Replio Backend and Frontend...
echo.

REM Start Backend in a new window
start "Replio Backend" cmd /k call start-backend.bat

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak

REM Start Frontend in a new window
start "Replio Frontend" cmd /k call start-frontend.bat

echo.
echo Both servers are starting in separate windows...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3003 (or next available port)
echo.
echo Close the windows to stop the servers.

pause
