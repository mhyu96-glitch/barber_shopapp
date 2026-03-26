// ========================================
// Promos Page
// Discount & promo management
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderPromos(container) {
    const promos = storage.getAll('promos');
    const services = storage.getAll('services');

    container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Promo & Diskon</h2>
        <p>Kelola promosi untuk menarik pelanggan</p>
      </div>
      <button class="btn btn-primary" id="add-promo-btn">
        <i class="fas fa-plus"></i> Tambah Promo
      </button>
    </div>

    ${promos.length > 0 ? `
      <div class="grid-2 stagger">
        ${promos.map(p => {
        const service = services.find(s => s.id === p.serviceId);
        const isActive = p.active && new Date(p.endDate) >= new Date();
        const dayNames = (p.validDays || []).map(d => dateUtils.getDayShort(d)).join(', ');

        return `
            <div class="card promo-card">
              <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 14px;">
                <div>
                  <div class="promo-badge">${p.type === 'percentage' ? `${p.discount}% OFF` : `Hemat ${formatter.currency(p.discount)}`}</div>
                  <h3 style="font-size: 18px; margin-top: 10px;">${p.name}</h3>
                  <p class="text-sm text-muted mt-sm">${p.description || ''}</p>
                </div>
                <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">
                  ${isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; margin-bottom: 14px;">
                ${service ? `<div class="text-muted"><i class="fas fa-scissors" style="width: 16px;"></i> ${service.name}</div>` : ''}
                <div class="text-muted"><i class="fas fa-calendar" style="width: 16px;"></i> ${dateUtils.formatDate(p.startDate, 'short')} - ${dateUtils.formatDate(p.endDate, 'short')}</div>
                <div class="text-muted"><i class="fas fa-clock" style="width: 16px;"></i> ${dayNames || 'Setiap hari'}</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.__togglePromo('${p.id}')">
                  <i class="fas ${isActive ? 'fa-pause' : 'fa-play'}"></i> ${isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button class="btn btn-ghost btn-sm" onclick="window.__editPromo('${p.id}')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="window.__deletePromo('${p.id}')">
                  <i class="fas fa-trash" style="color: var(--danger);"></i>
                </button>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    ` : `
      <div class="card empty-state">
        <i class="fas fa-tags"></i>
        <h3>Belum Ada Promo</h3>
        <p>Buat promo menarik untuk pelanggan</p>
      </div>
    `}
  `;

    container.querySelector('#add-promo-btn').addEventListener('click', () => showPromoForm(container));

    window.__editPromo = (id) => showPromoForm(container, id);
    window.__togglePromo = (id) => {
        const promo = storage.find('promos', id);
        if (promo) {
            storage.update('promos', id, { active: !promo.active });
            showToast(promo.active ? 'Promo dinonaktifkan' : 'Promo diaktifkan', 'success');
            renderPromos(container);
        }
    };
    window.__deletePromo = (id) => {
        confirmDialog('Yakin ingin menghapus promo ini?', () => {
            storage.delete('promos', id);
            showToast('Promo dihapus', 'warning');
            renderPromos(container);
        });
    };
}

function showPromoForm(pageContainer, editId = null) {
    const existing = editId ? storage.find('promos', editId) : null;
    const services = storage.getAll('services');
    const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const body = `
    <form id="promo-form">
      <div class="form-group">
        <label>Nama Promo</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" required />
      </div>
      <div class="form-group">
        <label>Deskripsi</label>
        <textarea class="form-control" name="description" rows="2">${existing?.description || ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tipe Diskon</label>
          <select class="form-control" name="type">
            <option value="percentage" ${existing?.type === 'percentage' ? 'selected' : ''}>Persentase (%)</option>
            <option value="fixed" ${existing?.type === 'fixed' ? 'selected' : ''}>Nominal (Rp)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nilai Diskon</label>
          <input type="number" class="form-control" name="discount" value="${existing?.discount || ''}" required />
        </div>
      </div>
      <div class="form-group">
        <label>Berlaku untuk Layanan</label>
        <select class="form-control" name="serviceId">
          <option value="">Semua Layanan</option>
          ${services.map(s => `<option value="${s.id}" ${existing?.serviceId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tanggal Mulai</label>
          <input type="date" class="form-control" name="startDate" value="${existing?.startDate || new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label>Tanggal Berakhir</label>
          <input type="date" class="form-control" name="endDate" value="${existing?.endDate || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label>Berlaku di Hari</label>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${daysOfWeek.map((d, i) => `
            <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-input); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px;">
              <input type="checkbox" name="validDays" value="${i}" ${!existing || (existing.validDays || []).includes(i) ? 'checked' : ''} />
              ${d.substring(0, 3)}
            </label>
          `).join('')}
        </div>
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-promo-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

    openModal(editId ? 'Edit Promo' : 'Tambah Promo', body, footer);

    document.getElementById('save-promo-btn').addEventListener('click', () => {
        const fd = new FormData(document.getElementById('promo-form'));
        const validDays = fd.getAll('validDays').map(Number);
        const data = {
            name: fd.get('name'),
            description: fd.get('description'),
            type: fd.get('type'),
            discount: Number(fd.get('discount')),
            serviceId: fd.get('serviceId'),
            startDate: fd.get('startDate'),
            endDate: fd.get('endDate'),
            validDays,
            active: existing ? existing.active : true,
        };

        if (!data.name || !data.discount) { showToast('Lengkapi data', 'error'); return; }

        if (editId) {
            storage.update('promos', editId, data);
            showToast('Promo diupdate!', 'success');
        } else {
            storage.add('promos', data);
            showToast('Promo ditambahkan!', 'success');
        }
        closeModal();
        renderPromos(pageContainer);
    });
}
