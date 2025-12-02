# Script for opening multiple browser windows for testing
# Each window with different Chrome profile
# Checks first for existing profiles

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   FastDelivery Test Environment Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Check what's already running ---
Write-Host "Checking running services..." -ForegroundColor Yellow

# Check if Backend is running (port 5000) - only LISTEN state means server is running
$backendRunning = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "   Backend (port 5000): RUNNING" -ForegroundColor Green
    $skipBackend = $true
} else {
    Write-Host "   Backend (port 5000): Not running" -ForegroundColor Gray
    $skipBackend = $false
}

# Check if Frontend is running (port 3000)
$frontendRunning = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($frontendRunning) {
    Write-Host "   Frontend (port 3000): RUNNING" -ForegroundColor Green
    $skipFrontend = $true
} else {
    Write-Host "   Frontend (port 3000): Not running" -ForegroundColor Gray
    $skipFrontend = $false
}

# Check if Customer Mobile is running (port 8081)
$customerMobileRunning = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($customerMobileRunning) {
    Write-Host "   Customer Mobile (port 8081): RUNNING" -ForegroundColor Green
    $skipCustomerMobile = $true
} else {
    Write-Host "   Customer Mobile (port 8081): Not running" -ForegroundColor Gray
    $skipCustomerMobile = $false
}

# Check if Driver Mobile is running (port 8082)
$driverMobileRunning = Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue
if ($driverMobileRunning) {
    Write-Host "   Driver Mobile (port 8082): RUNNING" -ForegroundColor Green
    $skipDriverMobile = $true
} else {
    Write-Host "   Driver Mobile (port 8082): Not running" -ForegroundColor Gray
    $skipDriverMobile = $false
}

# Check Chrome windows with our profiles
$chromeProcesses = Get-Process chrome -ErrorAction SilentlyContinue
if ($chromeProcesses) {
    $chromeCount = ($chromeProcesses | Measure-Object).Count
    Write-Host "   Chrome processes: $chromeCount running" -ForegroundColor Green
} else {
    Write-Host "   Chrome: Not running" -ForegroundColor Gray
}

Write-Host ""

# --- Start Android Emulators ---
$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"

# Get list of running emulators
$runningEmulators = & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices 2>$null | Select-String "emulator-"

# Get available AVDs
$avdList = & $emulatorPath -list-avds 2>$null

if ($avdList) {
    $avds = $avdList -split "`n" | Where-Object { $_ -match '\S' }
    Write-Host "Available Android Emulators:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $avds.Count; $i++) {
        Write-Host "   $($i + 1). $($avds[$i])" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Check if emulators are already running
    $runningCount = ($runningEmulators | Measure-Object).Count
    
    if ($runningCount -ge 2) {
        Write-Host "Emulators already running ($runningCount found)" -ForegroundColor Green
    } elseif ($runningCount -eq 1) {
        Write-Host "1 emulator running, starting second one..." -ForegroundColor Yellow
        if ($avds.Count -ge 2) {
            $emulator2 = $avds[1].Trim()
            Write-Host "   Starting emulator 2: $emulator2 (Driver)" -ForegroundColor Yellow
            Start-Process $emulatorPath -ArgumentList "-avd", $emulator2, "-no-snapshot-load"
            
            Write-Host ""
            Write-Host "==================================================" -ForegroundColor Cyan
            Write-Host "Wait for emulator to fully boot, then press ENTER" -ForegroundColor Green
            Write-Host "==================================================" -ForegroundColor Cyan
            Read-Host
        }
    } else {
        Write-Host "Starting Android Emulators (cold boot)..." -ForegroundColor Yellow
        
        # Start first emulator (for Customer app)
        if ($avds.Count -ge 1) {
            $emulator1 = $avds[0].Trim()
            Write-Host "   Starting emulator 1: $emulator1 (Customer)" -ForegroundColor Magenta
            Start-Process $emulatorPath -ArgumentList "-avd", $emulator1, "-no-snapshot-load"
            
            Write-Host "   Waiting 5 seconds before starting second emulator..." -ForegroundColor Gray
            Start-Sleep -Seconds 5
        }
        
        # Start second emulator (for Driver app)
        if ($avds.Count -ge 2) {
            $emulator2 = $avds[1].Trim()
            Write-Host "   Starting emulator 2: $emulator2 (Driver)" -ForegroundColor Yellow
            Start-Process $emulatorPath -ArgumentList "-avd", $emulator2, "-no-snapshot-load"
        } elseif ($avds.Count -eq 1) {
            Write-Host "   Warning: Only 1 AVD found. Create another for Driver app." -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor Cyan
        Write-Host "Wait for emulators to fully boot, then press ENTER" -ForegroundColor Green
        Write-Host "==================================================" -ForegroundColor Cyan
        Read-Host
    }
} else {
    Write-Host "No Android emulators found. Skipping emulator startup." -ForegroundColor Yellow
    Write-Host "You can create AVDs in Android Studio > Device Manager" -ForegroundColor Gray
}
Write-Host ""

# --- Start Servers ---
$backendPath = "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-backend"
$frontendPath = "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-frontend"
$customerMobilePath = "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-mobile\customer"
$driverMobilePath = "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-mobile\driver"

$startedSomething = $false

# Clear Metro cache before starting mobile apps (prevents ENOTEMPTY errors)
if (-not $skipCustomerMobile -or -not $skipDriverMobile) {
    Write-Host "Clearing Metro cache..." -ForegroundColor Gray
    Remove-Item -Path "$env:LOCALAPPDATA\Temp\metro-cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Metro cache cleared!" -ForegroundColor Green
}

if (-not $skipBackend) {
    Write-Host "Starting Backend Server (nodemon)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Minimized
    $startedSomething = $true
} else {
    Write-Host "Backend already running, skipping..." -ForegroundColor Gray
}

if (-not $skipFrontend) {
    Write-Host "Starting Frontend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start" -WindowStyle Minimized
    $startedSomething = $true
} else {
    Write-Host "Frontend already running, skipping..." -ForegroundColor Gray
}

if (-not $skipCustomerMobile) {
    Write-Host "Starting Customer Mobile App (port 8081)..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$customerMobilePath'; npx expo start -c --port 8081"
    $startedSomething = $true
} else {
    Write-Host "Customer Mobile already running, skipping..." -ForegroundColor Gray
}

if (-not $skipDriverMobile) {
    Write-Host "Starting Driver Mobile App (port 8082)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$driverMobilePath'; npx expo start -c --port 8082"
    $startedSomething = $true
} else {
    Write-Host "Driver Mobile already running, skipping..." -ForegroundColor Gray
}

if ($startedSomething) {
    Write-Host ""
    Write-Host "Waiting 15 seconds for servers to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}
# ---------------------

$frontendUrl = "http://localhost:3000"

Write-Host "Opening Test Browsers..." -ForegroundColor Cyan
Write-Host ""

# Browser path
$browserPath = $null
$browserName = ""

# Try Chrome first
$chromePaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $browserPath = $path
        $browserName = "Chrome"
        break
    }
}

