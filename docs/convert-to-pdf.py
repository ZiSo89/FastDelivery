#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Fast Delivery - Markdown to PDF Converter
Μετατρέπει το ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md σε PDF με υποστήριξη ελληνικών
"""

import os
from pathlib import Path

def install_dependencies():
    """Εγκαθιστά τα απαραίτητα packages"""
    print("🔧 Εγκατάσταση απαραίτητων βιβλιοθηκών...")
    os.system("pip install markdown2 pdfkit weasyprint reportlab markdown Pillow")
    print("✅ Ολοκληρώθηκε η εγκατάσταση\n")

def convert_with_weasyprint():
    """
    Μετατρέπει το Markdown σε PDF με WeasyPrint
    Η καλύτερη λύση για ελληνικά και emoji
    """
    try:
        from weasyprint import HTML, CSS
        import markdown
        
        print("📄 Μετατροπή με WeasyPrint...")
        
        # Διάβασμα του Markdown αρχείου
        md_file = Path(__file__).parent / "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md"
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Μετατροπή Markdown σε HTML
        html_content = markdown.markdown(
            md_content,
            extensions=['extra', 'codehilite', 'tables']
        )
        
        # HTML template με CSS για ελληνικά
        html_full = f"""
        <!DOCTYPE html>
        <html lang="el">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Fast Delivery - Εγχειρίδιο Χρήστη</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
                
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
                    line-height: 1.8;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background: #fff;
                }}
                
                h1 {{
                    color: #2c3e50;
                    border-bottom: 4px solid #3498db;
                    padding-bottom: 15px;
                    margin-bottom: 30px;
                    font-size: 2.5em;
                    page-break-after: avoid;
                }}
                
                h2 {{
                    color: #2980b9;
                    margin-top: 40px;
                    margin-bottom: 20px;
                    font-size: 2em;
                    border-left: 5px solid #3498db;
                    padding-left: 15px;
                    page-break-after: avoid;
                }}
                
                h3 {{
                    color: #34495e;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    font-size: 1.5em;
                    page-break-after: avoid;
                }}
                
                h4 {{
                    color: #555;
                    margin-top: 20px;
                    margin-bottom: 10px;
                    font-size: 1.2em;
                    page-break-after: avoid;
                }}
                
                p {{
                    margin-bottom: 15px;
                    text-align: justify;
                }}
                
                ul, ol {{
                    margin-left: 30px;
                    margin-bottom: 20px;
                }}
                
                li {{
                    margin-bottom: 8px;
                }}
                
                code {{
                    background-color: #f4f4f4;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }}
                
                pre {{
                    background-color: #f8f8f8;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 20px;
                    overflow-x: auto;
                    page-break-inside: avoid;
                }}
                
                pre code {{
                    background: none;
                    padding: 0;
                }}
                
                hr {{
                    border: none;
                    border-top: 2px solid #eee;
                    margin: 40px 0;
                }}
                
                blockquote {{
                    border-left: 4px solid #3498db;
                    padding-left: 20px;
                    margin: 20px 0;
                    color: #555;
                    font-style: italic;
                }}
                
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }}
                
                th, td {{
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }}
                
                th {{
                    background-color: #3498db;
                    color: white;
                    font-weight: bold;
                }}
                
                tr:nth-child(even) {{
                    background-color: #f9f9f9;
                }}
                
                .page-break {{
                    page-break-after: always;
                }}
                
                @page {{
                    size: A4;
                    margin: 2cm;
                    @bottom-right {{
                        content: "Σελίδα " counter(page);
                        font-size: 10pt;
                        color: #666;
                    }}
                }}
                
                /* Print-specific styles */
                @media print {{
                    body {{
                        font-size: 11pt;
                    }}
                    
                    h1 {{
                        font-size: 24pt;
                    }}
                    
                    h2 {{
                        font-size: 18pt;
                    }}
                    
                    h3 {{
                        font-size: 14pt;
                    }}
                }}
            </style>
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """
        
        # Δημιουργία PDF
        pdf_file = Path(__file__).parent / "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf"
        HTML(string=html_full).write_pdf(pdf_file)
        
        print(f"✅ Το PDF δημιουργήθηκε επιτυχώς: {pdf_file}")
        print(f"📊 Μέγεθος αρχείου: {pdf_file.stat().st_size / 1024:.2f} KB")
        return True
        
    except ImportError:
        print("❌ Το WeasyPrint δεν είναι εγκατεστημένο")
        return False
    except Exception as e:
        print(f"❌ Σφάλμα: {e}")
        return False

def convert_with_reportlab():
    """
    Εναλλακτική μέθοδος με ReportLab
    Χρειάζεται περισσότερο κώδικα αλλά δουλεύει πάντα
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
        
        print("📄 Μετατροπή με ReportLab...")
        
        # Διάβασμα του Markdown αρχείου
        md_file = Path(__file__).parent / "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md"
        with open(md_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Δημιουργία PDF
        pdf_file = Path(__file__).parent / "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.pdf"
        doc = SimpleDocTemplate(
            str(pdf_file),
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Styles
        styles = getSampleStyleSheet()
        
        # Custom styles για ελληνικά
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#2c3e50',
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading2_style = ParagraphStyle(
            'CustomHeading2',
            parent=styles['Heading2'],
            fontSize=18,
            textColor='#2980b9',
            spaceAfter=12,
            spaceBefore=20
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=10
        )
        
        # Story (περιεχόμενο)
        story = []
        
        for line in lines:
            line = line.strip()
            
            if not line:
                story.append(Spacer(1, 0.2*cm))
                continue
            
            # Αντικατάσταση Markdown markup
            if line.startswith('# '):
                text = line[2:].strip()
                story.append(Paragraph(text, title_style))
            elif line.startswith('## '):
                text = line[3:].strip()
                story.append(Paragraph(text, heading2_style))
            elif line.startswith('### '):
                text = line[4:].strip()
                story.append(Paragraph(f"<b>{text}</b>", normal_style))
            elif line.startswith('- '):
                text = line[2:].strip()
                story.append(Paragraph(f"• {text}", normal_style))
            elif line.startswith('**') and line.endswith('**'):
                text = line[2:-2]
                story.append(Paragraph(f"<b>{text}</b>", normal_style))
            elif line == '---':
                story.append(Spacer(1, 1*cm))
            else:
                # Κανονικό κείμενο
                text = line.replace('**', '<b>').replace('**', '</b>')
                text = text.replace('*', '<i>').replace('*', '</i>')
                story.append(Paragraph(text, normal_style))
        
        # Build PDF
        doc.build(story)
        
        print(f"✅ Το PDF δημιουργήθηκε επιτυχώς: {pdf_file}")
        print(f"📊 Μέγεθος αρχείου: {pdf_file.stat().st_size / 1024:.2f} KB")
        return True
        
    except ImportError:
        print("❌ Το ReportLab δεν είναι εγκατεστημένο")
        return False
    except Exception as e:
        print(f"❌ Σφάλμα: {e}")
        return False

def main():
    """Κύρια συνάρτηση"""
    print("=" * 60)
    print("  Fast Delivery - Μετατροπέας Markdown σε PDF")
    print("  Υποστήριξη Ελληνικών & Emoji")
    print("=" * 60)
    print()
    
    # Έλεγχος αν υπάρχει το αρχείο
    md_file = Path(__file__).parent / "ΕΓΧΕΙΡΙΔΙΟ_ΧΡΗΣΤΗ.md"
    if not md_file.exists():
        print(f"❌ Το αρχείο {md_file} δεν βρέθηκε!")
        return
    
    print(f"📖 Βρέθηκε αρχείο: {md_file.name}")
    print(f"📊 Μέγεθος: {md_file.stat().st_size / 1024:.2f} KB")
    print()
    
    # Προσπάθεια μετατροπής με WeasyPrint (καλύτερο αποτέλεσμα)
    print("🔄 Δοκιμή μεθόδου 1: WeasyPrint (συνιστάται)")
    if convert_with_weasyprint():
        print("\n🎉 Επιτυχής μετατροπή!")
        print("\n💡 Συμβουλή: Άνοιξε το PDF με Adobe Reader για καλύτερη απεικόνιση")
        return
    
    print("\n🔄 Δοκιμή μεθόδου 2: ReportLab (εναλλακτική)")
    if convert_with_reportlab():
        print("\n🎉 Επιτυχής μετατροπή!")
        return
    
    print("\n❌ Αποτυχία μετατροπής με όλες τις μεθόδους")
    print("\n📝 Εγκατάσταση dependencies:")
    print("   pip install weasyprint markdown")
    print("   Ή: pip install reportlab markdown")

if __name__ == "__main__":
    main()
