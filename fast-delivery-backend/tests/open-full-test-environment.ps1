# ============================================================
# FastDelivery Full Test Environment Script
# ============================================================
# This script:
# 1. Shows available emulators and lets you choose
# 2. Starts selected emulators in CMD windows
# 3. Installs apps on your chosen emulators
# 4. Opens Chrome browsers for Admin & Store
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FastDelivery Test Environment Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Settings ---
$projectPath = "C:\Users\zisog\Documents\Projects\FastDelivery"
$customerApk = "$projectPath\fast-delivery-mobile\customer\Fast Delivery.apk"
$driverApk = "$projectPath\fast-delivery-mobile\driver\Driver-Fast-Delivery.apk"
$frontendUrl = "https://fastdeliveryfontend.onrender.com/login"
$emulatorExe = "C:\Users\zisog\AppData\Local\Android\Sdk\emulator\emulator.exe"
$adbExe = "C:\Users\zisog\AppData\Local\Android\Sdk\platform-tools\adb.exe"

# Add Android SDK to PATH
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\platform-tools"
$env:PATH = "$env:PATH;C:\Users\zisog\AppData\Local\Android\Sdk\emulator"

# ============================================================
# STEP 1: Show available Emulators and let user CHOOSE
# ============================================================
Write-Host "[1/5] Available Android Emulators..." -ForegroundColor Yellow
Write-Host ""

$availableAvds = @(emulator -list-avds 2>$null)
if (-not $availableAvds -or $availableAvds.Count -eq 0) {
    Write-Host "ERROR: No AVDs found!" -ForegroundColor Red
    exit 1
}

Write-Host "Available AVDs:" -ForegroundColor Green
for ($i = 0; $i -lt $availableAvds.Count; $i++) {
    Write-Host "   [$($i+1)] $($availableAvds[$i])" -ForegroundColor Gray
}
Write-Host "   [0] Skip (use already running emulators)" -ForegroundColor DarkGray
Write-Host ""

# --- Customer App Emulator Selection ---
Write-Host "CUSTOMER APP - Which emulator?" -ForegroundColor Magenta
$customerChoice = Read-Host "Enter number (0 to skip)"
$customerAvdToStart = $null
if ($customerChoice -ne "0" -and $customerChoice -ne "") {
    $customerIndex = [int]$customerChoice - 1
    if ($customerIndex -ge 0 -and $customerIndex -lt $availableAvds.Count) {
        $customerAvdToStart = $availableAvds[$customerIndex]
        Write-Host "   -> Customer App: $customerAvdToStart" -ForegroundColor Magenta
    }
}
Write-Host ""

# --- Driver App Emulator Selection ---
Write-Host "DRIVER APP - Which emulator?" -ForegroundColor Yellow
for ($i = 0; $i -lt $availableAvds.Count; $i++) {
    $marker = ""
    if ($availableAvds[$i] -eq $customerAvdToStart) { $marker = " [Customer]" }
    Write-Host "   [$($i+1)] $($availableAvds[$i])$marker" -ForegroundColor Gray
}
Write-Host "   [0] Skip (use already running emulators)" -ForegroundColor DarkGray
$driverChoice = Read-Host "Enter number (0 to skip)"
$driverAvdToStart = $null
if ($driverChoice -ne "0" -and $driverChoice -ne "") {
    $driverIndex = [int]$driverChoice - 1
    if ($driverIndex -ge 0 -and $driverIndex -lt $availableAvds.Count) {
        $driverAvdToStart = $availableAvds[$driverIndex]
        Write-Host "   -> Driver App: $driverAvdToStart" -ForegroundColor Yellow
    }
}
Write-Host ""

# ============================================================
# STEP 2: Check running emulators
# ============================================================
Write-Host "[2/5] Checking running emulators..." -ForegroundColor Yellow

$runningDevices = @(adb devices 2>$null | Select-String "emulator-" | ForEach-Object { 
    ($_ -split "\s+")[0] 
})

$emulatorMapping = @{}
$deviceToAvd = @{}

