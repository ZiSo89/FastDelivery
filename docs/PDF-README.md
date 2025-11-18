# Μετατροπή Εγχειριδίου σε PDF

Αυτός ο φάκελος περιέχει scripts για μετατροπή του `ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md` σε PDF.

## 🚀 Γρήγορη Χρήση (Windows)

### Απλή Μέθοδος:
1. Κάνε **διπλό κλικ** στο `create-pdf.ps1`
2. Περίμενε 1-2 λεπτά
3. Το PDF θα δημιουργηθεί αυτόματα!

### Εναλλακτική (PowerShell):
```powershell
cd docs
.\create-pdf.ps1
```

## 🐍 Χειροκίνητη Χρήση (Python)

### 1. Εγκατάσταση Dependencies:

**Μέθοδος 1 (WeasyPrint - Συνιστάται):**
```bash
pip install weasyprint markdown
```

**Μέθοδος 2 (ReportLab - Εναλλακτική):**
```bash
pip install reportlab markdown
```

### 2. Εκτέλεση:
```bash
cd docs
python convert-to-pdf.py
```

## 📋 Τι Κάνει το Script;

1. ✅ Διαβάζει το `ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md`
2. ✅ Μετατρέπει Markdown → HTML
3. ✅ Εφαρμόζει όμορφο CSS styling
4. ✅ Υποστηρίζει **ελληνικά** και **emoji**
5. ✅ Δημιουργεί `ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf`

## 🎨 Χαρακτηριστικά PDF:

- ✅ **Πλήρης υποστήριξη ελληνικών** (UTF-8)
- ✅ **Emoji & Σύμβολα** (📱 🎯 ✅ ❌ κλπ)
- ✅ **Professional design** με χρώματα
- ✅ **Table of contents** ready
- ✅ **Print-friendly** formatting
- ✅ **Αρίθμηση σελίδων**
- ✅ **A4 format** (2cm margins)

## 🔧 Troubleshooting

### Πρόβλημα: "Python δεν βρέθηκε"
**Λύση:** Εγκατάστησε το Python από https://www.python.org/downloads/

### Πρόβλημα: "WeasyPrint failed"
**Λύση:** Δοκίμασε ReportLab:
```bash
pip install reportlab markdown
python convert-to-pdf.py
```

### Πρόβλημα: "Τα ελληνικά δεν φαίνονται σωστά"
**Λύση:** Άνοιξε το PDF με Adobe Acrobat Reader (όχι browser)

### Πρόβλημα: "Script execution disabled"
**Λύση (PowerShell ως Administrator):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📦 Απαιτήσεις

- Python 3.7+ (https://www.python.org/downloads/)
- pip (συνήθως έρχεται με το Python)
- Internet connection (για πρώτη εγκατάσταση packages)

## 📁 Αρχεία

```
docs/
├── ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md      # Αρχικό Markdown αρχείο
├── convert-to-pdf.py          # Python script μετατροπής
├── create-pdf.ps1             # PowerShell automation script
├── PDF-README.md              # Αυτό το αρχείο
└── ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf     # Τελικό PDF (δημιουργείται)
```

## 🌐 Online Εναλλακτικές (Χωρίς Python)

Αν δεν θες να εγκαταστήσεις Python:

1. **Pandoc Online:** https://pandoc.org/try/
   - Ανέβασε το .md
   - Επίλεξε PDF output
   - Κατέβασε

2. **Markdown to PDF:** https://md2pdf.netlify.app/
   - Copy-paste το περιεχόμενο
   - Download PDF

3. **Typora:** https://typora.io/
   - Ανοίγει .md αρχεία
   - Export → PDF

## 💡 Tips

- Για καλύτερη εμφάνιση: Χρησιμοποίησε Adobe Acrobat Reader
- Για μικρότερο μέγεθος: Χρησιμοποίησε ReportLab αντί για WeasyPrint
- Για επεξεργασία: Το Markdown είναι πιο εύκολο από PDF

## ✅ Αποτέλεσμα

Μετά την επιτυχή εκτέλεση θα έχεις:
- `ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf` (~200-500 KB)
- Professional formatting
- Έτοιμο για αποστολή σε πελάτες

---

**© 2025 Fast Delivery**
