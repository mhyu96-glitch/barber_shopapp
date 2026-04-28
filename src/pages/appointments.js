// ========================================
// Appointments Page
// CRUD, booking, conflict detection
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { whatsapp } from '../components/whatsapp.js';
import { receipt } from '../utils/receipt.js';

let filterStatus = 'all';
let filterDate = 'today';

export function renderAppointments(container) {
  const user = storage.getCurrentUser();
  const isBarber = user?.role === 'barber';
  const appointments = storage.getAll('appointments');
  const todayStr = new Date().toISOString().split('T')[0];

  // Cari barberId untuk barber yang login
  let myBarberId = user?.barberId;
  if (!myBarberId && isBarber) {
    const barbers = storage.getAll('barbers');
    const matched = barbers.find(b => b.name?.toLowerCase() === (user?.fullName || user?.username || '').toLowerCase());
    if (matched) myBarberId = matched.id;
  }

  // Filter
  let filtered = [...appointments];
  // Barber hanya lihat janji miliknya
  if (isBarber && myBarberId) {
    filtered = filtered.filter(a => a.barberId === myBarberId);
  }
  if (filterStatus !== 'all') filtered = filtered.filter(a => a.status === filterStatus);
  if (filterDate === 'today') filtered = filtered.filter(a => a.date === todayStr);
  else if (filterDate === 'upcoming') filtered = filtered.filter(a => a.date >= todayStr && a.status !== 'done' && a.status !== 'cancelled');
  else if (filterDate === 'week') {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    filtered = filtered.filter(a => new Date(a.date) >= weekAgo);
  } else if (filterDate === 'month') {
    filtered = filtered.filter(a => a.date.startsWith(todayStr.substring(0, 7)));
  }

  filtered.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
  });

  container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Janji Temu</h2>
        <p>Kelola jadwal dan booking pelanggan</p>
      </div>
      <button class="btn btn-primary" id="add-appointment-btn">
        <i class="fas fa-plus"></i> Janji Baru
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-input">
        <i class="fas fa-search"></i>
        <input type="text" id="search-appt" placeholder="Cari pelanggan..." />
      </div>
      <select class="filter-select" id="filter-date">
        <option value="today" ${filterDate === 'today' ? 'selected' : ''}>Hari Ini</option>
        <option value="upcoming" ${filterDate === 'upcoming' ? 'selected' : ''}>Akan Datang</option>
        <option value="week" ${filterDate === 'week' ? 'selected' : ''}>Minggu Ini</option>
        <option value="month" ${filterDate === 'month' ? 'selected' : ''}>Bulan Ini</option>
        <option value="all" ${filterDate === 'all' ? 'selected' : ''}>Semua</option>
      </select>
      <select class="filter-select" id="filter-status">
        <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Semua Status</option>
        <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Pending Portal</option>
        <option value="confirmed" ${filterStatus === 'confirmed' ? 'selected' : ''}>Dikonfirmasi</option>
        <option value="done" ${filterStatus === 'done' ? 'selected' : ''}>Selesai</option>
        <option value="cancelled" ${filterStatus === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
        <option value="rejected" ${filterStatus === 'rejected' ? 'selected' : ''}>Ditolak</option>
      </select>
    </div>

    <div id="appointments-list">
      ${filtered.length > 0 ? `
        <div class="table-container" style="background: var(--bg-card); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light);">
          <table style="width: 100%;">
            <thead>
              <tr>
                <th style="padding-left: 20px;">Tanggal</th>
                <th>Jam</th>
                <th>Pelanggan</th>
                <th>Layanan & Harga</th>
                <th>Stylist</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(apt => `
                <tr>
                  <td style="padding-left: 20px; width: 80px;">
                    <div style="background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); text-align: center; padding: 6px 4px; display: inline-block; min-width: 56px;">
                      <div class="text-[9px] uppercase tracking-widest fw-800 text-muted" style="border-bottom: 1px solid var(--border-light); padding-bottom: 2px; margin-bottom: 4px;">${dateUtils.formatDate(apt.date, 'dayshort')}</div>
                      <div class="fw-900 text-primary" style="font-size: 16px; line-height: 1;">${apt.date.split('-')[2]}</div>
                      <div class="text-[9px] uppercase fw-800 text-accent mt-[2px]">${dateUtils.formatDate(apt.date, 'short').split(' ')[1]}</div>
                    </div>
                  </td>
                  <td><span class="fw-800 text-primary" style="font-size: 15px; letter-spacing: -0.5px;">${apt.time}</span></td>
                  <td>
                    <div class="fw-700 text-primary" style="text-transform: capitalize; font-size: 14px;">${apt.customerName}</div>
                  </td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="fw-600 text-primary" style="text-transform: capitalize; font-size: 13px;">${apt.serviceName}</span>
                        ${apt.recurringType ? `<i class="fas fa-redo text-accent" style="font-size: 10px;" title="${apt.recurringType}"></i>` : ''}
                      </div>
                      <div class="text-[11px] fw-800 text-accent">${formatter.currency(apt.price)}</div>
                    </div>
                  </td>
                  <td>
                    <div class="fw-600 text-muted" style="text-transform: capitalize; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                      <div style="width: 20px; height: 20px; border-radius: 50%; background: var(--accent-subtle); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 9px;"><i class="fas fa-cut"></i></div>
                      ${apt.barberName}
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                      <span class="badge ${getStatusBadge(apt.status)}" style="font-size: 10px; padding: 4px 8px;">
                        ${getStatusLabel(apt.status)}
                      </span>
                      <span class="badge ${getPayBadge(apt.paymentStatus)}" style="font-size: 9px; padding: 2px 6px; opacity: 0.9;">
                        ${apt.paymentStatus === 'paid' ? 'LUNAS' : apt.paymentStatus === 'dp' ? 'DP' : 'BELUM BAYAR'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      ${apt.status === 'pending' ? `
                        <button class="btn btn-ghost btn-sm" title="Terima" onclick="window.__approvePortalAppt('${apt.id}')" style="background: var(--success-bg); color: var(--success); padding: 6px 10px; border-radius: 6px;">
                          <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm" title="Tolak" onclick="window.__rejectPortalAppt('${apt.id}')" style="background: var(--danger-bg); color: var(--danger); padding: 6px 10px; border-radius: 6px;">
                          <i class="fas fa-times"></i>
                        </button>
                      ` : ''}
                      ${apt.status !== 'done' && apt.status !== 'cancelled' && apt.status !== 'rejected' && apt.status !== 'pending' ? `
                        <button class="btn btn-ghost btn-sm" title="WhatsApp Pelanggan" onclick="window.__waAppt('${apt.id}')" style="color: #25d366; background: rgba(37, 211, 102, 0.1); padding: 6px 10px; border-radius: 6px;">
                          <i class="fab fa-whatsapp"></i>
                        </button>
                        ${apt.status === 'scheduled' ? `
                          <button class="btn btn-ghost btn-sm" title="Konfirmasi Kedatangan" onclick="window.__confirmAppt('${apt.id}')" style="color: var(--success); padding: 6px 10px; border-radius: 6px;">
                            <i class="fas fa-calendar-check"></i>
                          </button>
                        ` : ''}
                        <button class="btn btn-ghost btn-sm" title="Tandai Selesai" onclick="window.__doneAppt('${apt.id}')" style="color: var(--info); padding: 6px 10px; border-radius: 6px;">
                          <i class="fas fa-check-double"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm" title="Batalkan Pesanan" onclick="window.__cancelAppt('${apt.id}')" style="color: var(--text-muted); padding: 6px 10px; border-radius: 6px;">
                          <i class="fas fa-ban"></i>
                        </button>
                      ` : ''}
                      <button class="btn btn-ghost btn-sm" title="Lihat Detail" onclick="window.__editAppt('${apt.id}')" style="background: var(--accent-subtle); color: var(--accent); padding: 6px 10px; border-radius: 6px;">
                        <i class="fas fa-eye"></i>
                      </button>
                      ${apt.status === 'done' ? `
                        <button class="btn btn-ghost btn-sm" title="Cetak Struk" onclick="window.__invoiceAppt('${apt.id}')" style="background: var(--bg-input); color: var(--text-primary); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border);">
                          <i class="fas fa-print"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="card empty-state">
          <i class="fas fa-calendar-xmark"></i>
          <h3>Belum Ada Janji</h3>
          <p>Tambah janji baru untuk pelanggan</p>
        </div>
      `}
    </div>
  `;

  // Events
  container.querySelector('#add-appointment-btn').addEventListener('click', () => showAppointmentForm());
  container.querySelector('#filter-date').addEventListener('change', (e) => {
    filterDate = e.target.value;
    renderAppointments(container);
  });
  container.querySelector('#filter-status').addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderAppointments(container);
  });
  container.querySelector('#search-appt').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    container.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Global handlers
  window.__waAppt = (id) => {
    const apt = storage.find('appointments', id);
    const customer = storage.find('customers', apt?.customerId);
    if (apt && customer) whatsapp.sendReminder(apt, customer);
  };
  window.__confirmAppt = (id) => {
    storage.update('appointments', id, { status: 'confirmed' });
    showToast('Janji dikonfirmasi!', 'success');
    renderAppointments(container);
  };
  window.__doneAppt = (id) => {
    showRatingModal(id, container);
  };
  window.__cancelAppt = (id) => {
    confirmDialog('Yakin ingin membatalkan janji ini?', () => {
      const apt = storage.find('appointments', id);
      if (!apt) return;

      storage.update('appointments', id, { status: 'cancelled' });
      showToast('Janji dibatalkan', 'warning');
      renderAppointments(container);

      // Notify Waitlist
      const waitlist = storage.getAll('waitlist');
      const waiting = waitlist.filter(w => w.date === apt.date && w.time === apt.time && w.barberId === apt.barberId && w.status === 'waiting');

      if (waiting.length > 0) {
        confirmDialog(`Ada ${waiting.length} orang di waitlist untuk jam ini. Kirim notifikasi WhatsApp?`, () => {
          waiting.forEach(w => {
            const msg = `Halo ${w.name}! 👋\n\nKabar baik! Slot jam *${w.time}* pada tanggal *${dateUtils.formatDate(w.date, 'short')}* yang Anda tunggu kini tersedia kembali.\n\nSegera booking melalui portal kami sebelum diambil orang lain! ✂️`;
            window.open(`https://wa.me/${w.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
            storage.update('waitlist', w.id, { status: 'notified' });
          });
          showToast('Waitlist telah dinotifikasi!', 'success');
        }, 'Notifikasi Waitlist');
      }
    }, 'Batalkan Janji');
  };
  window.__editAppt = (id) => {
    showAppointmentDetail(id);
  };
  window.__invoiceAppt = (id) => {
    generateInvoice(id);
  };

  // Portal actions re-using dashboard handlers
  window.__approvePortalAppt = (id) => {
    // We use the global handlers from dashboard.js or re-implement here if needed
    // Since dashboard.js adds them to window, we can call them or trigger dashboard logic
    // But for convenience let's re-implement them here to update this page correctly
    const apt = storage.find('appointments', id);
    if (!apt) return;
    storage.update('appointments', id, { status: 'confirmed' });

    if (apt.customerPhone) {
      const phone = apt.customerPhone.replace(/\D/g, '');
      const msg = `Halo ${apt.customerName}! ✅\n\nBooking Anda telah DITERIMA!\n\n📅 ${dateUtils.formatDate(apt.date, 'short')}\n⏰ ${apt.time}\n💇 ${apt.serviceName}\n💈 ${apt.barberName}\n${apt.bookingCode ? `🔖 Kode: ${apt.bookingCode}` : ''}\n\nSampai jumpa! 😊`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    showToast('Booking diterima! ✅', 'success');
    renderAppointments(container);
  };

  window.__rejectPortalAppt = (id) => {
    const apt = storage.find('appointments', id);
    if (!apt) return;
    storage.update('appointments', id, { status: 'rejected' });

    if (apt.customerPhone) {
      const phone = apt.customerPhone.replace(/\D/g, '');
      const msg = `Halo ${apt.customerName},\n\nMohon maaf, booking Anda untuk tanggal ${dateUtils.formatDate(apt.date, 'short')} jam ${apt.time} tidak dapat kami terima saat ini.\n\nSilakan pilih jadwal lain melalui portal kami. Terima kasih 🙏`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    showToast('Booking ditolak', 'warning');
    renderAppointments(container);
  };
}

function showAppointmentForm(editId = null) {
  const customers = storage.getAll('customers');
  const barbers = storage.getAll('barbers');
  const services = storage.getAll('services');
  const existing = editId ? storage.find('appointments', editId) : null;
  const todayStr = new Date().toISOString().split('T')[0];

  const body = `
    <form id="appt-form">
      <div class="form-group">
        <label>Pelanggan</label>
        <div style="position: relative;">
          <input type="text" id="customer-search" class="form-control" placeholder="Cari nama pelanggan..." autocomplete="off"
            style="padding-right: 36px;"
            value="${existing ? (customers.find(c=>c.id===existing.customerId)?.name || '') : ''}" />
          <i class="fas fa-search" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none;"></i>
          <input type="hidden" name="customerId" id="customer-id-hidden" value="${existing?.customerId || ''}" required />
        </div>
        <div id="customer-dropdown" style="display:none; position:absolute; z-index:9999; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; max-height:200px; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.3); margin-top:4px; width:calc(100% - 48px);"></div>
        <div id="customer-selected-pill" style="margin-top:8px; display:${existing?.customerId ? 'flex' : 'none'}; align-items:center; gap:8px; padding:8px 12px; background:var(--accent-subtle); border:1px solid var(--accent-glow); border-radius:30px; width:fit-content;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--accent);color:#0f1117;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;" id="pill-avatar">
            ${existing ? (customers.find(c=>c.id===existing.customerId)?.name?.[0]?.toUpperCase() || '?') : '?'}
          </div>
          <span style="font-size:13px;font-weight:600;color:var(--accent);" id="pill-name">
            ${existing ? (customers.find(c=>c.id===existing.customerId)?.name || '') : ''}
          </span>
          <button type="button" onclick="window.__clearCustomer()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0;font-size:14px;line-height:1;">×</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tanggal</label>
          <input type="date" class="form-control" name="date" value="${existing?.date || todayStr}" required />
        </div>
        <div class="form-group">
          <label>Jam</label>
          <select class="form-control" name="time" required>
            ${dateUtils.getTimeSlots().map(t => `<option value="${t}" ${existing?.time === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Layanan (Bisa pilih lebih dari satu)</label>
        <div class="service-selection-grid" style="display: grid; grid-template-columns: 1fr; gap: 6px; max-height: 160px; overflow-y: auto; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius);">
          ${services.map(s => {
            const isChecked = existing?.serviceId === s.id || (existing?.serviceName || '').includes(s.name);
            return `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 4px 0;">
              <input type="checkbox" name="serviceIds" value="${s.id}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; flex-shrink: 0;" data-name="${s.name}" data-price="${s.price}" data-duration="${s.duration}" />
              <span style="flex: 1;">${s.name}</span>
              <span style="font-size: 11px; color: var(--accent); flex-shrink: 0;">Rp ${(s.price||0).toLocaleString('id')}</span>
            </label>
          `}).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Barber</label>
        <select class="form-control" name="barberId" required>
          <option value="">Pilih barber...</option>
          ${barbers.map(b => `<option value="${b.id}" ${existing?.barberId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Pembayaran</label>
        <select class="form-control" name="paymentStatus" id="payment-status-select">
          <option value="unpaid" ${existing?.paymentStatus === 'unpaid' ? 'selected' : ''}>Belum Bayar</option>
          <option value="dp" ${existing?.paymentStatus === 'dp' ? 'selected' : ''}>DP (Uang Muka)</option>
          <option value="paid" ${existing?.paymentStatus === 'paid' ? 'selected' : ''}>Lunas</option>
          <option value="package" ${existing?.paymentStatus === 'package' ? 'selected' : ''}>Paket Membership</option>
        </select>
      </div>
      <div class="form-group" id="package-selector-group" style="display: none;">
        <label>Pilih Paket</label>
        <select class="form-control" name="usedPackageId" id="package-select">
          <option value="">Pilih paket aktif...</option>
        </select>
      </div>
      <div class="form-group" id="dp-amount-group" style="display: none;">
        <label>Jumlah DP</label>
        <input type="number" class="form-control" name="dpAmount" placeholder="0" value="${existing?.dpAmount || ''}" />
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <textarea class="form-control" name="notes" rows="2" placeholder="Catatan tambahan...">${existing?.notes || ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-appt-btn">
      <i class="fas fa-save"></i> ${editId ? 'Update' : 'Simpan'}
    </button>
  `;

  openModal(editId ? 'Edit Janji' : 'Janji Temu Baru', body, footer);

  // Customer search pill
  const searchInput = document.getElementById('customer-search');
  const dropdown = document.getElementById('customer-dropdown');
  const hiddenInput = document.getElementById('customer-id-hidden');
  const pill = document.getElementById('customer-selected-pill');
  const pillName = document.getElementById('pill-name');
  const pillAvatar = document.getElementById('pill-avatar');

  window.__clearCustomer = () => {
    hiddenInput.value = '';
    searchInput.value = '';
    pill.style.display = 'none';
    searchInput.style.display = '';
    searchInput.focus();
  };

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = customers.filter(c =>
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).slice(0, 8);

    if (!q || filtered.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.style.display = 'block';
    dropdown.innerHTML = filtered.map(c => `
      <div data-id="${c.id}" data-name="${c.name}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.15s;"
        onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background='transparent'">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--accent);color:#0f1117;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">
          ${c.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;">${c.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">${formatter.phoneDisplay(c.phone) || '-'}</div>
        </div>
      </div>
    `).join('');

    dropdown.querySelectorAll('[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        hiddenInput.value = item.dataset.id;
        pillName.textContent = item.dataset.name;
        pillAvatar.textContent = item.dataset.name?.[0]?.toUpperCase() || '?';
        pill.style.display = 'flex';
        searchInput.style.display = 'none';
        dropdown.style.display = 'none';
      });
    });
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value) searchInput.dispatchEvent(new Event('input'));
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.style.display = 'none';
    }
  }, { once: false });

  // Jika sudah ada pelanggan terpilih, sembunyikan input
  if (existing?.customerId) {
    searchInput.style.display = 'none';
  }

  // Toggle payment groups
  const paySelect = document.getElementById('payment-status-select');
  const dpGroup = document.getElementById('dp-amount-group');
  const pkgGroup = document.getElementById('package-selector-group');
  const custHidden = document.getElementById('customer-id-hidden');
  const pkgSelect = document.getElementById('package-select');

  const updatePkgOptions = (custId) => {
    const cust = storage.find('customers', custId);
    const activePkgs = (cust?.packages || []).filter(p => p.remainingSessions > 0);
    pkgSelect.innerHTML = '<option value="">Pilih paket aktif...</option>' +
      activePkgs.map(p => `<option value="${p.id}">${p.name} (${p.remainingSessions} sesi)</option>`).join('');

    if (activePkgs.length === 0 && paySelect.value === 'package') {
      showToast('Pelanggan tidak punya paket aktif', 'warning');
      paySelect.value = 'unpaid';
      pkgGroup.style.display = 'none';
    }
  };

  paySelect.addEventListener('change', () => {
    dpGroup.style.display = paySelect.value === 'dp' ? '' : 'none';
    pkgGroup.style.display = paySelect.value === 'package' ? '' : 'none';
    if (paySelect.value === 'package') updatePkgOptions(custHidden.value);
  });

  if (paySelect.value === 'dp') dpGroup.style.display = '';
  if (paySelect.value === 'package') {
    pkgGroup.style.display = '';
    updatePkgOptions(custHidden.value);
  }

  // Save
  document.getElementById('save-appt-btn').addEventListener('click', () => {
    const form = document.getElementById('appt-form');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    
    // Get all checked services
    const serviceCheckboxes = Array.from(form.querySelectorAll('input[name="serviceIds"]:checked'));
    if (!data.customerId || !data.date || !data.time || serviceCheckboxes.length === 0 || !data.barberId) {
      showToast('Lengkapi semua field (termasuk minimal 1 layanan)', 'error');
      return;
    }

    // Conflict detection
    const allAppts = storage.getAll('appointments');
    const conflict = allAppts.find(a =>
      a.id !== editId &&
      a.date === data.date &&
      a.time === data.time &&
      a.barberId === data.barberId &&
      a.status !== 'cancelled'
    );
    if (conflict) {
      showToast(`Barber sudah punya janji jam ${data.time}!`, 'error');
      return;
    }

    const customer = storage.find('customers', data.customerId);
    const barber = storage.find('barbers', data.barberId);
    
    let totalDuration = 0;
    let totalPrice = 0;
    const serviceNames = [];
    serviceCheckboxes.forEach(cb => {
      totalDuration += Number(cb.dataset.duration || 30);
      totalPrice += Number(cb.dataset.price || 0);
      serviceNames.push(cb.dataset.name);
    });

    const aptData = {
      customerId: data.customerId,
      customerName: customer.name,
      barberId: data.barberId,
      barberName: barber.name,
      serviceId: serviceCheckboxes[0].value, // Primary ID
      serviceName: serviceNames.join(' + '),
      date: data.date,
      time: data.time,
      duration: totalDuration,
      price: totalPrice,
      status: 'scheduled',
      paymentStatus: data.paymentStatus || 'unpaid',
      paymentAmount: data.paymentStatus === 'paid' ? totalPrice : (data.paymentStatus === 'dp' ? Number(data.dpAmount || 0) : 0),
      dpAmount: data.paymentStatus === 'dp' ? Number(data.dpAmount || 0) : 0,
      notes: data.notes || '',
      rating: 0,
    };

    if (editId) {
      storage.update('appointments', editId, aptData);
      showToast('Janji berhasil diupdate!', 'success');
    } else {
      // Deduct package session if applicable
      if (data.paymentStatus === 'package' && data.usedPackageId) {
        const cust = storage.find('customers', data.customerId);
        if (cust && cust.packages) {
          const pkgIdx = cust.packages.findIndex(p => p.id === data.usedPackageId);
          if (pkgIdx !== -1 && cust.packages[pkgIdx].remainingSessions > 0) {
            cust.packages[pkgIdx].remainingSessions--;
            storage.update('customers', data.customerId, { packages: cust.packages });
            aptData.usedPackageId = data.usedPackageId;
            aptData.paymentAmount = 0; // Value is prepaid
          }
        }
      }
      storage.add('appointments', aptData);
      showToast('Janji berhasil ditambahkan!', 'success');
    }

    // Record payment
    if (aptData.paymentStatus !== 'unpaid') {
      storage.add('payments', {
        appointmentId: editId || aptData.id,
        customerId: data.customerId,
        customerName: customer.name,
        amount: aptData.paymentAmount,
        type: aptData.paymentStatus === 'dp' ? 'dp' : 'full',
        method: 'cash',
        date: data.date,
        notes: ''
      });
    }

    closeModal();
    const pageContainer = document.getElementById('page-container');
    renderAppointments(pageContainer);
  });
}

