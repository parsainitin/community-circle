# Windows PowerShell Script to Start Evolution API, msgservice & CommunityCircle

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Integrated Ecosystem Services" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$rootDir = $PSScriptRoot
$msgServiceDir = Join-Path $rootDir "msgservice"
$evoApiDir = Join-Path $msgServiceDir "evolution-api"

# Check directories
if (-not (Test-Path $msgServiceDir)) {
    Write-Host "❌ Error: msgservice directory not found at $msgServiceDir" -ForegroundColor Red
    exit 1
}

# Automatically free ports 8080, 3000 & 3001 if occupied by stale processes
foreach ($port in @(8080, 3000, 3001)) {
    $procs = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pidToKill in $procs) {
        if ($pidToKill -and $pidToKill -ne 0) {
            Write-Host "🧹 Freeing port $port (PID: $pidToKill)..." -ForegroundColor Yellow
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "`n1️⃣ Launching Evolution API (WhatsApp Gateway - Port 8080)..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$evoApiDir'; Write-Host '--- Starting Evolution API (Port 8080) ---' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 3

Write-Host "`n2️⃣ Launching msgservice (WhastFlow Backend - Port 3000)..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$msgServiceDir'; Write-Host '--- Starting msgservice (Port 3000) ---' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

Write-Host "`n3️⃣ Launching CommunityCircle Next.js App (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; Write-Host '--- Starting CommunityCircle (Port 3001) ---' -ForegroundColor Green; npm run dev -- -p 3001"

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "✅ All 3 services launched in separate windows!" -ForegroundColor Green
Write-Host "• Evolution API:       http://localhost:8080" -ForegroundColor Cyan
Write-Host "• msgservice API:       http://localhost:3000" -ForegroundColor Cyan
Write-Host "• CommunityCircle App:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
