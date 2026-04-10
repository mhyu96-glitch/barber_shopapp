import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { renderSuperAdminReports } from './reports_super.js';

window.closeModal = closeModal;

let activeTab = 'tenants';

export async function renderSuperAdmin(container) {
  renderMainLayout(container);
}

function renderMainLayout(container) {
  const currentTheme = localStorage.getItem('barberpro_theme') || 'dark';

  container.innerHTML = `
    <div class="super-admin-layout fade-in">
      <div class="super-admin-header sticky-header" style="background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 12px 30px; margin: -24px -30px 24px -30px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); z-index: 100;">
        <div class="header-content">
          <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: var(--accent); letter-spacing: -0.5px;">Master Dashboard Platform</h1>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 500;">Kendali penuh platform & manajemen tenant</p>
        </div>
        <div class="header-actions" style="display: flex; gap: 10px; align-items: center;">
           <button id="theme-toggle-btn" class="btn btn-secondary btn-sm" title="Ganti Tema" style="width: 38px; height: 38px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 10px;">
            <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
          </button>
          
          <div style="width: 1px; height: 20px; background: var(--border); margin: 0 4px;" class="hide-mobile"></div>
          
          <div class="btn-group" style="display: flex; background: var(--bg-input); padding: 4px; border-radius: 12px; border: 1px solid var(--border);">
            <button id="btn-tab-tenants" class="btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-ghost'} btn-sm" style="border-radius: 8px; font-size: 12px; padding: 6px 14px;">
              <i class="fas fa-store"></i> <span class="hide-mobile">Tenant</span>
            </button>
            <button id="btn-tab-reports" class="btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-ghost'} btn-sm" style="border-radius: 8px; font-size: 12px; padding: 6px 14px;">
              <i class="fas fa-chart-pie"></i> <span class="hide-mobile">Laporan</span>
            </button>
            <button id="btn-tab-broadcast" class="btn ${activeTab === 'broadcast' ? 'btn-primary' : 'btn-ghost'} btn-sm" style="border-radius: 8px; font-size: 12px; padding: 6px 14px;">
              <i class="fas fa-bullhorn"></i> <span class="hide-mobile">Pengumuman</span>
            </button>
          </div>

          <div style="width: 1px; height: 20px; background: var(--border); margin: 0 4px;" class="hide-mobile"></div>

          <button id="add-shop-btn" class="btn btn-primary btn-sm" style="border-radius: 10px; font-weight: 700;">
            <i class="fas fa-plus"></i> <span class="hide-mobile">Registrasi Baru</span>
          </button>
          
          <button id="master-logout-btn" class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.15); width: 38px; height: 38px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 10px;">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <div id="sub-page-container">
        <!-- Content injected here -->
      </div>
    </div>
  `;

  // Global Listeners
  container.querySelector('#theme-toggle-btn').onclick = toggleTheme;
  container.querySelector('#add-shop-btn').onclick = () => renderAddShopModal();
  container.querySelector('#btn-tab-tenants').onclick = () => { activeTab = 'tenants'; renderMainLayout(container); };
  container.querySelector('#btn-tab-reports').onclick = () => { activeTab = 'reports'; renderMainLayout(container); };
  container.querySelector('#btn-tab-broadcast').onclick = () => { activeTab = 'broadcast'; renderMainLayout(container); };

  renderActiveTab(container);
}

