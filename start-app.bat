@echo off
cd /d "%~dp0ios-app"

echo Checking expo version...
set EXPO_OK=0
if exist node_modules\expo\package.json (
  findstr /C:"\"version\": \"54." node_modules\expo\package.json >nul 2>&1
  if not errorlevel 1 set EXPO_OK=1
)

if "%EXPO_OK%"=="0" (
  echo Wrong or missing expo version - reinstalling...
  if exist node_modules rmdir /s /q node_modules
  if exist package-lock.json del package-lock.json
  echo Installing packages ^(this takes 2-3 minutes^)...
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
echo Something went wrong. Check the error above.
pause
exit /b 1
