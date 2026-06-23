@echo off
cd /d "%~dp0ios-app"
if not exist node_modules (
  echo Installing packages (this takes 2-3 minutes)...
  call npm.cmd install --legacy-peer-deps
  if errorlevel 1 goto failed
)
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
