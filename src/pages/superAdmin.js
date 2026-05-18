import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { renderSuperAdminReports } from './reports_super.js';

window.closeModal = closeModal;

let activeTab = 'tenants';

export async function renderSuperAdmin(container) {
  const currentTheme = localStorage.getItem('barberpro_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  if (currentTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
  }
  renderMainLayout(container);
}

function renderMainLayout(container) {
  const currentTheme = localStorage.getItem('barberpro_theme') || 'dark';

  container.innerHTML = `
    <div class="super-admin-layout fade-in" style="max-width: 1400px; margin: 0 auto; padding: 0 40px; min-height: 100vh;">

      <!-- Mobile top bar (hanya tampil di mobile) -->
      <div class="mobile-top-bar" style="display:none; padding: 14px 16px 0; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 16px; font-weight: 900; color: var(--accent); letter-spacing: -0.5px;">MASTER PLATFORM</div>
          <div style="font-size: 11px; color: var(--text-muted);">Manajemen tenant & sistem global</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="theme-toggle-btn-mobile" class="btn btn-secondary btn-sm" title="Ganti Tema" style="border-radius: 10px; height: 36px; padding: 0 10px; font-size: 11px; font-weight: 800; background: var(--bg-input);">
            <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}" style="color: var(--accent);"></i>
          </button>
          <button id="add-superadmin-btn-mobile" class="btn btn-secondary btn-sm" style="border-radius: 10px; height: 36px; padding: 0 10px; font-size: 11px; font-weight: 800; background: var(--bg-input);">
            <i class="fas fa-user-shield" style="color: var(--accent);"></i>
          </button>
          <button id="add-shop-btn-mobile" class="btn btn-primary btn-sm" style="border-radius: 10px; height: 36px; padding: 0 14px; font-size: 12px; font-weight: 800;">
            <i class="fas fa-plus"></i> Baru
          </button>
        </div>
      </div>

      <div class="super-admin-header sticky-header" style="background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 16px 30px; margin: 0 -40px 24px -40px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); z-index: 100; border-radius: 0 0 16px 16px;">
        <div class="header-content" style="padding-left: 10px;">
          <h1 style="font-size: 19px; font-weight: 800; margin: 0; color: var(--accent); letter-spacing: -0.5px; text-transform: uppercase;">Master Platform</h1>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 500; opacity: 0.8;">Manajemen operasional tenant & sistem global</p>
        </div>
        <div class="header-actions" style="display: flex; gap: 12px; align-items: center;">
           <button id="theme-toggle-btn" class="btn btn-secondary btn-sm" title="Ganti Tema" style="width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--bg-input);">
            <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
          </button>
          
          <div style="width: 1px; height: 24px; background: var(--border); margin: 0 4px;" class="hide-mobile"></div>
          
          <div class="btn-group" style="display: flex; background: var(--bg-sidebar); padding: 5px; border-radius: 14px; border: 1px solid var(--border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
            <button id="btn-tab-tenants" class="btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-ghost'} btn-sm" style="border-radius: 10px; font-size: 12px; padding: 7px 16px; font-weight: 700;">
              <i class="fas fa-store"></i> <span class="hide-mobile">Tenant</span>
            </button>
            <button id="btn-tab-reports" class="btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-ghost'} btn-sm" style="border-radius: 10px; font-size: 12px; padding: 7px 16px; font-weight: 700;">
              <i class="fas fa-chart-pie"></i> <span class="hide-mobile">Laporan</span>
            </button>
            <button id="btn-tab-broadcast" class="btn ${activeTab === 'broadcast' ? 'btn-primary' : 'btn-ghost'} btn-sm" style="border-radius: 10px; font-size: 12px; padding: 7px 16px; font-weight: 700;">
              <i class="fas fa-bullhorn"></i> <span class="hide-mobile">Pengumuman</span>
            </button>
          </div>

          <div style="width: 1px; height: 24px; background: var(--border); margin: 0 4px;" class="hide-mobile"></div>

          <button id="add-superadmin-btn" class="btn btn-secondary btn-sm" style="border-radius: 12px; font-weight: 800; padding: 0 18px; height: 40px; border-color: rgba(var(--accent-rgb), 0.15); display: flex; align-items: center; justify-content: center; gap: 6px; background: var(--bg-input);">
            <i class="fas fa-user-shield" style="color: var(--accent);"></i> <span class="hide-mobile">Tambah Superadmin</span>
          </button>

          <button id="add-shop-btn" class="btn btn-primary btn-sm" style="border-radius: 12px; font-weight: 800; padding: 0 18px; height: 40px; box-shadow: 0 4px 12px rgba(var(--accent-rgb), 0.2);">
            <i class="fas fa-plus-circle"></i> <span class="hide-mobile">Registrasi Baru</span>
          </button>
          
          <button id="master-logout-btn" class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.15); width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--bg-input);">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <div id="sub-page-container" style="padding-bottom: 40px;">
        <!-- Content injected here -->
      </div>

      <!-- Mobile Bottom Navigation -->
      <nav class="sa-bottom-nav">
        <button class="sa-nav-item ${activeTab === 'tenants' ? 'active' : ''}" id="mob-tab-tenants">
          <i class="fas fa-store"></i>
          <span>Tenant</span>
        </button>
        <button class="sa-nav-item ${activeTab === 'reports' ? 'active' : ''}" id="mob-tab-reports">
          <i class="fas fa-chart-pie"></i>
          <span>Laporan</span>
        </button>
        <button class="sa-nav-item ${activeTab === 'broadcast' ? 'active' : ''}" id="mob-tab-broadcast">
          <i class="fas fa-bullhorn"></i>
          <span>Umumkan</span>
        </button>
        <button class="sa-nav-item" id="mob-add-btn">
          <i class="fas fa-plus-circle" style="color: var(--accent);"></i>
          <span style="color: var(--accent);">Daftar</span>
        </button>
        <button class="sa-nav-item danger" id="mob-logout-btn">
          <i class="fas fa-sign-out-alt"></i>
          <span>Keluar</span>
        </button>
      </nav>
    </div>
  `;

  // Global Listeners
  container.querySelector('#theme-toggle-btn').onclick = toggleTheme;
  const mobileThemeBtn = container.querySelector('#theme-toggle-btn-mobile');
  if (mobileThemeBtn) mobileThemeBtn.onclick = toggleTheme;
  container.querySelector('#add-superadmin-btn').onclick = () => renderAddSuperAdminModal();
  const mobileAddSuperBtn = container.querySelector('#add-superadmin-btn-mobile');
  if (mobileAddSuperBtn) mobileAddSuperBtn.onclick = () => renderAddSuperAdminModal();
  container.querySelector('#add-shop-btn').onclick = () => renderAddShopModal();
  const mobileAddBtn = container.querySelector('#add-shop-btn-mobile');
  if (mobileAddBtn) mobileAddBtn.onclick = () => renderAddShopModal();
  container.querySelector('#btn-tab-tenants').onclick = () => { activeTab = 'tenants'; renderMainLayout(container); };
  container.querySelector('#btn-tab-reports').onclick = () => { activeTab = 'reports'; renderMainLayout(container); };
  container.querySelector('#btn-tab-broadcast').onclick = () => { activeTab = 'broadcast'; renderMainLayout(container); };

  // Mobile bottom nav
  container.querySelector('#mob-tab-tenants')?.addEventListener('click', () => { activeTab = 'tenants'; renderMainLayout(container); });
  container.querySelector('#mob-tab-reports')?.addEventListener('click', () => { activeTab = 'reports'; renderMainLayout(container); });
  container.querySelector('#mob-tab-broadcast')?.addEventListener('click', () => { activeTab = 'broadcast'; renderMainLayout(container); });
  container.querySelector('#mob-add-btn')?.addEventListener('click', () => renderAddShopModal());
  container.querySelector('#mob-logout-btn')?.addEventListener('click', () => {
    document.querySelector('#master-logout-btn')?.click();
  });

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
  // Ambil credentials yang tersimpan
  const savedCreds = JSON.parse(localStorage.getItem('barberpro_shop_credentials') || '[]');

  container.innerHTML = `
    ${savedCreds.length > 0 ? `
    <div class="card fade-in" style="margin-top: 16px; border: 1px solid var(--accent-glow);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="font-size:14px;margin:0;"><i class="fas fa-key" style="color:var(--accent);"></i> Kredensial Toko Terdaftar</h3>
        <button class="btn btn-ghost btn-sm" onclick="localStorage.removeItem('barberpro_shop_credentials');renderSuperAdmin(document.getElementById('page-container'));" style="font-size:11px;color:var(--danger);">
          <i class="fas fa-trash"></i> Hapus Semua
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${savedCreds.map(c => `
          <div style="background:var(--bg-input);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <div style="width:36px;height:36px;border-radius:10px;background:var(--accent-subtle);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;">
              ${c.shopName?.[0]?.toUpperCase() || 'S'}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:13px;">${c.shopName}</div>
              <div style="font-size:11px;color:var(--text-muted);">Slug: ${c.shopSlug} • ${c.createdAt}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <div style="background:var(--bg-card);padding:4px 10px;border-radius:6px;font-size:11px;">
                <span style="color:var(--text-muted);">User: </span>
                <code style="color:var(--accent);font-weight:700;">${c.username}</code>
              </div>
              <div style="background:var(--bg-card);padding:4px 10px;border-radius:6px;font-size:11px;">
                <span style="color:var(--text-muted);">Pass: </span>
                <code style="color:var(--text-primary);font-weight:700;">${c.password}</code>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    <div class="stats-grid fade-in" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 20px;">
       <div class="card stat-card" style="display: flex; align-items: center; gap: 16px; padding: 22px; border-left: 4px solid var(--accent); background: linear-gradient(to right, rgba(var(--accent-rgb), 0.05), transparent);">
        <div class="stat-icon" style="background: var(--accent-subtle); color: var(--accent); width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><i class="fas fa-store"></i></div>
        <div class="stat-info">
          <h3 id="stat-total" style="font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -1px;">-</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 600; text-transform: uppercase; opacity: 0.7;">Total Barbershop</p>
        </div>
      </div>
      <div class="card stat-card" style="display: flex; align-items: center; gap: 16px; padding: 22px; border-left: 4px solid #22c55e; background: linear-gradient(to right, rgba(34, 197, 94, 0.05), transparent);">
        <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e; width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><i class="fas fa-check-circle"></i></div>
        <div class="stat-info">
          <h3 id="stat-active" style="font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -1px;">-</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 600; text-transform: uppercase; opacity: 0.7;">Toko Aktif</p>
        </div>
      </div>
      <div class="card stat-card" style="display: flex; align-items: center; gap: 16px; padding: 22px; border-left: 4px solid #ef4444; background: linear-gradient(to right, rgba(239, 68, 68, 0.05), transparent);">
        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><i class="fas fa-times-circle"></i></div>
        <div class="stat-info">
          <h3 id="stat-expired" style="font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -1px;">-</h3>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 600; text-transform: uppercase; opacity: 0.7;">Kedaluwarsa</p>
        </div>
      </div>
    </div>

    <div class="card fade-in" style="margin-top: 24px;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 16px;"><i class="fas fa-list"></i> Unit Tenant Terdaftar</h2>
        <button id="refresh-tenants" class="btn btn-ghost btn-sm"><i class="fas fa-sync-alt"></i></button>
      </div>

      <!-- Mobile: card list -->
      <div id="tenant-cards-mobile" class="sa-tenant-cards" style="display:none; padding: 12px 0; gap: 10px; flex-direction: column;">
        <div style="text-align:center;padding:30px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i></div>
      </div>

      <!-- Desktop: table -->
      <div class="table-container sa-tenant-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tenant & Info</th>
              <th>Status</th>
              <th>Paket</th>
              <th>Harga Jual</th>
              <th>Masa Aktif</th>
              <th>Daftar Pada</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="tenants-body">
            <tr><td colspan="7" style="text-align:center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
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
    let shops = [];
    try {
      const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      shops = data || [];
    } catch (netErr) {
      console.warn("Supabase fetch shops failed (offline?), using local offline shops:", netErr);
      shops = JSON.parse(localStorage.getItem('barberpro_shops') || '[]');
      shops = shops.map(s => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        phone: s.phone,
        status: s.status || 'active',
        plan_id: s.plan_id,
        sale_price: s.sale_price || s.salePrice || 0,
        expires_at: s.expires_at || s.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: s.created_at || s.createdAt || new Date().toISOString()
      }));
    }
    
    container.querySelector('#stat-total').textContent = shops.length;
    container.querySelector('#stat-active').textContent = shops.filter(s => s.status === 'active').length;
    container.querySelector('#stat-expired').textContent = shops.filter(s => s.status === 'expired').length;

    const tbody = container.querySelector('#tenants-body');
    if (shops.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Belum ada tenant terdaftar.</td></tr>';
      // Mobile cards juga kosong
      const mobileCards = container.querySelector('#tenant-cards-mobile');
      if (mobileCards) mobileCards.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">Belum ada tenant.</div>';
      return;
    }

    // Desktop table
    tbody.innerHTML = shops.map(shop => {
      const expiryDate = shop.expires_at ? new Date(shop.expires_at) : null;
      const isLifetime = expiryDate && expiryDate.getFullYear() > 2090;
      const daysLeft = expiryDate ? Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      
      let expiryBadge = '';
      if (isLifetime) {
        expiryBadge = '<span style="background: rgba(34,197,94,0.1); color: #22c55e; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">Lifetime</span>';
      } else if (daysLeft > 0) {
        expiryBadge = `<span style="background: rgba(59,130,246,0.1); color: #3b82f6; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">${daysLeft} Hari Lagi</span>`;
      } else {
        expiryBadge = '<span style="background: rgba(239,68,68,0.1); color: #ef4444; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">Habis</span>';
      }

      const expiryText = isLifetime ? 'Lifetime' : expiryDate ? expiryDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

      return `
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
        <td><span class="status-badge status-${shop.status || 'trial'}" style="padding: 4px 10px; border-radius: 10px; font-weight: 700;">${(shop.status || 'trial').toUpperCase()}</span></td>
        <td><div style="font-size: 11px; color: var(--accent); font-weight: 700; background: rgba(var(--accent-rgb), 0.1); padding: 2px 8px; border-radius: 6px; display: inline-block;">${shop.plan_id ? 'PRO UNLIMITED' : 'BASIC TIER'}</div></td>
        <td style="font-size: 12px; font-weight: 700; color: var(--accent);">Rp ${(shop.sale_price || shop.salePrice || 0).toLocaleString('id-ID')}</td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 12px; font-weight: 600;">${expiryText}</span>
            <div style="margin-top: 2px;">${expiryBadge}</div>
          </div>
        </td>
        <td style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${new Date(shop.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td>
          <div class="flex gap-2">
            <button class="btn-icon edit-shop-btn" data-id="${shop.id}" title="Edit Info"><i class="fas fa-edit"></i></button>
            <button class="btn-icon provision-btn" data-id="${shop.id}" data-name="${shop.name}" data-slug="${shop.slug}" title="Provision User" style="color: #6366f1;"><i class="fas fa-user-shield"></i></button>
            <button class="btn-icon wa-followup-btn" data-id="${shop.id}" data-phone="${shop.phone || ''}" data-name="${shop.name}" data-status="${shop.status || 'trial'}" title="WhatsApp Follow-up" style="color: #22c55e;"><i class="fab fa-whatsapp"></i></button>
            <button class="btn-icon delete-btn" data-id="${shop.id}" title="Hapus Permanen" style="color: #ef4444;"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    const triggerWaFollowup = (btn) => {
      const name = btn.dataset.name;
      const phone = btn.dataset.phone || '';
      const status = btn.dataset.status || 'trial';
      
      let msg = '';
      if (status === 'trial') {
        msg = `Halo Kak ${name}! 😊 Kami dari tim *BarberPro*. Kami harap Kakak menyukai fitur kasir & booking online kami. Masa trial toko Kakak akan segera berakhir. Ingin upgrade ke paket *Pro Unlimited* untuk terus meningkatkan omset barbershop? Hubungi kami ya! 🚀`;
      } else if (status === 'expired' || status === 'deactivated') {
        msg = `Halo Kak ${name}! 🙏 Layanan sewa aplikasi *BarberPro* untuk barbershop Kakak telah kedaluwarsa. Agar seluruh fitur booking online & kasir dapat kembali dibuka, silakan hubungi kami untuk perpanjangan lisensi. Terima kasih! 💈`;
      } else {
        msg = `Halo Kak ${name}! 😊 Ada yang bisa tim *BarberPro* bantu terkait operasional barbershop Kakak hari ini? Selamat bekerja dan sukses selalu! ✂️`;
      }
      
      const cleanPhone = phone.replace(/\D/g, '') || '6281234567890';
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    tbody.querySelectorAll('.edit-shop-btn').forEach(btn => btn.onclick = () => handleEditShop(shops.find(s => s.id === btn.dataset.id)));
    tbody.querySelectorAll('.provision-btn').forEach(btn => btn.onclick = () => renderAdminProvisioning(btn.dataset.id, btn.dataset.name, btn.dataset.slug));
    tbody.querySelectorAll('.wa-followup-btn').forEach(btn => btn.onclick = () => triggerWaFollowup(btn));
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => handleDeleteShop(shops.find(s => s.id === btn.dataset.id)));

    // Mobile cards
    const mobileCards = container.querySelector('#tenant-cards-mobile');
    if (mobileCards) {
      const statusColor = { active: '#22c55e', trial: '#f59e0b', expired: '#ef4444', deactivated: '#6b7280' };
      mobileCards.innerHTML = shops.map(shop => {
        const expiryDate = shop.expires_at ? new Date(shop.expires_at) : null;
        const isLifetime = expiryDate && expiryDate.getFullYear() > 2090;
        const daysLeft = expiryDate ? Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
        const expiryText = isLifetime ? 'Lifetime' : expiryDate ? expiryDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-';
        const daysLabel = isLifetime ? 'Lifetime' : daysLeft > 0 ? `${daysLeft} Hari` : 'Habis';

        return `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: var(--accent-subtle); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; flex-shrink: 0;">
              ${shop.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${shop.name}</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">/${shop.slug} • Aktif: <strong style="color:var(--accent);">${expiryText} (${daysLabel})</strong></div>
            </div>
            <span style="font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: ${statusColor[shop.status || 'trial']}20; color: ${statusColor[shop.status || 'trial']}; flex-shrink: 0;">
              ${(shop.status || 'TRIAL').toUpperCase()}
            </span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border);">
            <div style="font-size: 10px; color: var(--text-muted);">
              <i class="fas fa-calendar" style="color: var(--accent);"></i>
              ${new Date(shop.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              <span style="margin-left: 8px; background: var(--accent-subtle); color: var(--accent); padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                ${shop.plan_id ? 'PRO' : 'BASIC'}
              </span>
              <span style="margin-left: 8px; background: rgba(34,197,94,0.1); color: #22c55e; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                Rp ${(shop.sale_price || shop.salePrice || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm mob-edit-btn" data-id="${shop.id}" style="height: 32px; padding: 0 10px; border-radius: 8px; font-size: 12px;">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-ghost btn-sm mob-prov-btn" data-id="${shop.id}" data-name="${shop.name}" data-slug="${shop.slug}" style="height: 32px; padding: 0 10px; border-radius: 8px; font-size: 12px; color: #6366f1;">
                <i class="fas fa-user-shield"></i>
              </button>
              <button class="btn btn-ghost btn-sm mob-wa-btn" data-id="${shop.id}" data-phone="${shop.phone || ''}" data-name="${shop.name}" data-status="${shop.status || 'trial'}" style="height: 32px; padding: 0 10px; border-radius: 8px; font-size: 12px; color: #22c55e;">
                <i class="fab fa-whatsapp"></i>
              </button>
              <button class="btn btn-ghost btn-sm mob-del-btn" data-id="${shop.id}" style="height: 32px; padding: 0 10px; border-radius: 8px; font-size: 12px; color: var(--danger);">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      }).join('');

      mobileCards.querySelectorAll('.mob-edit-btn').forEach(btn => btn.onclick = () => handleEditShop(shops.find(s => s.id === btn.dataset.id)));
      mobileCards.querySelectorAll('.mob-prov-btn').forEach(btn => btn.onclick = () => renderAdminProvisioning(btn.dataset.id, btn.dataset.name, btn.dataset.slug));
      mobileCards.querySelectorAll('.mob-wa-btn').forEach(btn => btn.onclick = () => triggerWaFollowup(btn));
      mobileCards.querySelectorAll('.mob-del-btn').forEach(btn => btn.onclick = () => handleDeleteShop(shops.find(s => s.id === btn.dataset.id)));
    }

  } catch (err) { console.error(err); showToast('Gagal memuat tenant.', 'danger'); }
}

// ==========================================
// ANNOUNCEMENTS TAB
// ==========================================
async function renderAnnouncementsTab(container) {
  container.innerHTML = `
    <div class="card fade-in" style="margin-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="font-size: 15px; margin: 0;"><i class="fas fa-bullhorn" style="color:var(--accent);"></i> Pengumuman Global</h2>
        <button id="add-notice-btn" class="btn btn-primary btn-sm" style="height: 36px; padding: 0 14px; font-size: 12px;">
          <i class="fas fa-plus"></i> Tambah
        </button>
      </div>
      <div id="notices-list" style="display: flex; flex-direction: column; gap: 10px;">
        <div style="text-align:center; padding: 30px; color: var(--text-muted);">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    </div>
  `;

  loadNotices(container);
  container.querySelector('#add-notice-btn').onclick = () => renderNoticeModal();
}

async function loadNotices(container) {
  try {
    const { data: notices } = await supabase.from('platform_notices').select('*').order('created_at', { ascending: false });
    const listEl = container.querySelector('#notices-list');

    if (!notices || notices.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 30px; color: var(--text-muted);">
          <i class="fas fa-bullhorn" style="font-size: 28px; opacity: 0.2; display: block; margin-bottom: 8px;"></i>
          Belum ada pengumuman.
        </div>`;
      return;
    }

    const typeColor = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
    const typeIcon  = { info: 'fa-info-circle', success: 'fa-check-circle', warning: 'fa-triangle-exclamation', danger: 'fa-circle-xmark' };

    listEl.innerHTML = notices.map(n => `
      <div style="background: var(--bg-input); border-radius: 12px; padding: 14px; border-left: 3px solid ${typeColor[n.type] || '#3b82f6'};">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <i class="fas ${typeIcon[n.type] || 'fa-info-circle'}" style="color: ${typeColor[n.type] || '#3b82f6'}; font-size: 16px; margin-top: 2px; flex-shrink: 0;"></i>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 13px;">${n.title}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px; line-height: 1.5; word-break: break-word;">${n.message}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
              <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: ${typeColor[n.type]}20; color: ${typeColor[n.type]};">
                ${n.type.toUpperCase()}
              </span>
              <span style="font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 700;
                background: ${n.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)'};
                color: ${n.is_active ? '#22c55e' : '#6b7280'};">
                ${n.is_active ? '● AKTIF' : '○ NONAKTIF'}
              </span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">
            <button class="btn btn-ghost btn-sm toggle-notice-btn" data-id="${n.id}" data-active="${n.is_active}"
              style="width: 32px; height: 32px; padding: 0; border-radius: 8px; font-size: 13px;"
              title="${n.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
              <i class="fas ${n.is_active ? 'fa-eye-slash' : 'fa-eye'}" style="color: var(--text-muted);"></i>
            </button>
            <button class="btn btn-ghost btn-sm delete-notice-btn" data-id="${n.id}"
              style="width: 32px; height: 32px; padding: 0; border-radius: 8px; font-size: 13px;">
              <i class="fas fa-trash" style="color: var(--danger);"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.toggle-notice-btn').forEach(btn => {
      btn.onclick = async () => {
        const active = btn.dataset.active === 'true';
        await supabase.from('platform_notices').update({ is_active: !active }).eq('id', btn.dataset.id);
        loadNotices(container);
      };
    });

    listEl.querySelectorAll('.delete-notice-btn').forEach(btn => {
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
      <label>TIPE PENGUMUMAN</label>
      <div class="pill-selector" id="notice-type-pills">
        <button type="button" class="pill-btn active" data-value="info"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--info);"></span> Info</button>
        <button type="button" class="pill-btn" data-value="success"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--success);"></span> Success</button>
        <button type="button" class="pill-btn" data-value="warning"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--warning);"></span> Warning</button>
        <button type="button" class="pill-btn" data-value="danger"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--danger);"></span> Danger</button>
      </div>
      <input type="hidden" id="notice-type" value="info">
    </div>
  `;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                  <button id="save-notice-btn" class="btn btn-primary">Publikasikan</button>`;
  
  openModal('Buat Pengumuman Global', body, footer, { maxWidth: '450px' });

  const bindPillSelector = (pillContainerId, hiddenInputId) => {
    const pillContainer = document.getElementById(pillContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!pillContainer || !hiddenInput) return;

    pillContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.onclick = () => {
        pillContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        hiddenInput.value = btn.dataset.value;
      };
    });
  };

  bindPillSelector('notice-type-pills', 'notice-type');

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
      <label>HARGA JUAL APLIKASI (IDR)</label>
      <input type="number" id="edit-shop-sale-price" class="form-control" value="${shop.sale_price || shop.salePrice || 0}">
    </div>
    <div class="form-group mb-md">
      <label>TANGGAL KEDALUWARSA (MASA AKTIF)</label>
      <input type="date" id="edit-shop-expires-at" class="form-control" value="${shop.expires_at ? new Date(shop.expires_at).toISOString().split('T')[0] : '2099-12-31'}">
    </div>
    <div class="form-group mb-md">
      <label>STATUS TENANT</label>
      <div class="pill-selector" id="edit-shop-status-pills">
        <button type="button" class="pill-btn ${shop.status === 'active' ? 'active' : ''}" data-value="active">Active</button>
        <button type="button" class="pill-btn ${shop.status === 'trial' ? 'active' : ''}" data-value="trial">Trial</button>
        <button type="button" class="pill-btn ${shop.status === 'expired' ? 'active' : ''}" data-value="expired">Expired</button>
        <button type="button" class="pill-btn ${shop.status === 'deactivated' ? 'active' : ''}" data-value="deactivated">Deactivated</button>
      </div>
      <input type="hidden" id="edit-shop-status" value="${shop.status || 'trial'}">
    </div>
     <div class="form-group mb-md">
      <label>PAKET BERLANGGANAN</label>
      <div class="pill-selector" id="edit-shop-plan-pills">
        <button type="button" class="pill-btn ${!shop.plan_id ? 'active' : ''}" data-value="">Basic Tier</button>
        <button type="button" class="pill-btn ${shop.plan_id === 'pro_unlimited' ? 'active' : ''}" data-value="pro_unlimited">Pro Unlimited</button>
      </div>
      <input type="hidden" id="edit-shop-plan" value="${shop.plan_id || ''}">
    </div>
  `;
  const footer = `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                  <button id="update-shop-btn" class="btn btn-success">Simpan Perubahan</button>`;
  
  openModal(`Edit Tenant: ${shop.name}`, body, footer, { maxWidth: '450px' });

  const bindPillSelector = (pillContainerId, hiddenInputId) => {
    const pillContainer = document.getElementById(pillContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!pillContainer || !hiddenInput) return;

    pillContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.onclick = () => {
        pillContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        hiddenInput.value = btn.dataset.value;
      };
    });
  };

  bindPillSelector('edit-shop-status-pills', 'edit-shop-status');
  bindPillSelector('edit-shop-plan-pills', 'edit-shop-plan');

  document.getElementById('update-shop-btn').onclick = async (e) => {
    e.target.disabled = true;
    e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    const name = document.getElementById('edit-shop-name').value.trim();
    const phone = document.getElementById('edit-shop-phone').value.trim();
    const sale_price = parseFloat(document.getElementById('edit-shop-sale-price').value) || 0;
    const expires_at = new Date(document.getElementById('edit-shop-expires-at').value + 'T23:59:59').toISOString();
    const status = document.getElementById('edit-shop-status').value;
    const plan_id = document.getElementById('edit-shop-plan').value || null;

    try {
      // Update satu per satu field untuk isolasi error
      const updateData = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (status) updateData.status = status;
      // plan_id selalu diupdate ke dalam model
      updateData.plan_id = plan_id;
      updateData.sale_price = sale_price;
      updateData.salePrice = sale_price;
      updateData.expires_at = expires_at;
      updateData.expiresAt = expires_at;

      try {
        const { data, error } = await supabase
          .from('shops')
          .update(updateData)
          .eq('id', shop.id)
          .select();

        if (error) throw new Error(error.message || JSON.stringify(error));
      } catch (netErr) {
        console.warn("Supabase update failed (offline?), falling back to local storage:", netErr);
        
        // Update local storage
        const localShops = JSON.parse(localStorage.getItem('barberpro_shops') || '[]');
        const idx = localShops.findIndex(s => s.id === shop.id);
        if (idx !== -1) {
          localShops[idx] = {
            ...localShops[idx],
            ...updateData
          };
          localStorage.setItem('barberpro_shops', JSON.stringify(localShops));
        }
      }

      showToast('✅ Data tenant berhasil diperbarui!', 'success');
      closeModal();
      // Refresh dengan delay kecil agar Supabase sync
      setTimeout(() => loadTenants(document.getElementById('sub-page-container')), 300);
    } catch (err) {
      console.error('Update shop error:', err);
      showToast('Gagal: ' + err.message, 'danger');
      e.target.disabled = false;
      e.target.innerHTML = 'Simpan Perubahan';
    }
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
        <div class="form-group mb-md"><label>HARGA JUAL APLIKASI (IDR)</label><input type="number" id="new-shop-sale-price" class="form-control" placeholder="Contoh: 1500000" value="1500000"></div>
        <div class="form-group mb-md">
          <label>MASA AKTIF BERLANGGANAN</label>
          <div class="pill-selector" id="new-shop-duration-pills">
            <button type="button" class="pill-btn" data-value="30">1 Bulan</button>
            <button type="button" class="pill-btn" data-value="90">3 Bulan</button>
            <button type="button" class="pill-btn" data-value="180">6 Bulan</button>
            <button type="button" class="pill-btn" data-value="365">1 Tahun</button>
            <button type="button" class="pill-btn active" data-value="99999">Selamanya (Lifetime)</button>
          </div>
          <input type="hidden" id="new-shop-duration" value="99999">
        </div>
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

  const bindPillSelector = (pillContainerId, hiddenInputId) => {
    const pillContainer = document.getElementById(pillContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!pillContainer || !hiddenInput) return;

    pillContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.onclick = () => {
        pillContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        hiddenInput.value = btn.dataset.value;
      };
    });
  };

  bindPillSelector('new-shop-duration-pills', 'new-shop-duration');

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
    const salePrice = parseFloat(document.getElementById('new-shop-sale-price').value) || 0;
    const durationDays = parseInt(document.getElementById('new-shop-duration').value) || 99999;
    const ownerName = document.getElementById('new-owner-name').value.trim();
    const username = document.getElementById('new-admin-user').value.trim().toLowerCase();
    const password = document.getElementById('new-admin-pass').value;

    const expiresAtDate = new Date();
    if (durationDays === 99999) {
      expiresAtDate.setFullYear(2099, 11, 31);
    } else {
      expiresAtDate.setDate(expiresAtDate.getDate() + durationDays);
    }
    const expiresAt = expiresAtDate.toISOString();

    try {
      const email = `${username}${Date.now()}@barberpro.local`;
      let authUserId = `mock-owner-${Date.now()}`;
      let newShop = { id: `mock-shop-${Date.now()}`, slug: shopSlug, name: shopName, owner_id: authUserId, status: 'active', sale_price: salePrice, salePrice: salePrice, expires_at: expiresAt, expiresAt: expiresAt, created_at: new Date().toISOString() };

      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
        if (authErr) throw authErr;
        authUserId = authData.user.id;

        const { data: createdShop, error: shopErr } = await supabase.from('shops').insert([{ slug: shopSlug, name: shopName, owner_id: authUserId, sale_price: salePrice, expires_at: expiresAt }]).select().single();
        if (shopErr) throw shopErr;
        newShop = createdShop;

        await supabase.from('profiles').upsert({ id: authUserId, full_name: ownerName, username, role: 'admin', shop_id: newShop.id });
        await new Promise(r => setTimeout(r, 1000));
        await supabase.from('profiles').update({ role: 'admin', shop_id: newShop.id, full_name: ownerName, username }).eq('id', authUserId);
        await supabase.from('settings').insert([{ shop_id: newShop.id, shop_name: shopName }]);
      } catch (netErr) {
        console.warn("Supabase registration failed (offline?), falling back to local storage:", netErr);
        // Save shop local
        const localShops = JSON.parse(localStorage.getItem('barberpro_shops') || '[]');
        localShops.push(newShop);
        localStorage.setItem('barberpro_shops', JSON.stringify(localShops));

        // Save local settings
        const localSettings = JSON.parse(localStorage.getItem('barberpro_settings_list') || '[]');
        localSettings.push({ id: `mock-settings-${Date.now()}`, shopId: newShop.id, shopName });
        localStorage.setItem('barberpro_settings_list', JSON.stringify(localSettings));

        // Save local profile
        const localProfiles = JSON.parse(localStorage.getItem('barberpro_profiles') || '[]');
        localProfiles.push({ id: authUserId, fullName: ownerName, username, role: 'admin', shopId: newShop.id, shop_id: newShop.id });
        localStorage.setItem('barberpro_profiles', JSON.stringify(localProfiles));
      }

      // Simpan login map agar bisa login dengan username
      const loginMap = JSON.parse(localStorage.getItem('barberpro_staff_login_map') || '{}');
      loginMap[`${username}.${shopSlug}`] = email;
      loginMap[username] = email;
      localStorage.setItem('barberpro_staff_login_map', JSON.stringify(loginMap));

      // Simpan credentials untuk ditampilkan di card
      const savedCreds = JSON.parse(localStorage.getItem('barberpro_shop_credentials') || '[]');
      savedCreds.unshift({ shopName, shopSlug, username, password, createdAt: new Date().toLocaleDateString('id-ID') });
      localStorage.setItem('barberpro_shop_credentials', JSON.stringify(savedCreds.slice(0, 20)));

      showToast('SaaS Diaktifkan untuk ' + shopName, 'success');
      closeModal();

      // Tampilkan card kredensial
      openModal('✅ Toko Berhasil Didaftarkan', `
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div style="padding:16px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:12px;text-align:center;">
            <div style="font-size:24px;margin-bottom:8px;">🎉</div>
            <div style="font-weight:700;font-size:16px;color:#22c55e;">${shopName}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Slug: ${shopSlug}</div>
          </div>
          <div style="padding:16px;background:var(--bg-input);border-radius:12px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:12px;">Kredensial Login Owner</div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
              <span style="font-size:13px;color:var(--text-muted);">Kode Toko</span>
              <code style="font-size:13px;font-weight:700;color:var(--accent);background:var(--accent-subtle);padding:3px 10px;border-radius:6px;">${shopSlug}</code>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
              <span style="font-size:13px;color:var(--text-muted);">Username</span>
              <code style="font-size:13px;font-weight:700;color:var(--text-primary);background:var(--bg-card);padding:3px 10px;border-radius:6px;">${username}</code>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
              <span style="font-size:13px;color:var(--text-muted);">Password</span>
              <code style="font-size:13px;font-weight:700;color:var(--text-primary);background:var(--bg-card);padding:3px 10px;border-radius:6px;">${password}</code>
            </div>
          </div>
          <div style="padding:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;font-size:12px;color:var(--warning);">
            <i class="fas fa-triangle-exclamation"></i> Simpan kredensial ini. Password tidak bisa dilihat lagi setelah modal ditutup.
          </div>
        </div>
      `, `<button class="btn btn-primary" onclick="closeModal()">Tutup & Selesai</button>`);

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
      const email = `${username}${Date.now()}@barberpro.local`;
      let authUserId = `mock-prov-${Date.now()}`;
      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
        if (authErr) throw authErr;
        authUserId = authData.user.id;
        await supabase.from('profiles').upsert({ id: authUserId, full_name: fullName, username, role: 'admin', shop_id: shopId });
      } catch (netErr) {
        console.warn("Supabase provision failed (offline?), falling back to local storage:", netErr);
        const localProfiles = JSON.parse(localStorage.getItem('barberpro_profiles') || '[]');
        localProfiles.push({ id: authUserId, fullName: fullName, username, role: 'admin', shopId: shopId, shop_id: shopId });
        localStorage.setItem('barberpro_profiles', JSON.stringify(localProfiles));
      }
      
      // Simpan login map
      const loginMap = JSON.parse(localStorage.getItem('barberpro_staff_login_map') || '{}');
      loginMap[`${username}.${shopSlug}`] = email;
      loginMap[username] = email;
      localStorage.setItem('barberpro_staff_login_map', JSON.stringify(loginMap));
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
  document.getElementById('final-delete-btn').onclick = async (e) => {
    e.target.disabled = true;
    e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    try {
      const tables = ['settings', 'barbers', 'services', 'appointments', 'customers', 'attendance', 'subscriptions', 'profiles'];
      for (const t of tables) {
        const { error } = await supabase.from(t).delete().eq('shop_id', shop.id);
        if (error) console.warn(`Delete ${t} error:`, error.message);
      }
      const { error: shopErr } = await supabase.from('shops').delete().eq('id', shop.id);
      if (shopErr) throw new Error(shopErr.message);
      showToast('Registry Tenant Dihapus.', 'success');
      closeModal();
      loadTenants(document.getElementById('sub-page-container'));
    } catch (err) {
      showToast('Gagal hapus: ' + err.message, 'danger');
      e.target.disabled = false;
      e.target.innerHTML = 'Hapus Sekarang';
    }
  };
}

function renderAddSuperAdminModal() {
  const body = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <h3 style="font-size: 14px; color: var(--accent); margin-bottom: 8px;"><i class="fas fa-user-shield" style="color:var(--accent);"></i> PENDAFTARAN SUPERADMIN BARU</h3>
      <div class="form-group">
        <label>NAMA LENGKAP</label>
        <input type="text" id="new-sa-fullname" class="form-control" placeholder="Contoh: Admin Global 2">
      </div>
      <div class="form-group">
        <label>USERNAME LOGIN</label>
        <input type="text" id="new-sa-username" class="form-control" placeholder="Contoh: superadmin2">
      </div>
      <div class="form-group">
        <label>PASSWORD</label>
        <input type="password" id="new-sa-password" class="form-control" placeholder="Min 6 karakter">
      </div>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button id="confirm-add-sa" class="btn btn-primary"><i class="fas fa-user-shield"></i> Daftarkan Superadmin</button>
  `;
  openModal('Tambah Superadmin Baru', body, footer, { maxWidth: '400px' });

  document.getElementById('confirm-add-sa').onclick = async (e) => {
    e.target.disabled = true;
    const fullName = document.getElementById('new-sa-fullname').value.trim();
    const username = document.getElementById('new-sa-username').value.trim().toLowerCase();
    const password = document.getElementById('new-sa-password').value;

    if (!fullName || !username || !password) {
      showToast('Lengkapi semua data!', 'warning');
      e.target.disabled = false;
      return;
    }

    try {
      const email = `${username}${Date.now()}@barberpro.local`;
      let authUserId = `mock-sa-${Date.now()}`;

      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
        if (authErr) throw authErr;
        authUserId = authData.user.id;

        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: authUserId,
          full_name: fullName,
          username,
          role: 'superadmin',
          is_super_admin: true,
          shop_id: null
        });
        if (profileErr) throw profileErr;
      } catch (netErr) {
        console.warn("Supabase SuperAdmin registration failed (offline?), falling back to local storage:", netErr);
        const localProfiles = JSON.parse(localStorage.getItem('barberpro_profiles') || '[]');
        localProfiles.push({
          id: authUserId,
          fullName,
          username,
          role: 'superadmin',
          isSuperAdmin: true,
          shopId: null,
          shop_id: null
        });
        localStorage.setItem('barberpro_profiles', JSON.stringify(localProfiles));
      }

      // Simpan login map agar bisa login dengan username
      const loginMap = JSON.parse(localStorage.getItem('barberpro_staff_login_map') || '{}');
      loginMap[username] = email;
      localStorage.setItem('barberpro_staff_login_map', JSON.stringify(loginMap));

      showToast(`Superadmin ${fullName} berhasil didaftarkan!`, 'success');
      closeModal();
    } catch (err) {
      showToast('Gagal mendaftarkan superadmin: ' + err.message, 'danger');
      e.target.disabled = false;
    }
  };
}



