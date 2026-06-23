@echo off
cd /d "%~dp0ios-app"
echo Cleaning old install...
if exist node_modules (
  rmdir /s /q node_modules
  if errorlevel 1 goto failed
)
echo Installing exact locked packages (this takes 2-3 minutes)...
call npm.cmd ci --legacy-peer-deps
if errorlevel 1 goto failed
echo Starting app...
set EXPO_NO_DEPENDENCY_VALIDATION=1
call npx.cmd expo start --clear
if errorlevel 1 goto failed
pause
exit /b 0

:failed
echo.
echo App failed to launch. Check the error above.
pause
exit /b 1
