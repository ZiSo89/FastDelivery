# Complete Workflow Test - Full Cycle
# Creates fresh order and completes entire workflow

$baseUrl = "http://localhost:5000/api/v1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE ORDER WORKFLOW - FULL TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 0: Create Fresh Order
Write-Host "[0] Creating New Order..." -ForegroundColor Yellow
$orderBody = @{
    customer = @{
        name = "Kostas Papadopoulos"
        phone = "6977123456"
        address = "Eleftherias 123, Alexandroupoli"
    }
    storeId = "691c6b70d51ff5f2a7d3a90d"
    storeName = "City Market"
    orderType = "text"
    orderContent = "2kg potatoes, 1kg tomatoes, 1L olive oil, feta cheese"
} | ConvertTo-Json

$order = Invoke-RestMethod -Uri "$baseUrl/orders" -Method POST -Body $orderBody -ContentType "application/json"
$orderId = $order.order._id
Write-Host "    Created: $($order.order.orderNumber)" -ForegroundColor Green
Write-Host "    Order ID: $orderId" -ForegroundColor Gray
Write-Host "    Status: $($order.order.status)" -ForegroundColor Gray
Write-Host ""

# Step 1: Store Login
Write-Host "[1] Store Login" -ForegroundColor Green
$storeLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
    -Body (@{email="citymarket@test.com"; password="store123"; role="store"} | ConvertTo-Json) `
    -ContentType "application/json"
$storeHeaders = @{ "Authorization" = "Bearer $($storeLogin.token)" }
Write-Host "    OK - $($storeLogin.user.businessName)" -ForegroundColor Gray

# Step 2: Store Accepts
Write-Host "[2] Store Accepts Order" -ForegroundColor Green
$accepted = Invoke-RestMethod -Uri "$baseUrl/store/orders/$orderId/accept" -Method PUT `
    -Body (@{action="accept"} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $storeHeaders
Write-Host "    OK - Status: $($accepted.order.status)" -ForegroundColor Gray

# Step 3: Store Sets Price
Write-Host "[3] Store Sets Product Price" -ForegroundColor Green
$priced = Invoke-RestMethod -Uri "$baseUrl/store/orders/$orderId/price" -Method PUT `
    -Body (@{productPrice=28.50} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $storeHeaders
Write-Host "    OK - Product Price: €$($priced.order.productPrice)" -ForegroundColor Gray
Write-Host "    Status: $($priced.order.status)" -ForegroundColor Gray

# Step 4: Admin Login
Write-Host "[4] Admin Login" -ForegroundColor Green
$adminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
    -Body (@{email="admin@fastdelivery.gr"; password="admin123"; role="admin"} | ConvertTo-Json) `
    -ContentType "application/json"
$adminHeaders = @{ "Authorization" = "Bearer $($adminLogin.token)" }
Write-Host "    OK - $($adminLogin.user.name)" -ForegroundColor Gray

# Step 5: Admin Adds Delivery Fee
Write-Host "[5] Admin Adds Delivery Fee" -ForegroundColor Green
$withFee = Invoke-RestMethod -Uri "$baseUrl/admin/orders/$orderId/delivery-fee" -Method PUT `
    -Body (@{deliveryFee=4.00} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $adminHeaders
Write-Host "    OK - Total: €$($withFee.order.totalPrice) (€$($withFee.order.productPrice) + €$($withFee.order.deliveryFee))" -ForegroundColor Gray
Write-Host "    Status: $($withFee.order.status)" -ForegroundColor Gray

# Step 6: Customer Confirms
Write-Host "[6] Customer Confirms Price" -ForegroundColor Green
$confirmed = Invoke-RestMethod -Uri "$baseUrl/orders/$orderId/confirm" -Method PUT `
    -Body (@{phone="6977123456"; confirm=$true} | ConvertTo-Json) `
    -ContentType "application/json"
Write-Host "    OK - Status: $($confirmed.order.status)" -ForegroundColor Gray

# Step 7: Driver Login
Write-Host "[7] Driver Login" -ForegroundColor Green
$driverLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
    -Body (@{email="nikos.driver@test.com"; password="driver123"; role="driver"} | ConvertTo-Json) `
    -ContentType "application/json"
$driverHeaders = @{ "Authorization" = "Bearer $($driverLogin.token)" }
$driverId = $driverLogin.user._id
Write-Host "    OK - $($driverLogin.user.name)" -ForegroundColor Gray

# Step 8: Driver Goes Online
Write-Host "[8] Driver Goes Online" -ForegroundColor Green
$online = Invoke-RestMethod -Uri "$baseUrl/driver/availability" -Method PUT `
    -Body (@{isOnline=$true} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $driverHeaders
Write-Host "    OK - Driver is online" -ForegroundColor Gray

# Step 9: Admin Assigns Driver
Write-Host "[9] Admin Assigns Driver to Order" -ForegroundColor Green
$assigned = Invoke-RestMethod -Uri "$baseUrl/admin/orders/$orderId/assign-driver" -Method PUT `
    -Body (@{driverId=$driverId} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $adminHeaders
Write-Host "    OK - Driver: $($assigned.order.driverName)" -ForegroundColor Gray
Write-Host "    Status: $($assigned.order.status)" -ForegroundColor Gray

# Step 10: Driver Accepts Assignment
Write-Host "[10] Driver Accepts Assignment" -ForegroundColor Green
$acceptedDriver = Invoke-RestMethod -Uri "$baseUrl/driver/orders/$orderId/accept" -Method PUT `
    -Body (@{action="accept"} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $driverHeaders
Write-Host "    OK - Status: $($acceptedDriver.order.status)" -ForegroundColor Gray

# Step 11: Store Marks as Preparing
Write-Host "[11] Store Marks Order as Preparing" -ForegroundColor Green
$preparing = Invoke-RestMethod -Uri "$baseUrl/store/orders/$orderId/status" -Method PUT `
    -Body (@{status="preparing"} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $storeHeaders
Write-Host "    OK - Status: $($preparing.order.status)" -ForegroundColor Gray

# Step 12: Driver Picks Up (In Delivery)
Write-Host "[12] Driver Picks Up Order (In Delivery)" -ForegroundColor Green
$inDelivery = Invoke-RestMethod -Uri "$baseUrl/driver/orders/$orderId/status" -Method PUT `
    -Body (@{status="in_delivery"} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $driverHeaders
Write-Host "    OK - Status: $($inDelivery.order.status)" -ForegroundColor Gray

# Step 13: Driver Completes Delivery
Write-Host "[13] Driver Completes Delivery" -ForegroundColor Green
$completed = Invoke-RestMethod -Uri "$baseUrl/driver/orders/$orderId/status" -Method PUT `
    -Body (@{status="completed"} | ConvertTo-Json) `
    -ContentType "application/json" -Headers $driverHeaders
Write-Host "    OK - Status: $($completed.order.status)" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  WORKFLOW COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Order Summary:" -ForegroundColor Yellow
Write-Host "  Order Number: $($completed.order.orderNumber)" -ForegroundColor White
Write-Host "  Customer: Kostas Papadopoulos" -ForegroundColor White
Write-Host "  Items: 2kg potatoes, 1kg tomatoes, 1L olive oil, feta cheese" -ForegroundColor White
Write-Host "  Store: City Market" -ForegroundColor White
Write-Host "  Driver: $($completed.order.driverName)" -ForegroundColor White
Write-Host "  Product Price: €28.50" -ForegroundColor White
Write-Host "  Delivery Fee: €4.00" -ForegroundColor White
Write-Host "  Total Price: €$($completed.order.totalPrice)" -ForegroundColor Green
Write-Host "  Final Status: $($completed.order.status)" -ForegroundColor Green
Write-Host ""

# Final Stats Check
Write-Host "Updated Statistics:" -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "$baseUrl/admin/stats" -Headers $adminHeaders
Write-Host "  Total Orders: $($stats.stats.totalOrders)" -ForegroundColor White
Write-Host "  Completed Today: $($stats.stats.ordersByStatus.completed)" -ForegroundColor White
Write-Host "  Revenue (Delivery Fees): €$($stats.stats.totalRevenue)" -ForegroundColor White
Write-Host "  Active Stores: $($stats.stats.activeStores)" -ForegroundColor White
Write-Host "  Online Drivers: $($stats.stats.activeDrivers)" -ForegroundColor White
Write-Host ""