function showAppointmentDetail(id) {
  const apt = storage.find('appointments', id);
  if (!apt) return;

  const body = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Main Status Card -->
      <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 16px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 16px;">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div>
            <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); text-transform: uppercase;">${apt.customerName}</h4>
            <div class="text-[11px] fw-600 text-muted">${dateUtils.formatDate(apt.date, 'long')}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge ${getStatusBadge(apt.status)}" style="font-size: 10px; padding: 4px 8px;">${getStatusLabel(apt.status)}</span>
        </div>
      </div>

      <!-- Detail Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px 14px; border: 1px solid var(--border);">
          <div class="text-[10px] uppercase text-muted tracking-widest fw-700 mb-[4px]"><i class="fas fa-clock text-accent"></i> Jam Shift</div>
          <div class="fw-800 text-primary text-md">${apt.time}</div>
        </div>
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px 14px; border: 1px solid var(--border);">
          <div class="text-[10px] uppercase text-muted tracking-widest fw-700 mb-[4px]"><i class="fas fa-user-tie text-accent"></i> Barber</div>
          <div class="fw-700 text-primary text-sm" style="text-transform: capitalize;">${apt.barberName}</div>
        </div>
      </div>

      <!-- Service Detail -->
      <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 16px; border: 1px solid var(--border);">
        <div class="text-[10px] uppercase text-muted tracking-widest fw-700 mb-[8px]"><i class="fas fa-cut text-accent"></i> Detail Layanan</div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px dashed var(--border-light); padding-bottom: 12px;">
          <div class="fw-600" style="color: var(--text-primary); font-size: 13px; text-transform: capitalize;">${apt.serviceName}</div>
          <div class="fw-800 text-primary text-md" style="letter-spacing: -0.5px;">${formatter.currency(apt.price)}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="text-muted text-[11px] fw-600">Status Pembayaran:</span>
          <span class="badge ${getPayBadge(apt.paymentStatus)}">${apt.paymentStatus === 'paid' ? `LUNAS` : apt.paymentStatus === 'dp' ? `DP (${formatter.currency(apt.dpAmount)})` : 'BELUM BAYAR'}</span>
        </div>
      </div>

      ${apt.notes ? `
        <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid var(--warning); padding: 10px 14px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 12px;">
          <div class="fw-800 text-warning mb-[2px] text-[10px] uppercase tracking-widest"><i class="fas fa-sticky-note"></i> Catatan Khusus</div>
          <div class="text-primary fw-600">${apt.notes}</div>
        </div>
      ` : ''}

      ${apt.rating > 0 ? `
        <div style="text-align: center; padding-top: 8px;">
          <div class="text-[10px] text-muted mb-[4px] uppercase fw-700 tracking-widest">Rating Kepuasan</div>
          <div style="color: #fbbf24; font-size: 18px; letter-spacing: 2px;">${'⭐'.repeat(apt.rating)}${'<i class="far fa-star"></i>'.repeat(5 - apt.rating)}</div>
        </div>
      ` : ''}
    </div>
  `;

  openModal('Detail Janji', body);
}

function showRatingModal(aptId, pageContainer) {
  const body = `
    <p class="text-muted mb-md">Berikan rating pelayanan:</p>
    <div class="rating-stars" id="rating-input" style="font-size: 28px; justify-content: center; margin-bottom: 16px;">
      ${[1, 2, 3, 4, 5].map(i => `<i class="far fa-star" data-rating="${i}"></i>`).join('')}
    </div>
    <p class="text-sm text-muted text-right" id="rating-label">Belum dinilai</p>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-success" id="done-rate-btn"><i class="fas fa-check"></i> Selesai</button>
  `;

  openModal('Selesaikan Janji', body, footer);

  let selectedRating = 0;
  const stars = document.querySelectorAll('#rating-input i');
  const label = document.getElementById('rating-label');
  const labels = ['', 'Kurang', 'Cukup', 'Baik', 'Bagus', 'Sempurna!'];

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = Number(star.dataset.rating);
      stars.forEach((s, i) => {
        s.className = i < selectedRating ? 'fas fa-star active' : 'far fa-star';
      });
      label.textContent = labels[selectedRating];
    });
    star.addEventListener('mouseenter', () => {
      const r = Number(star.dataset.rating);
      stars.forEach((s, i) => {
        s.className = i < r ? 'fas fa-star active' : 'far fa-star';
      });
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        s.className = i < selectedRating ? 'fas fa-star active' : 'far fa-star';
      });
    });
  });

  document.getElementById('done-rate-btn').addEventListener('click', () => {
    const apt = storage.find('appointments', aptId);
    if (!apt) return;

    storage.update('appointments', aptId, { status: 'done', rating: selectedRating });

    // Resource Tracking: Deduct consumables if service has them
    const service = storage.find('services', apt.serviceId);
    if (service && service.consumables) {
      service.consumables.forEach(c => {
        const product = storage.find('inventory', c.id);
        if (product) {
          const newStock = (product.stock || 0) - c.qty;
          storage.update('inventory', c.id, { stock: Math.max(0, newStock) });

          if (newStock <= (product.minStock || 5)) {
            showToast(`Stok ${product.name} rendah!`, 'warning');
          }
        }
      });
    }

    // Update barber rating
    if (selectedRating > 0) {
      const barber = storage.find('barbers', apt.barberId);
      if (barber) {
        const newTotal = (barber.totalRatings || 0) + 1;
        const newRating = (((barber.rating || 0) * (barber.totalRatings || 0)) + selectedRating) / newTotal;
        storage.update('barbers', apt.barberId, { rating: Math.round(newRating * 10) / 10, totalRatings: newTotal });
      }
      // Update customer visits
      const customer = storage.find('customers', apt.customerId);
      if (customer) {
        storage.update('customers', apt.customerId, {
          totalVisits: (customer.totalVisits || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + (apt.paymentAmount || 0)
        });

        // Referral Reward: If this was a referred booking, give points to the referrer
        if (apt.refId) {
          const customers = storage.getAll('customers');
          const referrer = customers.find(c => c.id.slice(-6) === apt.refId || c.id === apt.refId);
          if (referrer) {
            storage.update('customers', referrer.id, {
              loyaltyPoints: (referrer.loyaltyPoints || 0) + 50, // Reward 50 points
              notes: (referrer.notes || '') + `\n[Reward] Referral dari ${apt.customerName}`
            });
          }
        }
      }
    }

    closeModal();
    showToast('Janji selesai! ✂️', 'success');
    renderAppointments(pageContainer);
  });
}

function getStatusBadge(status) {
  const map = { pending: 'badge-warning', scheduled: 'badge-warning', confirmed: 'badge-info', done: 'badge-success', cancelled: 'badge-danger', rejected: 'badge-danger' };
  return map[status] || 'badge-info';
}

function getStatusLabel(status) {
  const map = { pending: 'Pending Portal', scheduled: 'Terjadwal', confirmed: 'Dikonfirmasi', done: 'Selesai', cancelled: 'Dibatalkan', rejected: 'Ditolak' };
  return map[status] || status;
}

function getPayBadge(status) {
  const map = { paid: 'badge-success', dp: 'badge-warning', unpaid: 'badge-danger' };
  return map[status] || 'badge-danger';
}

// === Digital Invoice / Struk ===
function generateInvoice(aptId) {
  const apt = storage.find('appointments', aptId);
  if (!apt) return;
  const settings = storage.get('settings', {});
  const shopName = settings.shopName || 'BarberPro Studio';
  const shopPhone = settings.phone || '';
  const shopAddress = settings.address || '';

  const dateObj = new Date(apt.date);
  const dateStr = dateUtils.formatDate(apt.date, 'long');

  const body = `
    <div id="invoice-content" style="background: #fff; color: #111; padding: 30px; border-radius: 12px; font-family: 'Inter', sans-serif; max-width: 400px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px dashed #ddd; padding-bottom: 16px; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 20px; color: #b8912e;">✂️ ${shopName}</h2>
        ${shopAddress ? `<p style="margin: 4px 0 0; font-size: 11px; color: #888;">${shopAddress}</p>` : ''}
        ${shopPhone ? `<p style="margin: 2px 0 0; font-size: 11px; color: #888;">📱 ${shopPhone}</p>` : ''}
      </div>
      <!-- Invoice Info -->
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 16px;">
        <span>No: ${apt.bookingCode || apt.id?.slice(-6).toUpperCase() || '-'}</span>
        <span>${dateStr}</span>
      </div>
      <!-- Items -->
      <div style="border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-weight: 600;">${apt.serviceName}</span>
          <span style="font-weight: 600;">${formatter.currency(apt.paymentAmount || 0)}</span>
        </div>
        <div style="font-size: 12px; color: #888;">Barber: ${apt.barberName} · Jam ${apt.time} · ${apt.duration || 30} menit</div>
      </div>
      <!-- Total -->
      <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #b8912e; margin-bottom: 16px;">
        <span>TOTAL</span>
        <span>${formatter.currency(apt.paymentAmount || 0)}</span>
      </div>
      <div style="text-align: center; font-size: 12px; color: #888; border-top: 2px dashed #ddd; padding-top: 12px;">
        <p style="margin: 0;">Status: ${apt.paymentStatus === 'paid' ? '✅ LUNAS' : '⏳ Belum Bayar'}</p>
        <p style="margin: 4px 0 0;">Pelanggan: ${apt.customerName}</p>
        <p style="margin: 8px 0 0; font-style: italic;">Terima kasih telah berkunjung! 🙏</p>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Tutup</button>
    <button class="btn btn-primary" id="print-invoice-thermal">
      <i class="fas fa-print"></i> Cetak Struk
    </button>
    <button class="btn btn-wa" id="share-invoice-wa">
      <i class="fab fa-whatsapp"></i> Kirim via WA
    </button>
  `;

  openModal('Struk Digital', body, footer);

  document.getElementById('print-invoice-thermal')?.addEventListener('click', () => {
    receipt.print(apt, [{ name: apt.serviceName, price: apt.price }], 'Tunai');
  });

  document.getElementById('share-invoice-wa')?.addEventListener('click', () => {
    const phone = (apt.customerPhone || '').replace(/\D/g, '');
    const msg = `*STRUK - ${shopName}*\n\n` +
      `No: ${apt.bookingCode || '-'}\n` +
      `Tanggal: ${dateStr}\n` +
      `Pelanggan: ${apt.customerName}\n\n` +
      `Layanan: ${apt.serviceName}\n` +
      `Barber: ${apt.barberName}\n` +
      `Jam: ${apt.time}\n\n` +
      `*TOTAL: ${formatter.currency(apt.paymentAmount || 0)}*\n` +
      `Status: ${apt.paymentStatus === 'paid' ? 'LUNAS ✅' : 'Belum Bayar'}\n\n` +
      `Terima kasih! 🙏✂️`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}


