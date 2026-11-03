@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (echo Python 3.10+ is required. Install from https://python.org and enable Add Python to PATH.& pause & exit /b 1)
python -c "import sklearn, pandas" >nul 2>nul
if errorlevel 1 (echo Installing required Python packages...& python -m pip install -r backend\requirements.txt)
if errorlevel 1 (echo Dependency installation failed.& pause & exit /b 1)
timeout /t 2 >nul
start "ModelLab Browser" http://127.0.0.1:8000
python backend\server.py
pause
