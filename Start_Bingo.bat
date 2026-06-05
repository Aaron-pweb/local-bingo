@echo off
TITLE Local Bingo System
COLOR 0B

echo =========================================================
echo               BINGO SYSTEM LAUNCHER
echo =========================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed on this computer!
    echo Please install Python 3.10 or higher from the Microsoft Store or python.org.
    echo.
    pause
    exit /b
)

:: Check if virtual environment exists, if not, build it.
IF NOT EXIST "venv\Scripts\python.exe" (
    echo [1/3] First-time setup detected. Creating virtual environment...
    python -m venv venv
    
    echo [2/3] Installing dependencies. This might take a minute...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) ELSE (
    echo [1/3] System environment verified.
    call venv\Scripts\activate.bat
)

echo [3/3] Starting Local Bingo Server...
:: Start the Flask server in the background of this terminal
start /b python backend\app.py

:: Give the server 3 seconds to boot up
timeout /t 3 /nobreak > NUL

echo.
echo Launching TV Display and Caller Dashboard in App Mode...

:: Launch the Edge browser without URL bars (looks like native software)
start msedge.exe --app=http://127.0.0.1:5000/display --start-fullscreen
start msedge.exe --app=http://127.0.0.1:5000/caller

echo.
echo =========================================================
echo     SYSTEM IS LIVE! DO NOT CLOSE THIS WINDOW.
echo =========================================================
echo Both the TV Display and the Caller Dashboard have been opened.
echo To shut down the game completely, press CTRL+C and type Y.
echo.
pause
