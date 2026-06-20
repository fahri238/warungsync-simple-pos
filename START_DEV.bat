@echo off
echo Starting Backend Server...
start cmd /k "cd back-end && npm run dev"

echo.
echo Waiting 3 seconds before starting Frontend...
timeout /t 3

echo Starting Frontend Server...
start cmd /k "cd front-end && npm run dev"

echo.
echo Both servers should be starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause
