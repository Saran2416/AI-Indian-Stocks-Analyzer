@echo off
REM AI Stock Analyzer - Quick Setup Guide
REM This script helps you set up the project on Windows

echo.
echo 📊 AI Indian Stock Analyzer - Setup Guide
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i

echo ✓ Node.js version: %NODE_VERSION%
echo ✓ npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✓ Dependencies installed successfully
echo.

REM Create .env.local if it doesn't exist
echo 🔑 Setting up environment variables...
if not exist .env.local (
    copy .env.local.example .env.local
    echo ✓ Created .env.local from .env.local.example
    echo.
    echo ⚠️  Optional: edit .env.local to use Google Gemini (free tier) or local Ollama
    echo    Without a key, the app uses its built-in analyzer.
    echo    Gemini key: https://aistudio.google.com/apikey
) else (
    echo ✓ .env.local already exists
)

echo.
echo ✅ Setup complete! Next steps:
echo.
echo 1. (Optional) Add a free Gemini key to .env.local, or use built-in analysis
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
echo 📖 For more information, see README.md
