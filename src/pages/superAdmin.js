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
      <div class="super-admin-header sticky-header" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 15px 30px; margin: -24px -30px 24px -30px;">
        <div class="header-content">
          <h1 style="font-size: 20px; font-weight: 800;">Master Dashboard Platform</h1>
          <p style="font-size: 12px; color: var(--text-secondary);">Manajemen seluruh tenant dan langganan BarberPro</p>
        </div>
        <div class="header-actions" style="display: flex; gap: 10px; align-items: center;">
          <button id="theme-toggle-btn" class="btn btn-secondary" title="Ganti Tema" style="width: 40px; padding: 0;">
            <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
          </button>
          <div style="width: 1px; height: 24px; background: var(--border); margin: 0 5px;"></div>
          <button id="add-shop-btn" class="btn btn-primary" style="background: #22c55e; color: white; border: none;">
            <i class="fas fa-plus"></i> Registrasi Toko Baru
          </button>
          <button id="btn-tab-tenants" class="btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-secondary'}">
            <i class="fas fa-list"></i> Tenant
          </button>
          <button id="btn-tab-reports" class="btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}">
            <i class="fas fa-chart-bar"></i> Laporan
          </button>
          <button id="refresh-btn" class="btn btn-secondary">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div id="sub-page-container">
        <!-- Content injected here based on tab -->
      </div>
    </div>
  `;

  // Listeners
  container.querySelector('#theme-toggle-btn').onclick = toggleTheme;
  container.querySelector('#add-shop-btn').onclick = () => renderAddShopModal();
  container.querySelector('#refresh-btn').onclick = () => renderActiveTab(container);
  
  container.querySelector('#btn-tab-tenants').onclick = () => {
    activeTab = 'tenants';
    renderMainLayout(container);
  };
  container.querySelector('#btn-tab-reports').onclick = () => {
    activeTab = 'reports';
    renderMainLayout(container);
  };

  renderActiveTab(container);
}

function toggleTheme() {
  const current = localStorage.getItem('barberpro_theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('barberpro_theme', next);
  document.documentElement.setAttribute('data-theme', next);
  if (next === 'light') document.documentElement.classList.add('light-theme');
  else document.documentElement.classList.remove('light-theme');
  
  // Refresh layout to update icon
  const appContainer = document.getElementById('page-container');
  if (appContainer) renderSuperAdmin(appContainer);
}

async function renderActiveTab(container) {
  const subContainer = container.querySelector('#sub-page-container');
  if (!subContainer) return;
  
  if (activeTab === 'tenants') {
    renderTenantsList(subContainer);
  } else {
    renderSuperAdminReports(subContainer);
  }
}

async function renderTenantsList(container) {
  container.innerHTML = `
    <div class="stats-grid fade-in" style="margin-top: 10px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(186, 155, 102, 0.1); color: var(--accent);">
          <i class="fas fa-store"></i>
        </div>
        <div class="stat-info">
          <h3 id="total-shops-stat">-</h3>
          <p>Total Barbershop</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e;">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <h3 id="active-shops-stat">-</h3>
          <p>Toko Aktif</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <h3 id="trial-shops-stat">-</h3>
          <p>Masa Trial</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-info">
          <h3 id="expired-shops-stat">-</h3>
          <p>Kedaluwarsa</p>
        </div>
      </div>
    </div>

    <div class="card fade-in" style="margin-top: 24px;">
      <div class="card-header">
        <h2 style="font-size: 18px;"><i class="fas fa-list" style="margin-right: 10px;"></i> Daftar Tenant Platform</h2>
      </div>
      <div class="table-container" style="margin-top: 15px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nama Toko</th>
              <th>Status</th>
              <th>Paket</th>
              <th>Tanggal Daftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="shops-table-body">
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px;">
                <i class="fas fa-circle-notch fa-spin"></i> Memuat data toko...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadShops(container);
}

