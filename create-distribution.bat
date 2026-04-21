@echo off
echo ========================================
echo Jewellery Management System
echo Distribution Package Creator
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Build SunarKhata.exe...
call npm run build:exe
if errorlevel 1 (
    echo ERROR: Failed to build SunarKhata.exe
    pause
    exit /b 1
)

echo.
echo Step 3: Create distribution folder and ZIP...
call node create-distribution.js
if errorlevel 1 (
    echo ERROR: Failed to build or create distribution package
    pause
    exit /b 1
)

echo.
echo ========================================
echo Distribution package created successfully!
echo ========================================
echo.
echo The distribution files are in the 'dist' folder
echo The ZIP file is: /dist/SunarKhata-Distribution.zip
echo The executable is: SunarKhata.exe
echo.
echo Runtime configuration:
echo   - Edit .env next to SunarKhata.exe (same folder as build and server)
echo   - Restart the app after changing ports, URLs, or API keys
echo.
echo Runtime configuration:
echo   - Edit .env next to JewelleryApp.exe (same folder as build and server)
echo   - Restart the app after changing ports, URLs, or API keys
echo.
pause

