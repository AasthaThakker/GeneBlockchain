@echo off
echo Starting IPFS daemon...
echo Using IPFS from: E:\kubo_v0.28.0_windows-amd64\kubo\ipfs.exe
echo.

REM Check if IPFS is already initialized
if not exist "C:\Users\Admin\.ipfs" (
    echo Initializing IPFS repository...
    "E:\kubo_v0.28.0_windows-amd64\kubo\ipfs.exe" init
)

echo Starting IPFS daemon...
echo API will be available at: http://127.0.0.1:5001
echo Gateway will be available at: http://127.0.0.1:8080
echo Web UI will be available at: http://127.0.0.1:5001/webui
echo.
echo Press Ctrl+C to stop the daemon
echo.

"E:\kubo_v0.28.0_windows-amd64\kubo\ipfs.exe" daemon
