@echo off
setlocal
cd /d "%~dp0"
echo Installing KALU server dependencies...
call npm install
if errorlevel 1 goto failed
echo Installing KALU client dependencies...
call npm install --prefix client
if errorlevel 1 goto failed
echo Building KALU frontend...
call npm run build --prefix client
if errorlevel 1 goto failed
if not exist .env copy .env.example .env
echo.
echo Installation complete. Edit .env and add your MongoDB URI and JWT_SECRET.
pause
exit /b 0
:failed
echo.
echo Installation/build failed. Copy the full error and share it.
pause
exit /b 1
