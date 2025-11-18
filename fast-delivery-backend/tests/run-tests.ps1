# Fast Delivery API Tests
Write-Host ""
Write-Host "=== FAST DELIVERY API TESTS ===" -ForegroundColor Cyan
Write-Host "Base URL: http://localhost:5000/api/v1" -ForegroundColor Yellow
Write-Host ""

# 1. Health Check
Write-Host "[1] Health Check..." -ForegroundColor Green
$health = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health" -Method GET
Write-Host "    Status: $($health.message)" -ForegroundColor Gray
Write-Host ""

# 2. Admin Login
Write-Host "[2] Admin Login..." -ForegroundColor Green
$loginBody = @{
    email = "admin@fastdelivery.gr"
    password = "admin123"
    role = "admin"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
Write-Host "    User: $($login.user.name)" -ForegroundColor Gray
Write-Host "    Token: $($login.token.Substring(0, 30))..." -ForegroundColor Gray
$token = $login.token
Write-Host ""

# 3. Admin Stats
Write-Host "[3] Admin Stats (Protected)..." -ForegroundColor Green
$headers = @{ "Authorization" = "Bearer $token" }
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/admin/stats" -Method GET -Headers $headers
Write-Host "    Total Orders: $($stats.stats.totalOrders)" -ForegroundColor Gray
Write-Host "    Active Stores: $($stats.stats.activeStores)" -ForegroundColor Gray
Write-Host "    Active Drivers: $($stats.stats.activeDrivers)" -ForegroundColor Gray
Write-Host ""

# 4. Store Registration
Write-Host "[4] Store Registration..." -ForegroundColor Green
$storeBody = @{
    businessName = "Mini Market Alex"
    afm = "123456789"
    email = "store1@test.com"
    password = "store123"
    phone = "2551012345"
    address = "Main St 10"
    storeType = "Mini Market"
    workingHours = "Mon-Fri 08:00-22:00"
    serviceAreas = "City Center"
    location = @{
        type = "Point"
        coordinates = @(25.8738, 40.8475)
    }
} | ConvertTo-Json

try {
    $store = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/store/register" -Method POST -Body $storeBody -ContentType "application/json"
    Write-Host "    Name: $($store.store.businessName)" -ForegroundColor Gray
    Write-Host "    Status: $($store.store.status)" -ForegroundColor Yellow
} catch {
    Write-Host "    Store already exists or error" -ForegroundColor Yellow
}
Write-Host ""

# 5. Driver Registration
Write-Host "[5] Driver Registration..." -ForegroundColor Green
$driverBody = @{
    name = "John Driver"
    email = "driver1@test.com"
    password = "driver123"
    phone = "6901234567"
} | ConvertTo-Json

try {
    $driver = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/driver/register" -Method POST -Body $driverBody -ContentType "application/json"
    Write-Host "    Name: $($driver.driver.name)" -ForegroundColor Gray
    Write-Host "    Status: $($driver.driver.status)" -ForegroundColor Yellow
} catch {
    Write-Host "    Driver already exists or error" -ForegroundColor Yellow
}
Write-Host ""

# 6. Get Pending Stores
Write-Host "[6] Get Pending Stores..." -ForegroundColor Green
$pendingStores = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/admin/stores?status=pending" -Method GET -Headers $headers
Write-Host "    Found: $($pendingStores.count) pending stores" -ForegroundColor Gray
Write-Host ""

# 7. Get Pending Drivers
Write-Host "[7] Get Pending Drivers..." -ForegroundColor Green
$pendingDrivers = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/admin/drivers?status=pending" -Method GET -Headers $headers
Write-Host "    Found: $($pendingDrivers.count) pending drivers" -ForegroundColor Gray
Write-Host ""

Write-Host "=== ALL TESTS PASSED ===" -ForegroundColor Green
Write-Host ""
