// ========================================
// Customer Portal - Booking Wizard
// ========================================

import { supabase } from '../utils/supabaseClient.js';
import { initSampleData } from '../utils/sampleData.js';

const STORAGE_PREFIX = 'barberpro_';
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

const STYLE_IMAGES = {
    // Foto nyata per gaya rambut (Unsplash)
    'Fade Cut':             'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
    'Undercut':             'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
    'Pompadour':            'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80',
    'Buzz Cut':             'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80',
    'Mullet':               'https://images.unsplash.com/photo-1620302380595-64c3c3933cff?w=400&q=80',
    'Crew Cut':             'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80',
    'Textured Crop':        'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=400&q=80',
    'Textured Crop Fade':   'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=400&q=80',
    'Classic Pompadour':    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80',
    'Skin Fade Buzz Cut':   'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80',
    'Side Part Quiff':      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80',
    'Modern Mullet':        'https://images.unsplash.com/photo-1620302380595-64c3c3933cff?w=400&q=80',
    'Classic Crew Cut':     'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80',
    'Quiff':                'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80',
    'Slick Back':           'https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=400&q=80',
    'French Crop':          'https://images.unsplash.com/photo-1593702288056-7cc3b3e24b6e?w=400&q=80',
    'Caesar Cut':           'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=400&q=80',
    'Ivy League':           'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80',
    'Mohawk':               'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400&q=80',
    'Faux Hawk':            'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400&q=80',
    'Comb Over':            'https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=400&q=80',
    'Taper Fade':           'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
    'High Fade':            'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
    'Low Fade':             'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
    'Mid Fade':             'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
    'Skin Fade':            'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80',
    'Drop Fade':            'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
    'Burst Fade':           'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=400&q=80',
    'Temple Fade':          'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
    'Bald Fade':            'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80',
    // Default fallback
    '_default':             'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
};

// === Storage helpers (read-only from main app's localStorage) ===
function sGet(key, def = null) {
  try { const v = localStorage.getItem(STORAGE_PREFIX + key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function sSet(key, val) { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val)); }
function sGetAll(key) { return sGet(key, []); }
function sAdd(key, item) {
  const list = sGetAll(key);
  item.id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  item.createdAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();
  list.push(item);
  sSet(key, list);
  return item;
}

// === Supabase Sync Helper ===
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
function toSnakeCaseObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, val] of Object.entries(obj)) result[toSnakeCase(key)] = val;
  return result;
}
async function syncToSupabase(table, item, isUpdate = false) {
  try {
    const dbData = toSnakeCaseObj(item);
    if (dbData.created_at) delete dbData.created_at;
    if (dbData.updated_at) delete dbData.updated_at;
    
    let query;
    if (isUpdate) {
      query = supabase.from(table).update(dbData).eq('id', item.id);
    } else {
      query = supabase.from(table).insert([dbData]);
    }
    
    const { error } = await query;
    if (error) console.error(`Supabase sync error (${table}):`, error);
    else console.log(`✅ Synced to Supabase (${isUpdate ? 'Update' : 'Insert'}): ${table}`);
  } catch (e) {
    console.warn(`Supabase sync failed for ${table}:`, e);
  }
}

// === State ===
let currentStep = 0; // 0=home, 1=service, 2=barber, 3=schedule, 4=info, 5=review, 6=success
let booking = { services: [], barber: null, date: null, time: null, name: '', phone: '', notes: '', promoId: null };
let currentShop = null; // { id, slug, name, ... }

// === Multi-Tenant: Load shop data from Supabase ===
async function loadShopData(slug) {
  try {
    // Fetch shop by slug
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (shopErr || !shop) return null;
    currentShop = shop;

    // Fetch shop-scoped data from Supabase
    const [servicesRes, barbersRes, settingsRes, promosRes, appointmentsRes, customersRes, galleryRes] = await Promise.all([
      supabase.from('services').select('*').eq('shop_id', shop.id),
      supabase.from('barbers').select('*').eq('shop_id', shop.id),
      supabase.from('settings').select('*').eq('shop_id', shop.id).limit(1),
      supabase.from('promos').select('*').eq('shop_id', shop.id),
      supabase.from('appointments').select('*').eq('shop_id', shop.id),
      supabase.from('customers').select('*').eq('shop_id', shop.id),
      supabase.from('gallery').select('*').eq('shop_id', shop.id),
    ]);

    // Store in localStorage for portal helpers to use
    if (servicesRes.data) sSet('services', servicesRes.data.map(toCamelCaseObj));
    if (barbersRes.data) sSet('barbers', barbersRes.data.map(toCamelCaseObj));
    if (promosRes.data) sSet('promos', promosRes.data.map(toCamelCaseObj));
    if (appointmentsRes.data) sSet('appointments', appointmentsRes.data.map(toCamelCaseObj));
    if (customersRes.data) sSet('customers', customersRes.data.map(toCamelCaseObj));
    if (galleryRes.data) sSet('gallery', galleryRes.data.map(toCamelCaseObj));
    if (settingsRes.data?.[0]) sSet('settings', toCamelCaseObj(settingsRes.data[0]));

    return shop;
  } catch (e) {
    console.error('Error loading shop:', e);
    return null;
  }
}

function toCamelCase(str) {
  return str.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
}
function toCamelCaseObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, val] of Object.entries(obj)) result[toCamelCase(key)] = val;
  return result;
}

function renderShopNotFound() {
  const main = document.getElementById('portal-main');
  main.innerHTML = `
    <div class="portal-main fade-in" style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 64px; margin-bottom: 16px;">🏪</div>
      <h2 style="margin-bottom: 8px;">Toko Tidak Ditemukan</h2>
      <p style="color: var(--p-muted); margin-bottom: 24px;">
        URL toko yang Anda masukkan tidak valid atau toko sudah tidak aktif.
      </p>
      <p style="font-size: 13px; color: var(--p-muted);">
        Contoh URL: <code>portal.html?shop=nama-toko-anda</code>
      </p>
    </div>
  `;
}

// === Init ===
document.addEventListener('DOMContentLoaded', async () => {
  // Ensure sample data is initialized if not using multi-tenant slug
  initSampleData();

  const params = new URLSearchParams(window.location.search);
  const shopSlug = params.get('shop');

  if (shopSlug) {
    // Multi-tenant: load from Supabase by slug
    const shop = await loadShopData(shopSlug);
    if (!shop) {
      renderShopNotFound();
      return;
    }
  }
  // If no slug, fallback to localStorage (legacy/local mode)

  initPortalTheme();
  renderHeader();
  renderFooter();

  if (params.get('status')) {
    renderStatusCheck(params.get('status'));
  } else {
    if (params.get('ref')) {
      booking.refId = params.get('ref');
    }
    if (params.get('barber')) {
      const bId = params.get('barber');
      const b = sGetAll('barbers').find(b => b.id === bId);
      if (b) booking.barber = b;
    }
    renderHome();
  }
});

function initPortalTheme() {
  const settings = sGet('settings', {});
  const accent = settings.portalAccent || '#d4a843';
  const root = document.documentElement;
  root.style.setProperty('--p-accent', accent);
  root.style.setProperty('--p-accent-glow', accent + '33');
}

const STEPS = [
  { label: 'Layanan', icon: 'fa-scissors' },
  { label: 'Barber', icon: 'fa-user' },
  { label: 'Jadwal', icon: 'fa-calendar' },
  { label: 'Data', icon: 'fa-id-card' },
  { label: 'Review', icon: 'fa-check' },
];

// === Helpers ===
function getServicePrice(service, checkHH = true) {
  if (!service) return 0;
  let price = service.price || 0;

  if (checkHH) {
    const settings = sGet('settings', {});
    if (settings.hhActive && settings.hhDiscount > 0) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (timeStr >= settings.hhStart && timeStr <= settings.hhEnd) {
        price = price * (1 - settings.hhDiscount / 100);
      }
    }
  }
  return Math.round(price);
}

function isHappyHourNow() {
  const settings = sGet('settings', {});
  if (!settings.hhActive || !settings.hhDiscount) return false;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return timeStr >= settings.hhStart && timeStr <= settings.hhEnd;
}