# Map to your existing Chrome profiles
# Profile 4 = Admin, Profile 5 = Store, Profile 6 = Driver
$chromeUserData = "$env:LOCALAPPDATA\Google\Chrome\User Data"
$existingProfiles = @{
    "Admin" = "Profile 4"
    "Store" = "Profile 5"
    "Driver" = "Profile 6"
    "Customer" = "Default"
}

# Verify profiles exist
Write-Host "Checking Chrome profiles..." -ForegroundColor Yellow
$profilesFound = $false
foreach ($role in @("Admin", "Store", "Driver", "Customer")) {
    $profileName = $existingProfiles[$role]
    if ($profileName) {
        $profilePath = Join-Path $chromeUserData $profileName
        if (Test-Path $profilePath) {
            Write-Host "   Found $role profile: $profileName" -ForegroundColor Green
            $profilesFound = $true
        } else {
            Write-Host "   Warning: $profileName not found" -ForegroundColor Yellow
            $existingProfiles[$role] = $null
        }
    }
}
Write-Host ""

if (-not $browserPath) {
    Write-Host "Chrome not found." -ForegroundColor Red
    exit
}

Write-Host "Using browser: $browserName" -ForegroundColor Green
Write-Host ""

# Create temp profiles directory if needed
$profilesDir = "$env:TEMP\FastDeliveryProfiles"
$useExisting = $profilesFound

if ($useExisting) {
    Write-Host "Using your Chrome profiles!" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Creating new temp profiles..." -ForegroundColor Yellow
    if (-not (Test-Path $profilesDir)) {
        New-Item -ItemType Directory -Path $profilesDir | Out-Null
    }
    Write-Host ""
}

# Check if Chrome windows with our profiles are already open
# by checking command line arguments of chrome processes
$skipBrowsers = $false
if ($chromeProcesses) {
    # Check if localhost:3000 is loaded in any Chrome tab
    # We use a simple heuristic - if Chrome is running AND frontend is running, probably already open
    if ($frontendRunning -and ($chromeProcesses | Measure-Object).Count -ge 4) {
        Write-Host "Chrome already has multiple windows open. Skip opening browsers? (Y/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -eq "Y" -or $response -eq "y") {
            $skipBrowsers = $true
            Write-Host "Skipping browser windows..." -ForegroundColor Gray
        }
    }
}

