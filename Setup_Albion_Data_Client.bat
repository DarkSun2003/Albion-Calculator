@echo off
title Albion Data Client (ADC) - Auto-Installer & Launcher
echo ====================================================================
echo   Albion Online Data Client (ADC) - Live Market Price Scanner Setup
echo ====================================================================
echo.

set "ADC_EXE_1=%LocalAppData%\AlbionDataClient\albiondata-client.exe"
set "ADC_EXE_2=%ProgramFiles%\AlbionDataClient\albiondata-client.exe"
set "ADC_EXE_3=%ProgramFiles(x86)%\AlbionDataClient\albiondata-client.exe"

if exist "%ADC_EXE_1%" (
    echo [OK] Albion Data Client is already installed! Starting it in the background...
    start "" "%ADC_EXE_1%"
    exit /b 0
)
if exist "%ADC_EXE_2%" (
    echo [OK] Albion Data Client is already installed! Starting it in the background...
    start "" "%ADC_EXE_2%"
    exit /b 0
)
if exist "%ADC_EXE_3%" (
    echo [OK] Albion Data Client is already installed! Starting it in the background...
    start "" "%ADC_EXE_3%"
    exit /b 0
)

echo [1/2] Albion Data Client not found on this PC.
echo Downloading official Albion Data Client installer from GitHub...
echo.

set "INSTALLER_PATH=%TEMP%\albiondata-client-amd64-installer.exe"
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/ao-data/albiondata-client/releases/latest/download/albiondata-client-amd64-installer.exe' -OutFile '%INSTALLER_PATH%'"

if exist "%INSTALLER_PATH%" (
    echo [2/2] Download complete! Launching the installer now...
    echo Follow the setup prompts (make sure to allow Npcap if asked).
    echo Once installed, our Desktop App will automatically start ADC for you!
    start "" /wait "%INSTALLER_PATH%"
) else (
    echo Could not download automatically. Opening the official download page in your browser...
    start https://github.com/ao-data/albiondata-client/releases/latest
)

echo.
pause
