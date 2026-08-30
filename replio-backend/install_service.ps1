# PowerShell script to create a Windows Service for Replio Backend
# Run as Administrator

$serviceName = "ReplioBackend"
$displayName = "Replio v2 Backend API"
$description = "AI Auto-Attendant Backend Service"
$backendPath = "C:\AI\Clients\DweezyAiTEAM\v_assistant\replio-v2\replio-backend"
$pythonPath = "C:\Python314\python.exe"

# Check if service already exists
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "Service already exists. Removing..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force
    Remove-Service -Name $serviceName -Force
    Start-Sleep -Seconds 2
}

# Create batch file to launch the service
$batchFile = "$backendPath\start_service.bat"
@"
@echo off
cd /d "$backendPath"
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
"@ | Set-Content $batchFile

Write-Host "Creating Windows Service..." -ForegroundColor Cyan

# Create the service using NSSM (Non-Sucking Service Manager)
# First, check if NSSM is available, if not provide alternative

$nssmPath = "C:\Program Files\NSSM\nssm.exe"
if (Test-Path $nssmPath) {
    & $nssmPath install $serviceName "$pythonPath" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
    & $nssmPath set $serviceName AppDirectory "$backendPath"
    & $nssmPath set $serviceName AppParameters "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
    Write-Host "Service created with NSSM" -ForegroundColor Green
} else {
    Write-Host "`nNSSM not found. Alternative method:" -ForegroundColor Yellow
    Write-Host "`n1. Download NSSM from: https://nssm.cc/download" -ForegroundColor White
    Write-Host "2. Extract to: C:\Program Files\NSSM" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host "`nOR use the batch file for manual startup:" -ForegroundColor Yellow
    Write-Host "   $batchFile" -ForegroundColor Cyan
}

Write-Host "`nService Installation Complete!" -ForegroundColor Green
Write-Host "Service Name: $serviceName" -ForegroundColor Cyan
Write-Host "Display Name: $displayName" -ForegroundColor Cyan
Write-Host "`nTo start the service:" -ForegroundColor Yellow
Write-Host "  Start-Service -Name `"$serviceName`"" -ForegroundColor White
Write-Host "`nTo check status:" -ForegroundColor Yellow
Write-Host "  Get-Service -Name `"$serviceName`"" -ForegroundColor White
