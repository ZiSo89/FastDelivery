# Update Test Users with Greek data from Alexandroupoli

Write-Host "`n=== UPDATING STORE PROFILE ===" -ForegroundColor Cyan

# Store update
$storeBody = @{
    name = "Mini Market Alexandroupolis"
    phone = "2551099999"
    address = "Leoforos Dimokratias 25, Alexandroupoli"
    afm = "999888777"
} | ConvertTo-Json -Compress

try {
    # Login as store first
    $loginStore = @{
        email = "store@test.com"
        password = "store123"
    } | ConvertTo-Json
    
    $storeLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $loginStore -ContentType "application/json"
    $storeToken = $storeLogin.token
    
    Write-Host "Logged in as store" -ForegroundColor Green
    
    # Get current profile
    $headers = @{ Authorization = "Bearer $storeToken" }
    $currentProfile = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/store/profile" -Method GET -Headers $headers
    
    Write-Host "Current store name: $($currentProfile.store.name)" -ForegroundColor Yellow
    Write-Host "Store already has data!" -ForegroundColor Green
    
} catch {
    Write-Host "Error updating store: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== UPDATING DRIVER PROFILE ===" -ForegroundColor Cyan

try {
    # Login as driver
    $loginDriver = @{
        email = "driver@test.com"
        password = "driver123"
    } | ConvertTo-Json
    
    $driverLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $loginDriver -ContentType "application/json"
    $driverToken = $driverLogin.token
    
    Write-Host "Logged in as driver" -ForegroundColor Green
    
    # Get current profile
    $headers = @{ Authorization = "Bearer $driverToken" }
    $currentDriverProfile = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/driver/profile" -Method GET -Headers $headers
    
    Write-Host "Current driver name: $($currentDriverProfile.driver.name)" -ForegroundColor Yellow
    Write-Host "Driver already has data!" -ForegroundColor Green
    
} catch {
    Write-Host "Error updating driver: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Store: store@test.com / store123" -ForegroundColor White
Write-Host "Driver: driver@test.com / driver123" -ForegroundColor White
Write-Host "`nNow try creating an order from Customer panel!" -ForegroundColor Green
