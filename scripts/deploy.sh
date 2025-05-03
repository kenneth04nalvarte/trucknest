#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Validate environment variables
echo "🔍 Validating environment variables..."
if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ] || \
   [ -z "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" ] || \
   [ -z "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ] || \
   [ -z "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" ] || \
   [ -z "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" ] || \
   [ -z "$NEXT_PUBLIC_FIREBASE_APP_ID" ]; then
  echo "❌ Error: Missing required Firebase environment variables"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Build the application
echo "🏗️ Building the application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed successfully!" 