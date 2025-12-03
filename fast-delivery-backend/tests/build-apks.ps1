# ============================================================
# FastDelivery APK Build Script
# ============================================================
# Builds Customer and Driver APKs in parallel PowerShell windows
# Then offers to install on emulators
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FastDelivery APK Build Script        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Settings ---
$projectPath = "C:\Users\zisog\Documents\Projects\FastDelivery"
$customerSource = "$projectPath\fast-delivery-mobile\customer"
$driverSource = "$projectPath\fast-delivery-mobile\driver"
$customerApkDest = "$customerSource\Fast Delivery.apk"
$driverApkDest = "$driverSource\Driver-Fast-Delivery.apk"

# --- Build Scripts ---
$customerBuildScript = @'
$host.UI.RawUI.WindowTitle = "Building CUSTOMER APK..."
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  CUSTOMER APK BUILD                   " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$projectPath = "C:\Users\zisog\Documents\Projects\FastDelivery"

# Step 0: Kill Java processes to release file locks
Write-Host "[0/6] Killing Java processes..." -ForegroundColor Yellow
taskkill /F /IM java.exe 2>$null
Start-Sleep -Seconds 1

# Step 1: Clean
Write-Host "[1/6] Cleaning C:\A\customer..." -ForegroundColor Yellow
if (Test-Path "C:\A\customer") { 
    cmd /c "rd /s /q C:\A\customer" 2>$null
    Start-Sleep -Seconds 2
}
New-Item -ItemType Directory -Path "C:\A\customer" -Force | Out-Null

# Step 2: Copy
Write-Host "[2/6] Copying files..." -ForegroundColor Yellow
robocopy "$projectPath\fast-delivery-mobile\customer" "C:\A\customer" /E /XD ".expo" "android" "node_modules" ".git" /NFL /NDL /NJH /NJS /NC /NS

# Step 3: npm install
Write-Host "[3/6] Installing dependencies (npm install)..." -ForegroundColor Yellow
Set-Location C:\A\customer
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install FAILED!" -ForegroundColor Red
    "DONE" | Out-File "C:\A\customer_build_done.flag"
    exit 1
}

# Step 4: Prebuild
Write-Host "[4/6] Expo prebuild..." -ForegroundColor Yellow
$env:CI = "1"
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "Expo prebuild FAILED!" -ForegroundColor Red
    "DONE" | Out-File "C:\A\customer_build_done.flag"
    exit 1
}

# Check if android folder exists
if (-not (Test-Path "C:\A\customer\android")) {
    Write-Host "ERROR: android folder not created!" -ForegroundColor Red
    "DONE" | Out-File "C:\A\customer_build_done.flag"
    exit 1
}

# Step 5: Gradle build
Write-Host "[5/6] Building APK (gradlew assembleRelease)..." -ForegroundColor Yellow
Set-Location C:\A\customer\android
.\gradlew.bat assembleRelease --console=plain

# Step 6: Copy APK
Write-Host "[6/6] Copying APK to project..." -ForegroundColor Yellow
$apkSource = "C:\A\customer\android\app\build\outputs\apk\release\app-release.apk"
$apkDest = "$projectPath\fast-delivery-mobile\customer\Fast Delivery.apk"
if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  CUSTOMER APK BUILD SUCCESSFUL!       " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "APK: $apkDest" -ForegroundColor Gray
    [System.Media.SystemSounds]::Asterisk.Play()
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  CUSTOMER APK BUILD FAILED!           " -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    [System.Media.SystemSounds]::Hand.Play()
}

# Create flag file to signal completion
"DONE" | Out-File "C:\A\customer_build_done.flag"

Write-Host ""
Write-Host "Window will close in 10 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 10
'@

$driverBuildScript = @'
$host.UI.RawUI.WindowTitle = "Building DRIVER APK..."
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  DRIVER APK BUILD                     " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$projectPath = "C:\Users\zisog\Documents\Projects\FastDelivery"

# Step 0: Kill Java processes to release file locks
Write-Host "[0/6] Killing Java processes..." -ForegroundColor Yellow
taskkill /F /IM java.exe 2>$null
Start-Sleep -Seconds 1

# Step 1: Clean
Write-Host "[1/6] Cleaning C:\A\driver..." -ForegroundColor Yellow
if (Test-Path "C:\A\driver") { 
    cmd /c "rd /s /q C:\A\driver" 2>$null
    Start-Sleep -Seconds 2
}
New-Item -ItemType Directory -Path "C:\A\driver" -Force | Out-Null

# Step 2: Copy
Write-Host "[2/6] Copying files..." -ForegroundColor Yellow
robocopy "$projectPath\fast-delivery-mobile\driver" "C:\A\driver" /E /XD ".expo" "android" "node_modules" ".git" /NFL /NDL /NJH /NJS /NC /NS

