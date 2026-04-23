@echo off
echo ==========================================
echo   🚀 Starting Students Learning Platform
echo ==========================================

:: Change directory to current folder
cd /d "%~dp0"

:: Start Backend and Frontend concurrently using the npm script
:: This also triggers the new AI auto-start logic in server.js
npm start

pause
