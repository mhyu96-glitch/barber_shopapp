/**
 * ocrService.js
 * Handles receipt scanning and data extraction using Tesseract.js
 */

export const ocrService = {
  async scanReceipt(imageFile) {
    try {
      // Initialize Tesseract
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'ind+eng', // Scan for Indonesian and English
        { 
          logger: m => console.log(m) // Optional: tracking progress
        }
      );

      console.log('Raw OCR Text:', text);
      return this.extractData(text);
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Gagal membaca struk. Pastikan foto jelas dan terang.');
    }
  },

  extractData(text) {
    const lines = text.split('\n');
    let amount = 0;
    let date = new Date().toISOString().split('T')[0];
    let description = '';

    // 1. Extract Amount
    // Look for lines containing "TOTAL", "JUMLAH", "RP", "NETT"
    const amountRegex = /(?:total|jumlah|rp|nett|bayar|net|tagihan)\s*[:=]?\s*([\d.,]{3,})/i;
    
    // We search from the bottom of the receipt as totals are usually at the end
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(amountRegex);
      if (match) {
        const rawAmount = match[1].replace(/[.,]/g, ''); // Remove separators
        const val = parseInt(rawAmount);
        if (val > 100) { // Basic sanity check to avoid small numbers/noise
          amount = val;
          break;
        }
      }
    }

    // 2. Extract Date
    // Look for common date patterns (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      let d = dateMatch[1].padStart(2, '0');
      let m = dateMatch[2].padStart(2, '0');
      let y = dateMatch[3];
      if (y.length === 2) y = '20' + y;
      
      // Basic validation if it's a valid date string
      const testDate = `${y}-${m}-${d}`;
      if (!isNaN(Date.parse(testDate))) {
        date = testDate;
      }
    }

    // 3. Extract Description (Tentative)
    // Try to find the first non-empty line that isn't a date or address (mock logic)
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim();
        if (line.length > 5 && !line.match(/\d/) && !line.includes('www')) {
            description = line;
            break;
        }
    }

    return { amount, date, description };
  }
};
