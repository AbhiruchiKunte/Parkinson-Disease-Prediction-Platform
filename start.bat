@echo off

echo Starting Parkinson Disease Prediction Platform...

:: Start Backend
start "Backend Server" cmd "cd backend && set FLASK_ENV=development && python app.py"

:: Start Frontend
start "Frontend Client" cmd "cd frontend && npm run dev"

echo.
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:5173
echo.
echo Services started successfully.

pause
