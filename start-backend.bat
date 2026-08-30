@echo off
REM Start Replio Backend Server
REM Prerequisites: Python 3.8+, PostgreSQL running

cd /d "%~dp0replio-backend"

echo Starting Replio Backend on http://localhost:8000
echo.
echo Prerequisites:
echo - PostgreSQL must be running on localhost:5432
echo - Database: replio (user: replio, password: replio)
echo - Environment: replio-backend/.env must be configured
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
