@echo off
:: ─────────────────────────────────────────────────────────────────────────────
::  DSA Chatbot — dev launcher (Windows)
::  Opens two cmd windows: one for the FastAPI backend, one for the Vite frontend.
::  Close either window to stop that service.
:: ─────────────────────────────────────────────────────────────────────────────
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "VENV_DIR=%BACKEND_DIR%\.venv"
set "PYTHON=%VENV_DIR%\Scripts\python.exe"
set "PIP=%VENV_DIR%\Scripts\pip.exe"
set "UVICORN=%VENV_DIR%\Scripts\uvicorn.exe"

:: ── Banner ────────────────────────────────────────────────────────────────────
echo.
echo  ======================================
echo        DSA Chatbot --- Dev Start
echo  ======================================
echo.

:: ── Dependency checks ─────────────────────────────────────────────────────────
echo [CHECK] Verifying system dependencies...

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] python not found. Install Python 3.9+ and add it to PATH.
    goto :fail
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] node not found. Install Node.js 18+ from https://nodejs.org
    goto :fail
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found. It ships with Node.js -- reinstall Node.js.
    goto :fail
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
for /f %%v in ('node --version') do set NODE_VER=%%v
echo [  OK ] python %PY_VER%  ^|  node %NODE_VER%

:: ── .env guards ───────────────────────────────────────────────────────────────
echo.
echo [CHECK] Checking .env files...

if not exist "%BACKEND_DIR%\.env" (
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
    echo [ WARN] backend\.env created from .env.example
    echo        Update LLM_API_KEY and API_TOKEN before using the chatbot.
) else (
    echo [  OK ] backend\.env found
    findstr /C:"your_api_key_here" /C:"your_secret_token_here" "%BACKEND_DIR%\.env" >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [ WARN] backend\.env still has placeholder values -- update LLM_API_KEY / API_TOKEN.
    )
)

if not exist "%FRONTEND_DIR%\.env" (
    copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
    echo [ WARN] frontend\.env created from .env.example
    echo        Set VITE_API_TOKEN to match your backend API_TOKEN.
) else (
    echo [  OK ] frontend\.env found
    findstr /C:"your_secret_token_here" "%FRONTEND_DIR%\.env" >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [ WARN] frontend\.env still has placeholder VITE_API_TOKEN.
    )
)

:: ── Python virtualenv ─────────────────────────────────────────────────────────
echo.
echo [SETUP] Setting up Python virtualenv...

if not exist "%VENV_DIR%" (
    python -m venv "%VENV_DIR%"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtualenv.
        goto :fail
    )
    echo [  OK ] Virtualenv created at backend\.venv
) else (
    echo [  OK ] Virtualenv already exists
)

echo [SETUP] Installing backend dependencies...
"%PIP%" install --quiet --upgrade pip
"%PIP%" install --quiet -r "%BACKEND_DIR%\requirements.txt"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pip install failed -- check requirements.txt and your internet connection.
    goto :fail
)
echo [  OK ] Backend dependencies ready

:: ── Frontend node_modules ─────────────────────────────────────────────────────
echo.
echo [SETUP] Installing frontend dependencies...

if not exist "%FRONTEND_DIR%\node_modules" (
    pushd "%FRONTEND_DIR%"
    npm install --silent
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        popd
        goto :fail
    )
    popd
    echo [  OK ] Frontend node_modules installed
) else (
    echo [  OK ] node_modules already present
)

:: ── Launch services in separate windows ───────────────────────────────────────
echo.
echo [START] Launching services...
echo.

:: Backend window
start "DSA Chatbot ^| Backend :8000" cmd /k ^
    "title DSA Chatbot ^| Backend :8000 && cd /d "%BACKEND_DIR%" && echo. && echo  Backend running at http://localhost:8000 && echo  Press Ctrl+C to stop. && echo. && "%UVICORN%" app.main:app --reload --host 0.0.0.0 --port 8000"

:: Small pause so uvicorn binds before frontend tries to contact it
timeout /t 2 /nobreak >nul

:: Frontend window
start "DSA Chatbot ^| Frontend :5173" cmd /k ^
    "title DSA Chatbot ^| Frontend :5173 && cd /d "%FRONTEND_DIR%" && echo. && echo  Frontend running at http://localhost:5173 && echo  Press Ctrl+C to stop. && echo. && npm run dev"

echo [  OK ] Backend  window opened  -- http://localhost:8000
echo [  OK ] Frontend window opened  -- http://localhost:5173
echo.
echo  Both services are starting in separate windows.
echo  Close a window to stop that service.
echo.

:: Open browser after a short delay
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"

goto :eof

:: ── Error exit ────────────────────────────────────────────────────────────────
:fail
echo.
echo [ABORT] Fix the errors above and re-run start.bat
echo.
pause
exit /b 1
