// ========================================
// Gallery Page
// Haircut style gallery
// ========================================

import { storage } from '../utils/storage.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

const STYLE_IMAGES = {
    'Fade Cut': 'linear-gradient(135deg, #667eea, #764ba2)',
    'Undercut': 'linear-gradient(135deg, #f093fb, #f5576c)',
    'Pompadour': 'linear-gradient(135deg, #4facfe, #00f2fe)',
    'Buzz Cut': 'linear-gradient(135deg, #43e97b, #38f9d7)',
    'Mullet': 'linear-gradient(135deg, #fa709a, #fee140)',
    'Crew Cut': 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
};

const CATEGORIES = ['Semua', 'Modern', 'Classic', 'Simple', 'Trendy'];

export function renderGallery(container) {
    const gallery = storage.getAll('gallery');
    let activeCategory = 'Semua';

    function render() {
        const filtered = activeCategory === 'Semua' ? gallery : gallery.filter(g => g.category === activeCategory);

        container.innerHTML = `
      <div class="page-header page-header-row">
        <div>
          <h2>Galeri Style</h2>
          <p>Koleksi model potongan rambut</p>
        </div>
        <button class="btn btn-primary" id="add-gallery-btn">
          <i class="fas fa-plus"></i> Tambah Style
        </button>
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
        ${CATEGORIES.map(c => `
          <button class="btn ${activeCategory === c ? 'btn-primary' : 'btn-secondary'} btn-sm" data-cat="${c}">
            ${c}
          </button>
        `).join('')}
      </div>

      ${filtered.length > 0 ? `
        <div class="gallery-grid">
          ${filtered.map(g => {
            const bg = STYLE_IMAGES[g.name] || 'linear-gradient(135deg, var(--bg-card-hover), var(--bg-card))';
            return `
              <div class="gallery-item" onclick="window.__viewGallery('${g.id}')">
                <div style="width: 100%; height: 100%; background: ${bg}; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-scissors" style="font-size: 36px; opacity: 0.3; color: #fff;"></i>
                </div>
                <div class="gallery-label">
                  <div>${g.name}</div>
                  <div style="font-size: 11px; opacity: 0.7;">${g.category || ''}</div>
                </div>
              </div>
            `;
        }).join('')}
        </div>
      ` : `
        <div class="card empty-state">
          <i class="fas fa-images"></i>
          <h3>Belum Ada Style</h3>
          <p>Tambah koleksi gaya potongan rambut</p>
        </div>
      `}
    `;

        container.querySelector('#add-gallery-btn').addEventListener('click', () => showGalleryForm(container));
        container.querySelectorAll('[data-cat]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeCategory = btn.dataset.cat;
                render();
            });
        });
    }

    render();

    window.__viewGallery = (id) => {
        const g = storage.find('gallery', id);
        if (!g) return;
        const bg = STYLE_IMAGES[g.name] || 'linear-gradient(135deg, var(--bg-card-hover), var(--bg-card))';
        const body = `
      <div style="width: 100%; height: 200px; border-radius: var(--radius-md); background: ${bg}; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <i class="fas fa-scissors" style="font-size: 48px; opacity: 0.3; color: #fff;"></i>
      </div>
      <h3>${g.name}</h3>
      <span class="badge badge-info mt-sm">${g.category}</span>
      <p class="text-muted mt-md">${g.description || 'Tidak ada deskripsi'}</p>
      <div style="display: flex; gap: 8px; margin-top: 16px;">
        <button class="btn btn-secondary btn-sm" onclick="window.__editGalleryItem('${g.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn btn-danger btn-sm" onclick="window.__deleteGalleryItem('${g.id}')"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `;
        openModal('Detail Style', body, '', { maxWidth: '450px' });
    };

    window.__editGalleryItem = (id) => { closeModal(); showGalleryForm(container, id); };
    window.__deleteGalleryItem = (id) => {
        closeModal();
        confirmDialog('Yakin ingin menghapus style ini?', () => {
            storage.delete('gallery', id);
            showToast('Style dihapus', 'warning');
            renderGallery(container);
        });
    };
}

function showGalleryForm(pageContainer, editId = null) {
    const existing = editId ? storage.find('gallery', editId) : null;

    const body = `
    <form id="gallery-form">
      <div class="form-group">
        <label>Nama Style</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" required />
      </div>
      <div class="form-group">
        <label>Kategori</label>
        <select class="form-control" name="category">
          <option value="Modern" ${existing?.category === 'Modern' ? 'selected' : ''}>Modern</option>
          <option value="Classic" ${existing?.category === 'Classic' ? 'selected' : ''}>Classic</option>
          <option value="Simple" ${existing?.category === 'Simple' ? 'selected' : ''}>Simple</option>
          <option value="Trendy" ${existing?.category === 'Trendy' ? 'selected' : ''}>Trendy</option>
        </select>
      </div>
      <div class="form-group">
        <label>Deskripsi</label>
        <textarea class="form-control" name="description" rows="2">${existing?.description || ''}</textarea>
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-gallery-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

    openModal(editId ? 'Edit Style' : 'Tambah Style', body, footer);

    document.getElementById('save-gallery-btn').addEventListener('click', () => {
        const fd = new FormData(document.getElementById('gallery-form'));
        const data = Object.fromEntries(fd);
        if (!data.name) { showToast('Nama wajib diisi', 'error'); return; }

        if (editId) {
            storage.update('gallery', editId, data);
            showToast('Style diupdate!', 'success');
        } else {
            storage.add('gallery', data);
            showToast('Style ditambahkan!', 'success');
        }
        closeModal();
        renderGallery(pageContainer);
    });
}