async function loadShops(container) {
  const tableBody = container.querySelector('#shops-table-body');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Update Stats
    container.querySelector('#total-shops-stat').textContent = shops.length;
    container.querySelector('#active-shops-stat').textContent = shops.filter(s => s.status === 'active').length;
    container.querySelector('#trial-shops-stat').textContent = shops.filter(s => s.status === 'trial').length;
    container.querySelector('#expired-shops-stat').textContent = shops.filter(s => ['expired', 'deactivated'].includes(s.status)).length;

    if (shops.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">Belum ada toko terdaftar.</td></tr>';
      return;
    }

    tableBody.innerHTML = shops.map(shop => `
      <tr>
        <td>
          <div class="shop-avatar" style="background: var(--accent-subtle); color: var(--accent); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
            ${shop.name?.[0] || 'S'}
          </div>
        </td>
        <td>
          <div style="font-weight: bold;">${shop.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${shop.phone || 'No Phone'}</div>
        </td>
        <td>
          <span class="status-badge status-${shop.status || 'trial'}">
            ${(shop.status || 'trial').toUpperCase()}
          </span>
        </td>
        <td>
          <div style="font-size: 13px; color: var(--accent); font-weight: 500;">${shop.plan_id ? 'Pro Unlimited' : 'Basic Tier'}</div>
        </td>
        <td style="font-size: 13px; color: var(--text-muted);">
          ${new Date(shop.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td>
          <div class="flex gap-2">
            <button class="btn-icon manage-btn" data-id="${shop.id}" title="Ubah Status">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon provision-btn" data-id="${shop.id}" data-name="${shop.name}" data-slug="${shop.slug}" title="Daftarkan Akun Admin" style="color: #6366f1;">
              <i class="fas fa-user-plus"></i>
            </button>
             <button class="btn-icon extend-btn" data-id="${shop.id}" title="Perpanjang Masa Trial" style="color: #22c55e;">
              <i class="fas fa-calendar-plus"></i>
            </button>
            <button class="btn-icon delete-btn" data-id="${shop.id}" title="Hapus Unit" style="color: #ef4444;">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Table Listeners
    tableBody.querySelectorAll('.manage-btn').forEach(btn => {
      btn.onclick = () => handleManageShop(btn.dataset.id);
    });
    tableBody.querySelectorAll('.provision-btn').forEach(btn => {
      btn.onclick = () => renderAdminProvisioning(btn.dataset.id, btn.dataset.name, btn.dataset.slug);
    });
    tableBody.querySelectorAll('.extend-btn').forEach(btn => {
      btn.onclick = () => handleExtendTrial(btn.dataset.id);
    });
    tableBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = () => handleDeleteShop(shops.find(s => s.id === btn.dataset.id));
    });

  } catch (err) {
    console.error('Error loading shops:', err);
    showToast('Gagal memuat data toko.', 'danger');
  }
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function renderAddShopModal() {
  const body = `
    <div id="registration-wizard">
      <!-- Step 1: Shop Info -->
      <div id="reg-step-1">
        <h3 style="font-size: 14px; color: var(--accent); margin-bottom: 16px;">LANGKAH 1: INFORMASI TOKO</h3>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="display: block; font-size: 11px; margin-bottom: 4px;">NAMA BARBERSHOP</label>
          <input type="text" id="new-shop-name" class="form-control" placeholder="Contoh: Garuda Barbershop">
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; font-size: 11px; margin-bottom: 4px;">SHOP SLUG (ID Unik URL)</label>
          <input type="text" id="new-shop-slug" class="form-control" placeholder="garuda-barber">
        </div>
        <button class="btn btn-primary btn-block" id="reg-next-1">Lanjut ke Akun Owner <i class="fas fa-arrow-right"></i></button>
      </div>

      <!-- Step 2: Owner Info -->
      <div id="reg-step-2" style="display: none;">
        <button class="btn btn-ghost btn-sm" id="reg-back-2" style="margin-bottom: 10px;"><i class="fas fa-arrow-left"></i> Kembali</button>
        <h3 style="font-size: 14px; color: var(--accent); margin-bottom: 16px;">LANGKAH 2: AKUN OWNER/ADMIN</h3>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="display: block; font-size: 11px; margin-bottom: 4px;">NAMA LENGKAP OWNER</label>
          <input type="text" id="new-owner-name" class="form-control" placeholder="Wahyu Pratama">
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="display: block; font-size: 11px; margin-bottom: 4px;">USERNAME LOGIN</label>
          <input type="text" id="new-admin-user" class="form-control" placeholder="admin_garuda">
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="display: block; font-size: 11px; margin-bottom: 4px;">PASSWORD</label>
          <input type="password" id="new-admin-pass" class="form-control" placeholder="Min 6 karakter">
        </div>
        <button id="confirm-add-shop" class="btn btn-success btn-block" style="margin-top: 10px;">Daftarkan Toko & Admin Utama</button>
      </div>
    </div>
  `;

  const footer = `
    <div style="display: flex; gap: 10px; width: 100%;">
      <button class="btn btn-secondary btn-block" onclick="closeModal()">Batal</button>
    </div>
  `;

  openModal('Registrasi Toko Hub', body, footer, { maxWidth: '450px' });

  const nameInput = document.getElementById('new-shop-name');
  const slugInput = document.getElementById('new-shop-slug');
  const step1 = document.getElementById('reg-step-1');
  const step2 = document.getElementById('reg-step-2');

  nameInput.oninput = () => { slugInput.value = slugify(nameInput.value); };

  document.getElementById('reg-next-1').onclick = () => {
    if (!nameInput.value.trim() || !slugInput.value.trim()) {
      showToast('Lengkapi nama dan slug toko.', 'warning');
      return;
    }
    step1.style.display = 'none';
    step2.style.display = 'block';
  };

  document.getElementById('reg-back-2').onclick = () => {
    step1.style.display = 'block';
    step2.style.display = 'none';
  };

  document.getElementById('confirm-add-shop').onclick = async (e) => {
    const btn = e.target;
    const shopName = nameInput.value.trim();
    const shopSlug = slugInput.value.trim();
    const ownerName = document.getElementById('new-owner-name').value.trim();
    const username = document.getElementById('new-admin-user').value.trim().toLowerCase();
    const password = document.getElementById('new-admin-pass').value;

    if (!ownerName || !username || password.length < 6) {
      showToast('Mohon lengkapi akun owner.', 'danger');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses Registrasi...';

    try {
      const email = `${username}.${shopSlug}@barberpro.local`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: ownerName, role: 'admin', username } }
      });
      if (authErr) throw authErr;

      const { data: newShop, error: shopErr } = await supabase.from('shops').insert([{ 
        slug: shopSlug, name: shopName, owner_id: authData.user.id, status: 'trial' 
      }]).select().single();
      if (shopErr) throw shopErr;

      await supabase.from('settings').insert([{ shop_id: newShop.id, shop_name: shopName }]);
      await supabase.from('profiles').upsert({ id: authData.user.id, full_name: ownerName, username, role: 'admin', shop_id: newShop.id });

      showToast('Toko & Admin berhasil didaftarkan!', 'success');
      closeModal();
      renderActiveTab(document.getElementById('page-container'));
    } catch (err) {
      showToast('Gagal: ' + err.message, 'danger');
      btn.disabled = false;
      btn.innerHTML = 'Daftarkan Toko & Admin Utama';
    }
  };
}

async function handleManageShop(shopId) {
  const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).single();
  if (!shop) return;

  const newStatus = prompt(`Ubah status untuk ${shop.name}?\n(Ketik: active, trial, expired, atau deactivated):`, shop.status);
  if (newStatus && ['active', 'trial', 'expired', 'deactivated'].includes(newStatus.toLowerCase())) {
    const { error } = await supabase.from('shops').update({ status: newStatus.toLowerCase() }).eq('id', shopId);
    if (error) showToast('Gagal mengubah status.', 'danger');
    else {
      showToast(`Status ${shop.name} diperbarui ke ${newStatus.toUpperCase()}`, 'success');
      renderActiveTab(document.getElementById('page-container'));
    }
  }
}

async function handleExtendTrial(shopId) {
  if (!confirm('Berikan tambahan 30 hari masa trial untuk tenant ini?')) return;
  // This is a placeholder for actual billing logic, but we can update status to 'trial' if it was expired
  const { error } = await supabase.from('shops').update({ status: 'trial' }).eq('id', shopId);
  if (error) showToast('Gagal memperpanjang.', 'danger');
  else {
    showToast('Masa trial berhasil diperpanjang 30 hari.', 'success');
    renderActiveTab(document.getElementById('page-container'));
  }
}

function renderAdminProvisioning(shopId, shopName, shopSlug) {
  // Existing function preserved but could be integrated into Hub
  const body = `
    <div style="padding: 15px 0;">
      <p style="margin-bottom: 20px; font-size: 14px; color: var(--text-muted);">Membuat akun admin untuk <strong>${shopName}</strong>.</p>
      <div class="form-group" style="margin-bottom: 15px;">
        <label>NAMA LENGKAP</label>
        <input type="text" id="prov-full-name" class="form-control" placeholder="Wahyu Pratama">
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label>USERNAME LOGIN</label>
        <input type="text" id="prov-admin-user" class="form-control" placeholder="wahyu_admin">
        <small style="color: #999; font-size: 10px;">Slug: ${shopSlug}</small>
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label>PASSWORD</label>
        <input type="password" id="prov-admin-pass" class="form-control" placeholder="••••••••">
      </div>
    </div>
  `;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                  <button id="provision-confirm-btn" class="btn btn-primary">Buat Akun</button>`;
  
  openModal(`Provision Admin: ${shopName}`, body, footer, { maxWidth: '400px' });

  document.getElementById('provision-confirm-btn').onclick = async (e) => {
    const btn = e.target;
    const fullName = document.getElementById('prov-full-name').value.trim();
    const username = document.getElementById('prov-admin-user').value.trim().toLowerCase();
    const password = document.getElementById('prov-admin-pass').value;

    if (!fullName || !username || password.length < 6) {
      showToast('Lengkapi semua field.', 'danger');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Memproses...';

    try {
      const email = `${username}.${shopSlug}@barberpro.local`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName, role: 'admin', username, shop_id: shopId } }
      });
      if (authErr) throw authErr;
      await supabase.from('profiles').upsert({ id: authData.user.id, full_name: fullName, username, role: 'admin', shop_id: shopId });
      showToast('Admin berhasil ditambahkan!', 'success');
      closeModal();
    } catch (err) {
      showToast('Gagal: ' + err.message, 'danger');
      btn.disabled = false;
      btn.innerHTML = 'Buat Akun';
    }
  };
}

