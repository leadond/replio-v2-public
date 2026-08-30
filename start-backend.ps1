# Start Replio Backend Server
# Prerequisites: Python 3.8+, PostgreSQL running

Write-Host "Starting Replio Backend on http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "- PostgreSQL must be running on localhost:5432"
Write-Host "- Database: replio (user: replio, password: replio)"
Write-Host "- Environment: replio-backend/.env must be configured"
Write-Host ""

Set-Location -Path "$PSScriptRoot\replio-backend"

& python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
