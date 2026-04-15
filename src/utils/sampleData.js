// ========================================
// Sample Data for Demo
// ========================================

import { storage } from './storage.js';

export function initSampleData() {
    // Current data version for synchronization
    const CURRENT_DATA_VERSION = '2.3';
    const lastVersion = storage.get('data_version', '0');

    console.log(`🔍 Checking Data Consistency (v${lastVersion} -> v${CURRENT_DATA_VERSION})...`);

    if (lastVersion === CURRENT_DATA_VERSION) {
        console.log('✅ Data already at latest version.');
        return;
    }

    console.log('🚀 Synchronizing New Default Services & Lookbook...');

    // Services Catalog
    const defaultServices = [
        { name: 'Potong Rambut', price: 35000, duration: 30, icon: 'fa-scissors', description: 'Potong rambut standar pria' },
        { name: 'Cukur Jenggot', price: 20000, duration: 15, icon: 'fa-razor', description: 'Trim & shaping jenggot' },
        { name: 'Potong + Cukur', price: 50000, duration: 45, icon: 'fa-cut', description: 'Paket potong rambut dan cukur jenggot' },
        { name: 'Hair Coloring', price: 150000, duration: 90, icon: 'fa-palette', description: 'Pewarnaan rambut premium' },
        { name: 'Creambath', price: 75000, duration: 60, icon: 'fa-spa', description: 'Perawatan rambut creambath' },
        { name: 'Hair Wash', price: 15000, duration: 15, icon: 'fa-shower', description: 'Cuci rambut + pijat kepala' },
        { name: 'Kids Cut', price: 25000, duration: 20, icon: 'fa-child', description: 'Potong rambut anak-anak' },
        { name: 'Pomade Styling', price: 45000, duration: 30, icon: 'fa-wand-magic-sparkles', description: 'Styling dengan pomade premium' },
        // New Premium Additions (Default Rp 0)
        { name: 'Konsultasi Gaya Rambut', price: 0, duration: 10, icon: 'fa-comments', description: 'Diskusi gaya rambut yang cocok untuk Anda' },
        { name: 'Pijat Kepala & Bahu', price: 0, duration: 15, icon: 'fa-hand-holding-heart', description: 'Relaksasi pijat kepala dan bahu' },
        { name: 'Cuci Rambut Relaksasi', price: 0, duration: 15, icon: 'fa-shower', description: 'Cuci rambut bersih dengan pijat' },
        { name: 'Aplikasi Hair Tonic', price: 0, duration: 5, icon: 'fa-bottle-droplet', description: 'Nutrisi akar rambut dengan hair tonic premium' },
        { name: 'Styling & Finish', price: 0, duration: 10, icon: 'fa-wind', description: 'Styling akhir menggunakan hair dryer & wax/pomade' },
        { name: 'Premium Aftershave', price: 0, duration: 5, icon: 'fa-spray-can', description: 'Kesegaran maksimal setelah cukur' },
        { name: 'Hair Tattoo / Design Line', price: 0, duration: 10, icon: 'fa-wand-magic', description: 'Sentuhan seni garis rambut' },
    ];

    // Style Lookbook
    const defaultGallery = [
        { title: 'Textured Crop Fade', description: 'Classic fade dengan clean lines', category: 'Modern', url: '/gallery/textured_crop_fade.png' },
        { title: 'Classic Pompadour', description: 'Undercut stylish untuk look modern', category: 'Classic', url: '/gallery/classic_pompadour.png' },
        { title: 'Skin Fade Buzz Cut', description: 'Pompadour klasik ala vintage', category: 'Simple', url: '/gallery/skin_fade_buzz_cut.png' },
        { title: 'Side Part Quiff', description: 'Potong pendek simple dan clean', category: 'Modern', url: '/gallery/side_part_quiff.png' },
        { title: 'Modern Mullet', description: 'Gaya mullet tren masa kini', category: 'Trendy', url: '/gallery/modern_mullet_fade.png' },
        { title: 'Classic Crew Cut', description: 'Potongan crew cut rapi dan profesional', category: 'Classic', url: '/gallery/classic_crew_cut.png' },
    ];

    // Incremental Sync logic
    const existingServices = storage.getAll('services');
    defaultServices.forEach(s => {
        if (!existingServices.some(ex => ex.name.toLowerCase() === s.name.toLowerCase())) {
            storage.add('services', s);
        }
    });

    const existingGallery = storage.getAll('gallery');
    defaultGallery.forEach(g => {
        if (!existingGallery.some(ex => ex.title?.toLowerCase() === g.title?.toLowerCase())) {
            storage.add('gallery', g);
        }
    });

    // Default Settings if missing
    const settings = storage.get('settings', {});
    if (!settings.shopName) {
        storage.set('settings', {
            shopName: 'BarberPro Studio',
            openTime: '08:00',
            closeTime: '21:00',
            closedDays: [0],
            address: 'Jl. Raya No. 123, Samarinda',
            phone: '081234567890',
            portalAccent: '#d4a843',
            language: 'id'
        });
    }

    // Mark as initialized for this version
    storage.set('data_version', CURRENT_DATA_VERSION);
    storage.set('initialized', true);
}
