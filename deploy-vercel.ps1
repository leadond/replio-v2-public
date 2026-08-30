# Deploy Replio Frontend to Vercel

Write-Host "Deploying Replio Frontend to Vercel..." -ForegroundColor Cyan
Write-Host ""

cd "$PSScriptRoot\replio-frontend"

# Check if vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "Starting Vercel deployment..." -ForegroundColor Green
Write-Host ""
Write-Host "You will be asked to:" -ForegroundColor Yellow
Write-Host "1. Link to your Vercel account (or create one)"
Write-Host "2. Confirm project settings"
Write-Host ""

vercel

Write-Host ""
Write-Host "Deployment complete! Your app is now live on Vercel." -ForegroundColor Green
Write-Host "Update the backend URL in src/api/client.ts and redeploy if needed." -ForegroundColor Yellow
