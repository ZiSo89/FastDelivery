# Test Socket.IO Events
# Αυτό το script δημιουργεί μια παραγγελία και ελέγχει αν τα events στέλνονται

Write-Host "🧪 Testing Socket.IO Real-time Updates..." -ForegroundColor Cyan
Write-Host ""

# 1. Login as admin to get token
Write-Host "1️⃣ Admin Login..." -ForegroundColor Yellow
$adminLogin = @{
    email = "admin@fastdelivery.gr"
    password = "admin123"
    role = "admin"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" `
    -Method POST -Body $adminLogin -ContentType "application/json"

$adminToken = $adminResponse.token
Write-Host "   ✅ Admin logged in" -ForegroundColor Green
Write-Host ""

# 2. Get a store
Write-Host "2️⃣ Getting stores..." -ForegroundColor Yellow
$stores = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/orders/stores"
$storeId = $stores.stores[0]._id
$storeName = $stores.stores[0].businessName
Write-Host "   ✅ Using store: $storeName" -ForegroundColor Green
Write-Host ""

# 3. Create new order (this should trigger socket events)
Write-Host "3️⃣ Creating new order..." -ForegroundColor Yellow
$orderData = @{
    customer = @{
        name = "Socket Test User"
        phone = "6900000000"
        address = "Test Address 123, Αλεξανδρούπολη"
    }
    storeId = $storeId
    orderType = "text"
    orderContent = "1x Test Product for Socket.IO"
} | ConvertTo-Json -Depth 3

$newOrder = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/orders" `
    -Method POST -Body $orderData -ContentType "application/json"

Write-Host "   ✅ Order created: $($newOrder.order.orderNumber)" -ForegroundColor Green
Write-Host ""

Write-Host "📡 Socket Events που έπρεπε να σταλούν:" -ForegroundColor Cyan
Write-Host "   1. order:new → Σε όλα τα admin panels" -ForegroundColor White
Write-Host "   2. order:new → Στο κατάστημα ($storeName)" -ForegroundColor White
Write-Host ""

Write-Host "👀 Έλεγξε τα browser windows:" -ForegroundColor Yellow
Write-Host "   - Admin Dashboard: Θα έπρεπε να δεις νέα παραγγελία" -ForegroundColor White
Write-Host "   - Store Dashboard: Θα έπρεπε να δεις νέα παραγγελία" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Άνοιξε Chrome Console (F12) και ψάξε για:" -ForegroundColor Yellow
Write-Host "   📨 Socket event received: order:new" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
