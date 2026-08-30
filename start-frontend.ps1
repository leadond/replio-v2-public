# Start Replio Frontend Development Server
# Prerequisites: Node.js 16+, npm or yarn

Write-Host "Starting Replio Frontend" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app will open on http://localhost:3003 (or similar port if 3003 is in use)" -ForegroundColor Green
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "- Node.js 16+ installed"
Write-Host "- npm install already run in replio-frontend directory"
Write-Host ""

Set-Location -Path "$PSScriptRoot\replio-frontend"

npm run dev
