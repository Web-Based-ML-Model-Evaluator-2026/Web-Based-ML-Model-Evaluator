@echo off
setlocal
cd /d "%~dp0"
echo.
echo  Model Evaluator - Sprint 3 Integrated Application
echo  Checking Python...
python --version
if errorlevel 1 (
  echo Python was not found. Install Python 3.10 or newer and enable Add Python to PATH.
  pause
  exit /b 1
)
echo.
echo Starting local application at http://127.0.0.1:8000
echo Keep this window open while using the application.
echo Press Ctrl+C to stop.
python backend\server.py
pause
