@echo off
cd /d "%~dp0"

echo Starting Wedding Invitation server...
echo Open http://localhost:8000 in your browser
echo Press Ctrl+C to stop the server.
echo.

start "" "http://localhost:8000"
python -m http.server 8000
