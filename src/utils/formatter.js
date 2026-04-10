// ========================================
// Formatters - Currency, text, etc.
// ========================================

export const formatter = {
    currency(amount) {
        return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
    },

    phone(phone) {
        if (!phone) return '-';
        // Normalize to 62 prefix
        let p = phone.replace(/\D/g, '');
        if (p.startsWith('0')) p = '62' + p.slice(1);
        if (!p.startsWith('62')) p = '62' + p;
        return p;
    },

    phoneDisplay(phone) {
        if (!phone) return '-';
        let p = phone.replace(/\D/g, '');
        if (p.startsWith('62')) p = '0' + p.slice(2);
        if (!p.startsWith('0')) p = '0' + p;
        return p;
    },

    waLink(phone, message = '') {
        const p = this.phone(phone);
        const msg = encodeURIComponent(message);
        return `https://wa.me/${p}${msg ? '?text=' + msg : ''}`;
    },

    initials(name) {
        if (!name) return '?';
        return name.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    },

    truncate(str, len = 30) {
        if (!str || str.length <= len) return str || '';
        return str.slice(0, len) + '...';
    },

    loyaltyTier(points = 0) {
        if (points >= 3000) return { name: 'Platinum', class: 'loyalty-platinum', icon: 'fa-gem', next: null };
        if (points >= 1500) return { name: 'Gold', class: 'loyalty-gold', icon: 'fa-crown', next: 3000 };
        if (points >= 500) return { name: 'Silver', class: 'loyalty-silver', icon: 'fa-medal', next: 1500 };
        return { name: 'Bronze', class: 'loyalty-bronze', icon: 'fa-award', next: 500 };
    },

    loyaltyPoints(amount) {
        return Math.floor(amount / 1000);
    },

    freeHaircuts(visits) {
        return Math.floor(visits / 10); // 1 free every 10 visits
    },

    percentage(value, total) {
        if (!total) return '0%';
        return Math.round((value / total) * 100) + '%';
    }
};
