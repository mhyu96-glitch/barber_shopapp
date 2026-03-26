@echo off
set FLUTTER_PATH=C:\flutter_windows_3.41.4-stable\flutter\bin\flutter.bat
cd mobile
echo Menjalankan BarberPro Mobile di Chrome (Port 9000)...
call "%FLUTTER_PATH%" run -d chrome --web-port 9000 --web-hostname 127.0.0.1
pause
