// ========================================
// Sample Data for Demo
// ========================================

import { storage } from './storage.js';

export function initSampleData() {
    // Force update for new features
    const CURRENT_DATA_VERSION = '2.1';
    if (storage.get('data_version') !== CURRENT_DATA_VERSION) {
        storage.set('initialized', false); // Allow re-init
        storage.set('data_version', CURRENT_DATA_VERSION);
    }

    if (storage.get('initialized')) return;

    // Services
    const services = [
        { id: 's1', name: 'Potong Rambut', price: 35000, duration: 30, icon: 'fa-scissors', description: 'Potong rambut standar pria' },
        { id: 's2', name: 'Cukur Jenggot', price: 20000, duration: 15, icon: 'fa-razor', description: 'Trim & shaping jenggot' },
        { id: 's3', name: 'Potong + Cukur', price: 50000, duration: 45, icon: 'fa-cut', description: 'Paket potong rambut dan cukur jenggot' },
        { id: 's4', name: 'Hair Coloring', price: 150000, duration: 90, icon: 'fa-palette', description: 'Pewarnaan rambut premium' },
        { id: 's5', name: 'Creambath', price: 75000, duration: 60, icon: 'fa-spa', description: 'Perawatan rambut creambath' },
        { id: 's6', name: 'Hair Wash', price: 15000, duration: 15, icon: 'fa-shower', description: 'Cuci rambut + pijat kepala' },
        { id: 's7', name: 'Kids Cut', price: 25000, duration: 20, icon: 'fa-child', description: 'Potong rambut anak-anak' },
        { id: 's8', name: 'Pomade Styling', price: 45000, duration: 30, icon: 'fa-wand-magic-sparkles', description: 'Styling dengan pomade premium' },
        { id: 's9', name: 'Konsultasi Gaya Rambut', price: 0, duration: 10, icon: 'fa-comments', description: 'Diskusi gaya rambut yang cocok untuk Anda' },
        { id: 's10', name: 'Pijat Kepala & Bahu', price: 0, duration: 15, icon: 'fa-hand-holding-heart', description: 'Relaksasi pijat kepala dan bahu' },
        { id: 's11', name: 'Cuci Rambut Relaksasi', price: 0, duration: 15, icon: 'fa-shower', description: 'Cuci rambut bersih dengan pijat' },
        { id: 's12', name: 'Aplikasi Hair Tonic', price: 0, duration: 5, icon: 'fa-bottle-droplet', description: 'Nutrisi akar rambut dengan hair tonic premium' },
        { id: 's13', name: 'Styling & Finish', price: 0, duration: 10, icon: 'fa-wind', description: 'Styling akhir menggunakan hair dryer & wax/pomade' },
    ];
    storage.set('services', services);

    // Barbers
    const barbers = [
        { id: 'b1', name: 'Andi Pratama', phone: '081234567890', specialization: 'Classic & Modern Cut', rating: 4.8, totalRatings: 45, workDays: [1, 2, 3, 4, 5, 6], workStart: '08:00', workEnd: '20:00', avatar: '', bio: 'Barber profesional dengan pengalaman 5 tahun' },
        { id: 'b2', name: 'Budi Santoso', phone: '082345678901', specialization: 'Fade & Skin Fade', rating: 4.9, totalRatings: 62, workDays: [1, 2, 3, 4, 5, 6], workStart: '09:00', workEnd: '21:00', avatar: '', bio: 'Spesialis fade dan desain rambut modern' },
        { id: 'b3', name: 'Rizky Ananda', phone: '083456789012', specialization: 'Coloring & Styling', rating: 4.7, totalRatings: 31, workDays: [1, 2, 3, 5, 6], workStart: '10:00', workEnd: '20:00', avatar: '', bio: 'Expert hair coloring dan creative styling' },
    ];
    storage.set('barbers', barbers);

    // Customers
    const customers = [
        { id: 'c1', name: 'Ahmad Fauzi', phone: '085678901234', birthday: '1995-05-15', address: 'Jl. Merdeka No. 10', notes: 'Suka model fade', preferredBarber: 'b1', firstVisit: '2025-01-10', totalVisits: 24, totalSpent: 960000 },
        { id: 'c2', name: 'Doni Setiawan', phone: '086789012345', birthday: '1990-08-22', address: 'Jl. Sudirman No. 45', notes: 'Alergi produk tertentu', preferredBarber: 'b2', firstVisit: '2025-03-05', totalVisits: 15, totalSpent: 600000 },
        { id: 'c3', name: 'Eko Prasetyo', phone: '087890123456', birthday: '1998-12-03', address: '', notes: '', preferredBarber: 'b1', firstVisit: '2025-06-20', totalVisits: 8, totalSpent: 320000 },
        { id: 'c4', name: 'Fajar Nugroho', phone: '088901234567', birthday: '2000-03-17', address: 'Jl. Gatot Subroto No. 12', notes: 'Selalu minta pomade', preferredBarber: 'b3', firstVisit: '2025-09-01', totalVisits: 52, totalSpent: 2600000 },
        { id: 'c5', name: 'Gilang Ramadhan', phone: '089012345678', birthday: '1993-07-28', address: '', notes: '', preferredBarber: 'b2', firstVisit: '2026-01-15', totalVisits: 4, totalSpent: 140000 },
    ];
    storage.set('customers', customers);

    // Generate appointments for demo
    const now = new Date();
    const appointments = [];
    const statuses = ['scheduled', 'confirmed', 'done', 'done', 'done'];

    // Past appointments
    for (let i = 30; i >= 1; i--) {
        if (Math.random() > 0.4) continue;
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const barber = barbers[Math.floor(Math.random() * barbers.length)];
        const service = services[Math.floor(Math.random() * 4)];
        const hour = 8 + Math.floor(Math.random() * 10);
        const minute = Math.random() > 0.5 ? '00' : '30';
        appointments.push({
            id: 'a_past_' + i,
            customerId: customer.id,
            customerName: customer.name,
            barberId: barber.id,
            barberName: barber.name,
            serviceId: service.id,
            serviceName: service.name,
            date: dateStr,
            time: `${String(hour).padStart(2, '0')}:${minute}`,
            duration: service.duration,
            price: service.price,
            status: 'done',
            paymentStatus: 'paid',
            paymentAmount: service.price,
            dpAmount: 0,
            notes: '',
            rating: Math.floor(Math.random() * 2) + 4,
            createdAt: date.toISOString()
        });
    }

    // Today's appointments
    const todayStr = now.toISOString().split('T')[0];
    const todayAppts = [
        { customerId: 'c1', customerName: 'Ahmad Fauzi', barberId: 'b1', barberName: 'Andi Pratama', serviceId: 's1', serviceName: 'Potong Rambut', time: '09:00', status: 'done', paymentStatus: 'paid' },
        { customerId: 'c2', customerName: 'Doni Setiawan', barberId: 'b2', barberName: 'Budi Santoso', serviceId: 's3', serviceName: 'Potong + Cukur', time: '10:00', status: 'done', paymentStatus: 'paid' },
        { customerId: 'c3', customerName: 'Eko Prasetyo', barberId: 'b1', barberName: 'Andi Pratama', serviceId: 's1', serviceName: 'Potong Rambut', time: '14:00', status: 'confirmed', paymentStatus: 'dp' },
        { customerId: 'c5', customerName: 'Gilang Ramadhan', barberId: 'b2', barberName: 'Budi Santoso', serviceId: 's5', serviceName: 'Creambath', time: '15:30', status: 'scheduled', paymentStatus: 'unpaid' },
    ];
    todayAppts.forEach((a, i) => {
        const svc = services.find(s => s.id === a.serviceId);
        appointments.push({
            id: 'a_today_' + i,
            ...a,
            date: todayStr,
            duration: svc.duration,
            price: svc.price,
            paymentAmount: a.paymentStatus === 'paid' ? svc.price : (a.paymentStatus === 'dp' ? Math.round(svc.price * 0.5) : 0),
            dpAmount: a.paymentStatus === 'dp' ? Math.round(svc.price * 0.5) : 0,
            notes: '',
            rating: a.status === 'done' ? 5 : 0,
            createdAt: now.toISOString()
        });
    });

    // Future appointments
    for (let i = 1; i <= 7; i++) {
        if (Math.random() > 0.5) continue;
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const barber = barbers[Math.floor(Math.random() * barbers.length)];
        const service = services[Math.floor(Math.random() * 4)];
        const hour = 8 + Math.floor(Math.random() * 10);
        const minute = Math.random() > 0.5 ? '00' : '30';
        appointments.push({
            id: 'a_future_' + i,
            customerId: customer.id,
            customerName: customer.name,
            barberId: barber.id,
            barberName: barber.name,
            serviceId: service.id,
            serviceName: service.name,
            date: dateStr,
            time: `${String(hour).padStart(2, '0')}:${minute}`,
            duration: service.duration,
            price: service.price,
            status: Math.random() > 0.5 ? 'confirmed' : 'scheduled',
            paymentStatus: Math.random() > 0.5 ? 'dp' : 'unpaid',
            paymentAmount: Math.random() > 0.5 ? Math.round(service.price * 0.5) : 0,
            dpAmount: Math.random() > 0.5 ? Math.round(service.price * 0.5) : 0,
            notes: '',
            rating: 0,
            createdAt: now.toISOString()
        });
    }

    storage.set('appointments', appointments);

    // Payments
    const payments = appointments.filter(a => a.paymentStatus !== 'unpaid').map((a, i) => ({
        id: 'p' + i,
        appointmentId: a.id,
        customerId: a.customerId,
        customerName: a.customerName,
        amount: a.paymentAmount,
        type: a.paymentStatus === 'dp' ? 'dp' : 'full',
        method: ['cash', 'transfer', 'ewallet'][Math.floor(Math.random() * 3)],
        date: a.date,
        notes: '',
        createdAt: a.createdAt
    }));
    storage.set('payments', payments);

    // Gallery styles
    const gallery = [
        { id: 'g1', title: 'Textured Crop Fade', description: 'Classic fade dengan clean lines', category: 'Modern', url: '/gallery/textured_crop_fade.png' },
        { id: 'g2', title: 'Classic Pompadour', description: 'Undercut stylish untuk look modern', category: 'Classic', url: '/gallery/classic_pompadour.png' },
        { id: 'g3', title: 'Skin Fade Buzz Cut', description: 'Pompadour klasik ala vintage', category: 'Simple', url: '/gallery/skin_fade_buzz_cut.png' },
        { id: 'g4', title: 'Side Part Quiff', description: 'Potong pendek simple dan clean', category: 'Modern', url: '/gallery/side_part_quiff.png' },
        { id: 'g5', title: 'Modern Mullet', description: 'Gaya mullet tren masa kini', category: 'Trendy', url: '/gallery/modern_mullet_fade.png' },
        { id: 'g6', title: 'Crew Cut', description: 'Potongan crew cut rapi', category: 'Classic', url: '' },
    ];
    storage.set('gallery', gallery);

    // Promos
    const promos = [
        { id: 'pr1', name: 'Diskon Weekday', description: 'Diskon 10% untuk potong rambut Senin-Jumat', discount: 10, type: 'percentage', validDays: [1, 2, 3, 4, 5], serviceId: 's1', active: true, startDate: '2026-01-01', endDate: '2026-12-31' },
        { id: 'pr2', name: 'Paket Hemat', description: 'Potong + Creambath hanya Rp 100.000', discount: 10000, type: 'fixed', validDays: [0, 1, 2, 3, 4, 5, 6], serviceId: 's3', active: true, startDate: '2026-01-01', endDate: '2026-06-30' },
        { id: 'pr3', name: 'Birthday Special', description: 'Gratis potong rambut di hari ulang tahun!', discount: 100, type: 'percentage', validDays: [0, 1, 2, 3, 4, 5, 6], serviceId: '', active: true, startDate: '2026-01-01', endDate: '2026-12-31' },
    ];
    storage.set('promos', promos);

    // Work schedule / holidays
    const holidays = [
        { id: 'h1', date: '2026-03-29', name: 'Hari Raya Nyepi', notes: 'Tutup 1 hari' },
        { id: 'h2', date: '2026-03-31', name: 'Idul Fitri', notes: 'Tutup 3 hari' },
    ];
    storage.set('holidays', holidays);

    // Shop settings
    storage.set('settings', {
        shopName: 'BarberPro Studio',
        openTime: '08:00',
        closeTime: '21:00',
        closedDays: [0], // Minggu
        address: 'Jl. Raya No. 123, Samarinda',
        phone: '081234567890'
    });

    storage.set('initialized', true);
}
