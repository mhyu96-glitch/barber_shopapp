// ========================================
// Settings Page
// Shop info, backup/restore, theme toggle
// ========================================

import { storage } from '../utils/storage.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { receipt } from '../utils/receipt.js';

export function renderSettings(container) {
  const settings = storage.get('settings', {});
  const currentTheme = storage.get('theme', 'dark');

  container.innerHTML = `
    <div class="page-header">
      <h2>Pengaturan</h2>
      <p>Konfigurasi toko dan aplikasi</p>
    </div>

    <div class="settings-grid">
      <!-- Column 1 -->
      <div class="settings-column">
        <!-- Shop Info -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-store" style="color: var(--accent);"></i> Informasi Toko</h3>
          <form id="settings-form">
            <div class="form-group">
              <label>Nama Toko</label>
              <input type="text" class="form-control" name="shopName" value="${settings.shopName || 'BarberPro Studio'}" />
            </div>
            <div class="form-group">
              <label>Alamat</label>
              <input type="text" class="form-control" name="address" value="${settings.address || ''}" />
            </div>
            <div class="form-group">
              <label>No. HP / WhatsApp Toko</label>
              <input type="text" class="form-control" name="phone" value="${settings.phone || ''}" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Jam Buka</label>
                <input type="time" class="form-control" name="openTime" value="${settings.openTime || '08:00'}" />
              </div>
              <div class="form-group">
                <label>Jam Tutup</label>
                <input type="time" class="form-control" name="closeTime" value="${settings.closeTime || '21:00'}" />
              </div>
            </div>
            <div class="form-group">
              <label>Hari Libur Tetap</label>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d, i) => `
                  <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-input); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px;">
                    <input type="checkbox" name="closedDays" value="${i}" ${(settings.closedDays || [0]).includes(i) ? 'checked' : ''} />
                    ${d.substring(0, 3)}
                  </label>
                `).join('')}
              </div>
            </div>
            <button type="button" class="btn btn-primary" id="save-settings-btn">
              <i class="fas fa-save"></i> Simpan Pengaturan
            </button>
          </form>
        </div>

        <!-- Thermal Printer Settings -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-print" style="color: var(--accent);"></i> Pengaturan Printer Thermal</h3>
          <p class="text-sm text-muted mb-md">Konfigurasi printer untuk cetak struk kasir.</p>
          
          <div class="card-section">
            <div class="card-section-title">Ukuran Kertas</div>
            <div style="display: flex; gap: 12px; margin-bottom: 18px;">
              <button class="btn ${settings.printerPaperSize === '58mm' ? 'btn-primary' : 'btn-secondary'}" onclick="window.__setPrinterSize('58mm')" style="flex: 1;">
                58mm
              </button>
              <button class="btn ${(settings.printerPaperSize || '80mm') === '80mm' ? 'btn-primary' : 'btn-secondary'}" onclick="window.__setPrinterSize('80mm')" style="flex: 1;">
                80mm
              </button>
            </div>
          </div>

          <div class="card-section">
            <div class="card-section-title">Logo & Header/Footer</div>
            <div class="form-group">
              <label>Logo Struk</label>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div id="printer-logo-preview" style="width: 50px; height: 50px; background: var(--bg-input); border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border);">
                  ${settings.printerLogo ? `<img src="${settings.printerLogo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : '<i class="fas fa-image" style="color: var(--text-muted);"></i>'}
                </div>
                <div style="flex: 1;">
                  <button class="btn btn-secondary btn-sm" onclick="document.getElementById('printer-logo-input').click()"><i class="fas fa-upload"></i> Pilih Logo</button>
                  <input type="file" id="printer-logo-input" accept="image/*" style="display: none;" />
                  ${settings.printerLogo ? '<button class="btn btn-ghost btn-sm text-danger" id="remove-logo-btn"><i class="fas fa-trash"></i> Hapus</button>' : ''}
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Header (Nama Toko)</label>
              <input type="text" class="form-control" id="printer-header" value="${settings.printerHeader || 'BARBERPRO STUDIO'}" />
            </div>
            <div class="form-group">
              <label>Footer (Pesan Penutup)</label>
              <textarea class="form-control" id="printer-footer" rows="2">${settings.printerFooter || 'Terima Kasih!\nSilakan Datang Kembali'}</textarea>
            </div>
            <button class="btn btn-primary btn-sm" id="save-printer-text-btn">
              <i class="fas fa-save"></i> Simpan Teks & Logo
            </button>
          </div>

          <div class="card-section">
            <div class="card-section-title">Uji Coba</div>
            <button class="btn btn-secondary btn-block" onclick="window.__testThermalPrint()">
              <i class="fas fa-vial"></i> Cetak Test Page
            </button>
          </div>
        </div>

        <!-- Targets -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-bullseye" style="color: var(--danger);"></i> Target Bulanan</h3>
          <form id="targets-form">
            <div class="form-group">
              <label>Target Pendapatan (Rp)</label>
              <input type="number" class="form-control" name="revenueTarget" value="${settings.revenueTarget || 5000000}" />
            </div>
            <div class="form-group">
              <label>Target Pelanggan Baru</label>
              <input type="number" class="form-control" name="newCustomerTarget" value="${settings.newCustomerTarget || 10}" />
            </div>
            <div class="form-group">
              <label>Target Jumlah Janji</label>
              <input type="number" class="form-control" name="appointmentTarget" value="${settings.appointmentTarget || 100}" />
            </div>
            <button type="button" class="btn btn-primary" id="save-targets-btn">
              <i class="fas fa-save"></i> Simpan Target
            </button>
          </form>
        </div>

        <!-- Backup / Restore -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-database" style="color: var(--info);"></i> Backup & Restore</h3>
          <p class="text-sm text-muted" style="margin-bottom: 14px;">Export semua data ke file JSON, atau restore dari backup.</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="export-data-btn">
              <i class="fas fa-download"></i> Export Data
            </button>
            <button class="btn btn-secondary" id="import-data-btn">
              <i class="fas fa-upload"></i> Import Data
            </button>
            <input type="file" id="import-file" accept=".json" style="display: none;" />
          </div>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
            <button class="btn btn-danger btn-sm" id="reset-data-btn">
              <i class="fas fa-trash"></i> Reset Semua Data
            </button>
          </div>
        </div>
      </div>

      <!-- Column 2 -->
      <div class="settings-column">
        <!-- Multi-Branch Management -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-network-wired" style="color: var(--accent);"></i> Manajemen Cabang (Multi-Branch)</h3>
          <p class="text-sm text-muted mb-md">Kelola beberapa lokasi barbershop Anda dari satu dashboard.</p>
          
          <div class="queue-list mb-md">
            ${(settings.branches || [{ id: 'main', name: 'Pusat' }]).map(b => `
              <div class="queue-item" style="border-left-color: ${settings.activeBranchId === b.id ? 'var(--accent)' : 'var(--border)'}">
                <div style="flex: 1;">
                  <div class="fw-600">${b.name} ${settings.activeBranchId === b.id ? '<span class="badge badge-success">Aktif</span>' : ''}</div>
                  <div class="text-xs text-muted">ID: ${b.id}</div>
                </div>
                ${settings.activeBranchId !== b.id ? `
                  <button class="btn btn-ghost btn-sm" onclick="window.__switchBranch('${b.id}')">Switch</button>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 8px;">
            <input type="text" class="form-control" id="new-branch-name" placeholder="Nama Cabang Baru" />
            <button class="btn btn-primary btn-sm" id="add-branch-btn"><i class="fas fa-plus"></i></button>
          </div>
        </div>

        <!-- Portal Link -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-globe" style="color: var(--info);"></i> Portal Booking Online</h3>
          <p class="text-sm text-muted mb-md">Bagikan link ini ke pelanggan agar mereka bisa booking sendiri.</p>
          <div style="display: flex; gap: 8px;">
            <input type="text" class="form-control" id="portal-link" readonly value="${window.location.origin}/portal.html" style="flex: 1; font-size: 13px;" />
            <button class="btn btn-primary btn-sm" id="copy-portal-link">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <a href="/portal.html" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration: none;">
              <i class="fas fa-external-link-alt"></i> Buka Portal
            </a>
            <button class="btn btn-wa btn-sm" id="share-portal-wa">
              <i class="fab fa-whatsapp"></i> Share via WA
            </button>
          </div>
        </div>

        <!-- Portal settings: Theme, Language, Theming -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-sliders" style="color: var(--accent);"></i> Kustomisasi Portal</h3>
          
          <div class="card-section">
            <div class="card-section-title">Bahasa</div>
            <div style="display: flex; gap: 12px;">
              <button class="btn ${(settings.language || 'id') === 'id' ? 'btn-primary' : 'btn-secondary'}" onclick="window.__setLanguage('id')" style="flex: 1;">
                🇮🇩 Indonesia
              </button>
              <button class="btn ${(settings.language || 'id') === 'en' ? 'btn-primary' : 'btn-secondary'}" onclick="window.__setLanguage('en')" style="flex: 1;">
                🇺🇸 English
              </button>
            </div>
          </div>

          <div class="card-section">
            <div class="card-section-title">Warna Aksen Portal</div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;">
              ${[
                { name: 'Gold', color: '#d4a843' },
                { name: 'Blue', color: '#4f8cf7' },
                { name: 'Green', color: '#34d399' },
                { name: 'Purple', color: '#a78bfa' },
                { name: 'Red', color: '#f87171' },
                { name: 'Pink', color: '#f472b6' },
                { name: 'Teal', color: '#2dd4bf' },
                { name: 'Orange', color: '#fb923c' },
              ].map(t => `
                <button class="btn btn-sm" style="background: ${t.color}; color: #fff; border: 2px solid ${(settings.portalAccent || '#d4a843') === t.color ? '#fff' : 'transparent'}; min-width: 44px; height: 44px; border-radius: 12px; padding: 0; font-size: 18px;" onclick="window.__setPortalTheme('${t.color}')" title="${t.name}">
                  ${(settings.portalAccent || '#d4a843') === t.color ? '✓' : ''}
                </button>
              `).join('')}
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="color" id="custom-portal-color" value="${settings.portalAccent || '#d4a843'}" style="width: 44px; height: 36px; border: none; cursor: pointer; border-radius: 8px;" />
              <button class="btn btn-secondary btn-sm" id="apply-custom-color">Apply Custom</button>
            </div>
          </div>
        </div>

        <!-- Happy Hour Settings -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-bolt" style="color: var(--warning);"></i> Happy Hour</h3>
          <form id="happy-hour-form">
            <div class="form-group" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
               <label class="switch">
                <input type="checkbox" name="hhActive" ${(settings.hhActive) ? 'checked' : ''}>
                <span class="slider round"></span>
              </label>
              <span class="fw-600">Aktifkan Happy Hour</span>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Mulai</label>
                <input type="time" class="form-control" name="hhStart" value="${settings.hhStart || '10:00'}" />
              </div>
              <div class="form-group">
                <label>Selesai</label>
                <input type="time" class="form-control" name="hhEnd" value="${settings.hhEnd || '14:00'}" />
              </div>
            </div>
            <div class="form-group">
              <label>Diskon (%)</label>
              <input type="number" class="form-control" name="hhDiscount" value="${settings.hhDiscount || 15}" min="0" max="100" />
            </div>
            <button type="button" class="btn btn-primary btn-block" id="save-hh-btn">
              <i class="fas fa-save"></i> Simpan Happy Hour
            </button>
          </form>
        </div>

        <!-- Booking Settings -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-calendar-check" style="color: var(--accent);"></i> Atur Booking Slot</h3>
          <form id="booking-settings-form">
            <div class="form-group">
              <label>Max Booking per Slot</label>
              <input type="number" class="form-control" name="maxBookingPerSlot" value="${settings.maxBookingPerSlot || 2}" min="1" />
            </div>
            <div class="form-group">
              <label>Minimal Booking H- (hari)</label>
              <input type="number" class="form-control" name="minBookingDays" value="${settings.minBookingDays || 0}" min="0" />
            </div>
            <button type="button" class="btn btn-primary btn-block" id="save-booking-settings-btn">
              <i class="fas fa-save"></i> Simpan Booking
            </button>
          </form>
        </div>

        <!-- Tampilan & Notifikasi -->
        <div class="card">
          <h3 style="margin-bottom: 18px;"><i class="fas fa-cog" style="color: var(--info);"></i> Sistem & Notifikasi</h3>
          <div class="card-section">
            <div class="card-section-title">Tema Aplikasi</div>
            <div style="display: flex; gap: 12px;">
              <button class="btn ${currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}" id="theme-dark" style="flex: 1;">
                <i class="fas fa-moon"></i> Dark
              </button>
              <button class="btn ${currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" id="theme-light" style="flex: 1;">
                <i class="fas fa-sun"></i> Light
              </button>
            </div>
          </div>
          <div class="card-section">
            <div class="card-section-title">Notifikasi Browser</div>
            <button class="btn btn-secondary btn-block" id="enable-notif-btn">
              <i class="fas fa-bell"></i> Aktifkan Notifikasi
            </button>
            <p class="text-xs mt-sm" id="notif-status" style="color: var(--text-muted);"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Save settings
  container.querySelector('#save-settings-btn').addEventListener('click', () => {
    const fd = new FormData(document.getElementById('settings-form'));
    const closedDays = fd.getAll('closedDays').map(Number);
    const data = {
      ...settings,
      shopName: fd.get('shopName'),
      address: fd.get('address'),
      phone: fd.get('phone'),
      openTime: fd.get('openTime'),
      closeTime: fd.get('closeTime'),
      closedDays,
    };
    storage.set('settings', data);
    showToast('Pengaturan disimpan!', 'success');
  });

  // Save targets
  container.querySelector('#save-targets-btn').addEventListener('click', () => {
    const fd = new FormData(document.getElementById('targets-form'));
    const updated = {
      ...storage.get('settings', {}),
      revenueTarget: Number(fd.get('revenueTarget')),
      newCustomerTarget: Number(fd.get('newCustomerTarget')),
      appointmentTarget: Number(fd.get('appointmentTarget')),
    };
    storage.set('settings', updated);
    showToast('Target disimpan!', 'success');
  });

  // Theme
  container.querySelector('#theme-dark').addEventListener('click', () => {
    setTheme('dark');
    renderSettings(container);
  });
  container.querySelector('#theme-light').addEventListener('click', () => {
    setTheme('light');
    renderSettings(container);
  });

  // Export
  container.querySelector('#export-data-btn').addEventListener('click', () => {
    exportData();
  });

  // Import
  container.querySelector('#import-data-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  container.querySelector('#import-file').addEventListener('change', (e) => {
    importData(e.target.files[0], container);
  });

  // Reset
  container.querySelector('#reset-data-btn').addEventListener('click', () => {
    import('../components/modal.js').then(m => {
      m.confirmDialog('Yakin ingin menghapus SEMUA data? Tindakan ini tidak bisa dibatalkan!', () => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('barberpro_'));
        keys.forEach(k => localStorage.removeItem(k));
        showToast('Data direset. Reload halaman...', 'warning');
        setTimeout(() => location.reload(), 1500);
      }, 'Reset Data');
    });
  });

  // Portal Link
  container.querySelector('#copy-portal-link')?.addEventListener('click', () => {
    const link = container.querySelector('#portal-link');
    link.select();
    document.execCommand('copy');
    import('../components/toast.js').then(m => m.showToast('Link disalin!', 'success'));
  });

  container.querySelector('#share-portal-wa')?.addEventListener('click', () => {
    const link = container.querySelector('#portal-link')?.value;
    const msg = `Halo! Sekarang kamu bisa booking potong rambut langsung via online di link berikut:\n\n${link}\n\nTunggu apa lagi? Yuk booking sekarang! ✂️`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  });

  // Portal Theme Handlers
  window.__setPortalTheme = async (color) => {
    const sets = storage.get('settings', {});
    sets.portalAccent = color;
    storage.set('settings', sets);
    
    // Sync to Supabase so the isolated online portal can see it!
    try {
        const { supabase } = await import('../utils/supabaseClient.js');
        const dbRow = { portal_accent: color };
        const shopId = storage.get('shopId');
        if (shopId) {
            await supabase.from('settings').update(dbRow).eq('shop_id', shopId);
        }
    } catch(e) { console.warn('Supabase sync theme error', e) }
    
    import('../components/toast.js').then(m => m.showToast(`Tema portal diperbarui: ${color}`, 'success'));
    renderSettings(container);
  };

  container.querySelector('#apply-custom-color')?.addEventListener('click', () => {
    const color = container.querySelector('#custom-portal-color').value;
    window.__setPortalTheme(color);
  });

  // Language Handler
  window.__setLanguage = (lang) => {
    const sets = storage.get('settings', {});
    sets.language = lang;
    storage.set('settings', sets);
    showToast(`Bahasa diatur ke: ${lang === 'id' ? 'Indonesia' : 'English'}`, 'success');
    renderSettings(container);
  };

  // Save Happy Hour Settings
  container.querySelector('#save-hh-btn')?.addEventListener('click', () => {
    const form = document.getElementById('happy-hour-form');
    const fd = new FormData(form);
    const updated = {
      ...storage.get('settings', {}),
      hhActive: fd.get('hhActive') === 'on',
      hhStart: fd.get('hhStart'),
      hhEnd: fd.get('hhEnd'),
      hhDiscount: parseInt(fd.get('hhDiscount')) || 0,
    };
    storage.set('settings', updated);
    showToast('Pengaturan Happy Hour disimpan!', 'success');
  });

  // Save Booking Settings
  container.querySelector('#save-booking-settings-btn')?.addEventListener('click', () => {
    const fd = new FormData(document.getElementById('booking-settings-form'));
    const updated = {
      ...storage.get('settings', {}),
      maxBookingPerSlot: Number(fd.get('maxBookingPerSlot')),
      minBookingDays: Number(fd.get('minBookingDays')),
    };
    storage.set('settings', updated);
  });

  // Branch Handlers
  container.querySelector('#add-branch-btn')?.addEventListener('click', () => {
    const nameInput = document.getElementById('new-branch-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const sets = storage.get('settings', {});
    const branches = sets.branches || [{ id: 'main', name: 'Pusat' }];
    const newBranch = { id: Date.now().toString(36), name };
    branches.push(newBranch);
    sets.branches = branches;
    storage.set('settings', sets);

    nameInput.value = '';
    showToast('Cabang baru ditambahkan!', 'success');
    renderSettings(container);
  });

  window.__switchBranch = (id) => {
    const sets = storage.get('settings', {});
    sets.activeBranchId = id;
    storage.set('settings', sets);
    showToast('Berpindah cabang. Memuat data...', 'success');
    setTimeout(() => location.reload(), 1000);
  };

  // Printer Handlers
  window.__setPrinterSize = (size) => {
    const sets = storage.get('settings', {});
    sets.printerPaperSize = size;
    storage.set('settings', sets);
    showToast(`Ukuran kertas diatur ke: ${size}`, 'success');
    renderSettings(container);
  };

  window.__testThermalPrint = () => {
    receipt.print({
      id: 'TEST-123456',
      customerName: 'Pelanggan Tes',
      amount: 50000
    }, [
      { name: 'Potong Rambut (Test)', price: 35000 },
      { name: 'Vitamin Rambut (Test)', price: 15000 }
    ], 'Tunai (Test)');
  };

  container.querySelector('#save-printer-text-btn')?.addEventListener('click', () => {
    const data = storage.get('settings', {});
    data.printerHeader = document.getElementById('printer-header').value;
    data.printerFooter = document.getElementById('printer-footer').value;
    storage.set('settings', data);
    showToast('Teks struk berhasil disimpan!', 'success');
  });

  container.querySelector('#printer-logo-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimization: Max width 200px for thermal printer
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 200;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        // Draw and convert to grayscale/high contrast for thermal
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'grayscale(100%) contrast(150%)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const base64 = canvas.toDataURL('image/png');
        const data = storage.get('settings', {});
        data.printerLogo = base64;
        storage.set('settings', data);
        showToast('Logo dioptimalkan & diunggah!', 'success');
        renderSettings(container);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  container.querySelector('#remove-logo-btn')?.addEventListener('click', () => {
    const data = storage.get('settings', {});
    delete data.printerLogo;
    storage.set('settings', data);
    showToast('Logo dihapus', 'info');
    renderSettings(container);
  });
}

function setTheme(theme) {
  storage.set('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'light') {
    document.documentElement.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
  }
}

// Initialize theme on load
export function initTheme() {
  const theme = storage.get('theme', 'dark');
  setTheme(theme);
}

function exportData() {
  const data = {};
  const keys = ['customers', 'barbers', 'appointments', 'payments', 'services', 'gallery', 'promos', 'holidays', 'settings', 'logbook', 'theme'];
  keys.forEach(k => {
    data[k] = storage.get(k);
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `barberpro_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data berhasil diexport!', 'success');
}

function importData(file, container) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      Object.entries(data).forEach(([key, value]) => {
        storage.set(key, value);
      });
      showToast('Data berhasil diimport! Reload...', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      showToast('File tidak valid!', 'error');
    }
  };
  reader.readAsText(file);
}
