// Fast Delivery - Markdown to PDF Converter (Node.js)
// Μετατρέπει το ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md σε PDF με υποστήριξη ελληνικών

const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('  Fast Delivery - Μετατροπέας Markdown σε PDF');
console.log('  Υποστήριξη Ελληνικών & Emoji');
console.log('============================================================\n');

// Έλεγχος αν υπάρχει το md-to-pdf package
try {
    require.resolve('md-to-pdf');
    convertToPdf();
} catch (e) {
    console.log('📦 Εγκατάσταση απαραίτητων βιβλιοθηκών...');
    console.log('   (Αυτό θα πάρει 10-20 δευτερόλεπτα...)\n');
    
    const { execSync } = require('child_process');
    try {
        execSync('npm install md-to-pdf', { stdio: 'inherit' });
        console.log('\n✅ Εγκατάσταση ολοκληρώθηκε!\n');
        convertToPdf();
    } catch (error) {
        console.error('❌ Αποτυχία εγκατάστασης dependencies');
        console.log('\n💡 Δοκίμασε χειροκίνητα:');
        console.log('   npm install md-to-pdf');
        console.log('   node convert-to-pdf.js\n');
        process.exit(1);
    }
}

async function convertToPdf() {
    const { mdToPdf } = require('md-to-pdf');
    
    const mdFile = path.join(__dirname, 'ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md');
    const pdfFile = path.join(__dirname, 'ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf');
    
    // Έλεγχος αν υπάρχει το αρχείο
    if (!fs.existsSync(mdFile)) {
        console.error(`❌ Το αρχείο ${mdFile} δεν βρέθηκε!`);
        process.exit(1);
    }
    
    console.log(`📖 Βρέθηκε αρχείο: ${path.basename(mdFile)}`);
    const stats = fs.statSync(mdFile);
    console.log(`📊 Μέγεθος: ${(stats.size / 1024).toFixed(2)} KB\n`);
    
    console.log('🔄 Μετατροπή σε PDF...');
    
    try {
        const pdf = await mdToPdf(
            { path: mdFile },
            {
                dest: pdfFile,
                pdf_options: {
                    format: 'A4',
                    margin: '2cm',
                    printBackground: true
                }
            }
        );
        
        const pdfStats = fs.statSync(pdfFile);
        console.log(`\n✅ Το PDF δημιουργήθηκε επιτυχώς!`);
        console.log(`📂 Αρχείο: ${pdfFile}`);
        console.log(`📊 Μέγεθος: ${(pdfStats.size / 1024).toFixed(2)} KB`);
        console.log('\n🎉 Επιτυχής μετατροπή!');
        console.log('\n💡 Συμβουλή: Άνοιξε το PDF με Adobe Reader για καλύτερη απεικόνιση\n');
        
    } catch (error) {
        console.error('\n❌ Σφάλμα κατά τη μετατροπή:', error.message);
        process.exit(1);
    }
}
