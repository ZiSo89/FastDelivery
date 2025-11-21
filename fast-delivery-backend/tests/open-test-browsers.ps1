# Script for opening multiple browser windows for testing
# Each window with different Chrome profile
# Checks first for existing profiles

# --- Start Servers ---
$backendPath = "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-backend"
$frontendPath = "C:\Users\zisog\Documents\Projects\FastDelivery\fast-delivery-frontend"

Write-Host "Starting Backend Server (nodemon)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start"

Write-Host "Waiting 15 seconds for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
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

Write-Host ""
Write-Host "All browser windows opened!" -ForegroundColor Green
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
