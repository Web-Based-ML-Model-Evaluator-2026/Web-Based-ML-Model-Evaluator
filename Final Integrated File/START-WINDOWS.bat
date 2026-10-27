@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher was not found. Install Python 3.10+ from https://www.python.org/downloads/ and enable Add Python to PATH.
  pause
  exit /b 1
)
echo Starting Web-Based ML Model Evaluator...
echo Keep this window open. Browse to http://127.0.0.1:8000
py -3 app\server.py
if errorlevel 1 (
  echo.
  echo The server exited with an error. Check that Python 3.10+ is installed and port 8000 is available.
  pause
)
endlocal
