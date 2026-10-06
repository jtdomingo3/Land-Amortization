# Land Amortization Tracker - PowerShell APK Build Script
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Land Amortization Tracker - Android APK Build Tool   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect or set JDK 17 (Gradle 7.6 requires JDK 17)
if (Test-Path "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot") {
    $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
} elseif (Test-Path "C:\Program Files\Java\jdk-17") {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
} elseif (-not $env:JAVA_HOME) {
    Write-Error "JDK 17 not found. Please set `$env:JAVA_HOME to JDK 17."
    exit 1
}

# 2. Detect Android SDK
if (-not $env:ANDROID_HOME) {
    if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    } else {
        Write-Error "Android SDK not found. Please set `$env:ANDROID_HOME."
        exit 1
    }
}

$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Write-Host "[1/4] Building web assets with Vite..." -ForegroundColor Yellow
npm run build

Write-Host "`n[2/4] Syncing Cordova platform assets..." -ForegroundColor Yellow
try {
    npx cordova prepare android
} catch {
    Write-Warning "Cordova CLI prepare skipped or partial, copying assets directly."
}
if (Test-Path ".\platforms\android\app\src\main\assets\www") {
    Copy-Item -Path ".\www\*" -Destination ".\platforms\android\app\src\main\assets\www\" -Recurse -Force
}

Write-Host "`n[3/4] Compiling debug APK via Gradle..." -ForegroundColor Yellow
& ".\platforms\android\gradlew.bat" -b ".\platforms\android\build.gradle" assembleDebug

Write-Host "`n[4/4] Copying APK to LandAmortization-v1.0.0.apk..." -ForegroundColor Yellow
$srcApk = ".\platforms\android\app\build\outputs\apk\debug\app-debug.apk"
$destApk = ".\LandAmortization-v1.0.0.apk"
Copy-Item -Path $srcApk -Destination $destApk -Force

$apkItem = Get-Item $destApk
$sizeMb = [math]::Round($apkItem.Length / 1MB, 2)

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " [SUCCESS] APK compiled successfully!" -ForegroundColor Green
Write-Host " File: $($apkItem.FullName)" -ForegroundColor Green
Write-Host " Size: $sizeMb MB ($($apkItem.Length) bytes)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
