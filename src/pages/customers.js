// ========================================
// Customers Page
// CRUD, history, loyalty
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { whatsapp } from '../components/whatsapp.js';

export function renderCustomers(container) {
  const customers = storage.getAll('customers');

  container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Pelanggan</h2>
        <p>Kelola data dan riwayat pelanggan</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" id="broadcast-wa-btn">
          <i class="fab fa-whatsapp"></i> Broadcast WA
        </button>
        <button class="btn btn-primary" id="add-customer-btn">
          <i class="fas fa-user-plus"></i> Pelanggan Baru
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-input">
        <i class="fas fa-search"></i>
        <input type="text" id="search-customer" placeholder="Cari nama atau nomor HP..." />
      </div>
    </div>

    ${customers.length > 0 ? `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>No. HP</th>
              <th>Kunjungan</th>
              <th>Loyalitas</th>
              <th>Berlangganan</th>
              <th>Total Bayar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => {
    const tier = formatter.loyaltyTier(c.totalVisits || 0);
    const points = formatter.loyaltyPoints(c.totalVisits || 0);
    const freeCount = formatter.freeHaircuts(c.totalVisits || 0);
    return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div style="width: 38px; height: 38px; border-radius: 50%; background: ${c.avatar ? `url(${c.avatar}) center/cover` : 'var(--accent-subtle)'}; display: flex; align-items: center; justify-content: center; color: var(--accent); font-weight: 700; font-size: ${c.avatar ? '0' : '13px'}; flex-shrink: 0; border: 1px solid var(--border-accent);">
                        ${c.avatar ? '' : formatter.initials(c.name)}
                      </div>
                      <div>
                        <div class="fw-600">${c.name}</div>
                        ${c.birthday ? `<div class="text-sm text-muted">🎂 ${dateUtils.formatDate(c.birthday, 'short')}</div>` : ''}
                      </div>
                    </div>
                  </td>
                  <td>${formatter.phoneDisplay(c.phone)}</td>
                  <td><span class="fw-700">${c.totalVisits || 0}x</span></td>
                  <td>
                    <span class="loyalty-badge ${tier.class}">
                      <i class="fas ${tier.icon}"></i> ${tier.name}
                    </span>
                    <div class="text-sm text-muted mt-sm">${points} poin ${freeCount > 0 ? `• ${freeCount} gratis` : ''}</div>
                  </td>
                  <td>${c.firstVisit ? dateUtils.membershipDuration(c.firstVisit) : '-'}</td>
                  <td class="fw-600">${formatter.currency(c.totalSpent || 0)}</td>
                  <td>
                    <div style="display: flex; gap: 4px;">
                      <button class="btn btn-ghost btn-sm" title="Detail" onclick="window.__viewCustomer('${c.id}')">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn btn-ghost btn-sm" title="WhatsApp" onclick="window.__waCustomer('${c.id}')">
                        <i class="fab fa-whatsapp" style="color: #25d366;"></i>
                      </button>
                      ${(c.lastVisit && new Date(c.lastVisit) < new Date(new Date() - 30 * 24 * 60 * 60 * 1000)) ? `
                        <button class="btn btn-primary btn-sm" title="Kangen Potong" onclick="window.__waKangen('${c.id}')" style="background: var(--warning); color: #000; padding: 4px 8px; font-size: 10px; font-weight: 700;">
                          <i class="fas fa-history"></i> KANGEN
                        </button>
                      ` : ''}
                      <button class="btn btn-ghost btn-sm" title="Edit" onclick="window.__editCustomer('${c.id}')">
                        <i class="fas fa-edit" style="color: var(--info);"></i>
                      </button>
                      <button class="btn btn-ghost btn-sm" title="Hapus" onclick="window.__deleteCustomer('${c.id}')">
                        <i class="fas fa-trash" style="color: var(--danger);"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card empty-state">
        <i class="fas fa-users"></i>
        <h3>Belum Ada Pelanggan</h3>
        <p>Tambah pelanggan pertama Anda</p>
      </div>
    `}
  `;

  container.querySelector('#add-customer-btn').addEventListener('click', () => showCustomerForm());
  container.querySelector('#search-customer').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    container.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  window.__viewCustomer = (id) => showCustomerDetail(id);
  window.__editCustomer = (id) => showCustomerForm(id);
  window.__waCustomer = (id) => {
    const c = storage.find('customers', id);
    if (c) whatsapp.sendCustom(c.phone, `Halo ${c.name}! Ada yang bisa kami bantu? 😊\n- BarberPro Studio`);
  };
  window.__waKangen = (id) => {
    const c = storage.find('customers', id);
    if (c) {
        const msg = `Halo ${c.name}! Kami kangen Anda di BarberPro Studio. 👋\n\nSudah lebih dari sebulan nih sejak kunjungan terakhir Anda. Yuk, luangkan waktu sejenak untuk merapikan rambut agar tetap tampil pede! ✂️\n\nBooking sekarang untuk amankan jam favorit Anda: ${window.location.origin}/portal\n\nSampai jumpa! 💈`;
        whatsapp.sendCustom(c.phone, msg);
    }
  };
  window.__deleteCustomer = (id) => {
    confirmDialog('Yakin ingin menghapus pelanggan ini?', () => {
      storage.delete('customers', id);
      showToast('Pelanggan dihapus', 'warning');
      renderCustomers(container);
    });
  };
}

function showBroadcastForm() {
  const customers = storage.getAll('customers');
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

  const inactiveCount = customers.filter(c => {
    const lastV = c.lastVisit || c.firstVisit;
    return lastV && new Date(lastV) < thirtyDaysAgo;
  }).length;

  const body = `
    <div class="form-group">
      <label>Pilih Segmen Pelanggan</label>
      <select class="form-control" id="broadcast-segment">
        <option value="all">Semua Pelanggan (${customers.length})</option>
        <option value="inactive">Tidak Datang > 30 Hari (${inactiveCount})</option>
        <option value="loyalty">Loyalitas (Gold & Platinum)</option>
        <option value="birthday">Ulang Tahun Bulan Ini</option>
      </select>
    </div>
    <div class="form-group">
      <label>Template Pesan</label>
      <textarea class="form-control" id="broadcast-message" rows="5" placeholder="Tulis pesan Anda di sini..."></textarea>
      <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('broadcast-message').value += 'Halo [name]! '">Tag [name]</button>
        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('broadcast-message').value = 'Halo [name]! Kami kangen Anda di BarberPro. Yuk booking lagi sekarang dan dapatkan diskon 10%! ✂️'">Promo Kangen</button>
        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('broadcast-message').value = 'Halo [name]! Ada gaya rambut baru nih di BarberPro. Cek galeri kami ya! 💈'">Info Gaya</button>
      </div>
    </div>
    <p class="text-sm text-muted"> <i class="fas fa-info-circle"></i> Pesan akan dibuka satu per satu di tab WhatsApp baru.</p>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" id="send-broadcast-btn"><i class="fab fa-whatsapp"></i> Kirim Broadcast</button>
  `;

  openModal('WhatsApp Broadcast', body, footer);

  document.getElementById('send-broadcast-btn').addEventListener('click', () => {
    const segment = document.getElementById('broadcast-segment').value;
    const rawMsg = document.getElementById('broadcast-message').value;

    if (!rawMsg) {
      import('../components/toast.js').then(m => m.showToast('Pesan tidak boleh kosong', 'error'));
      return;
    }

    let targets = [];
    if (segment === 'all') targets = customers;
    else if (segment === 'inactive') targets = customers.filter(c => {
      const lastV = c.lastVisit || c.firstVisit;
      return lastV && new Date(lastV) < thirtyDaysAgo;
    });
    else if (segment === 'loyalty') targets = customers.filter(c => (c.totalVisits || 0) >= 20);
    else if (segment === 'birthday') {
      const currentMonth = now.getMonth() + 1;
      targets = customers.filter(c => c.birthday && parseInt(c.birthday.split('-')[1]) === currentMonth);
    }

    if (targets.length === 0) {
      import('../components/toast.js').then(m => m.showToast('Tidak ada target di segmen ini', 'warning'));
      return;
    }

    confirmDialog(`Kirim pesan ke ${targets.length} pelanggan?`, () => {
      targets.forEach((c, i) => {
        setTimeout(() => {
          const msg = rawMsg.replace(/\[name\]/g, c.name);
          whatsapp.sendCustom(c.phone, msg);
        }, i * 2000); // 2 second delay to avoid browser blocking multiple popups
      });
      import('../components/toast.js').then(m => m.showToast('Broadcast dimulai...', 'success'));
      closeModal();
    });
  });
}

function showCustomerForm(editId = null) {
  const existing = editId ? storage.find('customers', editId) : null;
  const barbers = storage.getAll('barbers');

  const body = `
    <form id="customer-form">
      <div class="form-group">
        <label>Nama Lengkap</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" placeholder="Nama pelanggan" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>No. HP / WhatsApp</label>
          <input type="text" class="form-control" name="phone" value="${existing?.phone || ''}" placeholder="08xxxxxxxxxx" required />
        </div>
        <div class="form-group">
          <label>Tanggal Lahir</label>
          <input type="date" class="form-control" name="birthday" value="${existing?.birthday || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label>Alamat (Opsional)</label>
        <input type="text" class="form-control" name="address" value="${existing?.address || ''}" placeholder="Alamat" />
      </div>
      <div class="form-group">
        <label>Barber Favorit</label>
        <select class="form-control" name="preferredBarber">
          <option value="">Tidak ada preferensi</option>
          ${barbers.map(b => `<option value="${b.id}" ${existing?.preferredBarber === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <textarea class="form-control" name="notes" rows="2" placeholder="Preferensi gaya rambut, alergi, dll...">${existing?.notes || ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-customer-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal(editId ? 'Edit Pelanggan' : 'Pelanggan Baru', body, footer);

  document.getElementById('save-customer-btn').addEventListener('click', () => {
    const form = document.getElementById('customer-form');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);

    if (!data.name || !data.phone) {
      showToast('Nama dan No. HP wajib diisi', 'error');
      return;
    }

    if (editId) {
      storage.update('customers', editId, data);
      showToast('Data pelanggan diupdate!', 'success');
    } else {
      data.firstVisit = new Date().toISOString().split('T')[0];
      data.totalVisits = 0;
      data.totalSpent = 0;
      storage.add('customers', data);
      showToast('Pelanggan ditambahkan!', 'success');
    }

    closeModal();
    renderCustomers(document.getElementById('page-container'));
  });
}

function showCustomerDetail(id) {
  const customer = storage.find('customers', id);
  if (!customer) return;

  const appointments = storage.getAll('appointments').filter(a => a.customerId === id).sort((a, b) => b.date.localeCompare(a.date));
  const points = customer.loyalty_points || 0;
  const tier = formatter.loyaltyTier(points);
  
  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: ${customer.avatar ? `url(${customer.avatar}) center/cover` : 'var(--accent-subtle)'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: ${customer.avatar ? '0' : '22px'}; font-weight: 700; color: var(--accent); border: 2px solid var(--accent);">
        ${customer.avatar ? '' : formatter.initials(customer.name)}
      </div>
      <h3 style="margin-bottom: 4px;">${customer.name}</h3>
      <p class="text-sm text-muted">${formatter.phoneDisplay(customer.phone)}</p>
      
      <div style="display: inline-flex; flex-direction: column; align-items: center; margin-top: 10px; width: 100%; max-width: 240px;">
         <span class="loyalty-badge ${tier.class}" style="margin-bottom: 8px; font-weight: 800; padding: 4px 12px; border-radius: 20px;">
            <i class="fas ${tier.icon}"></i> ${tier.name.toUpperCase()} • ${points} Poin
         </span>
         
         ${tier.next ? `
            <div style="width: 100%; background: var(--bg-input); height: 6px; border-radius: 3px; position: relative; margin-top: 4px;">
               <div style="position: absolute; left: 0; top: 0; height: 100%; background: var(--accent); border-radius: 3px; width: ${Math.round((points / tier.next) * 100)}%;"></div>
            </div>
            <div class="text-xs text-muted mt-xs">Hanya butuh ${tier.next - points} poin lagi ke level berikutnya!</div>
         ` : '<div class="text-xs fw-700 text-accent">Luar biasa! Anda berada di level tertinggi! 💎</div>'}
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 18px;">
      <div style="text-align: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
        <div class="fw-700" style="font-size: 20px;">${customer.totalVisits || 0}</div>
        <div class="text-sm text-muted">Kunjungan</div>
      </div>
      <div style="text-align: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
        <div class="fw-700" style="font-size: 20px;">${customer.firstVisit ? dateUtils.membershipDuration(customer.firstVisit) : '-'}</div>
        <div class="text-sm text-muted">Member</div>
      </div>
      <div style="text-align: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
        <div class="fw-700 text-accent" style="font-size: 20px;">${freeCount}</div>
        <div class="text-sm text-muted">Gratis</div>
      </div>
    </div>

    ${customer.birthday ? `<p class="text-sm text-muted mb-md">🎂 Ulang tahun: ${dateUtils.formatDate(customer.birthday, 'long')}</p>` : ''}
    ${customer.notes ? `<p class="text-sm text-muted mb-md">📝 ${customer.notes}</p>` : ''}

    <div style="padding: 15px; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 18px;">
      <h4 style="margin-top: 0; font-size: 14px;"><i class="fas fa-box" style="color: var(--accent);"></i> Saldo Paket Membership</h4>
      ${(customer.packages || []).length > 0 ? customer.packages.map(p => `
        <div class="flex-between mb-sm">
          <span class="text-sm">${p.name}</span>
          <span class="badge badge-info">${p.remainingSessions} Sesi Tersisa</span>
        </div>
      `).join('') : '<p class="text-muted text-xs">Belum memiliki paket aktif</p>'}
      <button class="btn btn-ghost btn-sm btn-block" style="margin-top: 8px; border: 1px dashed var(--border);" onclick="window.__buyPackage('${id}')">
        <i class="fas fa-plus-circle"></i> Tambah Paket
      </button>
    </div>

    <div style="padding: 15px; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 18px;">
      <h4 style="margin-top: 0; font-size: 14px;"><i class="fas fa-share-nodes" style="color: var(--info);"></i> Referral Program</h4>
      <p class="text-xs text-muted mb-sm">Bagikan link ini. Teman yang booking via link ini dapat diskon, dan Anda dapat poin!</p>
      <div class="flex-between" style="background: var(--bg-card); padding: 8px; border-radius: 4px; border: 1px solid var(--border);">
        <code style="font-size: 11px;">.../?ref=${id.slice(-6)}</code>
        <button class="btn btn-ghost btn-xs" onclick="window.__copyReferral('${id}')">Salin</button>
      </div>
    </div>

    <div style="margin-top: 20px; border-top: 1px solid var(--border); pt-16;">
      <div class="flex-between mb-sm">
        <h4 style="margin: 0;">Galeri Gaya Rambut</h4>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gallery-upload').click()">
          <i class="fas fa-camera"></i> Tambah Foto
        </button>
        <input type="file" id="gallery-upload" accept="image/*" style="display: none;" onchange="window.__uploadCustomerPhoto(event, '${id}')" />
      </div>
      
      <div id="customer-gallery" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px;">
        ${(customer.gallery || []).length > 0 ? customer.gallery.map((img, idx) => `
          <div style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" onclick="window.__previewImage('${img}')" />
            <button style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; cursor: pointer;" onclick="window.__deleteCustomerPhoto('${id}', ${idx})">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `).join('') : `
          <div style="grid-column: span 3; padding: 20px; text-align: center; background: var(--bg-input); border-radius: 8px; color: var(--text-muted); font-size: 13px;">
            Belum ada foto gaya rambut
          </div>
        `}
      </div>
    </div>

    ${(() => {
        const membership = storage.getAll('customerMemberships')
            .find(m => m.customer_id === id && m.status === 'active' && m.remaining_sessions > 0);
        
        if (!membership) return '';
        const pack = storage.find('membershipPackages', membership.package_id);
        
        return `
            <div class="card" style="background: rgba(var(--accent-rgb), 0.1); border: 1px solid var(--accent); margin-bottom: 20px;">
                <div class="flex-between mb-sm">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-star text-accent"></i>
                        <h4 style="margin: 0;">Membership Aktif</h4>
                    </div>
                </div>
                <div class="fw-700" style="font-size: 16px;">${pack?.name || 'Paket Aktif'}</div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px;">
                    <div>
                        <div class="text-xs text-muted">Sisa Sesi</div>
                        <div class="fw-800" style="font-size: 20px; color: var(--accent);">${membership.remaining_sessions}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-muted">Berlaku Hingga</div>
                        <div class="fw-600">${membership.expiry_date || 'Selamanya'}</div>
                    </div>
                </div>
            </div>
        `;
    })()}

    <h4 style="margin-bottom: 10px;">Riwayat Kunjungan</h4>
    ${appointments.length > 0 ? `
      <div class="queue-list" style="max-height: 250px; overflow-y: auto;">
        ${appointments.slice(0, 15).map(apt => `
          <div class="queue-item" style="border-left-color: ${apt.status === 'done' ? 'var(--success)' : apt.status === 'cancelled' ? 'var(--danger)' : 'var(--accent)'};">
            <div style="flex: 1;">
              <div class="fw-600">${dateUtils.formatDate(apt.date, 'short')} - ${apt.time}</div>
              <div class="text-sm text-muted">${apt.serviceName} • ${apt.barberName}</div>
            </div>
            <div class="text-right">
              <div class="fw-600">${formatter.currency(apt.price)}</div>
              ${apt.rating > 0 ? `<div class="text-sm">${'⭐'.repeat(apt.rating)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<p class="text-muted text-sm">Belum ada riwayat</p>'}
  `;

  openModal('Detail Pelanggan', body, '', { maxWidth: '500px' });
}

// Global Gallery Handlers
window.__uploadCustomerPhoto = function (event, id) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 1024 * 1024) { // 1MB limit for localStorage
    import('../components/toast.js').then(m => m.showToast('Foto terlalu besar (max 1MB untuk demo)', 'error'));
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const customer = storage.find('customers', id);
    if (!customer) return;

    const gallery = customer.gallery || [];
    gallery.push(e.target.result);
    storage.update('customers', id, { gallery });

    import('../components/toast.js').then(m => m.showToast('Foto ditambahkan! 📸', 'success'));
    showCustomerDetail(id); // Re-render modal content
  };
  reader.readAsDataURL(file);
};

window.__deleteCustomerPhoto = function (id, idx) {
  confirmDialog('Hapus foto ini?', () => {
    const customer = storage.find('customers', id);
    if (!customer) return;

    const gallery = customer.gallery || [];
    gallery.splice(idx, 1);
    storage.update('customers', id, { gallery });

    import('../components/toast.js').then(m => m.showToast('Foto dihapus', 'warning'));
    showCustomerDetail(id);
  });
};

window.__previewImage = function (src) {
  const body = `<img src="${src}" style="width: 100%; border-radius: 8px;" />`;
  openModal('Preview', body, '', { maxWidth: '600px' });
};

window.__buyPackage = function (customerId) {
  const packages = storage.getAll('membershipPackages');
  if (packages.length === 0) {
    showToast('Belum ada master paket. Buat di menu Membership.', 'error');
    return;
  }

  const body = `
    <div style="padding: 10px;">
      <p class="text-sm mb-md">Pilih paket untuk pelanggan ini:</p>
      <div class="service-grid">
        ${packages.map(p => `
          <div class="p-card" style="padding: 12px; cursor: pointer; border: 1px solid var(--border);" onclick="window.__confirmBuyPackage('${customerId}', '${p.id}')">
            <div class="fw-600">${p.name}</div>
            <div class="text-xs text-muted">${p.sessions} Sesi • ${p.serviceName}</div>
            <div class="fw-700 text-accent" style="margin-top: 4px;">${formatter.currency(p.price)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  openModal('Tambah Paket Pelanggan', body);
};

window.__confirmBuyPackage = function (customerId, packageId) {
  const pkg = storage.find('membershipPackages', packageId);
  const customer = storage.find('customers', customerId);
  if (!pkg || !customer) return;

  confirmDialog(`Beli paket ${pkg.name} untuk ${customer.name}?`, () => {
    const activePackages = customer.packages || [];
    activePackages.push({
      ...pkg,
      purchaseDate: new Date().toISOString().split('T')[0],
      remainingSessions: pkg.sessions,
      status: 'active'
    });

    storage.update('customers', customerId, { packages: activePackages });

    // Record payment
    storage.add('payments', {
      customerId: customerId,
      customerName: customer.name,
      amount: pkg.price,
      type: 'package_purchase',
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: `Pembelian paket: ${pkg.name}`
    });

    showToast('Paket berhasil dibeli! ✅', 'success');
    closeModal();
    showCustomerDetail(customerId);
  });
};

window.__copyReferral = function (id) {
  const url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}portal/index.html?ref=${id.slice(-6)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link referral disalin! 🔗', 'success');
  });
};
