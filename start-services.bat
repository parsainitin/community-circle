@echo off
title Launch CommunityCircle, msgservice, and Evolution API
echo ==================================================
echo Starting Integrated Ecosystem Services
echo ==================================================

set "ROOT_DIR=%~dp0"
set "MSG_DIR=%~dp0msgservice"
set "EVO_DIR=%~dp0msgservice\evolution-api"

echo.
echo Freeing port 8080 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo Freeing port 3000 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo Freeing port 3001 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

echo.
echo 1. Launching Evolution API (WhatsApp Gateway - Port 8080)...
start "Evolution API (Port 8080)" cmd /k "cd /d "%EVO_DIR%" && npm start"

timeout /t 3 /nobreak >nul

echo.
echo 2. Launching msgservice (Port 3000)...
start "msgservice (Port 3000)" cmd /k "cd /d "%MSG_DIR%" && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo 3. Launching CommunityCircle (Port 3001)...
start "CommunityCircle (Port 3001)" cmd /k "cd /d "%ROOT_DIR%" && npm run dev -- -p 3001"

echo.
echo ==================================================
echo All 3 services launched in separate windows!
echo • Evolution API:       http://localhost:8080
echo • msgservice API:       http://localhost:3000
echo • CommunityCircle App:  http://localhost:3001
echo ==================================================
pause
