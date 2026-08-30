@echo off
REM Start Replio Frontend Development Server
REM Prerequisites: Node.js 16+, npm or yarn

cd /d "%~dp0replio-frontend"

echo Starting Replio Frontend
echo.
echo The app will open on http://localhost:3003 (or similar port if 3003 is in use)
echo.
echo Prerequisites:
echo - Node.js 16+ installed
echo - npm install already run in replio-frontend directory
echo.

npm run dev

pause
