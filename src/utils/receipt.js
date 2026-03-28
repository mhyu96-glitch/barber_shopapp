import { storage } from './storage.js';
import { formatter } from './formatter.js';

export const receipt = {
    /**
     * Print a thermal receipt
     * @param {Object} data - Payment/Appointment data
     * @param {Array} items - List of items {name, price}
     * @param {String} method - Payment method label
     */
    print(data, items, method = 'Tunai') {
        const settings = storage.get('settings', {});
        const paperSize = settings.printerPaperSize || '80mm'; // Default to 80mm
        const shopName = settings.printerHeader || settings.shopName || 'BarberPro Studio';
        const shopPhone = settings.phone || '0812-3456-7890';
        const shopAddress = settings.address || 'Jl. Executive Studio No. 1';
        const footerText = settings.printerFooter || 'Terima kasih atas kunjungan Anda!\nGunting Rambut, Senyum Kembali.';

        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        // Remove existing print area if any
        const oldArea = document.getElementById('thermal-print-area');
        if (oldArea) oldArea.remove();

        // Create new print area
        const printArea = document.createElement('div');
        printArea.id = 'thermal-print-area';
        
        // Dynamic Paper Size width
        const printWidth = paperSize === '58mm' ? '48mm' : '72mm';
        const fontSize = paperSize === '58mm' ? '10px' : '12px';
        const headerSize = paperSize === '58mm' ? '14px' : '16px';

        printArea.innerHTML = `
            <style>
                #thermal-print-area {
                    display: none;
                }
                @media print {
                    body * { visibility: hidden !important; }
                    #thermal-print-area, #thermal-print-area * { visibility: visible !important; }
                    #thermal-print-area { 
                        display: block !important;
                        position: absolute; left: 0; top: 0;
                        width: ${printWidth};
                        padding: 2mm 0;
                        font-family: 'Courier New', 'Lucida Console', monospace;
                        font-size: ${fontSize};
                        color: #000 !important;
                        background: #fff !important;
                        line-height: 1.4;
                    }
                    .receipt-header { text-align: center; margin-bottom: 8px; }
                    .receipt-header h2 { margin: 0; font-size: ${headerSize}; letter-spacing: 1px; text-transform: uppercase; }
                    .receipt-header p { margin: 1px 0; font-size: 9px; }
                    .receipt-line { border-top: 1px dashed #000; margin: 6px 0; }
                    .receipt-row { display: flex; justify-content: space-between; padding: 1px 0; }
                    .receipt-total { font-size: 1.2em; font-weight: bold; margin-top: 4px; }
                    .receipt-footer { text-align: center; margin-top: 12px; font-size: 9px; }
                    @page {
                        size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto;
                        margin: 0;
                    }
                }
            </style>
            <div class="receipt-header">
                ${settings.printerLogo ? `<img src="${settings.printerLogo}" style="max-width: 60px; margin-bottom: 8px; filter: grayscale(100%) contrast(200%); display: block; margin-left: auto; margin-right: auto;" />` : ''}
                <h2>${shopName}</h2>
                <p>${shopAddress}</p>
                <p>Telp: ${shopPhone}</p>
            </div>
            <div class="receipt-line"></div>
            <div class="receipt-row"><span>Tgl:</span><span>${dateStr} ${timeStr}</span></div>
            <div class="receipt-row"><span>No:</span><span>${(data.id || '').replace('PMT-', '').toUpperCase()}</span></div>
            <div class="receipt-row"><span>Plgn:</span><span>${data.customerName || 'Tamu'}</span></div>
            <div class="receipt-line"></div>
            
            ${items.map(item => `
                <div class="receipt-row">
                    <span style="flex: 1;">${item.name}</span>
                    <span style="margin-left: 10px;">${formatter.currency(item.price)}</span>
                </div>
            `).join('')}
            
            <div class="receipt-line"></div>
            <div class="receipt-row receipt-total">
                <span>TOTAL</span>
                <span>${formatter.currency(data.amount || data.price || 0)}</span>
            </div>
            <div class="receipt-row">
                <span>Bayar:</span>
                <span>${method}</span>
            </div>
            
            <div class="receipt-line"></div>
            <div class="receipt-footer">
                ${footerText.split('\n').map(line => `<p>${line}</p>`).join('')}
                <p style="margin-top: 4px; opacity: 0.5;">--- BarberPro POS ---</p>
            </div>
        `;

        document.body.appendChild(printArea);
        
        // Trigger print
        setTimeout(() => {
            window.print();
        }, 100);
    }
};