// === Translations ===
const TRANSLATIONS = {
  id: {
    welcome: 'Booking Online di',
    hero_sub: 'Pilih layanan, barber favorit, dan jadwal yang Anda inginkan. Mudah dan cepat!',
    btn_book_now: 'Booking Sekarang',
    btn_cek_status: 'Cek Status',
    promo_title: 'Promo Berlaku',
    barber_title: 'Tim Barber Kami',
    svc_title: 'Layanan Kami',
    review_title: 'Ulasan Pelanggan',
    loc_title: 'Lokasi Kami',

    step_svc: 'Pilih Layanan',
    step_svc_sub: 'Pilih layanan yang Anda inginkan',
    step_barber: 'Pilih Barber',
    step_barber_sub: 'Pilih barber favorit Anda',
    step_schedule: 'Pilih Jadwal',
    step_schedule_sub: 'Tentukan tanggal dan jam kedatangan',
    step_info: 'Informasi Anda',
    step_info_sub: 'Lengkapi data diri untuk konfirmasi',
    step_review: 'Review Booking',
    step_review_sub: 'Pastikan semua data sudah benar',

    label_svc: 'Layanan',
    label_barber: 'Barber',
    label_date: 'Tanggal',
    label_time: 'Jam',
    label_price: 'Harga',
    label_recurring: 'Rutin',
    label_name: 'Nama Lengkap',
    label_phone: 'Nomor WhatsApp',
    label_notes: 'Catatan tambahan (Opsional)',
    label_recurring_toggle: 'Jadikan Janji Temu Rutin? 📅',
    label_recurring_sub: 'Pilih frekuensi kunjungan rutin Anda:',

    btn_next: 'Lanjut',
    btn_back: 'Kembali',
    btn_confirm: 'Konfirmasi Booking',
    btn_cancel: 'Batal',

    hh_label: 'HAPPY HOUR',
    promo_badge: 'PROMO',
    status_pending: 'Menunggu Konfirmasi',
    status_done: 'Selesai',
    success_title: 'Booking Berhasil!',
    success_sub: 'Kode booking Anda adalah:',
    success_msg: 'Silakan simpan kode ini untuk mengecek status pesanan atau tunjukkan saat datang ke barbershop.',
    btn_home: 'Kembali ke Beranda',
    btn_wa_confirm: 'Konfirmasi via WhatsApp',
    status_title: 'Cek Status Booking',
    status_input_label: 'Masukkan Kode Booking',
    status_btn_check: 'Cek Sekarang',
    status_not_found: 'Kode booking tidak ditemukan.',
  },
  en: {
    welcome: 'Online Booking at',
    hero_sub: 'Choose your service, favorite barber, and schedule. Easy and fast!',
    btn_book_now: 'Book Now',
    btn_cek_status: 'Check Status',
    promo_title: 'Active Promos',
    barber_title: 'Our Barber Team',
    svc_title: 'Our Services',
    review_title: 'Customer Reviews',
    loc_title: 'Our Location',

    step_svc: 'Select Service',
    step_svc_sub: 'Choose the service you want',
    step_barber: 'Select Barber',
    step_barber_sub: 'Choose your favorite barber',
    step_schedule: 'Select Schedule',
    step_schedule_sub: 'Set your date and arrival time',
    step_info: 'Your Information',
    step_info_sub: 'Complete your details for confirmation',
    step_review: 'Review Booking',
    step_review_sub: 'Make sure all data is correct',

    label_svc: 'Service',
    label_barber: 'Barber',
    label_date: 'Date',
    label_time: 'Time',
    label_price: 'Price',
    label_recurring: 'Recurring',
    label_name: 'Full Name',
    label_phone: 'WhatsApp Number',
    label_notes: 'Additional notes (Optional)',
    label_recurring_toggle: 'Set as Recurring Appointment? 📅',
    label_recurring_sub: 'Choose your recurring frequency:',

    btn_next: 'Next',
    btn_back: 'Back',
    btn_confirm: 'Confirm Booking',
    btn_cancel: 'Cancel',

    hh_label: 'HAPPY HOUR',
    promo_badge: 'PROMO',
    status_pending: 'Awaiting Confirmation',
    status_done: 'Completed',

    success_title: 'Booking Successful!',
    success_sub: 'Your booking code is:',
    success_msg: 'Please save this code to check your order status or show it when you arrive at the barbershop.',
    btn_home: 'Back to Home',
    btn_wa_confirm: 'Confirm via WhatsApp',

    status_title: 'Check Booking Status',
    status_input_label: 'Enter Booking Code',
    status_btn_check: 'Check Now',
    status_not_found: 'Booking code not found.',
  }
};

function t(key) {
  const settings = sGet('settings', {});
  const lang = settings.language || 'id';
  return TRANSLATIONS[lang][key] || TRANSLATIONS['id'][key] || key;
}



// === Header ===
function renderHeader() {
  const settings = sGet('settings', {});
  const shopName = settings.shopName || 'BarberPro Studio';
  document.getElementById('portal-header').innerHTML = `
    <div class="portal-header">
      <div class="portal-header-inner">
        <div class="portal-logo" onclick="renderHome(); window.scrollTo({top:0});" style="cursor:pointer;">
          <i class="fas fa-scissors"></i>
          <h1>${shopName}</h1>
        </div>
        <div class="portal-header-actions">
          <button class="p-btn p-btn-sm" onclick="renderHome(); window.scrollTo({top:0});"
            style="background:transparent; color:var(--p-text2); border:1px solid var(--p-border); gap:6px;">
            <i class="fas fa-home"></i> Beranda
          </button>
          <button class="p-btn p-btn-sm" onclick="showStatusCheckModal()"
            style="background:transparent; color:var(--p-text2); border:1px solid var(--p-border); gap:6px;">
            <i class="fas fa-search"></i> Cek Status
          </button>
        </div>
      </div>
    </div>
  `;
}

// === Footer ===
function renderFooter() {
  const settings = sGet('settings', {});
  const shopName = settings.shopName || 'BarberPro Studio';
  const phone = settings.phone || '';
  const address = settings.address || '';

  document.getElementById('portal-footer').innerHTML = `
    <div class="portal-footer">
      ${address ? `<p style="margin-bottom: 6px;"><i class="fas fa-map-marker-alt" style="color: var(--p-accent);"></i> ${address}</p>` : ''}
      ${phone ? `<p style="margin-bottom: 12px;">
        <a href="https://wa.me/${phone.replace(/\D/g, '')}" target="_blank" style="color: #25d366; text-decoration: none;">
          <i class="fab fa-whatsapp"></i> ${phone}
        </a>
      </p>` : ''}
      <p>&copy; ${new Date().getFullYear()} ${shopName}</p>
    </div>
  `;
}