if (-not $skipBrowsers) {
    # Open Admin Profile
    Write-Host "1. Admin Profile" -ForegroundColor Green
    if ($existingProfiles["Admin"]) {
        Write-Host "   Using: $($existingProfiles['Admin'])" -ForegroundColor Gray
        Start-Process $browserPath -ArgumentList "--profile-directory=`"$($existingProfiles['Admin'])`"","$frontendUrl/login"
    } else {
        Start-Process $browserPath -ArgumentList "--user-data-dir=`"$profilesDir\Admin`"","$frontendUrl/login"
    }

    Start-Sleep -Seconds 2

    # Open Store Profile
    Write-Host "2. Store Profile" -ForegroundColor Blue
    if ($existingProfiles["Store"]) {
        Write-Host "   Using: $($existingProfiles['Store'])" -ForegroundColor Gray
        Start-Process $browserPath -ArgumentList "--profile-directory=`"$($existingProfiles['Store'])`"","$frontendUrl/login"
    } else {
        Start-Process $browserPath -ArgumentList "--user-data-dir=`"$profilesDir\Store`"","$frontendUrl/login"
    }

    Start-Sleep -Seconds 2

    # Open Driver Profile
    Write-Host "3. Driver Profile" -ForegroundColor Yellow
    if ($existingProfiles["Driver"]) {
        Write-Host "   Using: $($existingProfiles['Driver'])" -ForegroundColor Gray
        Start-Process $browserPath -ArgumentList "--profile-directory=`"$($existingProfiles['Driver'])`"","$frontendUrl/login"
    } else {
        Start-Process $browserPath -ArgumentList "--user-data-dir=`"$profilesDir\Driver`"","$frontendUrl/login"
    }

    Start-Sleep -Seconds 2

    # Open Customer Profile
    Write-Host "4. Customer Profile" -ForegroundColor Magenta
    if ($existingProfiles["Customer"]) {
        Write-Host "   Using: $($existingProfiles['Customer'])" -ForegroundColor Gray
        Start-Process $browserPath -ArgumentList "--profile-directory=`"$($existingProfiles['Customer'])`"","$frontendUrl"
    } else {
        Start-Process $browserPath -ArgumentList "--user-data-dir=`"$profilesDir\Customer`"","$frontendUrl"
    }
}

Write-Host ""
if (-not $skipBrowsers) {
    Write-Host "All browser windows opened!" -ForegroundColor Green
} else {
    Write-Host "Browser windows skipped." -ForegroundColor Gray
}
Write-Host ""

# Summary of what's running
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Environment Status Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Re-check ports to confirm
Start-Sleep -Seconds 1
$finalBackend = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$finalFrontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$finalCustomer = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
$finalDriver = Get-NetTCPConnection -LocalPort 8082 -ErrorAction SilentlyContinue

if ($finalBackend) { Write-Host "   Backend (5000):        RUNNING" -ForegroundColor Green }
else { Write-Host "   Backend (5000):        Starting..." -ForegroundColor Yellow }

if ($finalFrontend) { Write-Host "   Frontend (3000):       RUNNING" -ForegroundColor Green }
else { Write-Host "   Frontend (3000):       Starting..." -ForegroundColor Yellow }

if ($finalCustomer) { Write-Host "   Customer Mobile (8081): RUNNING" -ForegroundColor Green }
else { Write-Host "   Customer Mobile (8081): Starting..." -ForegroundColor Yellow }

if ($finalDriver) { Write-Host "   Driver Mobile (8082):  RUNNING" -ForegroundColor Green }
else { Write-Host "   Driver Mobile (8082):  Starting..." -ForegroundColor Yellow }

$finalEmulators = & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices 2>$null | Select-String "emulator-"
$emulatorCount = ($finalEmulators | Measure-Object).Count
Write-Host "   Android Emulators:     $emulatorCount running" -ForegroundColor $(if ($emulatorCount -ge 2) { "Green" } else { "Yellow" })

Write-Host ""

if ($useExisting) {
    Write-Host "Using your existing profiles - you should be logged in!" -ForegroundColor Cyan
} else {
    Write-Host "Credentials:" -ForegroundColor Cyan
    Write-Host "   Admin:    admin@fastdelivery.gr / admin123" -ForegroundColor Green
    Write-Host "   Store:    kafeteria@test.com / store123" -ForegroundColor Blue
    Write-Host "   Driver:   driver1@test.com / driver123" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Mobile Apps:" -ForegroundColor Cyan
Write-Host "   Customer App: http://localhost:8081 (press 'a' for Android emulator)" -ForegroundColor Magenta
Write-Host "   Driver App:   http://localhost:8082 (press 'a' for Android emulator)" -ForegroundColor Yellow
Write-Host ""
Write-Host "TIP: Open each mobile terminal and press 'a' to launch on emulator" -ForegroundColor Gray
Write-Host ""
