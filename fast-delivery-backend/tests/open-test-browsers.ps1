# Script για άνοιγμα πολλαπλών browser windows για testing
# Κάθε window με διαφορετικό Chrome profile

$frontendUrl = "http://localhost:3000"

Write-Host "🚀 Άνοιγμα Test Browsers..." -ForegroundColor Cyan
Write-Host ""

# Browser path - Δοκιμάζουμε Chrome, Edge, Firefox
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

# Try Edge if Chrome not found
if (-not $browserPath) {
    $edgePaths = @(
        "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    )
    
    foreach ($path in $edgePaths) {
        if (Test-Path $path) {
            $browserPath = $path
            $browserName = "Edge"
            break
        }
    }
}

# Try Firefox if neither found
if (-not $browserPath) {
    $firefoxPaths = @(
        "C:\Program Files\Mozilla Firefox\firefox.exe",
        "C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
    )
    
    foreach ($path in $firefoxPaths) {
        if (Test-Path $path) {
            $browserPath = $path
            $browserName = "Firefox"
            break
        }
    }
}

if (-not $browserPath) {
    Write-Host "❌ Δεν βρέθηκε Chrome, Edge, ή Firefox." -ForegroundColor Red
    Write-Host "💡 Παρακαλώ εγκατέστησε έναν από αυτούς τους browsers." -ForegroundColor Yellow
    exit
}

Write-Host "✅ Χρήση browser: $browserName" -ForegroundColor Green
Write-Host "   Path: $browserPath" -ForegroundColor Gray
Write-Host ""

# Δημιουργία temp profiles directory
$profilesDir = "$env:TEMP\FastDeliveryProfiles"
if (-not (Test-Path $profilesDir)) {
    New-Item -ItemType Directory -Path $profilesDir | Out-Null
}

Write-Host "1️⃣  Admin Profile - http://localhost:3000/login" -ForegroundColor Green
Start-Process $browserPath -ArgumentList `
    "--user-data-dir=$profilesDir\Admin", `
    "--new-window", `
    "$frontendUrl/login", `
    "--window-position=0,0", `
    "--window-size=800,900"

Start-Sleep -Seconds 2

Write-Host "2️⃣  Store Profile - http://localhost:3000/login" -ForegroundColor Blue
Start-Process $browserPath -ArgumentList `
    "--user-data-dir=$profilesDir\Store", `
    "--new-window", `
    "$frontendUrl/login", `
    "--window-position=820,0", `
    "--window-size=800,900"

Start-Sleep -Seconds 2

Write-Host "3️⃣  Driver Profile - http://localhost:3000/login" -ForegroundColor Yellow
Start-Process $browserPath -ArgumentList `
    "--user-data-dir=$profilesDir\Driver", `
    "--new-window", `
    "$frontendUrl/login", `
    "--window-position=0,500", `
    "--window-size=800,900"

Start-Sleep -Seconds 2

Write-Host "4️⃣  Customer Profile - http://localhost:3000" -ForegroundColor Magenta
Start-Process $browserPath -ArgumentList `
    "--user-data-dir=$profilesDir\Customer", `
    "--new-window", `
    "$frontendUrl", `
    "--window-position=820,500", `
    "--window-size=800,900"

Write-Host ""
Write-Host "✅ Όλα τα browser windows άνοιξαν!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Credentials:" -ForegroundColor Cyan
Write-Host "   Admin:    admin@fastdelivery.gr / admin123" -ForegroundColor Green
Write-Host "   Store:    store@test.com / store123" -ForegroundColor Blue
Write-Host "   Driver:   driver@test.com / driver123" -ForegroundColor Yellow
Write-Host "   Customer: Χωρίς login (guest)" -ForegroundColor Magenta
Write-Host ""
Write-Host "💡 Κάνε login σε κάθε παράθυρο και τα profiles θα αποθηκευτούν!" -ForegroundColor White
Write-Host "   Την επόμενη φορά θα είσαι ήδη logged in!" -ForegroundColor White
Write-Host ""