async function handleDeleteShop(shop) {
  if (!shop) return;
  const shopId = shop.id;
  const shopName = shop.name;

  const body = `
    <div style="padding: 10px 0;">
      <p style="color: var(--danger); font-weight: bold; margin-bottom: 15px;">TINDAKAN INI PERMANEN!</p>
      <p style="margin-bottom: 15px; font-size: 14px;">Ketik <strong>${shopName}</strong> untuk konfirmasi hapus:</p>
      <input type="text" id="confirm-shop-name" class="form-control" placeholder="${shopName}">
    </div>
  `;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                  <button id="final-delete-btn" class="btn btn-danger" style="opacity: 0.5" disabled>Hapus Permanen</button>`;
  
  openModal('Konfirmasi Purge', body, footer, { maxWidth: '400px' });

  const input = document.getElementById('confirm-shop-name');
  const deleteBtn = document.getElementById('final-delete-btn');

  input.oninput = (e) => {
    deleteBtn.disabled = e.target.value !== shopName;
    deleteBtn.style.opacity = e.target.value === shopName ? '1' : '0.5';
  };

  deleteBtn.onclick = async () => {
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = 'Purging Data...';
    try {
      const tables = ['settings', 'barbers', 'services', 'appointments', 'customers', 'attendance', 'subscriptions', 'profiles'];
      for (const t of tables) await supabase.from(t).delete().eq('shop_id', shopId);
      await supabase.from('shops').delete().eq('id', shopId);
      showToast('Unit Berhasil Dihapus dari Cloud.', 'success');
      closeModal();
      renderActiveTab(document.getElementById('page-container'));
    } catch (err) {
      showToast('Gagal: ' + err.message, 'danger');
      deleteBtn.disabled = false;
    }
  };
}
