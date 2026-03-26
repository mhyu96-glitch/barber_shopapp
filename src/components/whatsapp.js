// ========================================
// WhatsApp Integration Helper
// ========================================

import { formatter } from '../utils/formatter.js';
import { dateUtils } from '../utils/dateUtils.js';
import { storage } from '../utils/storage.js';

export const whatsapp = {
    // Send appointment confirmation
    sendConfirmation(appointment, customer) {
        const settings = storage.get('settings', {});
        const msg = `Halo ${customer.name}! 👋\n\n` +
            `Janji temu Anda telah dikonfirmasi:\n` +
            `📅 Tanggal: ${dateUtils.formatDate(appointment.date, 'long')}\n` +
            `⏰ Jam: ${appointment.time} WIB\n` +
            `💇 Layanan: ${appointment.serviceName}\n` +
            `💈 Barber: ${appointment.barberName}\n\n` +
            `${settings.shopName || 'BarberPro Studio'}\n` +
            `📍 ${settings.address || ''}\n\n` +
            `Sampai jumpa! ✂️`;

        this.openWA(customer.phone, msg);
    },

    // Send reminder
    sendReminder(appointment, customer) {
        const msg = `Halo ${customer.name}! 🔔\n\n` +
            `Reminder janji temu Anda:\n` +
            `📅 ${dateUtils.formatDate(appointment.date, 'long')}\n` +
            `⏰ Jam ${appointment.time} WIB\n` +
            `💇 ${appointment.serviceName}\n\n` +
            `Jangan lupa ya! 😊\n` +
            `Balas pesan ini jika ada perubahan.`;

        this.openWA(customer.phone, msg);
    },

    // Send birthday greeting
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
        const msg = `Terima kasih ${customer.name}! 🙏\n\n` +
            `Pembayaran diterima:\n` +
            `💰 ${formatter.currency(payment.amount)}\n` +
            `📝 ${payment.type === 'dp' ? 'DP' : 'Lunas'}\n` +
            `💇 ${appointment.serviceName}\n` +
            `📅 ${dateUtils.formatDate(appointment.date, 'short')}\n\n` +
            `BarberPro Studio ✂️`;

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
