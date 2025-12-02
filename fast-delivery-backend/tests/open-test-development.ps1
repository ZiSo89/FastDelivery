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
            
            Write-Host "   Waiting 10 seconds before starting second emulator..." -ForegroundColor Gray
            Start-Sleep -Seconds 10
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
    Start-Sleep -Seconds 3
} else {
    Write-Host "Backend already running, skipping..." -ForegroundColor Gray
}

if (-not $skipFrontend) {
    Write-Host "Starting Frontend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start" -WindowStyle Minimized
    $startedSomething = $true
    Start-Sleep -Seconds 3
} else {
    Write-Host "Frontend already running, skipping..." -ForegroundColor Gray
}

# Get screen dimensions for positioning mobile app windows
Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$halfWidth = [int]($screen.Width / 2)
$windowHeight = $screen.Height

if (-not $skipCustomerMobile) {
    Write-Host "Starting Customer Mobile App (port 8081)..." -ForegroundColor Magenta
    # Start Customer Mobile - will be positioned on LEFT side
    $customerProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$customerMobilePath'; npx expo start -c --port 8081" -PassThru
    $startedSomething = $true
} else {
    Write-Host "Customer Mobile already running, skipping..." -ForegroundColor Gray
}

if (-not $skipDriverMobile) {
    Write-Host "Starting Driver Mobile App (port 8082)..." -ForegroundColor Yellow
    # Start Driver Mobile - will be positioned on RIGHT side
    $driverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$driverMobilePath'; npx expo start -c --port 8082" -PassThru
    $startedSomething = $true
} else {
    Write-Host "Driver Mobile already running, skipping..." -ForegroundColor Gray
}

# Position the mobile app windows after a short delay
if ($customerProcess -or $driverProcess) {
    Start-Sleep -Seconds 2
    
    # Use Windows API to position windows
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class WindowHelper {
        [DllImport("user32.dll")]
        public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
        [DllImport("user32.dll")]
        public static extern bool SetForegroundWindow(IntPtr hWnd);
    }
"@
    
    if ($customerProcess -and $customerProcess.MainWindowHandle -ne [IntPtr]::Zero) {
        # Position Customer window on LEFT half
        [WindowHelper]::MoveWindow($customerProcess.MainWindowHandle, 0, 0, $halfWidth, $windowHeight, $true)
        Write-Host "   Customer Mobile positioned on LEFT side" -ForegroundColor Gray
    }
    
    if ($driverProcess -and $driverProcess.MainWindowHandle -ne [IntPtr]::Zero) {
        # Position Driver window on RIGHT half
        [WindowHelper]::MoveWindow($driverProcess.MainWindowHandle, $halfWidth, 0, $halfWidth, $windowHeight, $true)
        Write-Host "   Driver Mobile positioned on RIGHT side" -ForegroundColor Gray
    }
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

# Function to check if a port is listening
function Test-PortListening {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $connection)
}

# Wait and retry for servers to be ready
$maxRetries = 10
$retryInterval = 3

Write-Host "Checking servers status..." -ForegroundColor Yellow

# Check Backend
$backendReady = $false
for ($i = 1; $i -le $maxRetries; $i++) {
    if (Test-PortListening -Port 5000) {
        $backendReady = $true
        break
    }
    if ($i -lt $maxRetries) {
        Write-Host "   Backend (5000): Waiting... (attempt $i/$maxRetries)" -ForegroundColor Gray
        Start-Sleep -Seconds $retryInterval
    }
}

# Check Frontend
$frontendReady = $false
for ($i = 1; $i -le $maxRetries; $i++) {
    if (Test-PortListening -Port 3000) {
        $frontendReady = $true
        break
    }
    if ($i -lt $maxRetries) {
        Write-Host "   Frontend (3000): Waiting... (attempt $i/$maxRetries)" -ForegroundColor Gray
        Start-Sleep -Seconds $retryInterval
    }
}

# Check Mobile Apps (less retries since they start faster)
$customerReady = Test-PortListening -Port 8081
$driverReady = Test-PortListening -Port 8082

Write-Host ""
Write-Host "Final Status:" -ForegroundColor Cyan

if ($backendReady) { 
    Write-Host "   Backend (5000):         RUNNING" -ForegroundColor Green 
} else { 
    Write-Host "   Backend (5000):         NOT RUNNING - Check for errors!" -ForegroundColor Red
}

if ($frontendReady) { 
    Write-Host "   Frontend (3000):        RUNNING" -ForegroundColor Green 
} else { 
    Write-Host "   Frontend (3000):        NOT RUNNING - Check for errors!" -ForegroundColor Red
}

if ($customerReady) { 
    Write-Host "   Customer Mobile (8081): RUNNING" -ForegroundColor Green 
} else { 
    Write-Host "   Customer Mobile (8081): NOT RUNNING" -ForegroundColor Yellow
}

if ($driverReady) { 
    Write-Host "   Driver Mobile (8082):   RUNNING" -ForegroundColor Green 
} else { 
    Write-Host "   Driver Mobile (8082):   NOT RUNNING" -ForegroundColor Yellow
}

$finalEmulators = & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices 2>$null | Select-String "emulator-"
$emulatorCount = ($finalEmulators | Measure-Object).Count
Write-Host "   Android Emulators:      $emulatorCount running" -ForegroundColor $(if ($emulatorCount -ge 2) { "Green" } else { "Yellow" })

Write-Host ""

# Show warning if critical services are not running
if (-not $backendReady -or -not $frontendReady) {
    Write-Host "WARNING: Some critical services are not running!" -ForegroundColor Red
    Write-Host "Check the minimized PowerShell windows for error messages." -ForegroundColor Yellow
    Write-Host ""
}

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
