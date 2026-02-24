@echo off
echo Installing IPFS for Windows...
echo.

REM Check if IPFS is already installed
ipfs --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo IPFS is already installed!
    ipfs --version
    echo.
    goto :init
)

echo IPFS not found. Downloading...
echo.

REM Create temp directory
if not exist "temp" mkdir temp

REM Download IPFS
echo Downloading IPFS from official source...
powershell -Command "Invoke-WebRequest -Uri 'https://dist.ipfs.tech/kubo/v0.28.0/kubo_v0.28.0_windows-amd64.zip' -OutFile 'temp\ipfs.zip'"

if %ERRORLEVEL% neq 0 (
    echo Failed to download IPFS. Please download manually from:
    echo https://dist.ipfs.tech/kubo/v0.28.0/kubo_v0.28.0_windows-amd64.zip
    pause
    exit /b 1
)

REM Extract IPFS
echo Extracting IPFS...
powershell -Command "Expand-Archive -Path 'temp\ipfs.zip' -DestinationPath 'temp\' -Force"

REM Move to program files
echo Installing IPFS to C:\ipfs...
if exist "C:\ipfs" rmdir /s /q "C:\ipfs"
move "temp\kubo" "C:\ipfs"

REM Clean up
rmdir /s /q temp

REM Add to PATH (current session only)
set PATH=%PATH%;C:\ipfs

echo.
echo IPFS installed successfully!
echo.

:init
echo Initializing IPFS...
ipfs init

echo.
echo IPFS setup complete!
echo.
echo IMPORTANT: Add C:\ipfs to your system PATH environment variable
echo Then restart your terminal and run: ipfs daemon
echo.
pause
