@echo off

:: Set source and destination folders
set "source_folder=D:\BackUP\MongoDB"
set "destination_folder=\\192.168.100.11\BackUp\MongoDB"

:: Copy files using robocopy
robocopy "%source_folder%" "%destination_folder%" /E /XO

:: Check success
if errorlevel 1 (
    echo Copy operation failed.
    exit /b 1
) else (
    echo Copy operation completed.
    exit /b 0
)
