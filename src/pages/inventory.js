// ========================================
// Inventory Page
// Manage retail products, stock, and sales
// ========================================

import { storage } from '../utils/storage.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderInventory(container) {
  const inventory = storage.getAll('inventory');

  container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Inventori & Produk</h2>
        <p>Kelola stok produk retail dan bahan</p>
      </div>
      <button class="btn btn-primary" id="add-product-btn">
        <i class="fas fa-plus"></i> Tambah Produk
      </button>
    </div>

    <!-- Inventory Stats -->
    <div class="stats-grid stagger" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
      <div class="card stat-card" style="border-left: 3px solid var(--accent);">
        <div class="stat-icon gold"><i class="fas fa-box"></i></div>
        <div class="stat-info">
          <h3>${inventory.length}</h3>
          <p>Total Produk</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left: 3px solid var(--danger);">
        <div class="stat-icon red"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="stat-info">
          <h3>${inventory.filter(p => (p.stock || 0) <= (p.minStock || 5)).length}</h3>
          <p>Stok Menipis</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left: 3px solid var(--success);">
        <div class="stat-icon green"><i class="fas fa-tag"></i></div>
        <div class="stat-info">
          <h3>${formatter.currency(inventory.reduce((s, p) => s + ((p.stock || 0) * (p.buyPrice || 0)), 0))}</h3>
          <p>Nilai Aset</p>
        </div>
      </div>
    </div>

    <!-- Product Table -->
    <div class="card">
      <h3 style="font-size: 15px; margin-bottom: 14px;">
        <i class="fas fa-list" style="color: var(--accent);"></i> Daftar Produk
      </h3>
      ${inventory.length > 0 ? `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${inventory.sort((a, b) => a.name.localeCompare(b.name)).map(p => {
    const isLow = (p.stock || 0) <= (p.minStock || 5);
    return `
                  <tr>
                    <td>
                      <div class="fw-600">${p.name}</div>
                      <div class="text-xs text-muted">${p.brand || '-'}</div>
                    </td>
                    <td><span class="badge badge-info">${p.category || 'Retail'}</span></td>
                    <td>
                      <span class="fw-700 ${isLow ? 'text-danger' : ''}">${p.stock || 0}</span>
                      ${isLow ? ' <i class="fas fa-arrow-down text-danger pulse" style="font-size: 10px;"></i>' : ''}
                    </td>
                    <td>${formatter.currency(p.buyPrice || 0)}</td>
                    <td class="fw-600 text-accent">${formatter.currency(p.sellPrice || 0)}</td>
                    <td>
                      <div style="display: flex; gap: 4px;">
                        ${isLow && p.supplierPhone ? `
                          <button class="btn btn-ghost btn-sm" onclick="window.__reorderProduct('${p.id}')" title="Pesan Ulang">
                            <i class="fab fa-whatsapp" style="color: #25d366;"></i>
                          </button>
                        ` : ''}
                        <button class="btn btn-ghost btn-sm" onclick="window.__editProduct('${p.id}')">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="window.__deleteProduct('${p.id}')">
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
        <div class="empty-state" style="padding: 40px;">
          <i class="fas fa-boxes-stacked"></i>
          <p>Belum ada produk terdaftar</p>
        </div>
      `}
    </div>
  `;

  // Events
  container.querySelector('#add-product-btn').addEventListener('click', () => showProductForm());

  window.__editProduct = (id) => showProductForm(id);
  window.__deleteProduct = (id) => {
    confirmDialog('Hapus produk ini?', () => {
      storage.delete('inventory', id);
      showToast('Produk dihapus', 'warning');
      renderInventory(container);
    });
  };
}

function showProductForm(productId = null) {
  const products = storage.getAll('inventory');
  const p = productId ? products.find(x => x.id === productId) : {};
  const isEdit = !!productId;

  const body = `
    <form id="product-form">
      <div class="form-group">
        <label>Nama Produk</label>
        <input type="text" class="form-control" name="name" value="${p.name || ''}" placeholder="e.g., Pomade Heavy Hold" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Brand</label>
          <input type="text" class="form-control" name="brand" value="${p.brand || ''}" placeholder="Smiths" />
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select class="form-control" name="category">
            <option value="Retail" ${p.category === 'Retail' ? 'selected' : ''}>Retail (Jual)</option>
            <option value="Bahan" ${p.category === 'Bahan' ? 'selected' : ''}>Bahan (Pakai)</option>
            <option value="Alat" ${p.category === 'Alat' ? 'selected' : ''}>Alat</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Stok Saat Ini</label>
          <input type="number" class="form-control" name="stock" value="${p.stock || 0}" min="0" required />
        </div>
        <div class="form-group">
          <label>Min. Stok (Alert)</label>
          <input type="number" class="form-control" name="minStock" value="${p.minStock || 5}" min="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Harga Beli (Rp)</label>
          <input type="number" class="form-control" name="buyPrice" value="${p.buyPrice || 0}" min="0" required />
        </div>
        <div class="form-group">
          <label>Harga Jual (Rp)</label>
          <input type="number" class="form-control" name="sellPrice" value="${p.sellPrice || 0}" min="0" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Nama Supplier</label>
          <input type="text" class="form-control" name="supplierName" value="${p.supplierName || ''}" placeholder="e.g., PT Alat Salon" />
        </div>
        <div class="form-group">
          <label>WA Supplier</label>
          <input type="text" class="form-control" name="supplierPhone" value="${p.supplierPhone || ''}" placeholder="08xxxxxxxxxx" />
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-product-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal(isEdit ? 'Edit Produk' : 'Tambah Produk', body, footer);

  document.getElementById('save-product-btn').addEventListener('click', () => {
    const form = document.getElementById('product-form');
    const fd = new FormData(form);
    const data = {
      name: fd.get('name'),
      brand: fd.get('brand'),
      category: fd.get('category'),
      stock: parseInt(fd.get('stock')) || 0,
      minStock: parseInt(fd.get('minStock')) || 5,
      buyPrice: parseInt(fd.get('buyPrice')) || 0,
      sellPrice: parseInt(fd.get('sellPrice')) || 0,
      supplierName: fd.get('supplierName'),
      supplierPhone: fd.get('supplierPhone'),
    };

    if (!data.name) {
      showToast('Nama produk wajib diisi', 'error');
      return;
    }

    if (isEdit) {
      storage.update('inventory', productId, data);
      showToast('Produk diperbarui!', 'success');
    } else {
      storage.add('inventory', data);
      showToast('Produk ditambahkan!', 'success');
    }

    closeModal();
    renderInventory(document.getElementById('page-container'));
  });
}

window.__reorderProduct = function (id) {
  const p = storage.find('inventory', id);
  if (!p || !p.supplierPhone) return;

  const msg = `Halo ${p.supplierName || 'Supplier'}!\n\n` +
    `Saya ingin memesan ulang stok produk berikut:\n` +
    `📦 Produk: *${p.name}*\n` +
    `🏷️ Brand: ${p.brand || '-'}\n` +
    `📉 Stok Saat Ini: ${p.stock}\n\n` +
    `Mohon informasikan ketersediaan dan harganya. Terima kasih! 🙏`;

  import('../components/whatsapp.js').then(m => m.whatsapp.sendCustom(p.supplierPhone, msg));
};
