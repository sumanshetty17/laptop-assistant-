@echo off
title Orbit
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Orbit.ps1"
if errorlevel 1 pause
