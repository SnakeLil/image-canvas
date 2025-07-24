@echo off
REM IOPaint Setup Script for Magic Eraser (Windows)
REM This script helps you install and run IOPaint locally for free image inpainting

echo 🎨 Magic Eraser - IOPaint Setup Script (Windows)
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    echo    Visit: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found
python --version

REM Check if pip is installed
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pip is not installed. Please install pip first.
    pause
    exit /b 1
)

echo ✅ pip found
echo.

REM Create virtual environment (recommended)
echo 📦 Setting up virtual environment...
if not exist "iopaint_env" (
    python -m venv iopaint_env
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

REM Activate virtual environment
call iopaint_env\Scripts\activate.bat
echo ✅ Virtual environment activated

REM Install IOPaint
echo.
echo ⬇️  Installing IOPaint...
python -m pip install --upgrade pip
pip install iopaint

if %errorlevel% equ 0 (
    echo ✅ IOPaint installed successfully!
) else (
    echo ❌ Failed to install IOPaint
    pause
    exit /b 1
)

REM Create startup script
echo.
echo 📝 Creating startup script...
(
echo @echo off
echo echo 🚀 Starting IOPaint server...
echo echo Server will be available at: http://localhost:8080
echo echo Press Ctrl+C to stop the server
echo echo.
echo.
echo REM Activate virtual environment
echo call iopaint_env\Scripts\activate.bat
echo.
echo REM Start IOPaint with recommended settings
echo iopaint start --model=lama --port=8080 --host=0.0.0.0 --no-half --cpu-offload --disable-nsfw --enable-interactive-seg
echo.
echo pause
) > start_iopaint.bat

echo ✅ Startup script created: start_iopaint.bat

REM Create stop script
(
echo @echo off
echo echo 🛑 Stopping IOPaint server...
echo taskkill /f /im python.exe /fi "WINDOWTITLE eq IOPaint*" 2^>nul
echo echo ✅ IOPaint server stopped
echo pause
) > stop_iopaint.bat

echo ✅ Stop script created: stop_iopaint.bat

REM Test installation
echo.
echo 🧪 Testing IOPaint installation...
iopaint --help >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ IOPaint is working correctly!
) else (
    echo ❌ IOPaint installation test failed
    pause
    exit /b 1
)

echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo 📋 Next Steps:
echo 1. Double-click: start_iopaint.bat
echo 2. Wait for the server to start (may take a few minutes on first run)
echo 3. Open your Magic Eraser app at http://localhost:3001
echo 4. Go to API Settings and select 'IOPaint (Local)'
echo 5. Set the server URL to: http://localhost:8080
echo.
echo 💡 Tips:
echo - First run will download the AI model (~100MB)
echo - Keep the command window open while using IOPaint
echo - Use stop_iopaint.bat to stop the server
echo - IOPaint is completely free and runs offline!
echo.
echo 🔧 Troubleshooting:
echo - If port 8080 is busy, edit start_iopaint.bat and change the port
echo - For GPU acceleration, install PyTorch with CUDA support
echo - Check the IOPaint documentation: https://github.com/Sanster/IOPaint
echo.

REM Deactivate virtual environment
call iopaint_env\Scripts\deactivate.bat

pause
