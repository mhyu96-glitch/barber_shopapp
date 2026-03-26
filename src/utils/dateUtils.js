// ========================================
// Date Utilities
// ========================================

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

export const dateUtils = {
    today() {
        return new Date();
    },

    formatDate(date, format = 'long') {
        const d = new Date(date);
        if (format === 'long') return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
        if (format === 'short') return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
        if (format === 'iso') return d.toISOString().split('T')[0];
        if (format === 'day') return DAYS_ID[d.getDay()];
        if (format === 'dayshort') return DAYS_SHORT[d.getDay()];
        if (format === 'input') return d.toISOString().split('T')[0]; // yyyy-mm-dd
        return d.toLocaleDateString('id-ID');
    },

    formatTime(time) {
        // input: "14:00" or Date
        if (typeof time === 'string') return time;
        const d = new Date(time);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    formatDateTime(date) {
        const d = new Date(date);
        return `${this.formatDate(d, 'short')}, ${this.formatTime(d)}`;
    },

    getMonthName(month) { return MONTHS_ID[month]; },
    getMonthShort(month) { return MONTHS_SHORT[month]; },
    getDayName(day) { return DAYS_ID[day]; },
    getDayShort(day) { return DAYS_SHORT[day]; },

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    },

    isToday(date) {
        const d = new Date(date);
        const t = new Date();
        return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    },

    isSameDay(d1, d2) {
        const a = new Date(d1);
        const b = new Date(d2);
        return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    },

    daysBetween(d1, d2) {
        const a = new Date(d1);
        const b = new Date(d2);
        return Math.floor((b - a) / (1000 * 60 * 60 * 24));
    },

    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    },

    getTimeSlots(start = '08:00', end = '21:00', interval = 30) {
        const slots = [];
        let [h, m] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        while (h < eh || (h === eh && m <= em)) {
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            m += interval;
            if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
        }
        return slots;
    },

    getRelativeTime(date) {
        const now = new Date();
        const d = new Date(date);
        const diffMs = d - now;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins >= 0 && diffMins < 60) return `${diffMins} menit lagi`;
        if (diffHours >= 0 && diffHours < 24) return `${diffHours} jam lagi`;
        if (diffDays === 0) return 'Hari ini';
        if (diffDays === 1) return 'Besok';
        if (diffDays > 1 && diffDays < 7) return `${diffDays} hari lagi`;
        if (diffDays < 0 && diffDays > -1) return 'Hari ini';
        if (diffDays === -1) return 'Kemarin';
        return this.formatDate(d, 'short');
    },

    membershipDuration(firstVisit) {
        const days = this.daysBetween(firstVisit, new Date());
        if (days < 30) return `${days} hari`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} bulan`;
        const years = Math.floor(months / 12);
        const remainMonths = months % 12;
        return remainMonths > 0 ? `${years} tahun ${remainMonths} bulan` : `${years} tahun`;
    }
};