// === Home Page ===
window.renderHome = function () {
  currentStep = 0;
  const settings = sGet('settings', {});
  const shopName = settings.shopName || 'BarberPro Studio';
  const address = settings.address || '';
  const phone = settings.phone || '';
  const openTime = settings.openTime || '08:00';
  const closeTime = settings.closeTime || '21:00';
  const closedDays = settings.closedDays || [0];
  const promos = sGetAll('promos').filter(p => p.active && new Date(p.endDate) >= new Date());
  const barbers = sGetAll('barbers');
  const services = sGetAll('services');
  const gallery = sGetAll('gallery');

  // Jam buka / tutup
  const now = new Date();
  const dayNow = now.getDay();
  const timeNow = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const isClosedDay = closedDays.includes(dayNow);
  const isOpen = !isClosedDay && timeNow >= openTime && timeNow <= closeTime;

  // Reviews dari appointments
  const reviews = sGetAll('appointments')
    .filter(a => a.status === 'done' && a.rating > 0)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 6);

  // Avg rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const main = document.getElementById('portal-main');
  main.innerHTML = `
    <div class="portal-main fade-in">

      <!-- HERO -->
      <div class="portal-hero" style="padding: 48px 16px 32px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; background: radial-gradient(circle, var(--p-accent-glow) 0%, transparent 70%); pointer-events: none;"></div>
        
        <!-- Status Buka/Tutup -->
        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 16px;
          background: ${isOpen ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'};
          color: ${isOpen ? 'var(--p-success)' : 'var(--p-danger)'};
          border: 1px solid ${isOpen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: currentColor; ${isOpen ? 'animation: blink 1.5s infinite;' : ''}"></span>
          ${isOpen ? `BUKA • Tutup ${closeTime}` : `TUTUP • Buka ${openTime}`}
        </div>

        <h2 style="font-size: 30px; font-weight: 900; margin-bottom: 10px; line-height: 1.2;">
          ${t('welcome')} <span style="color: var(--p-accent);">${shopName}</span>
        </h2>
        <p style="color: var(--p-text2); font-size: 15px; max-width: 420px; margin: 0 auto 8px;">
          ${t('hero_sub')}
        </p>

        <!-- Rating & Stats -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin: 16px 0 24px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--p-warning);">
            <i class="fas fa-star"></i> ${avgRating}
            <span style="color: var(--p-muted); font-weight: 400;">(${reviews.length} ulasan)</span>
          </div>
          ${barbers.length > 0 ? `
            <div style="width: 1px; height: 16px; background: var(--p-border);"></div>
            <div style="font-size: 13px; color: var(--p-muted);">
              <i class="fas fa-user-tie" style="color: var(--p-accent);"></i> ${barbers.length} Barber Profesional
            </div>
          ` : ''}
          ${services.length > 0 ? `
            <div style="width: 1px; height: 16px; background: var(--p-border);"></div>
            <div style="font-size: 13px; color: var(--p-muted);">
              <i class="fas fa-scissors" style="color: var(--p-accent);"></i> ${services.length} Layanan
            </div>
          ` : ''}
        </div>

        <button class="p-btn p-btn-primary" onclick="startBooking()" style="font-size: 16px; padding: 14px 40px; border-radius: 50px; box-shadow: 0 6px 24px var(--p-accent-glow);">
          <i class="fas fa-calendar-plus"></i> ${t('btn_book_now')}
        </button>

        ${phone ? `
          <div style="margin-top: 14px;">
            <a href="https://wa.me/${phone.replace(/\D/g,'')}" target="_blank" style="color: #25d366; font-size: 13px; text-decoration: none; font-weight: 600;">
              <i class="fab fa-whatsapp"></i> Hubungi via WhatsApp
            </a>
          </div>
        ` : ''}
      </div>

      <style>
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      </style>

      <!-- Live Queue -->
      ${renderLiveQueue()}

      <!-- Happy Hour Banner -->
      ${isHappyHourNow() ? `
        <div style="background: linear-gradient(135deg, #facc15, #f59e0b); border-radius: 16px; padding: 14px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; color: #111;">
          <div style="font-size: 24px;">⚡</div>
          <div>
            <div style="font-weight: 800; font-size: 14px;">HAPPY HOUR AKTIF!</div>
            <div style="font-size: 12px; opacity: 0.8;">Diskon ${sGet('settings',{}).hhDiscount || 0}% untuk semua layanan • Berlaku s/d ${sGet('settings',{}).hhEnd}</div>
          </div>
        </div>
      ` : ''}

      <!-- Promo Banner -->
      ${promos.length > 0 ? `
        <div style="margin-bottom: 28px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 800;"><i class="fas fa-tags" style="color: var(--p-accent);"></i> ${t('promo_title')}</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${promos.map(p => {
              const svc = services.find(s => s.id === p.serviceId);
              return `
                <div class="promo-banner" style="cursor: pointer;" onclick="startBooking()">
                  <div class="promo-icon"><i class="fas fa-percent"></i></div>
                  <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 14px;">${p.name}</div>
                    <div style="font-size: 12px; color: var(--p-muted); margin-top: 2px;">
                      ${p.type === 'percentage' ? `Diskon ${p.discount}%` : `Hemat Rp ${Number(p.discount).toLocaleString('id')}`}
                      ${svc ? ` untuk <b>${svc.name}</b>` : ' untuk semua layanan'} • s/d ${formatDateShort(p.endDate)}
                    </div>
                  </div>
                  <span class="p-badge p-badge-gold">PROMO</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Gallery / Inspirasi Style -->
      ${gallery.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <h3 style="font-size: 16px; font-weight: 800;"><i class="fas fa-camera-retro" style="color: var(--p-accent);"></i> Inspirasi Style</h3>
            <span style="font-size: 12px; color: var(--p-muted);">Geser →</span>
          </div>
          <div class="portal-gallery-carousel" style="display: flex; gap: 14px; overflow-x: auto; padding: 4px 0 16px; scroll-snap-type: x mandatory;">
            ${gallery.map(item => {
              const imgUrl = item.image_url || item.url || item.image;
              const title = item.title || item.name || 'Style';
              // Prioritas: foto dari gallery data → STYLE_IMAGES → default
              const photoUrl = imgUrl || STYLE_IMAGES[title] || STYLE_IMAGES['_default'];
              return `
                <div style="flex: 0 0 150px; scroll-snap-align: start; border-radius: 18px; overflow: hidden; position: relative; aspect-ratio: 3/4; border: 1px solid var(--p-border); cursor: pointer;" onclick="useLookbookStyle('${title}')">
                  <img src="${photoUrl}" 
                    style="width:100%;height:100%;object-fit:cover;display:block;" 
                    alt="${title}" 
                    loading="lazy"
                    onerror="this.src='${STYLE_IMAGES['_default']}'"
                  />
                  <div style="position:absolute;bottom:0;left:0;right:0;padding:36px 10px 10px;background:linear-gradient(to top,rgba(0,0,0,0.9),transparent);">
                    <div style="font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:var(--p-accent);font-weight:800;">${item.category || 'STYLE'}</div>
                    <div style="font-weight:700;font-size:12px;color:#fff;margin-top:2px;">${title}</div>
                    <div style="margin-top:6px;background:var(--p-accent);color:#000;font-size:9px;font-weight:800;padding:4px 8px;border-radius:6px;text-align:center;letter-spacing:0.5px;">PILIH GAYA</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <!-- Fallback: tampilkan style default dengan foto nyata -->
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <h3 style="font-size: 16px; font-weight: 800;"><i class="fas fa-camera-retro" style="color: var(--p-accent);"></i> Inspirasi Style</h3>
            <span style="font-size: 12px; color: var(--p-muted);">Geser →</span>
          </div>
          <div class="portal-gallery-carousel" style="display: flex; gap: 14px; overflow-x: auto; padding: 4px 0 16px; scroll-snap-type: x mandatory;">
            ${[
              { title: 'Fade Cut',      category: 'MODERN',   photo: STYLE_IMAGES['Fade Cut'] },
              { title: 'Undercut',      category: 'TRENDY',   photo: STYLE_IMAGES['Undercut'] },
              { title: 'Pompadour',     category: 'CLASSIC',  photo: STYLE_IMAGES['Pompadour'] },
              { title: 'Buzz Cut',      category: 'SIMPLE',   photo: STYLE_IMAGES['Buzz Cut'] },
              { title: 'Crew Cut',      category: 'CLASSIC',  photo: STYLE_IMAGES['Crew Cut'] },
              { title: 'Quiff',         category: 'STYLISH',  photo: STYLE_IMAGES['Quiff'] },
              { title: 'Slick Back',    category: 'FORMAL',   photo: STYLE_IMAGES['Slick Back'] },
              { title: 'Taper Fade',    category: 'POPULAR',  photo: STYLE_IMAGES['Taper Fade'] },
            ].map(s => `
              <div style="flex:0 0 150px;scroll-snap-align:start;border-radius:18px;overflow:hidden;position:relative;aspect-ratio:3/4;border:1px solid var(--p-border);cursor:pointer;" onclick="useLookbookStyle('${s.title}')">
                <img src="${s.photo}" 
                  style="width:100%;height:100%;object-fit:cover;display:block;" 
                  alt="${s.title}" 
                  loading="lazy"
                  onerror="this.src='${STYLE_IMAGES['_default']}'"
                />
                <div style="position:absolute;bottom:0;left:0;right:0;padding:36px 10px 10px;background:linear-gradient(to top,rgba(0,0,0,0.9),transparent);">
                  <div style="font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:var(--p-accent);font-weight:800;">${s.category}</div>
                  <div style="font-weight:700;font-size:12px;color:#fff;margin-top:2px;">${s.title}</div>
                  <div style="margin-top:6px;background:var(--p-accent);color:#000;font-size:9px;font-weight:800;padding:4px 8px;border-radius:6px;text-align:center;letter-spacing:0.5px;">PILIH GAYA</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `}

      <!-- Layanan -->
      ${(() => {
        // Filter hanya layanan dengan harga > 0 untuk portal
        const visibleServices = services.filter(s => s.price > 0);
        if (visibleServices.length === 0) return '';

        // Definisi kategori
        const CATEGORIES = {
          'Potong': { icon: 'fa-scissors', keywords: ['potong', 'cut', 'kids', 'anak', 'fade', 'undercut', 'crop'] },
          'Cukur': { icon: 'fa-razor', keywords: ['cukur', 'jenggot', 'kumis', 'shave', 'beard'] },
          'Perawatan': { icon: 'fa-spa', keywords: ['creambath', 'hair wash', 'keramas', 'tonic', 'kondisioner', 'wash', 'cuci', 'pijat', 'relaksasi', 'facial'] },
          'Styling': { icon: 'fa-wand-magic-sparkles', keywords: ['styling', 'pomade', 'blow', 'finish', 'wax', 'gel'] },
          'Warna': { icon: 'fa-palette', keywords: ['color', 'warna', 'highlight', 'smoothing', 'rebonding'] },
          'Paket': { icon: 'fa-star', keywords: ['paket', 'combo', 'vip', 'pengantin', 'eksekutif'] },
        };

        // Tentukan kategori tiap layanan
        function getCategory(name) {
          const lower = name.toLowerCase();
          for (const [cat, cfg] of Object.entries(CATEGORIES)) {
            if (cfg.keywords.some(k => lower.includes(k))) return cat;
          }
          return 'Lainnya';
        }

        // Badge populer (layanan dengan harga tertinggi di kategorinya atau nama mengandung kata kunci)
        function getBadge(s) {
          const lower = s.name.toLowerCase();
          if (lower.includes('paket') || lower.includes('combo') || lower.includes('vip')) return { label: 'HEMAT', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
          if (lower.includes('potong rambut') || lower.includes('fade cut')) return { label: 'POPULER', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
          if (lower.includes('pengantin') || lower.includes('eksekutif')) return { label: 'PREMIUM', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
          return null;
        }

        // Kelompokkan per kategori
        const grouped = {};
        visibleServices.forEach(s => {
          const cat = getCategory(s.name);
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(s);
        });

        return `
          <div style="margin-bottom: 32px;">
            <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 6px;">
              <i class="fas fa-list-check" style="color: var(--p-accent);"></i> ${t('svc_title')}
            </h3>
            <p style="font-size: 12px; color: var(--p-muted); margin-bottom: 18px;">Tap layanan untuk langsung booking</p>

            ${Object.entries(grouped).map(([cat, items]) => `
              <div style="margin-bottom: 20px;">
                <!-- Label Kategori -->
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                  <div style="width:28px;height:28px;border-radius:8px;background:var(--p-accent-glow);display:flex;align-items:center;justify-content:center;color:var(--p-accent);font-size:12px;">
                    <i class="fas ${CATEGORIES[cat]?.icon || 'fa-tag'}"></i>
                  </div>
                  <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:var(--p-muted);">${cat}</span>
                  <div style="flex:1;height:1px;background:var(--p-border);"></div>
                </div>

                <!-- Kartu Layanan -->
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${items.map(s => {
                    const hhPrice = getServicePrice(s);
                    const isHH = hhPrice !== s.price;
                    const badge = getBadge(s);
                    return `
                      <div onclick="portalSelectService('${s.id}')"
                        style="display:flex;align-items:center;gap:14px;padding:14px 16px;
                          background:var(--p-card);border:1px solid var(--p-border);
                          border-radius:14px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;"
                        onmouseover="this.style.borderColor='var(--p-accent)';this.style.transform='translateY(-1px)'"
                        onmouseout="this.style.borderColor='var(--p-border)';this.style.transform='translateY(0)'">

                        <!-- Icon -->
                        <div style="width:44px;height:44px;border-radius:12px;background:var(--p-accent-glow);
                          display:flex;align-items:center;justify-content:center;
                          color:var(--p-accent);font-size:18px;flex-shrink:0;">
                          <i class="fas ${s.icon || 'fa-scissors'}"></i>
                        </div>

                        <!-- Info -->
                        <div style="flex:1;min-width:0;">
                          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span style="font-weight:700;font-size:14px;">${s.name}</span>
                            ${badge ? `<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px;background:${badge.bg};color:${badge.color};letter-spacing:0.5px;">${badge.label}</span>` : ''}
                          </div>
                          <div style="font-size:11px;color:var(--p-muted);margin-top:3px;display:flex;align-items:center;gap:8px;">
                            <span><i class="far fa-clock"></i> ${s.duration} menit</span>
                            ${s.description ? `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;">${s.description}</span>` : ''}
                          </div>
                        </div>

                        <!-- Harga + Tombol -->
                        <div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                          <div>
                            ${isHH ? `<div style="text-decoration:line-through;color:var(--p-muted);font-size:10px;">Rp ${s.price.toLocaleString('id')}</div>` : ''}
                            <div style="font-weight:900;color:var(--p-accent);font-size:15px;line-height:1;">Rp ${hhPrice.toLocaleString('id')}</div>
                            ${isHH ? `<div style="font-size:8px;background:#facc15;color:#111;padding:1px 5px;border-radius:4px;font-weight:800;margin-top:2px;">HH</div>` : ''}
                          </div>
                          <div style="background:var(--p-accent);color:#0f1117;font-size:10px;font-weight:800;
                            padding:5px 12px;border-radius:20px;letter-spacing:0.3px;white-space:nowrap;">
                            Pilih →
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      })()}

      <!-- Tim Barber -->
      ${barbers.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;"><i class="fas fa-user-tie" style="color: var(--p-accent);"></i> ${t('barber_title')}</h3>
          <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;">
            ${barbers.map(b => {
              const bReviews = sGetAll('appointments').filter(a => a.barberId === b.id && a.rating > 0);
              const bRating = bReviews.length > 0 ? (bReviews.reduce((s,r)=>s+r.rating,0)/bReviews.length).toFixed(1) : (b.rating||4.9).toFixed(1);
              return `
                <div class="p-card" style="flex:0 0 160px;scroll-snap-align:start;text-align:center;padding:20px 14px;border-radius:20px;cursor:pointer;" onclick="startBooking()">
                  <div style="width:64px;height:64px;border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#0f1117;
                    ${b.avatar ? `background:url(${b.avatar}) center/cover;border:2px solid var(--p-accent-glow);` : 'background:linear-gradient(135deg,var(--p-accent-dk),var(--p-accent));'}">
                    ${b.avatar ? '' : getInitials(b.name)}
                  </div>
                  <div style="font-weight:700;font-size:14px;">${b.name}</div>
                  <div style="font-size:10px;color:var(--p-muted);text-transform:uppercase;letter-spacing:0.8px;margin-top:3px;">${b.specialization||'Master Barber'}</div>
                  <div style="margin-top:8px;display:inline-flex;align-items:center;gap:4px;background:var(--p-warning-bg);color:var(--p-warning);padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;">
                    <i class="fas fa-star" style="font-size:9px;"></i> ${bRating}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Ulasan Pelanggan -->
      ${reviews.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;"><i class="fas fa-star" style="color: var(--p-warning);"></i> ${t('review_title')}</h3>
          <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;">
            ${reviews.map(r => `
              <div class="p-card" style="flex:0 0 240px;scroll-snap-align:start;padding:16px;border-radius:16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                  <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--p-accent-dk),var(--p-accent));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#0f1117;flex-shrink:0;">
                    ${(r.customerName||'?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:13px;">${r.customerName||'Pelanggan'}</div>
                    <div style="font-size:10px;color:var(--p-muted);">${formatDateShort(r.date)}</div>
                  </div>
                </div>
                <div style="color:var(--p-warning);font-size:12px;margin-bottom:8px;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
                <div style="font-size:12px;color:var(--p-text2);line-height:1.5;font-style:italic;">"${r.notes||r.comment||'Pelayanan sangat memuaskan!'}"</div>
                <div style="font-size:10px;color:var(--p-muted);margin-top:8px;">✂️ ${r.serviceName||''} • ${r.barberName||''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Info Jam Operasional -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;"><i class="fas fa-clock" style="color: var(--p-accent);"></i> Jam Operasional</h3>
        <div class="p-card" style="padding: 18px; border-radius: 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--p-border);">
            <span style="font-size:14px;color:var(--p-text2);">Senin – Sabtu</span>
            <span style="font-weight:700;font-size:14px;">${openTime} – ${closeTime} WITA</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--p-border);">
            <span style="font-size:14px;color:var(--p-text2);">Hari Libur</span>
            <span style="font-weight:700;font-size:14px;color:var(--p-danger);">
              ${closedDays.map(d => ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][d]).join(', ')}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;">
            <span style="font-size:14px;color:var(--p-text2);">Status Sekarang</span>
            <span style="font-weight:700;font-size:13px;padding:4px 12px;border-radius:20px;
              background:${isOpen?'var(--p-success-bg)':'var(--p-danger-bg)'};
              color:${isOpen?'var(--p-success)':'var(--p-danger)'};">
              ${isOpen ? '🟢 BUKA' : '🔴 TUTUP'}
            </span>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;"><i class="fas fa-circle-question" style="color: var(--p-accent);"></i> FAQ</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${[
            ['Apakah bisa walk-in tanpa booking?', 'Bisa, namun booking online diprioritaskan. Disarankan booking terlebih dahulu untuk menghindari antrian panjang.'],
            ['Berapa lama proses potong rambut?', 'Rata-rata 30–60 menit tergantung layanan yang dipilih.'],
            ['Bagaimana cara membatalkan booking?', 'Hubungi kami via WhatsApp dengan menyebutkan kode booking Anda.'],
            ['Apakah ada diskon untuk pelanggan setia?', 'Ya! Setiap 10 kunjungan, Anda mendapatkan 1 potong rambut GRATIS.'],
          ].map(([q, a], i) => `
            <div class="p-card" style="padding:0;border-radius:14px;overflow:hidden;">
              <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'; this.querySelector('i').style.transform=this.nextElementSibling.style.display==='block'?'rotate(180deg)':'rotate(0deg)'"
                style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:transparent;border:none;color:var(--p-text);font-size:13px;font-weight:600;cursor:pointer;text-align:left;gap:10px;">
                <span>${q}</span>
                <i class="fas fa-chevron-down" style="color:var(--p-accent);flex-shrink:0;transition:transform 0.2s;"></i>
              </button>
              <div style="display:none;padding:0 16px 14px;font-size:13px;color:var(--p-text2);line-height:1.6;">${a}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Lokasi -->
      ${renderMapSection()}

      <!-- CTA Bottom -->
      <div style="text-align:center;margin:32px 0 16px;">
        <button class="p-btn p-btn-primary p-btn-block" onclick="startBooking()" style="font-size:16px;padding:16px;border-radius:50px;box-shadow:0 6px 24px var(--p-accent-glow);">
          <i class="fas fa-calendar-plus"></i> ${t('btn_book_now')}
        </button>
        ${phone ? `
          <a href="https://wa.me/${phone.replace(/\D/g,'')}" target="_blank" class="p-btn p-btn-wa p-btn-block" style="margin-top:10px;border-radius:50px;font-size:15px;padding:14px;text-decoration:none;display:flex;">
            <i class="fab fa-whatsapp"></i> Chat WhatsApp
          </a>
        ` : ''}
      </div>

    </div>
  `;
};

// === Queue & Loyalty Helpers ===
function renderLiveQueue() {
  const appointments = sGetAll('appointments').filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.date === today && (a.status === 'pending' || a.status === 'confirmed');
  });

  if (appointments.length === 0) return '';

  const avgTimePerService = 30; // 30 minutes average
  const totalWait = appointments.length * avgTimePerService;

  return `
    <div class="live-queue-banner stagger" style="border-radius: 16px; background: linear-gradient(135deg, var(--p-bg2), var(--p-glass)); border: 1px solid var(--p-accent-glow);">
      <div class="queue-info">
        <i class="fas fa-clock-rotate-left" style="color: var(--p-accent); font-size: 20px;"></i>
        <span>Antrian Saat Ini: <b style="color: var(--p-accent);">${appointments.length} Orang</b></span>
      </div>
      <div class="queue-wait">
        <span>Estimasi Tunggu: <b style="color: var(--p-accent);">~${totalWait} Menit</b> • WITA</span>
      </div>
    </div>
  `;
}

window.useLookbookStyle = function(title) {
  if (booking.notes && !booking.notes.includes(title)) {
    booking.notes += `, Gaya: ${title}`;
  } else {
    booking.notes = `Gaya Rambut: ${title}`;
  }
  startBooking(false); // false means don't reset existing selections
};

async function getLoyaltyStatus(phone) {
  if (!phone) return null;
  const appointments = sGetAll('appointments').filter(a => 
    a.phone === phone && a.status === 'done'
  );
  return {
    count: appointments.length,
    nextReward: 5 - (appointments.length % 5),
    isRewardReady: appointments.length > 0 && appointments.length % 5 === 0
  };
}

// === Map Section ===
function renderMapSection() {
  const settings = sGet('settings', {});
  const address = settings.address || '';
  if (!address) return '';
  const mapQuery = encodeURIComponent(address);
  return `
    <div style="margin-bottom: 28px;">
      <h3 style="font-size: 16px; margin-bottom: 12px;"><i class="fas fa-map-marker-alt" style="color: var(--p-danger);"></i> ${t('loc_title')}</h3>
      <div class="p-card" style="padding: 16px;">
        <p style="font-size: 14px; margin-bottom: 8px;"><i class="fas fa-location-dot" style="color: var(--p-accent);"></i> ${address}</p>
        <div class="map-container">
          <iframe src="https://maps.google.com/maps?q=${mapQuery}&output=embed" allowfullscreen loading="lazy"></iframe>
        </div>
      </div>
    </div>
  `;
}

// Tap layanan dari portal → langsung masuk booking dengan layanan terpilih
window.portalSelectService = function(id) {
  const svc = sGetAll('services').find(s => s.id === id);
  booking = { services: svc ? [svc] : [], barber: null, date: null, time: null, name: '', phone: '', notes: '', promoId: null };
  currentStep = svc ? 2 : 1;
  renderWizard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// === Start Booking ===
window.startBooking = function (reset = true) {
  if (reset) {
    booking = { services: [], barber: null, date: null, time: null, name: '', phone: '', notes: '', promoId: null };
  }
  currentStep = 1;
  renderWizard();
};

// === Wizard ===
function renderWizard() {
  const main = document.getElementById('portal-main');
  main.innerHTML = `
    <div class="portal-main fade-in">
      ${renderWizardProgress()}
      <div id="wizard-content"></div>
      <div id="wizard-nav" style="display: flex; gap: 10px; margin-top: 24px;"></div>
    </div>
  `;
  renderWizardStep();
}

function renderWizardProgress() {
  return `
    <div class="wizard-progress">
      ${STEPS.map((s, i) => {
    const stepNum = i + 1;
    const cls = currentStep > stepNum ? 'done' : currentStep === stepNum ? 'active' : '';
    const lineCls = currentStep > stepNum ? 'done' : '';
    return `
          <div class="wizard-step ${cls}">
            <div class="wizard-dot">${currentStep > stepNum ? '<i class="fas fa-check"></i>' : stepNum}</div>
            <span>${s.label}</span>
          </div>
          ${i < STEPS.length - 1 ? `<div class="wizard-line ${lineCls}"></div>` : ''}
        `;
  }).join('')}
    </div>
  `;
}

function renderWizardStep() {
  const content = document.getElementById('wizard-content');
  const nav = document.getElementById('wizard-nav');

  if (currentStep === 1) renderStep1(content);
  else if (currentStep === 2) renderStep2(content);
  else if (currentStep === 3) renderStep3(content);
  else if (currentStep === 4) renderStep4(content);
  else if (currentStep === 5) renderStep5(content);

  // Nav buttons
  nav.innerHTML = `
    <button class="p-btn p-btn-secondary" onclick="wizardBack()" ${currentStep <= 1 ? 'style="visibility:hidden;"' : ''}>
      <i class="fas fa-arrow-left"></i> ${t('btn_back')}
    </button>
    <div style="flex: 1;"></div>
    ${currentStep === 5 ? `
      <button class="p-btn p-btn-primary" onclick="submitBooking()">
        <i class="fas fa-paper-plane"></i> ${t('btn_confirm')}
      </button>
    ` : `
      <button class="p-btn p-btn-primary" id="next-btn" onclick="wizardNext()">
        ${t('btn_next')} <i class="fas fa-arrow-right"></i>
      </button>
    `}
  `;
}

window.wizardNext = function () {
  const lang = sGet('settings', {}).language || 'id';
  const labels = {
    id: { svc: 'Pilih layanan terlebih dahulu', barber: 'Pilih barber terlebih dahulu', time: 'Pilih tanggal dan jam', info: 'Nama dan No. HP wajib diisi' },
    en: { svc: 'Please select a service first', barber: 'Please select a barber first', time: 'Please select date and time', info: 'Name and Phone are required' }
  };
  const m = labels[lang] || labels.id;

  if (currentStep === 1 && (!booking.services || booking.services.length === 0)) return alert(m.svc);
  if (currentStep === 2 && !booking.barber) return alert(m.barber);
  if (currentStep === 3 && (!booking.date || !booking.time)) return alert(m.time);
  if (currentStep === 4) {
    booking.name = document.querySelector('[name="cust-name"]')?.value || '';
    booking.phone = document.querySelector('[name="cust-phone"]')?.value || '';
    booking.notes = document.getElementById('p-notes')?.value || '';
    if (!booking.name || !booking.phone) return alert(m.info);
  }
  currentStep++;
  renderWizard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.wizardBack = function () {
  if (currentStep > 1) { currentStep--; renderWizard(); }
  else renderHome();
};

// === Step 1: Pilih Layanan ===
function renderStep1(container) {
  const services = sGetAll('services');
  const promos = sGetAll('promos').filter(p => p.active && new Date(p.endDate) >= new Date());

  container.innerHTML = `
    <h3 style="margin-bottom: 4px;">${t('step_svc')}</h3>
    <p style="color: var(--p-muted); font-size: 13px; margin-bottom: 16px;">${t('step_svc_sub')}</p>
    <div class="service-grid">
      ${services.map(s => {
    // Only apply promo if it targets ALL services (serviceId is null/undefined) or this specific service
    const promo = promos.find(p => (p.serviceId === s.id) || (p.serviceId === null || p.serviceId === undefined));
    const hhPrice = getServicePrice(s);
    const isHH = hhPrice !== s.price;

    let discountedPrice = s.price;
    if (promo) {
      if (promo.type === 'percentage') {
        discountedPrice = Math.round(s.price * (1 - promo.discount / 100));
      } else {
        discountedPrice = Math.max(0, s.price - promo.discount);
      }
    }

    // Use the lower of the two: Promo price or Happy Hour price
    const finalPrice = Math.max(0, Math.min(Math.round(promo ? discountedPrice : s.price), hhPrice));
    const showsDiscount = finalPrice < s.price;
    const isSelected = booking.services.some(svc => svc.id === s.id);

    return `
          <div class="service-option ${isSelected ? 'selected' : ''}" onclick="selectService('${s.id}')" style="display: flex; flex-direction: column; gap: 4px; padding: 20px; border-radius: 24px; position: relative; overflow: hidden;">
            <div style="display: flex; align-items: flex-start; gap: 14px;">
              <div class="atelier-aura">
                <i class="fas ${s.icon || 'fa-scissors'}"></i>
              </div>
              <div style="flex: 1;">
                <div class="svc-name" style="font-size: 16px; letter-spacing: -0.3px;">${s.name}</div>
                <div class="svc-dur" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6;">
                   ${s.duration} MIN • <span style="color: var(--p-accent);">WITA</span>
                </div>
              </div>
              ${isSelected ? `<div style="background: var(--p-accent); color: #000; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 0 10px var(--p-accent-glow);"><i class="fas fa-check"></i></div>` : ''}
            </div>
            
            <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                ${showsDiscount ? `<div style="text-decoration: line-through; color: var(--p-muted); font-size: 11px; margin-bottom: -2px;">Rp ${s.price.toLocaleString('id')}</div>` : ''}
                <div class="svc-price" style="font-size: 19px; letter-spacing: -0.5px; color: var(--p-accent);">Rp ${finalPrice.toLocaleString('id')}</div>
              </div>
              <div style="display: flex; gap: 4px;">
                ${promo ? `<span class="p-badge p-badge-gold" style="font-size: 8px; font-weight: 900;">PROMO</span>` : ''}
                ${isHH && finalPrice === hhPrice ? `<span class="p-badge" style="font-size: 8px; font-weight: 900; background: #facc15; color: #111;">HAPPY HOUR</span>` : ''}
              </div>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

window.selectService = function (id) {
  const services = sGetAll('services');
  const service = services.find(s => s.id === id);
  if(!service) return;

  const idx = booking.services.findIndex(s => s.id === id);
  if(idx === -1) {
    booking.services.push(service);
  } else {
    booking.services.splice(idx, 1);
  }
  
  // Check oldest promo for simplicity or join all promos
  const promos = sGetAll('promos').filter(p => p.active && new Date(p.endDate) >= new Date());
  const promo = promos.find(p => (p.serviceId === null || p.serviceId === undefined) || booking.services.some(s => s.id === p.serviceId));
  booking.promoId = promo?.id || null;
  
  renderWizardStep();
};

// === Step 2: Pilih Barber ===
function renderStep2(container) {
  const barbers = sGetAll('barbers');
  const appointments = sGetAll('appointments');

  container.innerHTML = `
    <h3 style="margin-bottom: 4px;">${t('step_barber')}</h3>
    <p style="color: var(--p-muted); font-size: 13px; margin-bottom: 16px;">${t('step_barber_sub')}</p>
    <div class="barber-grid">
      ${barbers.map(b => {
    const totalAppts = appointments.filter(a => a.barberId === b.id && a.status === 'done').length;
    const reviews = appointments.filter(a => a.barberId === b.id && a.rating > 0);
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : (b.rating || 4.9);
    const isSelected = booking.barber?.id === b.id;
    return `
          <div class="barber-option ${isSelected ? 'selected' : ''}" onclick="selectBarber('${b.id}')" style="padding: 24px; border-radius: 28px; position: relative;">
            <div class="barber-avatar" style="${b.avatar ? `background: url(${b.avatar}) center/cover; border: 3px solid var(--p-accent-glow);` : ''} width: 80px; height: 80px;">
              ${b.avatar ? '' : getInitials(b.name)}
            </div>
            <div class="barber-name" style="font-size: 16px; margin-top: 12px;">${b.name}</div>
            <div class="barber-spec" style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; opacity: 0.6; margin-top: 4px;">${b.specialization || 'MASTER BARBER'}</div>
            <div class="barber-rating" style="margin-top: 12px; background: var(--p-warning-bg); display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 12px; color: var(--p-warning); font-weight: 800; font-size: 11px;">
              <i class="fas fa-star" style="font-size: 10px;"></i> ${avgRating.toFixed(1)}
            </div>
            <div style="font-size: 10px; color: var(--p-muted); margin-top: 10px; font-weight: 600;">${totalAppts} CLIENTS SERVED</div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

window.selectBarber = function (id) {
  const barbers = sGetAll('barbers');
  booking.barber = barbers.find(b => b.id === id) || null;
  renderWizardStep();
};

// === Step 3: Pilih Jadwal ===
function renderStep3(container) {
  const settings = sGet('settings', {});
  const closedDays = settings.closedDays || [0]; // default Sunday

  // Generate next 14 days
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();

    const barberWorks = booking.barber ? (booking.barber.workDays || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek) : true;

    if (!closedDays.includes(dayOfWeek) && barberWorks) {
      dates.push({ date: d, dateStr: d.toISOString().split('T')[0] });
    }
  }

  if (!booking.date && dates.length > 0) booking.date = dates[0].dateStr;

  container.innerHTML = `
    <h3 style="margin-bottom: 4px;">${t('step_schedule')}</h3>
    <p style="color: var(--p-muted); font-size: 13px; margin-bottom: 16px;">${t('step_schedule_sub')}</p>
    
    <div class="calendar-widget">
      <div class="calendar-header">
        <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
      </div>
      <div class="calendar-grid-body">
        ${(() => {
          let html = '';
          const firstDate = new Date(); // Start calendar from today
          const firstDay = firstDate.getDay();
          
          // Empty cells for padding
          for(let i=0; i<firstDay; i++) {
            html += '<div class="cal-cell empty"></div>';
          }
          
          // Generate 14 days
          const start = new Date();
          const end = new Date();
          end.setDate(end.getDate() + 14);
          
          for(let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dStr = d.toISOString().split('T')[0];
            const isAvailable = dates.find(x => x.dateStr === dStr);
            
            if(isAvailable) {
              html += `<button class="cal-cell ${booking.date === dStr ? 'selected' : ''}" onclick="selectDate('${dStr}')">
                ${d.getDate()}<div class="cal-cell-month">${MONTHS_SHORT[d.getMonth()]}</div>
              </button>`;
            } else {
              html += `<button class="cal-cell unavailable" disabled>${d.getDate()}<div class="cal-cell-month">${MONTHS_SHORT[d.getMonth()]}</div></button>`;
            }
          }
          return html;
        })()}
      </div>
    </div>

    <div id="time-slots-container"></div>
  `;

  renderTimeSlots();
}

window.selectDate = function (dateStr) {
  booking.date = dateStr;
  booking.time = null;
  renderWizardStep();
};

function renderTimeSlots() {
  const tsc = document.getElementById('time-slots-container');
  if (!tsc || !booking.date) return;

  const settings = sGet('settings', {});
  const openTime = settings.openTime || '08:00';
  const closeTime = settings.closeTime || '21:00';
  const maxPerSlot = settings.maxBookingPerSlot || 2;

  // Generate time slots
  const slots = [];
  let [h, m] = openTime.split(':').map(Number);
  const [eh, em] = closeTime.split(':').map(Number);
  while (h < eh || (h === eh && m < em)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { h++; m = 0; }
  }

  // Check existing bookings for this date + barber
  const existingAppts = sGetAll('appointments')
    .filter(a => a.date === booking.date && a.barberId === booking.barber?.id && a.status !== 'cancelled' && a.status !== 'rejected');

  // If today, filter out past times
  const now = new Date();
  const isToday = booking.date === now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  tsc.innerHTML = `
    <h4 style="font-size: 12px; margin-bottom: 12px; color: var(--p-text2); text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">WAKTU TERSEDIA • WITA</h4>
    <div class="time-grid">
      ${slots.map(t => {
    const booked = existingAppts.filter(a => a.time === t).length;
    const isPast = isToday && t <= currentTime;
    const isFull = booked >= maxPerSlot;

    // Barber Specific Availability
    const b = booking.barber;
    let isWithinBarberHours = true;
    let isOnBreak = false;
    
    if (b) {
      const wStart = b.workStart && b.workStart !== 'undefined' && b.workStart !== 'null' ? b.workStart : null;
      const wEnd = b.workEnd && b.workEnd !== 'undefined' && b.workEnd !== 'null' ? b.workEnd : null;
      const bStart = b.breakStart && b.breakStart !== 'undefined' && b.breakStart !== 'null' ? b.breakStart : null;
      const bEnd = b.breakEnd && b.breakEnd !== 'undefined' && b.breakEnd !== 'null' ? b.breakEnd : null;
      
      if (wStart && wEnd && wEnd !== '00:00') {
         isWithinBarberHours = (t >= wStart && t <= wEnd);
      }
      if (bStart && bEnd) {
         isOnBreak = (t >= bStart && t < bEnd);
      }
    }

    const unavailable = isPast || isFull || !isWithinBarberHours || isOnBreak;

    const reason = isPast ? 'Lewat' : !isWithinBarberHours ? 'Libur' : isOnBreak ? 'Istirahat' : 'Penuh';

    return `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button class="time-btn ${booking.time === t ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}" 
              onclick="${unavailable ? '' : `selectTime('${t}')`}" ${unavailable ? 'disabled' : ''}>
              ${t}
              ${booked > 0 && !unavailable ? `<div class="slot-info">${booked}/${maxPerSlot} booking</div>` : ''}
              ${unavailable ? `<div class="slot-info">${reason}</div>` : ''}
            </button>
            ${isFull && !isPast && isWithinBarberHours && !isOnBreak ? `
              <button class="p-btn p-btn-secondary p-btn-xs" onclick="joinWaitlist('${t}')" style="font-size: 10px; padding: 4px;">
                <i class="fas fa-hourglass-start"></i> Waitlist
              </button>
            ` : ''}
          </div>
        `;
  }).join('')}
    </div>

    ${booking.time ? `
      <div class="queue-estimate">
        <i class="fas fa-users"></i>
        <span>Estimasi ${existingAppts.filter(a => a.time === booking.time).length} orang sudah booking di jam ini</span>
      </div>
    ` : ''}
  `;
}

window.selectTime = function (time) {
  booking.time = time;
  renderTimeSlots();
  // Update selected state
  document.querySelectorAll('.time-btn').forEach(b => {
    b.classList.toggle('selected', b.textContent.trim().startsWith(time));
  });
};

// === Step 4: Data Pelanggan ===

// === Step 5: Review ===
function renderStep5(container) {
  const promos = sGetAll('promos');
  const promo = promos.find(p => p.id === booking.promoId);
  
  let rawTotal = 0;
  let totalDuration = 0;
  
  booking.services.forEach(s => {
    rawTotal += getServicePrice(s);
    totalDuration += (s.duration || 30);
  });

  let finalPrice = rawTotal;
  let discount = 0;
  if (promo) {
    const d = promo.type === 'percentage' ? finalPrice * promo.discount / 100 : promo.discount;
    discount = d;
    finalPrice -= d;
  }

  // Referral Discount (10% for new customer)
  let refDiscount = 0;
  if (booking.refId) {
    refDiscount = finalPrice * 0.1;
    finalPrice -= refDiscount;
  }

  const dateObj = new Date(booking.date);
  const dateStr = `${DAYS_ID[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTHS_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  container.innerHTML = `
    <h3 style="margin-bottom: 4px;">${t('step_review')}</h3>
    <p style="color: var(--p-muted); font-size: 13px; margin-bottom: 16px;">${t('step_review_sub')}</p>
    <div class="p-card" style="padding: 24px;">
      <div class="review-row">
        <span class="review-label">${t('label_svc')}</span>
        <span class="review-value">${booking.services.map(s => s.name).join(' + ')}</span>
      </div>
      <div class="review-row">
        <span class="review-label">${t('label_barber')}</span>
        <span class="review-value">${booking.barber?.name || '-'}</span>
      </div>
      <div class="review-row">
        <span class="review-label">${t('label_date')}</span>
        <span class="review-value">${dateStr}</span>
      </div>
      <div class="review-row">
        <span class="review-label">${t('label_time')}</span>
        <span class="review-value">${booking.time} <span style="color: var(--p-accent);">WITA</span></span>
      </div>
      <div class="review-row">
        <span class="review-label">Total Durasi</span>
        <span class="review-value"><i class="far fa-clock"></i> ${totalDuration} menit</span>
      </div>
      <div class="review-row">
        <span class="review-label">${t('label_name')}</span>
        <span class="review-value">${booking.name}</span>
      </div>
      <div class="review-row">
        <span class="review-label">${t('label_phone')}</span>
        <span class="review-value">${booking.phone}</span>
      </div>
      ${booking.recurringType ? `
        <div class="review-row">
          <span class="review-label">${t('label_recurring')}</span>
          <span class="review-value" style="color: var(--p-accent); font-weight: 700;"><i class="fas fa-redo"></i> ${booking.recurringType}</span>
        </div>
      ` : ''}
      ${booking.refId ? `
        <div class="review-row">
          <span class="review-label">Promo Referral</span>
          <span class="review-value" style="color: var(--p-success); font-weight: 700;">Diskon 10% ✨</span>
        </div>
      ` : ''}
      <div style="border-top: 2px dashed var(--p-border); margin-top: 20px; padding-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--p-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">TOTAL PEMBAYARAN</div>
            <div style="font-weight: 900; font-size: 28px; color: var(--p-accent); letter-spacing: -0.8px;">Rp ${Math.round(finalPrice).toLocaleString('id')}</div>
          </div>
          <div style="text-align: right; font-size: 9px; color: var(--p-muted); font-weight: 700; margin-bottom: 4px;">NET • WITA</div>
        </div>
      </div>
    </div>
  `;
}

// === Submit Booking ===
window.submitBooking = function () {
  const promos = sGetAll('promos');
  const promo = promos.find(p => p.id === booking.promoId);
  const appts = sGetAll('appointments');

  // Loyalty Check (every 10th cut is free)
  const completed = appts.filter(a => a.customerPhone === booking.phone && a.status === 'done').length;
  const isLoyaltyFree = (completed + 1) % 10 === 0;

  let totalRawPrice = 0;
  let totalDuration = 0;
  booking.services.forEach(s => {
    totalRawPrice += s.price || 0;
    totalDuration += (s.duration || 30);
  });

  let finalPrice = totalRawPrice;
  if (isLoyaltyFree) {
    finalPrice = 0;
  } else if (promo) {
    const disc = promo.type === 'percentage' ? finalPrice * promo.discount / 100 : promo.discount;
    finalPrice -= disc;
  }

  // Referral Discount (10% for new customer)
  if (booking.refId && !isLoyaltyFree) {
    finalPrice = finalPrice * 0.9;
  }

  const bookingCode = 'BP' + Date.now().toString(36).toUpperCase().slice(-6);

  const appointment = {
    customerName: booking.name,
    customerId: null,
    customerPhone: booking.phone,
    serviceName: booking.services.map(s => s.name).join(' + '),
    serviceId: booking.services[0]?.id, // Store primary ID
    barberName: booking.barber?.name,
    barberId: booking.barber?.id,
    date: booking.date,
    time: booking.time,
    duration: totalDuration,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentAmount: Math.round(finalPrice),
    notes: booking.notes,
    rating: 0,
    source: 'portal',
    bookingCode: bookingCode,
    promoId: booking.promoId,
    refId: booking.refId,
    isLoyaltyFree: isLoyaltyFree,
    recurringType: booking.recurringType || null,
    shopId: currentShop?.id || null,
  };

  const savedAppointment = sAdd('appointments', appointment);
  // Sync appointment to Supabase for real-time notification to all platforms
  syncToSupabase('appointments', savedAppointment);

  // Also try to find/create customer
  const customers = sGetAll('customers');
  let existingCust = customers.find(c => c.phone === booking.phone || c.name === booking.name);
  if (!existingCust) {
    const newCustomer = sAdd('customers', {
      name: booking.name,
      phone: booking.phone,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      firstVisit: booking.date,
      notes: 'Dari Portal Online',
    });
    syncToSupabase('customers', newCustomer);
  }

  // Play sound notification for admin (if same device)
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleVmRhdGE=');
    audio.play().catch(() => { });
  } catch { }

  currentStep = 6;
  renderSuccess(bookingCode);
};

// === Success Page ===
function renderSuccess(code) {
  const dateObj = new Date(booking.date);
  const dateStr = `${DAYS_ID[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTHS_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const settings = sGet('settings', {});
  const shopPhone = settings.phone || '';
  const isDepositRequired = settings.isDepositRequired || false;
  const depositAmount = settings.depositAmount || 0;

  const main = document.getElementById('portal-main');
  main.innerHTML = `
    <div class="portal-main fade-in">
      <div class="success-page" style="padding-top: 40px;">
        <div class="success-icon" style="background: var(--p-success-bg); color: var(--p-success); width: 80px; height: 80px; margin-bottom: 24px; box-shadow: 0 0 20px var(--p-success-bg);">
          <i class="fas fa-check"></i>
        </div>
        <h2 style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px;">Pesanan Diterima!</h2>
        <p style="color: var(--p-muted); font-size: 15px; margin-bottom: 32px;">Barber kami sedang bersiap menyambut Anda.</p>
        
        ${isDepositRequired ? `
          <div class="p-card stagger" style="background: var(--p-accent-glow); border: 1px dashed var(--p-accent); padding: 20px; margin: 20px 0; text-align: left;">
            <h4 style="color: var(--p-accent); margin-bottom: 12px;"><i class="fas fa-wallet"></i> Instruksi Pembayaran DP</h4>
            <p style="font-size: 13px; margin-bottom: 10px;">Untuk mengunci jadwal Anda, silakan lakukan pembayaran DP sebesar:</p>
            <div style="font-size: 24px; font-weight: 800; color: var(--p-accent); margin-bottom: 16px;">Rp ${depositAmount.toLocaleString('id')}</div>
            <div style="font-size: 12px; line-height: 1.6;">
              <p><b>Metode Pembayaran:</b></p>
              <p>• Transfer Bank: <b>BCA 123456789 (a.n BarberPro)</b></p>
              <p>• QRIS: (Tersedia di Kasir)</p>
            </div>
            <p style="font-size: 11px; color: var(--p-muted); margin-top: 12px;">*Harap kirimkan bukti transfer melalui tombol WhatsApp di bawah.</p>
          </div>
        ` : ''}

        <p style="color: var(--p-muted); margin-bottom: 20px;">Menunggu konfirmasi dari admin</p>

        <div style="margin-bottom: 32px; background: var(--p-bg2); border: 1px solid var(--p-border); border-radius: 20px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="font-size: 10px; color: var(--p-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">KODE BOOKING</div>
          <div class="booking-code" style="margin: 0; padding: 4px 16px; border-style: solid; border-width: 1px; font-size: 32px;">${code}</div>
        </div>

        <!-- QR Code (simple text-based) -->
        <div class="qr-container" id="qr-code">
          <canvas id="qr-canvas" width="150" height="150"></canvas>
        </div>
        <p style="font-size: 11px; color: var(--p-muted); margin-bottom: 20px;">Scan QR atau simpan kode booking</p>

        <div class="p-card" style="text-align: left; margin-bottom: 20px;">
          <div class="review-row">
            <span class="review-label">Layanan</span>
            <span class="review-value" style="font-size: 12px;">${booking.services.map(s => s.name).join(' + ')}</span>
          </div>
          <div class="review-row">
            <span class="review-label">Barber</span>
            <span class="review-value">${booking.barber?.name}</span>
          </div>
          <div class="review-row">
            <span class="review-label">Jadwal</span>
            <span class="review-value" style="font-weight: 700;">${dateStr}, ${booking.time} <span style="color: var(--p-accent);">WITA</span></span>
          </div>
          ${booking.recurringType ? `
            <div class="review-row">
              <span class="review-label">Rutin</span>
              <span class="review-value" style="color: var(--p-accent); font-weight: 700;"><i class="fas fa-redo"></i> ${booking.recurringType}</span>
            </div>
          ` : ''}
          <div class="review-row">
            <span class="review-label">Status</span>
            <span class="review-value"><span class="status-badge status-pending"><i class="fas fa-hourglass-half"></i> Menunggu Konfirmasi</span></span>
          </div>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
          ${shopPhone ? `
            <a href="https://wa.me/${shopPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo, saya sudah booking online dengan kode ${code}. Mohon konfirmasi ya! 🙏`)}" target="_blank" class="p-btn p-btn-wa">
              <i class="fab fa-whatsapp"></i> Hubungi via WA
            </a>
          ` : ''}
          <button class="p-btn p-btn-secondary" onclick="renderHome(); window.scrollTo({top:0});">
            <i class="fas fa-home"></i> Kembali
          </button>
        </div>
      </div>
    </div>
  `;

  // Draw simple QR-like pattern
  drawQRCode(code);
}

// === Simple QR Code Generator ===
function drawQRCode(text) {
  const canvas = document.getElementById('qr-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 150;
  const cellSize = 5;
  const grid = Math.floor(size / cellSize);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000000';

  // Simple hash-based pattern (visual representation, not a real QR scanner)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  // Corner patterns (like real QR)
  const drawFinder = (x, y) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
        ctx.fillRect((x + i) * cellSize, (y + j) * cellSize, cellSize, cellSize);
      }
    }
  };
  drawFinder(1, 1);
  drawFinder(grid - 9, 1);
  drawFinder(1, grid - 9);

  // Data pattern  
  const seed = Math.abs(hash);
  for (let i = 9; i < grid - 1; i++) {
    for (let j = 9; j < grid - 1; j++) {
      if (((seed * (i + 1) * (j + 1)) % 7) < 3) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < grid - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
      ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
}

// === Status Check ===
window.showStatusCheckModal = function () {
  const main = document.getElementById('portal-main');
  main.innerHTML = `
    <div class="portal-main fade-in">
      <div class="p-card" style="max-width: 500px; margin: 40px auto; padding: 30px;">
        <h3 style="text-align: center; margin-bottom: 20px;">
          <i class="fas fa-search" style="color: var(--p-accent);"></i> Cek Status Booking
        </h3>
        <div class="p-form-group">
          <label>Kode Booking</label>
          <input type="text" class="p-form-control" id="check-code" placeholder="Contoh: BPABC123" style="text-transform: uppercase;" />
        </div>
        <button class="p-btn p-btn-primary p-btn-block" onclick="checkBookingStatus()">
          <i class="fas fa-search"></i> Cek Status
        </button>
        <div id="status-result" style="margin-top: 20px;"></div>
        <div style="text-align: center; margin-top: 16px;">
          <button class="p-btn p-btn-secondary p-btn-sm" onclick="renderHome()">
            <i class="fas fa-arrow-left"></i> Kembali
          </button>
        </div>
      </div>
    </div>
  `;
};

window.checkBookingStatus = function () {
  const code = document.getElementById('check-code')?.value?.toUpperCase().trim();
  const result = document.getElementById('status-result');
  if (!code) { result.innerHTML = '<p style="color: var(--p-danger);">Masukkan kode booking</p>'; return; }

  const appointments = sGetAll('appointments');
  const apt = appointments.find(a => a.bookingCode === code);

  if (!apt) {
    result.innerHTML = `<div class="p-card status-card"><p style="color: var(--p-danger);"><i class="fas fa-exclamation-circle"></i> Booking tidak ditemukan</p></div>`;
    return;
  }

  const statusMap = {
    pending: { label: 'Menunggu Konfirmasi', cls: 'status-pending', icon: 'fa-hourglass-half' },
    confirmed: { label: 'Dikonfirmasi ✅', cls: 'status-confirmed', icon: 'fa-check-circle' },
    scheduled: { label: 'Terjadwal', cls: 'status-confirmed', icon: 'fa-calendar-check' },
    done: { label: 'Selesai', cls: 'status-confirmed', icon: 'fa-check-double' },
    cancelled: { label: 'Dibatalkan', cls: 'status-rejected', icon: 'fa-times-circle' },
    rejected: { label: 'Ditolak', cls: 'status-rejected', icon: 'fa-times-circle' },
  };
  const st = statusMap[apt.status] || statusMap.pending;
  const dateObj = new Date(apt.date);
  const dateStr = `${DAYS_ID[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTHS_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  // Loyalty Progress
  const completedCount = appointments.filter(a => a.customerPhone === apt.customerPhone && a.status === 'done').length;
  const stamps = completedCount % 10;

  result.innerHTML = `
    <div class="p-card" style="text-align: center; padding: 24px;">
      <span class="status-badge ${st.cls}"><i class="fas ${st.icon}"></i> ${st.label}</span>
      <div style="text-align: left; margin-top: 20px;">
        <div class="review-row"><span class="review-label">Layanan</span><span class="review-value">${apt.serviceName}</span></div>
        <div class="review-row"><span class="review-label">Barber</span><span class="review-value">${apt.barberName}</span></div>
        <div class="review-row"><span class="review-label">Jadwal</span><span class="review-value">${dateStr}, ${apt.time}</span></div>
        ${apt.isLoyaltyFree ? `<div class="review-row"><span class="review-label">Info</span><span class="review-value" style="color:var(--p-accent)">POTONGAN KE-10 (GRATIS) 🎁</span></div>` : ''}
      </div>

      <!-- Loyalty Card UI -->
      <div style="margin-top: 24px; padding: 16px; background: rgba(0,0,0,0.2); border-radius: var(--p-radius); border: 1px dashed var(--p-border);">
        <p style="font-size: 13px; font-weight: 700; color: var(--p-accent); margin-bottom: 12px;">Loyalty Card: Kumpulkan 10 Stempel!</p>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
           ${Array.from({ length: 10 }).map((_, i) => `
             <div style="aspect-ratio: 1; border-radius: 50%; border: 2px solid ${i < stamps ? 'var(--p-accent)' : 'var(--p-border)'}; display: flex; align-items: center; justify-content: center; font-size: 16px; background: ${i < stamps ? 'var(--p-accent-glow)' : 'transparent'}">
                ${i < stamps ? '✂️' : (i === 9 ? '🎁' : '')}
             </div>
           `).join('')}
        </div>
        <p style="font-size: 11px; color: var(--p-muted); margin-top: 10px;">${10 - stamps} stempel lagi untuk potongan GRATIS!</p>
      </div>

      <!-- Review Form (if done) -->
      ${apt.status === 'done' ? `
        <div style="margin-top: 24px; text-align: left; border-top: 1px solid var(--p-border); padding-top: 20px;">
          <h4 style="font-size: 15px; margin-bottom: 10px;">Berikan Ulasan Anda</h4>
          ${apt.rating > 0 ? `
            <div style="color: var(--p-warning); margin-bottom: 4px;">${'⭐'.repeat(apt.rating)}</div>
            <p style="font-size: 13px; font-style: italic; color: var(--p-text2);">"${apt.reviewComment || 'Tidak ada komentar'}"</p>
          ` : `
            <div class="p-form-group">
              <label>Rating</label>
              <div id="star-rating" style="font-size: 24px; color: var(--p-muted); cursor: pointer; display: flex; gap: 4px;">
                ${[1, 2, 3, 4, 5].map(i => `<i class="far fa-star" onclick="setStarRating(${i})" data-star="${i}"></i>`).join('')}
              </div>
            </div>
            <div class="p-form-group">
              <label>Komentar</label>
              <textarea class="p-form-control" id="review-comment" rows="2" placeholder="Tulis masukan Anda..."></textarea>
            </div>
            <button class="p-btn p-btn-primary p-btn-sm p-btn-block" onclick="submitReview('${apt.id}')">Kirim Ulasan</button>
          `}
        </div>
      ` : ''}
    </div>
  `;
};

let tempRating = 0;
window.setStarRating = function (n) {
  tempRating = n;
  document.querySelectorAll('#star-rating i').forEach(star => {
    const val = parseInt(star.dataset.star);
    star.className = val <= n ? 'fas fa-star' : 'far fa-star';
    star.style.color = val <= n ? 'var(--p-warning)' : 'var(--p-muted)';
  });
};

window.submitReview = function (id) {
  if (tempRating === 0) return alert('Pilih rating terlebih dahulu');
  const comment = document.getElementById('review-comment').value;
  const list = sGetAll('appointments');
  const index = list.findIndex(a => a.id === id);
  if (index !== -1) {
    list[index].rating = tempRating;
    list[index].reviewComment = comment;
    sSet('appointments', list);
    
    // Sync review to Supabase
    syncToSupabase('appointments', list[index], true);
    
    alert('Terima kasih atas ulasan Anda!');
    checkBookingStatus(); // Refresh
  }
};

function renderStatusCheck(code) {
  showStatusCheckModal();
  setTimeout(() => {
    const input = document.getElementById('check-code');
    if (input) { input.value = code; checkBookingStatus(); }
  }, 200);
}

// === Helpers ===
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateShort(date) {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
window.toggleRecurringGroup = function () {
  const isChecked = document.getElementById('p-recurring').checked;
  document.getElementById('recurring-options').style.display = isChecked ? 'block' : 'none';
  if (!isChecked) booking.recurringType = null;
};

window.selectRecurring = function (type) {
  booking.recurringType = type;
  renderBookingInfo(); // Re-render to show selection
};

window.updateLoyaltyUI = async function() {
  const phone = document.querySelector('[name="cust-phone"]')?.value;
  const loyaltyContainer = document.getElementById('loyalty-status-container');
  if (!phone || phone.length < 8 || !loyaltyContainer) return;

  const status = await getLoyaltyStatus(phone);
  if (!status || status.count === 0) {
    loyaltyContainer.innerHTML = '';
    return;
  }

  const progress = (status.count % 5) * 20;
  loyaltyContainer.innerHTML = `
    <div class="loyalty-card stagger">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 700; color: var(--p-accent);">LOYALTY PROGRAM 🏆</span>
        <span style="font-size: 11px; font-weight: 600;">${status.count} Kunjungan</span>
      </div>
      <div class="loyalty-progress-bg">
        <div class="loyalty-progress-fill" style="width: ${progress}%"></div>
      </div>
      <p style="font-size: 10px; margin-top: 6px; color: var(--p-muted);">
        ${status.isRewardReady ? 
          '<b style="color: var(--p-success);">Selamat! Anda berhak mendapatkan 1x Potong Gratis! 🎁</b>' : 
          `Dapatkan <b>1x Potong GRATIS</b> setelah <b>${status.nextReward}</b> kunjungan lagi.`}
      </p>
    </div>
  `;
}

function renderStep4(container) {
  container.innerHTML = `
    <h3 style="margin-bottom: 4px;">${t('step_info')}</h3>
    <p style="color: var(--p-muted); font-size: 13px; margin-bottom: 16px;">${t('step_info_sub')}</p>
    
    <div class="p-card" style="padding: 20px;">
      <div class="p-form-group">
        <label>${t('label_name')}</label>
        <input type="text" name="cust-name" class="p-form-control" value="${booking.name}" placeholder="Masukkan nama Anda" />
      </div>
      <div class="p-form-group">
        <label>${t('label_phone')}</label>
        <input type="tel" name="cust-phone" class="p-form-control" value="${booking.phone}" placeholder="Contoh: 08123456789" oninput="updateLoyaltyUI()" />
      </div>

      <div id="loyalty-status-container"></div>

      <div class="p-form-group" style="margin-top: 16px;">
        <label>${t('label_notes')}</label>
        <textarea id="p-notes" class="p-form-control" style="height: 80px;" placeholder="Ada pesan khusus?">${booking.notes}</textarea>
      </div>
    </div>
  `;
}

window.joinWaitlist = function (time) {
  const barberName = booking.barber?.name || 'Barber';
  const serviceName = booking.service?.name || 'Layanan';

  const body = `
    <div style="padding: 20px;">
      <h3 style="margin-bottom: 8px;">Gabung Waitlist</h3>
      <p style="font-size: 13px; color: var(--p-muted); margin-bottom: 20px;">Slot jam <b>${time}</b> bersama <b>${barberName}</b> sudah penuh. Kami akan menghubungi Anda via WhatsApp jika ada pembatalan.</p>
      
      <div class="p-form-group">
        <label>Nama Lengkap</label>
        <input type="text" class="p-form-control" id="wl-name" placeholder="John Doe" />
      </div>
      <div class="p-form-group">
        <label>Nomor WhatsApp</label>
        <input type="tel" class="p-form-control" id="wl-phone" placeholder="08xxxxxxxxxx" />
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 24px;">
        <button class="p-btn p-btn-secondary" onclick="closePModal()">Batal</button>
        <button class="p-btn p-btn-primary" onclick="submitWaitlist('${time}')">Gabung Sekarang</button>
      </div>
    </div>
  `;
  openPModal(body);
};

window.submitWaitlist = function (time) {
  const name = document.getElementById('wl-name').value;
  const phone = document.getElementById('wl-phone').value;

  if (!name || !phone) return alert('Nama dan No. HP wajib diisi');

  const wlEntry = {
    name,
    phone,
    date: booking.date,
    time,
    barberId: booking.barber?.id,
    barberName: booking.barber?.name,
    serviceId: booking.service?.id,
    serviceName: booking.service?.name,
    status: 'waiting',
    shopId: currentShop?.id || null,
  };

  const savedWl = sAdd('waitlist', wlEntry);
  syncToSupabase('waitlist', savedWl);

  const body = `
    <div style="padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background: var(--p-accent-glow); color: var(--p-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 20px;">
        <i class="fas fa-check"></i>
      </div>
      <h3>Berhasil Terdaftar!</h3>
      <p style="font-size: 14px; color: var(--p-muted); margin-top: 10px;">Anda sudah masuk dalam daftar tunggu untuk jam ${time}. Kami akan mengabari jika slot terbuka.</p>
      <button class="p-btn p-btn-primary" onclick="closePModal()" style="margin-top: 24px;">Siap!</button>
    </div>
  `;
  openPModal(body);
};

// Simple Modal for Portal (if not already defined)
function openPModal(content) {
  let modal = document.getElementById('portal-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'portal-modal';
    modal.style = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="p-card fade-in" style="width: 100%; max-width: 400px; padding: 0; overflow: hidden; position: relative;">
      ${content}
    </div>
  `;
  modal.style.display = 'flex';
}

window.closePModal = function () {
  const modal = document.getElementById('portal-modal');
  if (modal) modal.style.display = 'none';
};