# Step 3: npm install
Write-Host "[3/6] Installing dependencies (npm install)..." -ForegroundColor Yellow
Set-Location C:\A\driver
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install FAILED!" -ForegroundColor Red
    "DONE" | Out-File "C:\A\driver_build_done.flag"
    exit 1
}

# Step 4: Prebuild
Write-Host "[4/6] Expo prebuild..." -ForegroundColor Yellow
$env:CI = "1"
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "Expo prebuild FAILED!" -ForegroundColor Red
    "DONE" | Out-File "C:\A\driver_build_done.flag"
    exit 1
}

# Check if android folder exists
if (-not (Test-Path "C:\A\driver\android")) {
    Write-Host "ERROR: android folder not created!" -ForegroundColor Red
    "DONE" | Out-File "C:\A\driver_build_done.flag"
    exit 1
}

# Step 5: Gradle build
Write-Host "[5/6] Building APK (gradlew assembleRelease)..." -ForegroundColor Yellow
Set-Location C:\A\driver\android
.\gradlew.bat assembleRelease --console=plain

# Step 6: Copy APK
Write-Host "[6/6] Copying APK to project..." -ForegroundColor Yellow
$apkSource = "C:\A\driver\android\app\build\outputs\apk\release\app-release.apk"
$apkDest = "$projectPath\fast-delivery-mobile\driver\Driver-Fast-Delivery.apk"
if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  DRIVER APK BUILD SUCCESSFUL!         " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "APK: $apkDest" -ForegroundColor Gray
    [System.Media.SystemSounds]::Asterisk.Play()
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  DRIVER APK BUILD FAILED!             " -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    [System.Media.SystemSounds]::Hand.Play()
}

# Create flag file to signal completion
"DONE" | Out-File "C:\A\driver_build_done.flag"

Write-Host ""
Write-Host "Window will close in 10 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 10
'@

# --- Menu ---
Write-Host "What do you want to build?" -ForegroundColor Yellow
Write-Host "   [1] Customer APK only" -ForegroundColor Magenta
Write-Host "   [2] Driver APK only" -ForegroundColor Yellow
Write-Host "   [3] Both (parallel)" -ForegroundColor Green
Write-Host ""
$buildChoice = Read-Host "Enter choice (default: 3)"
if ([string]::IsNullOrEmpty($buildChoice)) { $buildChoice = "3" }

# Clean flag files
Remove-Item "C:\A\customer_build_done.flag" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\A\driver_build_done.flag" -Force -ErrorAction SilentlyContinue

# Start builds
$buildCustomer = $buildChoice -eq "1" -or $buildChoice -eq "3"
$buildDriver = $buildChoice -eq "2" -or $buildChoice -eq "3"

if ($buildCustomer) {
    Write-Host "Starting Customer build in new window..." -ForegroundColor Magenta
    $customerScriptPath = "$env:TEMP\build_customer.ps1"
    $customerBuildScript | Out-File $customerScriptPath -Encoding UTF8
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $customerScriptPath
}

