@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   Land Amortization Tracker - Android APK Build Tool
echo ========================================================
echo.

:: 1. Auto-detect or set JDK 17
if exist "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
) else if exist "C:\Program Files\Java\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
) else if not defined JAVA_HOME (
    echo [ERROR] JDK 17 not found. Please set JAVA_HOME to JDK 17.
    exit /b 1
)

:: 2. Auto-detect Android SDK
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    ) else (
        echo [ERROR] Android SDK not found. Please set ANDROID_HOME.
        exit /b 1
    )
)

set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo [1/4] Building web application (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed.
    exit /b %errorlevel%
)

echo.
echo [2/4] Preparing Cordova Android platform...
call npx cordova prepare android
if %errorlevel% neq 0 (
    echo [ERROR] Cordova prepare failed.
    exit /b %errorlevel%
)

echo.
echo [3/4] Compiling debug APK via Gradle...
call .\platforms\android\gradlew.bat -b .\platforms\android\build.gradle cdvBuildDebug
if %errorlevel% neq 0 (
    echo [ERROR] Gradle compilation failed.
    exit /b %errorlevel%
)

echo.
echo [4/4] Copying installer to LandAmortization-v1.0.0.apk...
copy /y ".\platforms\android\app\build\outputs\apk\debug\app-debug.apk" ".\LandAmortization-v1.0.0.apk" >nul

echo.
echo ========================================================
echo [SUCCESS] APK compiled successfully!
echo Output: %~dp0LandAmortization-v1.0.0.apk
echo ========================================================