if ($runningDevices -and $runningDevices.Count -gt 0) {
    Write-Host "Already running:" -ForegroundColor Green
    foreach ($device in $runningDevices) {
        $avdName = (adb -s $device emu avd name 2>$null | Select-Object -First 1)
        if ($avdName) {
            $avdName = $avdName.Trim()
            $emulatorMapping[$avdName] = $device
            $deviceToAvd[$device] = $avdName
            Write-Host "   - $device -> $avdName" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   No emulators running" -ForegroundColor Gray
    $runningDevices = @()
}
Write-Host ""

# ============================================================
# STEP 3: Start selected emulators in CMD windows
# ============================================================
Write-Host "[3/5] Starting emulators..." -ForegroundColor Yellow
Write-Host ""

$needToWait = $false

# Start Customer emulator if selected and not running
if ($customerAvdToStart -and -not $emulatorMapping.ContainsKey($customerAvdToStart)) {
    Write-Host "Starting Customer emulator ($customerAvdToStart) in CMD window..." -ForegroundColor Magenta
    Start-Process cmd -ArgumentList "/k", "title CUSTOMER - $customerAvdToStart && `"$emulatorExe`" -avd $customerAvdToStart"
    $needToWait = $true
    Start-Sleep -Seconds 2
} elseif ($customerAvdToStart -and $emulatorMapping.ContainsKey($customerAvdToStart)) {
    Write-Host "Customer emulator ($customerAvdToStart) already running" -ForegroundColor Green
}

# Start Driver emulator if selected and not running (and different from customer)
if ($driverAvdToStart -and $driverAvdToStart -ne $customerAvdToStart -and -not $emulatorMapping.ContainsKey($driverAvdToStart)) {
    Write-Host "Starting Driver emulator ($driverAvdToStart) in CMD window..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList "/k", "title DRIVER - $driverAvdToStart && `"$emulatorExe`" -avd $driverAvdToStart"
    $needToWait = $true
    Start-Sleep -Seconds 2
} elseif ($driverAvdToStart -and $emulatorMapping.ContainsKey($driverAvdToStart)) {
    Write-Host "Driver emulator ($driverAvdToStart) already running" -ForegroundColor Green
}

# Wait for user confirmation if we started new emulators
if ($needToWait) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  Emulators are starting...            " -ForegroundColor Yellow
    Write-Host "  Wait until they show home screen!    " -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press ENTER when emulators are ready"
    Write-Host ""
}

# Refresh device list
$runningDevices = @(adb devices 2>$null | Select-String "emulator-" | ForEach-Object { 
    ($_ -split "\s+")[0] 
})

$emulatorMapping = @{}
$deviceToAvd = @{}
foreach ($device in $runningDevices) {
    $avdName = (adb -s $device emu avd name 2>$null | Select-Object -First 1)
    if ($avdName) {
        $avdName = $avdName.Trim()
        $emulatorMapping[$avdName] = $device
        $deviceToAvd[$device] = $avdName
    }
}

if ($runningDevices.Count -eq 0) {
    Write-Host "ERROR: No emulators detected!" -ForegroundColor Red
    exit 1
}

Write-Host "Active emulators:" -ForegroundColor Green
foreach ($device in $runningDevices) {
    $avd = $deviceToAvd[$device]
    Write-Host "   - $device -> $avd" -ForegroundColor Gray
}
Write-Host ""

# Determine which device to use for each app
$customerDevice = $null
$customerEmulator = $null
$driverDevice = $null
$driverEmulator = $null

if ($customerAvdToStart -and $emulatorMapping.ContainsKey($customerAvdToStart)) {
    $customerDevice = $emulatorMapping[$customerAvdToStart]
    $customerEmulator = $customerAvdToStart
} elseif ($runningDevices.Count -gt 0) {
    $customerDevice = $runningDevices[0]
    $customerEmulator = $deviceToAvd[$customerDevice]
}

if ($driverAvdToStart -and $emulatorMapping.ContainsKey($driverAvdToStart)) {
    $driverDevice = $emulatorMapping[$driverAvdToStart]
    $driverEmulator = $driverAvdToStart
} elseif ($runningDevices.Count -gt 1) {
    $driverDevice = $runningDevices[1]
    $driverEmulator = $deviceToAvd[$driverDevice]
} elseif ($runningDevices.Count -gt 0) {
    $driverDevice = $runningDevices[0]
    $driverEmulator = $deviceToAvd[$driverDevice]
}

Write-Host "Assignment:" -ForegroundColor Green
Write-Host "   Customer App -> $customerEmulator ($customerDevice)" -ForegroundColor Magenta
Write-Host "   Driver App -> $driverEmulator ($driverDevice)" -ForegroundColor Yellow
Write-Host ""

# ============================================================
# STEP 4: Install and start apps
# ============================================================
Write-Host "[4/5] Installing apps..." -ForegroundColor Yellow
Write-Host ""

# Customer App
if (Test-Path $customerApk) {
    Write-Host "Installing Customer App on $customerDevice ($customerEmulator)..." -ForegroundColor Magenta
    $result = adb -s $customerDevice install -r $customerApk 2>&1
    if ($result -match "Success") {
        Write-Host "   OK: Installation successful!" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: $result" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Customer APK not found: $customerApk" -ForegroundColor Red
}

# Driver App
if (Test-Path $driverApk) {
    Write-Host "Installing Driver App on $driverDevice ($driverEmulator)..." -ForegroundColor Yellow
    $result = adb -s $driverDevice install -r $driverApk 2>&1
    if ($result -match "Success") {
        Write-Host "   OK: Installation successful!" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: $result" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Driver APK not found: $driverApk" -ForegroundColor Red
}

Write-Host ""

# Start apps
Write-Host "Starting apps..." -ForegroundColor Yellow

Write-Host "   Starting Customer App on $customerEmulator..." -ForegroundColor Magenta
adb -s $customerDevice shell am start -n com.fastdelivery.customer/.MainActivity 2>$null

Start-Sleep -Seconds 2

Write-Host "   Starting Driver App on $driverEmulator..." -ForegroundColor Yellow
adb -s $driverDevice shell am start -n com.fastdelivery.driver/.MainActivity 2>$null

Write-Host ""

# ============================================================
# STEP 5: Open Chrome browsers
# ============================================================
Write-Host "[5/5] Opening Chrome browsers..." -ForegroundColor Cyan
Write-Host ""

# Find Chrome
$browserPath = $null
$chromePaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $browserPath = $path
        break
    }
}

if (-not $browserPath) {
    Write-Host "ERROR: Chrome not found!" -ForegroundColor Red
} else {
    # Chrome profiles
    $chromeUserData = "$env:LOCALAPPDATA\Google\Chrome\User Data"
    
    # Admin Profile
    $adminProfile = "Profile 4"
    $adminProfilePath = Join-Path $chromeUserData $adminProfile
    if (Test-Path $adminProfilePath) {
        Write-Host "Opening Admin browser (Profile 4)..." -ForegroundColor Green
        Start-Process $browserPath -ArgumentList "--profile-directory=`"$adminProfile`"", $frontendUrl
    } else {
        Write-Host "WARNING: Admin profile not found, opening with temp profile..." -ForegroundColor Yellow
        Start-Process $browserPath -ArgumentList "--user-data-dir=`"$env:TEMP\FastDeliveryProfiles\Admin`"", $frontendUrl
    }
    
    Start-Sleep -Seconds 2
    
    # Store Profile
    $storeProfile = "Profile 6"
    $storeProfilePath = Join-Path $chromeUserData $storeProfile
    if (Test-Path $storeProfilePath) {
        Write-Host "Opening Store browser (Profile 6)..." -ForegroundColor Blue
        Start-Process $browserPath -ArgumentList "--profile-directory=`"$storeProfile`"", $frontendUrl
    } else {
        Write-Host "WARNING: Store profile not found, opening with temp profile..." -ForegroundColor Yellow
        Start-Process $browserPath -ArgumentList "--user-data-dir=`"$env:TEMP\FastDeliveryProfiles\Store`"", $frontendUrl
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL READY FOR TESTING!               " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mobile Apps:" -ForegroundColor Yellow
Write-Host "   Customer App -> $customerEmulator ($customerDevice)" -ForegroundColor Magenta
Write-Host "   Driver App -> $driverEmulator ($driverDevice)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Web Browsers:" -ForegroundColor Yellow
Write-Host "   Admin -> Profile 4" -ForegroundColor Green
Write-Host "   Store -> Profile 6" -ForegroundColor Blue
Write-Host ""
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host ""
