// ========================================
// Barbers Page
// Staff management, schedule, ratings
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderBarbers(container) {
  const barbers = storage.getAll('barbers');
  const appointments = storage.getAll('appointments');
  const holidays = storage.getAll('holidays');

  container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Barber</h2>
        <p>Kelola staff dan jadwal kerja</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" id="manage-holidays-btn">
          <i class="fas fa-calendar-xmark"></i> Hari Libur
        </button>
        <button class="btn btn-primary" id="add-barber-btn">
          <i class="fas fa-user-plus"></i> Tambah Barber
        </button>
      </div>
    </div>

    <div class="grid-3 stagger">
      ${barbers.map(b => {
    const barberAppts = appointments.filter(a => a.barberId === b.id && a.status === 'done');
    const thisMonth = barberAppts.filter(a => a.date.startsWith(new Date().toISOString().substring(0, 7)));
    const dayNames = (b.workDays || []).map(d => dateUtils.getDayShort(d)).join(', ');

    return `
          <div class="card" style="position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: var(--accent-glow); border-radius: 0 0 0 80px;"></div>
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: ${b.avatar ? `url(${b.avatar}) center/cover` : 'linear-gradient(135deg, var(--accent), var(--accent-dark))'}; display: flex; align-items: center; justify-content: center; font-size: ${b.avatar ? '0' : '20px'}; font-weight: 700; color: var(--text-inverse); flex-shrink: 0; border: 2px solid var(--accent-subtle);">
                ${b.avatar ? '' : formatter.initials(b.name)}
              </div>
              <div>
                <h3 style="font-size: 16px;">${b.name}</h3>
                <p class="text-sm text-muted">${b.specialization || '-'}</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 12px;">
              <div class="rating-stars">
                ${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.round(b.rating || 0) ? 'fas' : 'far'} fa-star"></i>`).join('')}
              </div>
              <span class="fw-600" style="color: var(--accent); margin-left: 4px;">${b.rating || 0}</span>
              <span class="text-sm text-muted">(${b.totalRatings || 0})</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
              <div class="flex-between text-sm">
                <span class="text-muted">Jam Kerja</span>
                <span>${b.workStart || '08:00'} - ${b.workEnd || '20:00'}</span>
              </div>
              <div class="flex-between text-sm">
                <span class="text-muted">Hari Kerja</span>
                <span>${dayNames || '-'}</span>
              </div>
              <div class="flex-between text-sm">
                <span class="text-muted">Potong Bulan Ini</span>
                <span class="fw-600">${thisMonth.length}</span>
              </div>
              <div class="flex-between text-sm">
                <span class="text-muted">Total Potong</span>
                <span class="fw-600">${barberAppts.length}</span>
              </div>
            </div>

            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.__editBarber('${b.id}')">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-ghost btn-sm" title="Share Profile & QR" onclick="window.__shareBarberProfile('${b.id}')">
                <i class="fas fa-qrcode" style="color: var(--accent);"></i>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="window.__deleteBarber('${b.id}')">
                <i class="fas fa-trash" style="color: var(--danger);"></i>
              </button>
            </div>
          </div>
        `;
  }).join('')}
    </div>

    ${holidays.length > 0 ? `
      <div class="card mt-lg">
        <h3 style="margin-bottom: 12px;"><i class="fas fa-calendar-xmark" style="color: var(--danger);"></i> Hari Libur</h3>
        <div class="queue-list">
          ${holidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => `
            <div class="queue-item">
              <div style="flex: 1;">
                <div class="fw-600">${h.name}</div>
                <div class="text-sm text-muted">${dateUtils.formatDate(h.date, 'long')} ${h.notes ? '• ' + h.notes : ''}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="window.__deleteHoliday('${h.id}')">
                <i class="fas fa-times" style="color: var(--danger);"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  container.querySelector('#add-barber-btn').addEventListener('click', () => showBarberForm());
  container.querySelector('#manage-holidays-btn').addEventListener('click', () => showHolidayForm());

  window.__editBarber = (id) => showBarberForm(id);
  window.__deleteBarber = (id) => {
    confirmDialog('Yakin ingin menghapus barber ini?', () => {
      storage.delete('barbers', id);
      showToast('Barber dihapus', 'warning');
      renderBarbers(container);
    });
  };
  window.__deleteHoliday = (id) => {
    storage.delete('holidays', id);
    renderBarbers(container);
  };
}

function showBarberForm(editId = null) {
  if (!editId) {
    const currentBarbersCount = storage.getAll('barbers').length;
    const constraints = storage.get('shop_constraints', {});
    const maxBarbers = constraints.maxBarbers || 0; 
    
    if (maxBarbers > 0 && currentBarbersCount >= maxBarbers) {
      showToast(`Batas maksimal Barber (${maxBarbers}) telah tercapai untuk paket berlangganan Anda.`, 'warning');
      return;
    }
  }

  const existing = editId ? storage.find('barbers', editId) : null;
  const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const body = `
    <form id="barber-form">
      <div class="form-group">
        <label>Nama</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>No. HP</label>
          <input type="text" class="form-control" name="phone" value="${existing?.phone || ''}" />
        </div>
        <div class="form-group">
          <label>Spesialisasi</label>
          <input type="text" class="form-control" name="specialization" value="${existing?.specialization || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Jam Mulai</label>
          <input type="time" class="form-control" name="workStart" value="${existing?.workStart || '08:00'}" />
        </div>
        <div class="form-group">
          <label>Jam Selesai</label>
          <input type="time" class="form-control" name="workEnd" value="${existing?.workEnd || '20:00'}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Mulai Istirahat</label>
          <input type="time" class="form-control" name="breakStart" value="${existing?.breakStart || '12:00'}" />
        </div>
        <div class="form-group">
          <label>Selesai Istirahat</label>
          <input type="time" class="form-control" name="breakEnd" value="${existing?.breakEnd || '13:00'}" />
        </div>
      </div>
      <div class="form-group">
        <label>Hari Kerja</label>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${daysOfWeek.map((d, i) => `
            <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-input); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px;">
              <input type="checkbox" name="workDays" value="${i}" ${(existing?.workDays || [1, 2, 3, 4, 5, 6]).includes(i) ? 'checked' : ''} />
              ${d.substring(0, 3)}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Gaji Pokok (Rp)</label>
          <input type="number" class="form-control" name="baseSalary" value="${existing?.baseSalary || 0}" min="0" />
        </div>
        <div class="form-group">
          <label>Tipe Komisi</label>
          <select class="form-control" name="commissionType" id="commission-type-select">
            <option value="percent" ${(existing?.commissionType || 'percent') === 'percent' ? 'selected' : ''}>Persen (%)</option>
            <option value="fixed" ${existing?.commissionType === 'fixed' ? 'selected' : ''}>Rupiah Tetap (Rp)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" id="commission-percent-group" style="display: ${existing?.commissionType === 'fixed' ? 'none' : 'block'};">
          <label>Komisi per Transaksi (%)</label>
          <input type="number" class="form-control" name="commissionRate" value="${existing?.commissionRate || 10}" min="0" max="100" />
        </div>
        <div class="form-group" id="commission-fixed-group" style="display: ${existing?.commissionType === 'fixed' ? 'block' : 'none'};">
          <label>Komisi per Transaksi (Rp)</label>
          <input type="number" class="form-control" name="commissionFixed" value="${existing?.commissionFixed || 5000}" min="0" step="1000" />
        </div>
      </div>
      <div class="form-group">
        <label>Bio</label>
        <textarea class="form-control" name="bio" rows="2">${existing?.bio || ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-barber-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal(editId ? 'Edit Barber' : 'Tambah Barber', body, footer);

  // Dynamic toggle for commission type
  const typeSelect = document.getElementById('commission-type-select');
  const percentGroup = document.getElementById('commission-percent-group');
  const fixedGroup = document.getElementById('commission-fixed-group');
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      const isFixed = typeSelect.value === 'fixed';
      percentGroup.style.display = isFixed ? 'none' : 'block';
      fixedGroup.style.display = isFixed ? 'block' : 'none';
    });
  }

  document.getElementById('save-barber-btn').addEventListener('click', () => {
    const form = document.getElementById('barber-form');
    const fd = new FormData(form);
    const workDays = fd.getAll('workDays').map(Number);
    const commissionType = fd.get('commissionType') || 'percent';
    const data = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      specialization: fd.get('specialization'),
      workStart: fd.get('workStart'),
      workEnd: fd.get('workEnd'),
      breakStart: fd.get('breakStart'),
      breakEnd: fd.get('breakEnd'),
      workDays,
      baseSalary: parseInt(fd.get('baseSalary')) || 0,
      commissionType,
      commissionRate: commissionType === 'percent' ? (parseInt(fd.get('commissionRate')) || 0) : 0,
      commissionFixed: commissionType === 'fixed' ? (parseInt(fd.get('commissionFixed')) || 0) : 0,
      bio: fd.get('bio'),
    };

    if (!data.name) { showToast('Nama wajib diisi', 'error'); return; }

    if (editId) {
      storage.update('barbers', editId, data);
      showToast('Data barber diupdate!', 'success');
    } else {
      data.rating = 0;
      data.totalRatings = 0;
      storage.add('barbers', data);
      showToast('Barber ditambahkan!', 'success');
    }

    closeModal();
    renderBarbers(document.getElementById('page-container'));
  });
}

function showHolidayForm() {
  const body = `
    <form id="holiday-form">
      <div class="form-group">
        <label>Tanggal Libur</label>
        <input type="date" class="form-control" name="date" required />
      </div>
      <div class="form-group">
        <label>Nama Hari Libur</label>
        <input type="text" class="form-control" name="name" placeholder="e.g., Idul Fitri" required />
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <input type="text" class="form-control" name="notes" placeholder="e.g., Tutup 3 hari" />
      </div>
    </form>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-holiday-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal('Tambah Hari Libur', body, footer);

  document.getElementById('save-holiday-btn').addEventListener('click', () => {
    const form = document.getElementById('holiday-form');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.date || !data.name) { showToast('Lengkapi data', 'error'); return; }
    storage.add('holidays', data);
    showToast('Hari libur ditambahkan', 'success');
    closeModal();
    renderBarbers(document.getElementById('page-container'));
  });
}

window.__shareBarberProfile = function (id) {
  const barber = storage.find('barbers', id);
  if (!barber) return;

  const url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}portal/index.html?barber=${id}`;

  const body = `
    <div style="text-align: center; padding: 10px;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: 700; color: var(--accent);">
        ${barber.name.split(' ').map(n => n[0]).join('')}
      </div>
      <h3 style="margin-bottom: 4px;">${barber.name}</h3>
      <p class="text-sm text-muted mb-lg">${barber.specialization || 'Professional Barber'}</p>
      
      <div style="background: white; padding: 15px; border-radius: 12px; display: inline-block; margin-bottom: 15px; border: 1px solid var(--border);">
        <canvas id="barber-qr-canvas" width="180" height="180"></canvas>
      </div>
      
      <div style="background: var(--bg-input); padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-bottom: 15px; word-break: break-all;">
        ${url}
      </div>
      
      <button class="btn btn-primary btn-block" onclick="window.__copyBarberLink('${url}')">
        <i class="fas fa-copy"></i> Salin Link Booking
      </button>
    </div>
  `;

  openModal('Profil Digital Barber', body, '', { maxWidth: '400px' });

  // Draw QR
  setTimeout(() => {
    const canvas = document.getElementById('barber-qr-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      // Just a mock QR pattern
      for (let i = 0; i < 36; i++) {
        for (let j = 0; j < 36; j++) {
          if (Math.random() > 0.7) ctx.fillRect(i * 5, j * 5, 5, 5);
        }
      }
      ctx.fillRect(0, 0, 35, 35); ctx.clearRect(5, 5, 25, 25); ctx.fillRect(10, 10, 15, 15);
      ctx.fillRect(145, 0, 35, 35); ctx.clearRect(150, 5, 25, 25); ctx.fillRect(155, 10, 15, 15);
      ctx.fillRect(0, 145, 35, 35); ctx.clearRect(5, 150, 25, 25); ctx.fillRect(10, 155, 15, 15);
    }
  }, 100);
};

window.__copyBarberLink = function (url) {
  navigator.clipboard.writeText(url).then(() => {
    import('../components/toast.js').then(m => m.showToast('Link profil disalin! 🔗', 'success'));
  });
};
