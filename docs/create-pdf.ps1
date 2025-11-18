# Fast Delivery - PDF Converter Script
# Μετατρέπει το ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md σε PDF

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Fast Delivery - Μετατροπή Εγχειριδίου σε PDF" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Έλεγχος Python
Write-Host "🔍 Έλεγχος Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Το Python δεν είναι εγκατεστημένο!" -ForegroundColor Red
    Write-Host "📥 Κατέβασε το από: https://www.python.org/downloads/" -ForegroundColor Yellow
    pause
    exit
}
Write-Host "✅ $pythonVersion" -ForegroundColor Green
Write-Host ""

# Μετάβαση στον φάκελο docs
Set-Location $PSScriptRoot

# Έλεγχος αρχείου Markdown
if (-Not (Test-Path "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md")) {
    Write-Host "❌ Το αρχείο ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md δεν βρέθηκε!" -ForegroundColor Red
    pause
    exit
}

Write-Host "📖 Βρέθηκε: ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md" -ForegroundColor Green
Write-Host ""

# Εγκατάσταση dependencies
Write-Host "📦 Εγκατάσταση απαραίτητων βιβλιοθηκών..." -ForegroundColor Yellow
Write-Host "   (Αυτό μπορεί να πάρει 1-2 λεπτά...)" -ForegroundColor Gray
Write-Host ""

# Προσπάθεια εγκατάστασης WeasyPrint
Write-Host "⬇️  Εγκατάσταση weasyprint..." -ForegroundColor Cyan
pip install weasyprint markdown --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WeasyPrint εγκαταστάθηκε επιτυχώς" -ForegroundColor Green
} else {
    Write-Host "⚠️  Πρόβλημα με WeasyPrint, δοκιμή ReportLab..." -ForegroundColor Yellow
    pip install reportlab markdown --quiet
}
Write-Host ""

# Εκτέλεση του Python script
Write-Host "🚀 Ξεκινά η μετατροπή..." -ForegroundColor Yellow
Write-Host ""

python convert-to-pdf.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  🎉 Επιτυχής Ολοκλήρωση!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    
    # Άνοιγμα του PDF αν υπάρχει
    if (Test-Path "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf") {
        Write-Host "📂 Το PDF βρίσκεται στο: $PSScriptRoot\ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf" -ForegroundColor Cyan
        Write-Host ""
        
        $openPdf = Read-Host "Θέλεις να ανοίξει το PDF; (Y/N)"
        if ($openPdf -eq "Y" -or $openPdf -eq "y") {
            Start-Process "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf"
        }
    }
} else {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  ❌ Αποτυχία Μετατροπής" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Δοκίμασε χειροκίνητα:" -ForegroundColor Yellow
    Write-Host "   python convert-to-pdf.py" -ForegroundColor Gray
}

Write-Host ""
pause
