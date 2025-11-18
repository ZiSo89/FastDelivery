# Setup Test Data for Workflow
# Creates and approves a store and driver before running full workflow

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  SETUP TEST DATA" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/v1"

# Admin Login
Write-Host "[1] Admin Login..." -ForegroundColor Green
$loginBody = @{
    email = "admin@fastdelivery.gr"
    password = "admin123"
    role = "admin"
} | ConvertTo-Json

$adminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$adminToken = $adminLogin.token
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
Write-Host "    Token: $adminToken" -ForegroundColor Gray
Write-Host ""

# Create Store
Write-Host "[2] Register New Store..." -ForegroundColor Green
$storeBody = @{
    businessName = "Alex Mini Market"
    afm = "123456789"
    email = "alexmarket@test.com"
    password = "store123"
    phone = "2551098765"
    address = "Eleftherias 50, Alexandroupoli"
    storeType = "Mini Market"
    workingHours = "Mon-Sun 07:00-23:00"
    serviceAreas = "All city"
    location = @{
        type = "Point"
        coordinates = @(25.8738, 40.8475)
    }
} | ConvertTo-Json

try {
    $newStore = Invoke-RestMethod -Uri "$baseUrl/auth/store/register" -Method POST -Body $storeBody -ContentType "application/json"
    Write-Host "    Store registered: $($newStore.store.businessName)" -ForegroundColor Gray
    Write-Host "    Status: $($newStore.store.status)" -ForegroundColor Gray
    $storeId = $newStore.store._id
} catch {
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Getting existing stores..." -ForegroundColor Yellow
    $stores = Invoke-RestMethod -Uri "$baseUrl/admin/stores?status=pending" -Method GET -Headers $adminHeaders
    if ($stores.count -gt 0) {
        $storeId = $stores.stores[0]._id
        Write-Host "    Using existing store: $($stores.stores[0].businessName)" -ForegroundColor Gray
    }
}
Write-Host ""

# Approve Store
if ($storeId) {
    Write-Host "[3] Approve Store..." -ForegroundColor Green
    $approveBody = @{ action = "approve" } | ConvertTo-Json
    try {
        $approved = Invoke-RestMethod -Uri "$baseUrl/admin/stores/$storeId/approve" -Method PUT -Body $approveBody -ContentType "application/json" -Headers $adminHeaders
        Write-Host "    Store approved: $($approved.store.businessName)" -ForegroundColor Gray
        Write-Host "    Email: $($approved.store.email)" -ForegroundColor Gray
    } catch {
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Register Driver
Write-Host "[4] Register New Driver..." -ForegroundColor Green
$driverBody = @{
    name = "Nikos Driver"
    email = "nikos.driver@test.com"
    password = "driver123"
    phone = "6987654321"
    vehicleType = "Motorcycle"
    vehiclePlate = "ABC-1234"
    licenseNumber = "X123456789"
} | ConvertTo-Json

try {
    $newDriver = Invoke-RestMethod -Uri "$baseUrl/auth/driver/register" -Method POST -Body $driverBody -ContentType "application/json"
    Write-Host "    Driver registered: $($newDriver.driver.name)" -ForegroundColor Gray
    Write-Host "    Status: $($newDriver.driver.status)" -ForegroundColor Gray
    $driverId = $newDriver.driver._id
} catch {
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Getting existing drivers..." -ForegroundColor Yellow
    $drivers = Invoke-RestMethod -Uri "$baseUrl/admin/drivers?status=pending" -Method GET -Headers $adminHeaders
    if ($drivers.count -gt 0) {
        $driverId = $drivers.drivers[0]._id
        Write-Host "    Using existing driver: $($drivers.drivers[0].name)" -ForegroundColor Gray
    }
}
Write-Host ""

# Approve Driver
if ($driverId) {
    Write-Host "[5] Approve Driver..." -ForegroundColor Green
    $approveDriverBody = @{ action = "approve" } | ConvertTo-Json
    try {
        $approvedDriver = Invoke-RestMethod -Uri "$baseUrl/admin/drivers/$driverId/approve" -Method PUT -Body $approveDriverBody -ContentType "application/json" -Headers $adminHeaders
        Write-Host "    Driver approved: $($approvedDriver.driver.name)" -ForegroundColor Gray
        Write-Host "    Email: $($approvedDriver.driver.email)" -ForegroundColor Gray
    } catch {
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Summary
Write-Host "===================================" -ForegroundColor Green
Write-Host "  TEST DATA READY!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Store Login:" -ForegroundColor Yellow
Write-Host "  Email: alexmarket@test.com" -ForegroundColor White
Write-Host "  Password: store123" -ForegroundColor White
Write-Host ""
Write-Host "Driver Login:" -ForegroundColor Yellow
Write-Host "  Email: nikos.driver@test.com" -ForegroundColor White
Write-Host "  Password: driver123" -ForegroundColor White
Write-Host ""
