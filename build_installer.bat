@echo off
title BarberPro - Build Installer
echo ============================================
echo   BarberPro Installer Builder
echo ============================================
echo.
echo [1/2] Building web app...
call npm run build
echo.
echo [2/2] Building Windows installer...
call npx electron-builder --win
echo.
echo ============================================
echo   Installer created in /release folder!
echo ============================================
pause
