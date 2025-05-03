# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "Starting deployment process..." -ForegroundColor Green

# Validate environment variables
Write-Host "Validating environment variables..." -ForegroundColor Yellow
$requiredVars = @(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

foreach ($var in $requiredVars) {
    if (-not (Test-Path "env:$var")) {
        Write-Host "Error: Missing required environment variable: $var" -ForegroundColor Red
        exit 1
    }
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm ci

# Run type checking
Write-Host "Running type checking..." -ForegroundColor Yellow
npm run type-check

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
npm run test:ci

# Build the application
Write-Host "Building the application..." -ForegroundColor Yellow
npm run build

# Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "Deployment completed successfully!" -ForegroundColor Green 