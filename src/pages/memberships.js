// ========================================
// Membership & Packages Page
// Create and manage prepaid haircut bundles
// ========================================

import { storage } from '../utils/storage.js';
import { formatter } from '../utils/formatter.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';

export function renderMemberships(container) {
    const packages = storage.getAll('membershipPackages');
    const activeBookings = storage.getAll('appointments').filter(a => a.status !== 'cancelled');

    container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Membership & Paket</h2>
        <p>Kelola paket prepaid dan keanggotaan pelanggan</p>
      </div>
      <button class="btn btn-primary" id="add-package-btn">
        <i class="fas fa-plus"></i> Paket Baru
      </button>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 style="margin-bottom: 20px;"><i class="fas fa-box" style="color: var(--accent);"></i> Daftar Paket Tersedia</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama Paket</th>
                <th>Layanan</th>
                <th>Sesi</th>
                <th>Harga</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${packages.length > 0 ? packages.map(p => `
                <tr>
                  <td><div class="fw-600">${p.name}</div></td>
                  <td>${p.serviceName || 'Semua'}</td>
                  <td><span class="badge badge-info">${p.sessions} Sesi</span></td>
                  <td>${formatter.currency(p.price)}</td>
                  <td>
                    <div style="display: flex; gap: 4px;">
                      <button class="btn btn-ghost btn-sm" onclick="window.__editPackage('${p.id}')"><i class="fas fa-edit"></i></button>
                      <button class="btn btn-ghost btn-sm" onclick="window.__deletePackage('${p.id}')"><i class="fas fa-trash text-danger"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="5" class="text-center text-muted">Belum ada paket</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="flex-between mb-md">
            <h3 style="margin: 0;"><i class="fas fa-users" style="color: var(--info);"></i> Penggunaan Aktif</h3>
            <span class="badge badge-info">${storage.getAll('customerMemberships').filter(m => m.status === 'active').length} Member Aktif</span>
        </div>
        <div class="queue-list" id="active-memberships-list">
          ${(() => {
            const activeMembs = storage.getAll('customerMemberships').filter(m => m.status === 'active');
            if (activeMembs.length === 0) return '<div class="text-center py-20 text-muted">Belum ada member aktif</div>';
            
            return activeMembs.map(m => {
                const customer = storage.find('customers', m.customer_id) || { name: 'Unknown' };
                const pack = storage.find('membershipPackages', m.package_id) || { name: 'Unknown Package' };
                const isExpired = m.expiry_date && new Date(m.expiry_date) < new Date();
                
                return `
                    <div class="queue-item" style="${isExpired ? 'opacity: 0.6; background: rgba(var(--danger-rgb), 0.05);' : ''}">
                        <div style="flex: 1;">
                            <div class="fw-700">${customer.name}</div>
                            <div class="text-xs text-muted">${pack.name}</div>
                            <div class="text-xs mt-xs" style="color: var(--accent); font-weight: 600;">Sisa: ${m.remaining_sessions} Sesi</div>
                        </div>
                        <div style="text-align: right;">
                            <span class="badge ${isExpired ? 'badge-danger' : 'badge-success'}">${isExpired ? 'Expired' : 'Aktif'}</span>
                            <div class="text-xs text-muted mt-xs">${m.expiry_date ? 'Hingga: ' + m.expiry_date : 'Selamanya'}</div>
                        </div>
                    </div>
                `;
            }).join('');
          })()}
        </div>
      </div>
    </div>
  `;

    document.getElementById('add-package-btn').addEventListener('click', () => showPackageForm());

    window.__editPackage = (id) => showPackageForm(id);
    window.__deletePackage = (id) => {
        confirmDialog('Hapus paket ini?', () => {
            storage.delete('membershipPackages', id);
            showToast('Paket dihapus', 'warning');
            renderMemberships(container);
        });
    };
}

function showPackageForm(editId = null) {
    const existing = editId ? storage.find('membershipPackages', editId) : null;
    const services = storage.getAll('services');

    const body = `
    <form id="package-form">
      <div class="form-group">
        <label>Nama Paket</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" placeholder="e.g., Paket Mantap 5x Potong" required />
      </div>
      <div class="form-group">
        <label>Berlaku Untuk Layanan</label>
        <select class="form-control" name="serviceId">
          <option value="">Semua Layanan</option>
          ${services.map(s => `<option value="${s.id}" ${existing?.serviceId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Jumlah Sesi</label>
          <input type="number" class="form-control" name="sessions" value="${existing?.sessions || 5}" min="1" required />
        </div>
        <div class="form-group">
          <label>Harga Paket (Rp)</label>
          <input type="number" class="form-control" name="price" value="${existing?.price || 0}" min="0" required />
        </div>
      </div>
      <div class="form-group">
        <label>Masa Berlaku (Hari) <small class="text-muted">(Kosongkan jika selamanya)</small></label>
        <input type="number" class="form-control" name="validDays" value="${existing?.validDays || ''}" placeholder="e.g., 180" />
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" id="save-package-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

    openModal(editId ? 'Edit Paket' : 'Tambah Paket Baru', body, footer);

    document.getElementById('save-package-btn').addEventListener('click', () => {
        const form = document.getElementById('package-form');
        const fd = new FormData(form);
        const service = services.find(s => s.id === fd.get('serviceId'));
        const data = {
            name: fd.get('name'),
            serviceId: fd.get('serviceId'),
            serviceName: service ? service.name : 'Semua Layanan',
            sessions: parseInt(fd.get('sessions')),
            price: parseInt(fd.get('price')),
            validDays: fd.get('validDays') ? parseInt(fd.get('validDays')) : null,
        };

        if (editId) {
            storage.update('membershipPackages', editId, data);
            showToast('Paket diperbarui!', 'success');
        } else {
            storage.add('membershipPackages', data);
            showToast('Paket ditambahkan!', 'success');
        }

        closeModal();
        renderMemberships(document.getElementById('page-container'));
    });
}