if ($buildDriver) {
    Write-Host "Starting Driver build in new window..." -ForegroundColor Yellow
    $driverScriptPath = "$env:TEMP\build_driver.ps1"
    $driverBuildScript | Out-File $driverScriptPath -Encoding UTF8
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $driverScriptPath
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build processes started!             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build windows are running in background." -ForegroundColor Gray
Write-Host "This window will wait for builds to complete..." -ForegroundColor Gray
Write-Host ""

# Wait for builds to complete
$waitingFor = @()
if ($buildCustomer) { $waitingFor += "Customer" }
if ($buildDriver) { $waitingFor += "Driver" }

Write-Host "Waiting for: $($waitingFor -join ', ')..." -ForegroundColor Yellow
Write-Host ""

$timeout = 1800  # 30 minutes max
$elapsed = 0
$interval = 10

while ($elapsed -lt $timeout) {
    $customerDone = -not $buildCustomer -or (Test-Path "C:\A\customer_build_done.flag")
    $driverDone = -not $buildDriver -or (Test-Path "C:\A\driver_build_done.flag")
    
    if ($customerDone -and $driverDone) {
        break
    }
    
    $status = ""
    if ($buildCustomer) { $status += if ($customerDone) { "[Customer: DONE] " } else { "[Customer: building...] " } }
    if ($buildDriver) { $status += if ($driverDone) { "[Driver: DONE] " } else { "[Driver: building...] " } }
    Write-Host "`r$status ($elapsed sec)" -NoNewline -ForegroundColor Gray
    
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

Write-Host ""
Write-Host ""

# Check results
$customerSuccess = Test-Path $customerApkDest
$driverSuccess = Test-Path $driverApkDest

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUILD RESULTS                        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($buildCustomer) {
    if ($customerSuccess) {
        Write-Host "   Customer APK: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "   Customer APK: FAILED" -ForegroundColor Red
    }
}

if ($buildDriver) {
    if ($driverSuccess) {
        Write-Host "   Driver APK: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "   Driver APK: FAILED" -ForegroundColor Red
    }
}

Write-Host ""

# Play completion sound
[System.Media.SystemSounds]::Exclamation.Play()

# ============================================================
# EMULATOR INSTALLATION
# ============================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALL ON EMULATORS?                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   [1] Yes - Install on emulators" -ForegroundColor Green
Write-Host "   [2] No - Exit" -ForegroundColor Gray
Write-Host ""
$installChoice = Read-Host "Enter choice (default: 1)"
if ([string]::IsNullOrEmpty($installChoice)) { $installChoice = "1" }

if ($installChoice -ne "1") {
    Write-Host "Done! APKs are ready in project folders." -ForegroundColor Green
    exit
}

# Add ADB to path
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\platform-tools"

# Get running emulators
Write-Host ""
Write-Host "Checking running emulators..." -ForegroundColor Yellow

$runningDevices = @(adb devices 2>$null | Select-String "emulator-" | ForEach-Object { 
    ($_ -split "\s+")[0] 
})

if ($runningDevices.Count -eq 0) {
    Write-Host "No emulators running!" -ForegroundColor Red
    Write-Host "Start emulators and run open-full-test-environment.ps1 to install." -ForegroundColor Yellow
    exit
}

$deviceToAvd = @{}
Write-Host "Running emulators:" -ForegroundColor Green
for ($i = 0; $i -lt $runningDevices.Count; $i++) {
    $device = $runningDevices[$i]
    $avdName = (adb -s $device emu avd name 2>$null | Select-Object -First 1)
    if ($avdName) { $avdName = $avdName.Trim() } else { $avdName = "Unknown" }
    $deviceToAvd[$device] = $avdName
    Write-Host "   [$($i+1)] $avdName ($device)" -ForegroundColor Gray
}
Write-Host "   [0] Skip" -ForegroundColor DarkGray
Write-Host ""

# Customer App installation
if ($customerSuccess) {
    Write-Host "CUSTOMER APP - Select emulator:" -ForegroundColor Magenta
    $custChoice = Read-Host "Enter number (0 to skip)"
    if ($custChoice -ne "0" -and $custChoice -ne "") {
        $custIndex = [int]$custChoice - 1
        if ($custIndex -ge 0 -and $custIndex -lt $runningDevices.Count) {
            $custDevice = $runningDevices[$custIndex]
            $custAvd = $deviceToAvd[$custDevice]
            Write-Host "   Uninstalling old version..." -ForegroundColor Gray
            adb -s $custDevice uninstall com.fastdelivery.customer 2>$null
            Write-Host "   Installing Customer APK on $custAvd..." -ForegroundColor Magenta
            $result = adb -s $custDevice install -r $customerApkDest 2>&1
            if ($result -match "Success") {
                Write-Host "   SUCCESS!" -ForegroundColor Green
            } else {
                Write-Host "   FAILED: $result" -ForegroundColor Red
            }
        }
    }
    Write-Host ""
}

# Driver App installation
if ($driverSuccess) {
    Write-Host "DRIVER APP - Select emulator:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $runningDevices.Count; $i++) {
        $device = $runningDevices[$i]
        $avdName = $deviceToAvd[$device]
        Write-Host "   [$($i+1)] $avdName ($device)" -ForegroundColor Gray
    }
    Write-Host "   [0] Skip" -ForegroundColor DarkGray
    $drvChoice = Read-Host "Enter number (0 to skip)"
    if ($drvChoice -ne "0" -and $drvChoice -ne "") {
        $drvIndex = [int]$drvChoice - 1
        if ($drvIndex -ge 0 -and $drvIndex -lt $runningDevices.Count) {
            $drvDevice = $runningDevices[$drvIndex]
            $drvAvd = $deviceToAvd[$drvDevice]
            Write-Host "   Uninstalling old version..." -ForegroundColor Gray
            adb -s $drvDevice uninstall com.fastdelivery.driver 2>$null
            Write-Host "   Installing Driver APK on $drvAvd..." -ForegroundColor Yellow
            $result = adb -s $drvDevice install -r $driverApkDest 2>&1
            if ($result -match "Success") {
                Write-Host "   SUCCESS!" -ForegroundColor Green
            } else {
                Write-Host "   FAILED: $result" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ALL DONE!                            " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Final sound
[System.Media.SystemSounds]::Asterisk.Play()
