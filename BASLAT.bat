@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo HATA: Node.js bulunamadi. Once KURULUM.bat dosyasini calistirin.
  pause
  exit /b 1
)

node scripts\check-node.js
if errorlevel 1 (
  pause
  exit /b 1
)

if not exist "node_modules\better-sqlite3" (
  echo Bagimliliklar bulunamadi; ilk kurulum yapiliyor...
  call npm ci
  if errorlevel 1 (
    echo HATA: Kurulum tamamlanamadi.
    pause
    exit /b 1
  )
)

echo IzinPro baslatiliyor. Kapatmak icin Ctrl+C tuslarina basin.
call npm run start:vs
