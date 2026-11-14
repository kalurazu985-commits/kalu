@echo off
setlocal
cd /d "%~dp0"
if not exist .env (echo Missing .env. Copy .env.example to .env and configure MongoDB first.& pause & exit /b 1)
if not exist client\dist (echo Frontend build missing. Run INSTALL_AND_RUN.bat first.& pause & exit /b 1)
call npm start
pause
