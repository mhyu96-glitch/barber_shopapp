// ========================================
// WhatsApp Integration Helper
// ========================================

import { formatter } from '../utils/formatter.js';
import { dateUtils } from '../utils/dateUtils.js';
import { storage } from '../utils/storage.js';

export const whatsapp = {
    // Helper to replace tokens
    _parseTemplate(template, data) {
        if (!template) return '';
        const settings = storage.get('settings', {});
        return template
            .replace(/\\[NAMA_PELANGGAN\\]/g, data.customer?.name || '')
            .replace(/\\[TANGGAL\\]/g, data.appointment ? dateUtils.formatDate(data.appointment.date, 'long') : '')
            .replace(/\\[WAKTU\\]/g, data.appointment?.time || '')
            .replace(/\\[LAYANAN\\]/g, data.appointment?.serviceName || '')
            .replace(/\\[NAMA_BARBER\\]/g, data.appointment?.barberName || '')
            .replace(/\\[NAMA_TOKO\\]/g, settings.shopName || 'BarberPro Studio')
            .replace(/\\[ALAMAT_TOKO\\]/g, settings.address || '')
            .replace(/\\[HARGA\\]/g, data.payment ? formatter.currency(data.payment.amount) : '');
    },

    // Send appointment confirmation
    sendConfirmation(appointment, customer) {
        const settings = storage.get('settings', {});
        const defaultTpl = 'Halo [NAMA_PELANGGAN]! 👋\\n\\nJanji temu Anda telah dikonfirmasi:\\n📅 Tanggal: [TANGGAL]\\n⏰ Jam: [WAKTU] WIB\\n💇 Layanan: [LAYANAN]\\n💈 Barber: [NAMA_BARBER]\\n\\n[NAMA_TOKO]\\n📍 [ALAMAT_TOKO]\\n\\nSampai jumpa! ✂️';
        const tpl = settings.waTemplates?.confirmation || defaultTpl;
        const msg = this._parseTemplate(tpl, { appointment, customer });
        this.openWA(customer.phone, msg);
    },

    // Send reminder
    sendReminder(appointment, customer) {
        const settings = storage.get('settings', {});
        const defaultTpl = 'Halo [NAMA_PELANGGAN]! 🔔\\n\\nReminder janji temu Anda:\\n📅 [TANGGAL]\\n⏰ Jam [WAKTU] WIB\\n💇 [LAYANAN]\\n\\nJangan lupa ya! 😊\\nBalas pesan ini jika ada perubahan.';
        const tpl = settings.waTemplates?.reminder || defaultTpl;
        const msg = this._parseTemplate(tpl, { appointment, customer });
        this.openWA(customer.phone, msg);
    },

    // Send birthday greeting (static for now)
    sendBirthdayGreeting(customer) {
        const msg = `Selamat Ulang Tahun, ${customer.name}! 🎂🎉\n\n` +
            `Sebagai hadiah spesial, kami berikan GRATIS potong rambut untuk Anda!\n\n` +
            `Berlaku hari ini saja.\n` +
            `Tunjukkan pesan ini saat berkunjung.\n\n` +
            `Salam hangat,\nBarberPro Studio ✂️`;

        this.openWA(customer.phone, msg);
    },

    // Send payment receipt
    sendReceipt(appointment, customer, payment) {
        const settings = storage.get('settings', {});
        const defaultTpl = 'Terima kasih [NAMA_PELANGGAN]! 🙏\\n\\nPembayaran diterima:\\n💰 [HARGA]\\n📝 ' + (payment.type === 'dp' ? 'DP' : 'Lunas') + '\\n💇 [LAYANAN]\\n📅 [TANGGAL]\\n\\n[NAMA_TOKO] ✂️';
        const tpl = settings.waTemplates?.receipt || defaultTpl;
        const msg = this._parseTemplate(tpl, { appointment, customer, payment });
        this.openWA(customer.phone, msg);
    },

    // Send custom message
    sendCustom(phone, message) {
        this.openWA(phone, message);
    },

    // Open WhatsApp with pre-filled message
    openWA(phone, message) {
        const url = formatter.waLink(phone, message);
        window.open(url, '_blank');
    },

    // Get WA link (for href)
    getLink(phone, message = '') {
        return formatter.waLink(phone, message);
    }
};
