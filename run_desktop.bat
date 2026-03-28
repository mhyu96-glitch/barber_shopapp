@echo off
title BarberPro - Desktop Mode
echo ============================================
echo   BarberPro Desktop App
echo ============================================
echo.
echo [1/2] Building web app...
call npm run build
echo.
echo [2/2] Starting Electron...
call npx electron .