function toggleTheme() {
  const current = localStorage.getItem('barberpro_theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('barberpro_theme', next);
  document.documentElement.setAttribute('data-theme', next);
  if (next === 'light') document.documentElement.classList.add('light-theme');
  else document.documentElement.classList.remove('light-theme');
  renderSuperAdmin(document.getElementById('page-container'));
}

async function renderActiveTab(container) {
  const subContainer = container.querySelector('#sub-page-container');
  if (!subContainer) return;

  if (activeTab === 'tenants') renderTenantsList(subContainer);
  else if (activeTab === 'reports') renderSuperAdminReports(subContainer);
  else if (activeTab === 'broadcast') renderAnnouncementsTab(subContainer);
}

// ==========================================
// TENANTS LIST TAB
// ==========================================
async function renderTenantsList(container) {
  container.innerHTML = `
    <div class="stats-grid fade-in" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px;">
       <div class="card stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
        <div class="stat-icon" style="background: var(--accent-subtle); color: var(--accent); width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px;"><i class="fas fa-store"></i></div>
        <div class="stat-info">
          <h3 id="stat-total" style="font-size: 24px; font-weight: 800; margin: 0;">-</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0; font-weight: 600;">Total Barbershop</p>
        </div>
      </div>
      <div class="card stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px; border-left: 3px solid #22c55e;">
        <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px;"><i class="fas fa-check-circle"></i></div>
        <div class="stat-info">
          <h3 id="stat-active" style="font-size: 24px; font-weight: 800; margin: 0;">-</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0; font-weight: 600;">Toko Aktif</p>
        </div>
      </div>
      <div class="card stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px; border-left: 3px solid #ef4444;">
        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px;"><i class="fas fa-times-circle"></i></div>
        <div class="stat-info">
          <h3 id="stat-expired" style="font-size: 24px; font-weight: 800; margin: 0;">-</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0; font-weight: 600;">Kedaluwarsa</p>
        </div>
      </div>
    </div>

    <div class="card fade-in" style="margin-top: 24px;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 16px;"><i class="fas fa-list"></i> Unit Tenant Terdaftar</h2>
        <button id="refresh-tenants" class="btn btn-ghost btn-sm"><i class="fas fa-sync-alt"></i></button>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tenant & Info</th>
              <th>Status</th>
              <th>Paket</th>
              <th>Daftar Pada</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="tenants-body">
            <tr><td colspan="5" style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadTenants(container);
  container.querySelector('#refresh-tenants').onclick = () => loadTenants(container);
}

async function loadTenants(container) {
  try {
    const { data: shops } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    
    container.querySelector('#stat-total').textContent = shops.length;
    container.querySelector('#stat-active').textContent = shops.filter(s => s.status === 'active').length;
    container.querySelector('#stat-expired').textContent = shops.filter(s => s.status === 'expired').length;

    const tbody = container.querySelector('#tenants-body');
    if (shops.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Belum ada tenant terdaftar.</td></tr>';
      return;
    }

    tbody.innerHTML = shops.map(shop => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="shop-avatar" style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-subtle); color: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700;">${shop.name?.[0] || 'S'}</div>
            <div>
              <div class="fw-700">${shop.name}</div>
              <div style="font-size: 10px; color: var(--text-muted);">Slug: ${shop.slug} | HP: ${shop.phone || '-'}</div>
            </div>
          </div>
        </td>
        <td><span class="status-badge status-${shop.status || 'trial'}">${(shop.status || 'trial').toUpperCase()}</span></td>
        <td><div style="font-size: 12px; color: var(--accent); font-weight: 600;">${shop.plan_id ? 'PRO UNLIMITED' : 'BASIC TIER'}</div></td>
        <td style="font-size: 12px; color: var(--text-muted);">${new Date(shop.created_at).toLocaleDateString('id-ID')}</td>
        <td>
          <div class="flex gap-2">
            <button class="btn-icon edit-shop-btn" data-id="${shop.id}" title="Edit Info"><i class="fas fa-edit"></i></button>
            <button class="btn-icon provision-btn" data-id="${shop.id}" data-name="${shop.name}" data-slug="${shop.slug}" title="Provision User" style="color: #6366f1;"><i class="fas fa-user-shield"></i></button>
            <button class="btn-icon delete-btn" data-id="${shop.id}" title="Hapus Permanen" style="color: #ef4444;"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-shop-btn').forEach(btn => btn.onclick = () => handleEditShop(shops.find(s => s.id === btn.dataset.id)));
    tbody.querySelectorAll('.provision-btn').forEach(btn => btn.onclick = () => renderAdminProvisioning(btn.dataset.id, btn.dataset.name, btn.dataset.slug));
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => handleDeleteShop(shops.find(s => s.id === btn.dataset.id)));

  } catch (err) { console.error(err); showToast('Gagal memuat tenant.', 'danger'); }
}

// ==========================================
// ANNOUNCEMENTS TAB
// ==========================================
async function renderAnnouncementsTab(container) {
  container.innerHTML = `
    <div class="card fade-in" style="margin-top: 10px;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 16px;"><i class="fas fa-bullhorn"></i> Manajemen Pengumuman Global</h2>
        <button id="add-notice-btn" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Tambah Pengumuman</button>
      </div>
      <div class="table-container" style="margin-top: 15px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Judul & Pesan</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="notices-body">
            <tr><td colspan="4" style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadNotices(container);
  container.querySelector('#add-notice-btn').onclick = () => renderNoticeModal();
}

async function loadNotices(container) {
  try {
    const { data: notices } = await supabase.from('platform_notices').select('*').order('created_at', { ascending: false });
    const tbody = container.querySelector('#notices-body');
    
    if (!notices || notices.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Belum ada pengumuman.</td></tr>';
      return;
    }

    tbody.innerHTML = notices.map(n => `
      <tr>
        <td>
          <div class="fw-700">${n.title}</div>
          <div style="font-size: 11px; color: var(--text-muted); max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${n.message}</div>
        </td>
        <td><span class="badge" style="background: var(--${n.type}-bg); color: var(--${n.type});">${n.type.toUpperCase()}</span></td>
        <td><span class="status-badge status-${n.is_active ? 'active' : 'expired'}">${n.is_active ? 'AKTIF' : 'NON-AKTIF'}</span></td>
        <td>
          <div class="flex gap-2">
            <button class="btn-icon toggle-notice-btn" data-id="${n.id}" data-active="${n.is_active}">${n.is_active ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>'}</button>
            <button class="btn-icon delete-notice-btn" data-id="${n.id}" style="color: #ef4444;"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.toggle-notice-btn').forEach(btn => {
      btn.onclick = async () => {
        const active = btn.dataset.active === 'true';
        await supabase.from('platform_notices').update({ is_active: !active }).eq('id', btn.dataset.id);
        loadNotices(container);
      };
    });

    tbody.querySelectorAll('.delete-notice-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Hapus pengumuman ini?')) return;
        await supabase.from('platform_notices').delete().eq('id', btn.dataset.id);
        loadNotices(container);
      };
    });

  } catch (err) { console.warn(err); }
}

function renderNoticeModal() {
  const body = `
    <div class="form-group mb-md">
      <label>JUDUL PENGUMUMAN</label>
      <input type="text" id="notice-title" class="form-control" placeholder="Maintenance / Pembaruan Fitur">
    </div>
    <div class="form-group mb-md">
      <label>PESAN</label>
      <textarea id="notice-message" class="form-control" rows="4" placeholder="Tulis pengumuman di sini..."></textarea>
    </div>
    <div class="form-group mb-md">
      <label>TIPE</label>
      <select id="notice-type" class="form-control">
        <option value="info">Info (Biru)</option>
        <option value="success">Success (Hijau)</option>
        <option value="warning">Warning (Kuning)</option>
        <option value="danger">Danger (Merah)</option>
      </select>
    </div>
  `;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                  <button id="save-notice-btn" class="btn btn-primary">Publikasikan</button>`;
  
  openModal('Buat Pengumuman Global', body, footer, { maxWidth: '450px' });

  document.getElementById('save-notice-btn').onclick = async (e) => {
    const title = document.getElementById('notice-title').value.trim();
    const message = document.getElementById('notice-message').value.trim();
    const type = document.getElementById('notice-type').value;

    if (!title || !message) { showToast('Lengkapi data!', 'warning'); return; }
    
    e.target.disabled = true;
    try {
      await supabase.from('platform_notices').insert([{ title, message, type }]);
      showToast('Pengumuman dipublikasikan!', 'success');
      closeModal();
      renderAnnouncementsTab(document.getElementById('sub-page-container'));
    } catch (err) { showToast('Gagal: ' + err.message, 'danger'); e.target.disabled = false; }
  };
}

// ==========================================
// EDIT SHOP MODAL
// ==========================================
function handleEditShop(shop) {
  if (!shop) return;
  const body = `
    <div class="form-group mb-md">
      <label>NAMA BARBERSHOP</label>
      <input type="text" id="edit-shop-name" class="form-control" value="${shop.name}">
    </div>
    <div class="form-group mb-md">
      <label>NO. HP / WHATSAPP</label>
      <input type="text" id="edit-shop-phone" class="form-control" value="${shop.phone || ''}">
    </div>
    <div class="form-group mb-md">
      <label>STATUS TENANT</label>
      <select id="edit-shop-status" class="form-control">
        <option value="active" ${shop.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="trial" ${shop.status === 'trial' ? 'selected' : ''}>Trial</option>
        <option value="expired" ${shop.status === 'expired' ? 'selected' : ''}>Expired</option>
        <option value="deactivated" ${shop.status === 'deactivated' ? 'selected' : ''}>Deactivated</option>
      </select>
    </div>
     <div class="form-group mb-md">
      <label>PAKET BERLANGGANAN</label>
      <select id="edit-shop-plan" class="form-control">
        <option value="" ${!shop.plan_id ? 'selected' : ''}>Basic Tier (Free)</option>
        <option value="pro_unlimited" ${shop.plan_id === 'pro_unlimited' ? 'selected' : ''}>Pro Unlimited (Paid)</option>
      </select>
    </div>
  `;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                  <button id="update-shop-btn" class="btn btn-success">Simpan Perubahan</button>`;
  
  openModal(`Edit Tenant: ${shop.name}`, body, footer, { maxWidth: '450px' });

  document.getElementById('update-shop-btn').onclick = async (e) => {
    e.target.disabled = true;
    const name = document.getElementById('edit-shop-name').value.trim();
    const phone = document.getElementById('edit-shop-phone').value.trim();
    const status = document.getElementById('edit-shop-status').value;
    const plan_id = document.getElementById('edit-shop-plan').value || null;

    try {
      await supabase.from('shops').update({ name, phone, status, plan_id }).eq('id', shop.id);
      showToast('Data tenant berhasil diperbarui!', 'success');
      closeModal();
      loadTenants(document.getElementById('sub-page-container'));
    } catch (err) { showToast('Gagal: ' + err.message, 'danger'); e.target.disabled = false; }
  };
}

// ==========================================
// REGISTRATION & DELETE HANDLERS (Preserved)
// ==========================================
function slugify(text) { return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(); }

function renderAddShopModal() {
  const body = `
    <div id="registration-wizard">
      <div id="reg-step-1">
        <h3 style="font-size: 14px; color: var(--accent); margin-bottom: 16px;">LANGKAH 1: INFORMASI TOKO</h3>
        <div class="form-group mb-md"><label>NAMA BARBERSHOP</label><input type="text" id="new-shop-name" class="form-control" placeholder="Contoh: Garuda Barbershop"></div>
        <div class="form-group mb-sm"><label>SHOP SLUG (ID Unik URL)</label><input type="text" id="new-shop-slug" class="form-control" placeholder="garuda-barber"></div>
        <p style="font-size: 10px; color: var(--text-muted); margin-bottom: 20px;">* Slug digunakan sebagai sub-domain portal booking Anda.</p>
        <button class="btn btn-primary btn-block" id="reg-next-1">Lanjut ke Akun Owner <i class="fas fa-arrow-right"></i></button>
      </div>
      <div id="reg-step-2" style="display: none;">
        <button class="btn btn-ghost btn-sm" id="reg-back-2" style="margin-bottom: 10px;"><i class="fas fa-arrow-left"></i> Kembali</button>
        <h3 style="font-size: 14px; color: var(--accent); margin-bottom: 16px;">LANGKAH 2: AKUN OWNER/ADMIN</h3>
        <div class="form-group mb-md"><label>NAMA LENGKAP OWNER</label><input type="text" id="new-owner-name" class="form-control" placeholder="Wahyu Pratama"></div>
        <div class="form-group mb-md"><label>USERNAME LOGIN</label><input type="text" id="new-admin-user" class="form-control" placeholder="admin_garuda"></div>
        <div class="form-group mb-md"><label>PASSWORD</label><input type="password" id="new-admin-pass" class="form-control" placeholder="Min 6 karakter"></div>
        <button id="confirm-add-shop" class="btn btn-success btn-block" style="margin-top: 10px;">Daftarkan Toko & Aktifkan SaaS</button>
      </div>
    </div>
  `;
  openModal('Pendaftaran Tenant Baru', body, '', { maxWidth: '450px' });

  const nameInput = document.getElementById('new-shop-name');
  const slugInput = document.getElementById('new-shop-slug');
  const step1 = document.getElementById('reg-step-1');
  const step2 = document.getElementById('reg-step-2');

  nameInput.oninput = () => { slugInput.value = slugify(nameInput.value); };
  document.getElementById('reg-next-1').onclick = () => {
    if (!nameInput.value.trim() || !slugInput.value.trim()) { showToast('Lengkapi info toko!', 'warning'); return; }
    step1.style.display = 'none'; step2.style.display = 'block';
  };
  document.getElementById('reg-back-2').onclick = () => { step1.style.display = 'block'; step2.style.display = 'none'; };

  document.getElementById('confirm-add-shop').onclick = async (e) => {
    e.target.disabled = true;
    const shopName = nameInput.value.trim();
    const shopSlug = slugInput.value.trim();
    const ownerName = document.getElementById('new-owner-name').value.trim();
    const username = document.getElementById('new-admin-user').value.trim().toLowerCase();
    const password = document.getElementById('new-admin-pass').value;

    try {
      const email = `${username}.${shopSlug}@barberpro.local`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) throw authErr;

      const { data: newShop, error: shopErr } = await supabase.from('shops').insert([{ slug: shopSlug, name: shopName, owner_id: authData.user.id }]).select().single();
      if (shopErr) throw shopErr;

      await supabase.from('profiles').upsert({ id: authData.user.id, full_name: ownerName, username, role: 'admin', shop_id: newShop.id });
      await supabase.from('settings').insert([{ shop_id: newShop.id, shop_name: shopName }]);

      showToast('SaaS Diaktifkan untuk ' + shopName, 'success');
      closeModal();
      loadTenants(document.getElementById('sub-page-container'));
    } catch (err) { showToast(err.message, 'danger'); e.target.disabled = false; }
  };
}

function renderAdminProvisioning(shopId, shopName, shopSlug) {
  const body = `
    <div style="padding: 10px 0;">
      <p style="margin-bottom: 20px; font-size: 14px; color: var(--text-muted);">Akun admin tambahan untuk <strong>${shopName}</strong>.</p>
      <div class="form-group mb-md"><label>NAMA LENGKAP</label><input type="text" id="prov-full-name" class="form-control"></div>
      <div class="form-group mb-md"><label>USERNAME LOGIN</label><input type="text" id="prov-admin-user" class="form-control"><small style="color: #999; font-size: 10px;">Slug: ${shopSlug}</small></div>
      <div class="form-group mb-md"><label>PASSWORD</label><input type="password" id="prov-admin-pass" class="form-control"></div>
    </div>
  `;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                  <button id="provision-confirm-btn" class="btn btn-primary">Aktifkan Akun</button>`;
  
  openModal(`Provision: ${shopName}`, body, footer, { maxWidth: '400px' });

  document.getElementById('provision-confirm-btn').onclick = async (e) => {
    e.target.disabled = true;
    const fullName = document.getElementById('prov-full-name').value.trim();
    const username = document.getElementById('prov-admin-user').value.trim().toLowerCase();
    const password = document.getElementById('prov-admin-pass').value;
    try {
      const email = `${username}.${shopSlug}@barberpro.local`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) throw authErr;
      await supabase.from('profiles').upsert({ id: authData.user.id, full_name: fullName, username, role: 'admin', shop_id: shopId });
      showToast('Akun Admin Berhasil Ditambahkan.', 'success');
      closeModal();
    } catch (err) { showToast(err.message, 'danger'); e.target.disabled = false; }
  };
}

async function handleDeleteShop(shop) {
  if (!shop) return;
  const shopName = shop.name;
  const body = `<p style="color: var(--danger); font-weight: 700;">HAPUS PERMANEN ${shopName}?</p><input type="text" id="confirm-shop-name" class="form-control" placeholder="Ketik nama toko untuk konfirmasi">`;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button><button id="final-delete-btn" class="btn btn-danger" disabled>Hapus Sekarang</button>`;
  openModal('Delete Tenant Hub', body, footer, { maxWidth: '400px' });
  document.getElementById('confirm-shop-name').oninput = (e) => { document.getElementById('final-delete-btn').disabled = e.target.value !== shopName; };
  document.getElementById('final-delete-btn').onclick = async () => {
    const tables = ['settings', 'barbers', 'services', 'appointments', 'customers', 'attendance', 'subscriptions', 'profiles'];
    for (const t of tables) await supabase.from(t).delete().eq('shop_id', shop.id);
    await supabase.from('shops').delete().eq('id', shop.id);
    showToast('Registry Tenant Dihapus.', 'success'); closeModal(); loadTenants(document.getElementById('sub-page-container'));
  };
}
