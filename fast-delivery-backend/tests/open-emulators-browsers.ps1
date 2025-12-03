# Script for opening Android emulators and Chrome browser profiles
# Quick startup without servers

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   FastDelivery - Emulators & Browsers" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Start Android Emulators ---
$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"

# Get list of running emulators
$runningEmulators = & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices 2>$null | Select-String "emulator-"
$runningCount = ($runningEmulators | Measure-Object).Count

# Get available AVDs
$avdList = & $emulatorPath -list-avds 2>$null

if ($avdList) {
    $avds = $avdList -split "`n" | Where-Object { $_ -match '\S' }
    Write-Host "Available Android Emulators:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $avds.Count; $i++) {
        Write-Host "   $($i + 1). $($avds[$i])" -ForegroundColor Gray
    }
    Write-Host ""
    
    if ($runningCount -ge 2) {
        Write-Host "Emulators already running ($runningCount found)" -ForegroundColor Green
    } elseif ($runningCount -eq 1) {
        Write-Host "1 emulator running, starting second one..." -ForegroundColor Yellow
        if ($avds.Count -ge 2) {
            $emulator2 = $avds[1].Trim()
            Write-Host "   Starting emulator 2: $emulator2 (Driver)" -ForegroundColor Yellow
            Start-Process $emulatorPath -ArgumentList "-avd", $emulator2, "-no-snapshot-load"
        }
    } else {
        Write-Host "Starting Android Emulators..." -ForegroundColor Yellow
        
        # Start first emulator (Customer)
        if ($avds.Count -ge 1) {
            $emulator1 = $avds[0].Trim()
            Write-Host "   Starting emulator 1: $emulator1 (Customer)" -ForegroundColor Magenta
            Start-Process $emulatorPath -ArgumentList "-avd", $emulator1, "-no-snapshot-load"
            
            Write-Host "   Waiting 8 seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds 8
        }
        
        # Start second emulator (Driver)
        if ($avds.Count -ge 2) {
            $emulator2 = $avds[1].Trim()
            Write-Host "   Starting emulator 2: $emulator2 (Driver)" -ForegroundColor Yellow
            Start-Process $emulatorPath -ArgumentList "-avd", $emulator2, "-no-snapshot-load"
        }
    }
} else {
    Write-Host "No Android emulators found." -ForegroundColor Yellow
}

Write-Host ""

# --- Open Chrome Browsers ---
Write-Host "Opening Chrome browsers..." -ForegroundColor Cyan
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
    Write-Host "Chrome not found!" -ForegroundColor Red
    exit
}

$frontendUrl = "http://localhost:3000"

# Open Admin - Profile 4
Write-Host "1. Admin Profile (Profile 4)" -ForegroundColor Green
Start-Process $browserPath -ArgumentList "--profile-directory=`"Profile 4`"", "$frontendUrl/login"
Start-Sleep -Seconds 2

# Open Store - Profile 6
Write-Host "2. Store Profile (Profile 6)" -ForegroundColor Blue
Start-Process $browserPath -ArgumentList "--profile-directory=`"Profile 6`"", "$frontendUrl/login"
Start-Sleep -Seconds 2

# Open Driver - Profile 5
Write-Host "3. Driver Profile (Profile 5)" -ForegroundColor Yellow
Start-Process $browserPath -ArgumentList "--profile-directory=`"Profile 5`"", "$frontendUrl/login"

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
