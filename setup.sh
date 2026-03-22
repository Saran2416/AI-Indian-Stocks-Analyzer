#!/bin/bash

# AI Stock Analyzer - Quick Setup Guide
# This script helps you set up the project

echo "📊 AI Indian Stock Analyzer - Setup Guide"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo "✓ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔑 Setting up environment variables..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "✓ Created .env.local from .env.local.example"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your ANTHROPIC_API_KEY"
    echo "   You can get one from: https://console.anthropic.com"
else
    echo "✓ .env.local already exists"
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Edit .env.local and add your ANTHROPIC_API_KEY"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "📖 For more information, see README.md"
