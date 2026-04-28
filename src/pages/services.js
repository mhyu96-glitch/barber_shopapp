// ========================================
// Services Page
// Service catalog & pricing
// ========================================

import { storage } from '../utils/storage.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderServices(container) {
  const services = storage.getAll('services');

  container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Layanan & Harga</h2>
        <p>Katalog layanan barbershop</p>
      </div>
      <button class="btn btn-primary" id="add-service-btn">
        <i class="fas fa-plus"></i> Tambah Layanan
      </button>
    </div>

    <div class="grid-3 stagger">
      ${services.map(s => `
        <div class="card" style="position: relative; overflow: hidden; padding: 20px; border: 1px solid var(--border-light); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)';">
          ${(s.name || '').toLowerCase().includes('paket') || (s.name || '').toLowerCase().includes('combo') ? 
            `<div style="position: absolute; top: 0; right: 0; background: var(--accent); color: var(--text-inverse); font-size: 9px; font-weight: 900; padding: 4px 12px; border-bottom-left-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">Hemat</div>` : ''}
          
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; border-radius: 14px; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 24px; box-shadow: 0 4px 10px var(--accent-glow);">
              <i class="fas ${s.icon || 'fa-scissors'}"></i>
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: 17px; margin: 0; color: var(--text-primary);">${s.name}</h3>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <span style="font-size: 11px; color: var(--text-secondary);"><i class="fas fa-clock" style="font-size: 9px;"></i> ${s.duration} menit</span>
                <span style="width: 3px; height: 3px; background: var(--border); border-radius: 50%;"></span>
                <span style="font-size: 11px; color: ${s.price === 0 ? 'var(--warning)' : 'var(--accent)'}; font-weight: 700;">
                  ${s.price === 0 ? '⚙️ Atur Harga' : formatter.currency(s.price)}
                </span>
              </div>
            </div>
          </div>
          
          <p class="text-sm text-muted" style="margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 3em;">${s.description || 'Layanan potong rambut profesional untuk menunjang penampilan Anda.'}</p>
          
          <div style="display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border-light);">
            <button class="btn btn-secondary btn-sm" style="flex: 1; border-radius: 10px;" onclick="window.__editService('${s.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-ghost btn-sm" style="border-radius: 10px; width: 40px; height: 38px; padding: 0;" onclick="window.__deleteService('${s.id}')">
              <i class="fas fa-trash" style="color: var(--danger);"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>

    ${services.length === 0 ? `
      <div class="card empty-state">
        <i class="fas fa-list-check"></i>
        <h3>Belum Ada Layanan</h3>
        <p>Tambah layanan pertama Anda</p>
      </div>
    ` : ''}
  `;

  container.querySelector('#add-service-btn').addEventListener('click', () => showServiceForm());

  window.__editService = (id) => showServiceForm(id);
  window.__deleteService = (id) => {
    confirmDialog('Yakin ingin menghapus layanan ini?', () => {
      storage.delete('services', id);
      showToast('Layanan dihapus', 'warning');
      renderServices(container);
    });
  };
}

function showServiceForm(editId = null) {
  const existing = editId ? storage.find('services', editId) : null;
  const icons = [
    { val: 'fa-scissors', label: '✂️ Gunting' },
    { val: 'fa-cut', label: '💇 Potong' },
    { val: 'fa-spa', label: '💆 Spa' },
    { val: 'fa-palette', label: '🎨 Warna' },
    { val: 'fa-shower', label: '🚿 Cuci' },
    { val: 'fa-child', label: '👦 Anak' },
    { val: 'fa-wand-magic-sparkles', label: '✨ Styling' },
    { val: 'fa-razor', label: '🪒 Cukur' },
  ];

  const body = `
    <form id="service-form">
      <div class="form-group">
        <label>Nama Layanan</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Harga (Rp)</label>
          <input type="number" class="form-control" name="price" value="${existing?.price || ''}" required />
        </div>
        <div class="form-group">
          <label>Durasi (menit)</label>
          <input type="number" class="form-control" name="duration" value="${existing?.duration || 30}" required />
        </div>
      </div>
      <div class="form-group">
        <label>Ikon</label>
        <select class="form-control" name="icon">
          ${icons.map(i => `<option value="${i.val}" ${existing?.icon === i.val ? 'selected' : ''}>${i.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Deskripsi</label>
        <textarea class="form-control" name="description" rows="2">${existing?.description || ''}</textarea>
      </div>
      
      <div style="margin-top: 10px; padding: 15px; background: var(--bg-input); border-radius: var(--radius-md); border: 1px dashed var(--border);">
        <h4 style="margin-top: 0; font-size: 14px;"><i class="fas fa-boxes-stacked" style="color: var(--accent);"></i> Penggunaan Produk (Inventori)</h4>
        <p class="text-xs text-muted mb-md">Pilih produk yang akan otomatis berkurang stoknya saat layanan ini selesai.</p>
        <div id="consumables-list">
          ${(existing?.consumables || []).map((c, i) => `
            <div class="form-row mb-sm" style="align-items: flex-end; gap: 8px;">
              <div class="form-group mb-0" style="flex: 2;">
                <label class="text-xs">Produk</label>
                <select class="form-control form-control-sm" name="consumable_id_${i}">
                  ${storage.getAll('inventory').map(p => `<option value="${p.id}" ${c.id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group mb-0" style="width: 80px;">
                <label class="text-xs">Jumlah</label>
                <input type="number" class="form-control form-control-sm" name="consumable_qty_${i}" value="${c.qty}" />
              </div>
              <button type="button" class="btn btn-ghost btn-xs text-danger" onclick="this.parentElement.remove()" style="margin-bottom: 6px;">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn btn-ghost btn-xs" onclick="window.__addConsumableRow()">
          <i class="fas fa-plus"></i> Tambah Produk
        </button>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-service-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal(editId ? 'Edit Layanan' : 'Tambah Layanan', body, footer);

  document.getElementById('save-service-btn').addEventListener('click', () => {
    const form = document.getElementById('service-form');
    const fd = new FormData(form);
    const data = {
      name: fd.get('name'),
      price: Number(fd.get('price')),
      duration: Number(fd.get('duration')),
      icon: fd.get('icon'),
      description: fd.get('description'),
      consumables: []
    };

    if (!data.name) { showToast('Nama layanan wajib diisi', 'error'); return; }

    // Collect consumables from the dynamic rows
    const rows = document.getElementById('consumables-list').children;
    for (let i = 0; i < rows.length; i++) {
      const id = fd.get(`consumable_id_${i}`);
      const qty = Number(fd.get(`consumable_qty_${i}`));
      if (id && qty > 0) {
        data.consumables.push({ id, qty });
      }
    }

    if (editId) {
      storage.update('services', editId, data);
      showToast('Layanan diupdate!', 'success');
    } else {
      storage.add('services', data);
      showToast('Layanan ditambahkan!', 'success');
    }
    closeModal();
    renderServices(document.getElementById('page-container'));
  });
}

window.__addConsumableRow = function () {
  const list = document.getElementById('consumables-list');
  const idx = list.children.length;
  const products = storage.getAll('inventory');
  if (products.length === 0) return showToast('Belum ada produk di inventori', 'error');

  const div = document.createElement('div');
  div.className = 'form-row mb-sm';
  div.style.alignItems = 'flex-end';
  div.style.gap = '8px';
  div.innerHTML = `
      <div class="form-group mb-0" style="flex: 2;">
        <label class="text-xs">Produk</label>
        <select class="form-control form-control-sm" name="consumable_id_${idx}">
          ${products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group mb-0" style="width: 80px;">
        <label class="text-xs">Jumlah</label>
        <input type="number" class="form-control form-control-sm" name="consumable_qty_${idx}" value="1" />
      </div>
      <button type="button" class="btn btn-ghost btn-xs text-danger" onclick="this.parentElement.remove()" style="margin-bottom: 6px;">
        <i class="fas fa-times"></i>
      </button>
    `;
  list.appendChild(div);
};
