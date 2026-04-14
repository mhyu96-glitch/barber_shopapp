@echo off
set FLUTTER_PATH=C:\flutter_windows_3.41.4-stable\flutter\bin\flutter.bat

:start
cls
echo ==================================================
echo       BarberPro Mobile Development Launcher
echo ==================================================
echo.
echo 1. Jalankan FLUTTER Mobile App (Native)
echo 2. Jalankan WEB SPA Gold App (Vite)
echo 3. Keluar
echo.
set /p choice="Pilih opsi (1-3): "

if "%choice%"=="1" goto flutter
if "%choice%"=="2" goto vite
if "%choice%"=="3" exit
goto start

:flutter
echo.
echo [1/2] Menjalankan BarberPro Mobile di Port 9000...
cd mobile
call "%FLUTTER_PATH%" run -d chrome --web-port 9000 --web-hostname 127.0.0.1
pause
goto start

:vite
echo.
echo [2/2] Menjalankan Web SPA Gold App di Port 9000...
echo Pastikan Anda sudah menjalankan 'npm install' sebelumnya.
call npm run dev
pause
goto start
