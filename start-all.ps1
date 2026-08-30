# Start Both Replio Backend and Frontend in Separate Windows

Write-Host "Starting Replio Backend and Frontend..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend in a new window
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -File `"$scriptDir\start-backend.ps1`"" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend in a new window
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -File `"$scriptDir\start-frontend.ps1`"" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting in separate windows..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3003 (or next available port)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close the windows to stop the servers." -ForegroundColor Gray
