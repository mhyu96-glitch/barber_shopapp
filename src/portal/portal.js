// ========================================
// Customer Portal - Booking Wizard
// ========================================

const STORAGE_PREFIX = 'barberpro_';
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

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
  list.push(item);
  sSet(key, list);
  return item;
}

// === State ===
let currentStep = 0; // 0=home, 1=service, 2=barber, 3=schedule, 4=info, 5=review, 6=success
let booking = { service: null, barber: null, date: null, time: null, name: '', phone: '', notes: '', promoId: null };

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

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  initPortalTheme();
  renderHeader();
  renderFooter();
  // Check if URL has ?status=CODE or ?ref=ID
  const params = new URLSearchParams(window.location.search);
  if (params.get('status')) {
    renderStatusCheck(params.get('status'));
  } else {
    if (params.get('ref')) {
      booking.refId = params.get('ref');
    }
    if (params.get('barber')) {
      const bId = params.get('barber');
      const b = sFind('barbers', bId);
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
  root.style.setProperty('--p-accent-glow', accent + '33'); // 20% opacity
}

// === Header ===
function renderHeader() {
  const settings = sGet('settings', {});
  const shopName = settings.shopName || 'BarberPro Studio';
  document.getElementById('portal-header').innerHTML = `
    <div class="portal-header">
      <div class="portal-header-inner">
        <div class="portal-logo">
          <i class="fas fa-scissors"></i>
          <h1>${shopName}</h1>
        </div>
        <div class="portal-header-actions">
          <button class="p-btn p-btn-secondary p-btn-sm" onclick="showStatusCheckModal()">
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
      <p>&copy; ${new Date().getFullYear()} ${shopName}. Powered by BarberPro</p>
    </div>
  `;
}

// === Home Page ===
window.renderHome = function () {
  currentStep = 0;
  const settings = sGet('settings', {});
  const shopName = settings.shopName || 'BarberPro Studio';
  const promos = sGetAll('promos').filter(p => p.active && new Date(p.endDate) >= new Date());
  const barbers = sGetAll('barbers');
  const services = sGetAll('services');

  // Get public reviews (done appointments with ratings)
  const reviews = sGetAll('appointments')
    .filter(a => a.status === 'done' && a.rating > 0)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

  const main = document.getElementById('portal-main');
  main.innerHTML = `
    <div class="portal-main fade-in">
      <div class="portal-hero">
        <h2>${t('welcome')} <span>${shopName}</span></h2>
        <p>${t('hero_sub')}</p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 32px;">
        <button class="p-btn p-btn-primary" onclick="startBooking()" style="font-size: 16px; padding: 14px 40px;">
          <i class="fas fa-calendar-plus"></i> Booking Sekarang
        </button>
      </div>

      <!-- Active Promos -->
      ${promos.length > 0 ? `
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 16px; margin-bottom: 12px;"><i class="fas fa-tags" style="color: var(--p-accent);"></i> ${t('promo_title')}</h3>
          ${promos.map(p => {
    const svc = services.find(s => s.id === p.serviceId);
    return `
              <div class="promo-banner">
                <div class="promo-icon"><i class="fas fa-percent"></i></div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 14px;">${p.name}</div>
                  <div style="font-size: 12px; color: var(--p-muted);">
                    ${p.type === 'percentage' ? `Diskon ${p.discount}%` : `Hemat Rp ${p.discount.toLocaleString('id')}`}
                    ${svc ? ` untuk ${svc.name}` : ''} • s/d ${formatDateShort(p.endDate)}
                  </div>
                </div>
                <span class="p-badge p-badge-gold">PROMO</span>
              </div>
            `;
  }).join('')}
        </div>
      ` : ''}

      <!-- Our Barbers -->
      ${barbers.length > 0 ? `
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 16px; margin-bottom: 12px;"><i class="fas fa-user-tie" style="color: var(--p-accent);"></i> ${t('barber_title')}</h3>
          <div class="barber-grid">
            ${barbers.map(b => `
              <div class="p-card" style="text-align: center; padding: 20px;">
                <div class="barber-avatar" style="${b.avatar ? `background: url(${b.avatar}) center/cover; font-size: 0;` : ''}">
                  ${b.avatar ? '' : getInitials(b.name)}
                </div>
                <div class="barber-name">${b.name}</div>
                <div class="barber-spec">${b.specialization || 'All-round'}</div>
                <div class="barber-rating">${'⭐'.repeat(Math.round(b.rating || 4))} ${(b.rating || 4).toFixed(1)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Services Preview -->
      ${services.length > 0 ? `
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 16px; margin-bottom: 12px;"><i class="fas fa-list-check" style="color: var(--p-accent);"></i> ${t('svc_title')}</h3>
          <div class="service-grid">
            ${services.map(s => `
              <div class="p-card" style="padding: 16px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--p-accent-glow); display: flex; align-items: center; justify-content: center; color: var(--p-accent);"><i class="fas ${s.icon || 'fa-scissors'}"></i></div>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px;">${s.name}</div>
                    <div style="font-size: 12px; color: var(--p-muted);">${s.duration} menit</div>
                  </div>
                  <div style="font-weight: 700; color: var(--p-accent);">Rp ${s.price.toLocaleString('id')}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Public Reviews -->
      ${reviews.length > 0 ? `
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 16px; margin-bottom: 12px;"><i class="fas fa-star" style="color: var(--p-warning);"></i> ${t('review_title')}</h3>
          <div class="p-card">
            ${reviews.map(r => `
              <div class="review-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-weight: 600;">${r.customerName}</span>
                  <span style="color: var(--p-warning);">${'⭐'.repeat(r.rating)}</span>
                </div>
                <div style="font-size: 13px; color: var(--p-muted);">${r.serviceName} • ${r.barberName} • ${formatDateShort(r.date)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Map / Location -->
      ${renderMapSection()}

      <!-- CTA Bottom -->
      <div style="text-align: center; margin: 32px 0;">
        <button class="p-btn p-btn-primary p-btn-block" onclick="startBooking()" style="font-size: 16px; padding: 14px;">
          <i class="fas fa-calendar-plus"></i> Booking Sekarang
        </button>
      </div>
    </div>
  `;
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

// === Start Booking ===
window.startBooking = function () {
  booking = { service: null, barber: null, date: null, time: null, name: '', phone: '', notes: '', promoId: null };
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

  if (currentStep === 1 && !booking.service) return alert(m.svc);
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
    const promo = promos.find(p => !p.serviceId || p.serviceId === s.id);
    const hhPrice = getServicePrice(s);
    const isHH = hhPrice !== s.price;

    let discountedPrice = s.price;
    if (promo) {
      discountedPrice = promo.type === 'percentage' ? s.price * (1 - promo.discount / 100) : s.price - promo.discount;
    }

    // Use the lower of the two: Promo price or Happy Hour price
    const finalPrice = Math.min(Math.round(promo ? discountedPrice : s.price), hhPrice);
    const showsDiscount = finalPrice < s.price;

    return `
          <div class="service-option ${booking.service?.id === s.id ? 'selected' : ''}" onclick="selectService('${s.id}')">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--p-accent-glow); display: flex; align-items: center; justify-content: center; color: var(--p-accent);"><i class="fas ${s.icon || 'fa-scissors'}"></i></div>
              <div class="svc-name">${s.name}</div>
            </div>
            ${s.description ? `<p style="font-size: 12px; color: var(--p-muted); margin-bottom: 8px;">${s.description}</p>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                ${showsDiscount ? `<span style="text-decoration: line-through; color: var(--p-muted); font-size: 12px;">Rp ${s.price.toLocaleString('id')}</span> ` : ''}
                <span class="svc-price">Rp ${finalPrice.toLocaleString('id')}</span>
                ${promo ? `<span class="p-badge p-badge-gold" style="margin-left: 4px;">PROMO</span>` : ''}
                ${isHH && finalPrice === hhPrice ? `<span class="p-badge" style="margin-left: 4px; background: #facc15; color: #111;">⚡ HH</span>` : ''}
              </div>
              <span class="svc-dur"><i class="fas fa-clock"></i> ${s.duration} min</span>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

window.selectService = function (id) {
  const services = sGetAll('services');
  booking.service = services.find(s => s.id === id) || null;
  // Check promo
  const promos = sGetAll('promos').filter(p => p.active && new Date(p.endDate) >= new Date());
  const promo = promos.find(p => !p.serviceId || p.serviceId === id);
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
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : (b.rating || 4);
    return `
          <div class="barber-option ${booking.barber?.id === b.id ? 'selected' : ''}" onclick="selectBarber('${b.id}')">
            <div class="barber-avatar" style="${b.avatar ? `background: url(${b.avatar}) center/cover; font-size: 0;` : ''}">
              ${b.avatar ? '' : getInitials(b.name)}
            </div>
            <div class="barber-name">${b.name}</div>
            <div class="barber-spec">${b.specialization || 'All-round'}</div>
            <div class="barber-rating">${'⭐'.repeat(Math.round(avgRating))} ${avgRating.toFixed(1)}</div>
            <div style="font-size: 11px; color: var(--p-muted); margin-top: 4px;">${totalAppts} potong</div>
            ${b.phone ? `<a href="https://wa.me/${b.phone.replace(/\D/g, '')}" target="_blank" class="p-btn p-btn-wa p-btn-sm" style="margin-top: 8px; font-size: 11px;"><i class="fab fa-whatsapp"></i> Chat</a>` : ''}
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
    
    <div class="date-picker-row">
      ${dates.map(d => `
        <button class="date-btn ${booking.date === d.dateStr ? 'selected' : ''}" onclick="selectDate('${d.dateStr}')">
          <div class="date-day">${DAYS_SHORT[d.date.getDay()]}</div>
          <div class="date-num">${d.date.getDate()}</div>
          <div class="date-month">${MONTHS_SHORT[d.date.getMonth()]}</div>
        </button>
      `).join('')}
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
    <h4 style="font-size: 14px; margin-bottom: 10px; color: var(--p-text2);">Jam Tersedia</h4>
    <div class="time-grid">
      ${slots.map(t => {
    const booked = existingAppts.filter(a => a.time === t).length;
    const isPast = isToday && t <= currentTime;
    const isFull = booked >= maxPerSlot;

    // Barber Specific Availability
    const b = booking.barber;
    const isWithinBarberHours = b ? (t >= b.workStart && t < b.workEnd) : true;
    const isOnBreak = b ? (t >= b.breakStart && t < b.breakEnd) : false;

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
function renderStep4(container) {
  container.innerHTML = `
    <h3 style="margin-bottom: 4px;">${t('step_info')}</h3>
    <p style="color: var(--p-muted); font-size: 13px; margin-bottom: 16px;">${t('step_info_sub')}</p>
    <form id="booking-form">
      <div class="p-card" style="padding: 24px;">
        <div class="p-form-group">
          <label>${t('label_name')} *</label>
          <input type="text" class="p-form-control" name="cust-name" value="${booking.name}" placeholder="John Doe" required />
        </div>
        <div class="p-form-group">
          <label>${t('label_phone')} *</label>
          <input type="tel" class="p-form-control" name="cust-phone" value="${booking.phone}" placeholder="08xxxxxxxxxx" required />
        </div>
        <div class="p-form-group">
          <label>${t('label_notes')}</label>
          <textarea class="p-form-control" id="p-notes" placeholder="e.g., Taper fade..." rows="2">${booking.notes}</textarea>
        </div>

        <!-- Recurring Appointment Option -->
        <div style="margin-top: 10px; padding: 15px; background: rgba(212,168,67,0.05); border: 1px dashed var(--p-border); border-radius: var(--p-radius);">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="p-recurring" style="width: 18px; height: 18px; cursor: pointer;" ${booking.recurringType ? 'checked' : ''} onchange="toggleRecurringGroup()">
            <span style="font-weight: 600; font-size: 14px; color: var(--p-text1);">${t('label_recurring_toggle')}</span>
          </label>
          <div id="recurring-options" style="margin-top: 12px; display: ${booking.recurringType ? 'block' : 'none'}; padding-left: 28px; border-left: 2px solid var(--p-accent);">
            <p class="text-sm text-muted" style="margin-bottom: 8px; font-size: 12px;">${t('label_recurring_sub')}</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${['Setiap 2 Minggu', 'Setiap Bulan (4 Minggu)', 'Setiap 2 Bulan'].map(type => `
                <button class="p-btn p-btn-sm ${booking.recurringType === type ? 'p-btn-primary' : 'p-btn-secondary'}" 
                  onclick="selectRecurring('${type}')" style="font-size: 12px; padding: 6px 10px;">
                  ${type}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </form>
  `;
}

// === Step 5: Review ===
function renderStep5(container) {
  const promos = sGetAll('promos');
  const promo = promos.find(p => p.id === booking.promoId);
  let finalPrice = getServicePrice(booking.service);
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
        <span class="review-value">${booking.service?.name || '-'}</span>
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
        <span class="review-value">${booking.time}</span>
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
      <div style="border-top: 2px solid var(--p-border); margin-top: 10px; padding-top: 10px;">
        <div class="review-row" style="font-size: 18px;">
          <span class="review-label" style="font-weight: 700;">Total</span>
          <span class="review-value" style="color: var(--p-accent); font-size: 20px;">Rp ${Math.round(finalPrice).toLocaleString('id')}</span>
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

  let finalPrice = booking.service?.price || 0;
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
    serviceName: booking.service?.name,
    serviceId: booking.service?.id,
    barberName: booking.barber?.name,
    barberId: booking.barber?.id,
    date: booking.date,
    time: booking.time,
    duration: booking.service?.duration || 30,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentAmount: Math.round(finalPrice),
    notes: booking.notes,
    rating: 0,
    source: 'portal',
    bookingCode: bookingCode,
    promoId: booking.promoId,
    refId: booking.refId, // Storing referral source
    isLoyaltyFree: isLoyaltyFree,
    recurringType: booking.recurringType || null,
  };

  sAdd('appointments', appointment);

  // Also try to find/create customer
  const customers = sGetAll('customers');
  let existingCust = customers.find(c => c.phone === booking.phone || c.name === booking.name);
  if (!existingCust) {
    sAdd('customers', {
      name: booking.name,
      phone: booking.phone,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      firstVisit: booking.date,
      notes: 'Dari Portal Online',
    });
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

  const main = document.getElementById('portal-main');
  main.innerHTML = `
    <div class="portal-main fade-in">
      <div class="success-page">
        <div class="success-icon"><i class="fas fa-check"></i></div>
        <h2 style="margin-bottom: 6px;">Booking Berhasil Dikirim!</h2>
        <p style="color: var(--p-muted); margin-bottom: 20px;">Menunggu konfirmasi dari admin</p>

        <div style="margin-bottom: 20px;">
          <p style="font-size: 13px; color: var(--p-muted); margin-bottom: 6px;">Kode Booking Anda:</p>
          <div class="booking-code">${code}</div>
        </div>

        <!-- QR Code (simple text-based) -->
        <div class="qr-container" id="qr-code">
          <canvas id="qr-canvas" width="150" height="150"></canvas>
        </div>
        <p style="font-size: 11px; color: var(--p-muted); margin-bottom: 20px;">Scan QR atau simpan kode booking</p>

        <div class="p-card" style="text-align: left; margin-bottom: 20px;">
          <div class="review-row">
            <span class="review-label">Layanan</span>
            <span class="review-value">${booking.service?.name}</span>
          </div>
          <div class="review-row">
            <span class="review-label">Barber</span>
            <span class="review-value">${booking.barber?.name}</span>
          </div>
          <div class="review-row">
            <span class="review-label">Jadwal</span>
            <span class="review-value">${dateStr}, ${booking.time}</span>
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

function validateStep4() {
  const name = document.querySelector('[name="cust-name"]').value;
  const phone = document.querySelector('[name="cust-phone"]').value;
  const notes = document.getElementById('p-notes').value;

  if (!name || !phone) return false;
  booking.name = name;
  booking.phone = phone;
  booking.notes = notes;
  return true;
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
    status: 'waiting'
  };

  sAdd('waitlist', wlEntry);

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
