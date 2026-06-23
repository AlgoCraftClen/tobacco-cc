@echo off
cd /d "%~dp0ios-app"
echo Cleaning old install...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo Installing packages (this takes 2-3 minutes)...
npm install --legacy-peer-deps
echo Starting app...
npx expo start --clear
pause
