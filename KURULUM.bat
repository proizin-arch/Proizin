@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   IzinPro - Ilk Kurulum
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo HATA: Node.js bulunamadi.
  echo Node.js 24 LTS surumunu https://nodejs.org adresinden kurun.
  echo Kurulumdan sonra bu dosyayi yeniden calistirin.
  pause
  exit /b 1
)

node scripts\check-node.js
if errorlevel 1 (
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo HATA: npm bulunamadi. Node.js 24 LTS kurulumunu yenileyin.
  pause
  exit /b 1
)

echo Bagimliliklar package-lock.json dosyasina gore kuruluyor...
call npm ci
if errorlevel 1 (
  echo.
  echo HATA: Bagimliliklar kurulurken sorun olustu.
  echo Internet baglantisini kontrol edip yeniden deneyin.
  pause
  exit /b 1
)

echo.
echo Otomatik testler calistiriliyor...
call npm test
if errorlevel 1 (
  echo.
  echo HATA: Testlerden en az biri basarisiz oldu.
  pause
  exit /b 1
)

echo.
echo Kurulum ve testler basariyla tamamlandi.
echo Artik IzinPro.sln dosyasini acip F5 tusuna basabilirsiniz.
pause
exit /b 0
