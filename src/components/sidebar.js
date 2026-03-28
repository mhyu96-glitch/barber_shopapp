// ========================================
// Sidebar Component
// ========================================

import { navigateTo } from '../main.js';
import { storage } from '../utils/storage.js';
import { showToast } from './toast.js';

export function renderSidebar(container) {
  const todayAppointments = getTodayAppointmentCount();
  const pendingPortal = getPendingPortalCount();
  const settings = storage.get('settings', {});
  const shopName = settings.shopName || 'BarberPro';
  const activeBranchId = settings.activeBranchId || 'main';
  const branches = settings.branches || [{ id: 'main', name: 'Pusat' }];
  const user = storage.getCurrentUser();
  const role = user?.role || 'barber';
  let activeFeatures = storage.get('active_features', ['dashboard', 'appointments', 'customers', 'services', 'portal']);
  if (!Array.isArray(activeFeatures)) activeFeatures = ['dashboard', 'appointments', 'customers', 'services', 'portal'];
  
  const shopPlan = storage.get('shop_plan', 'Trial');
  const isSuperAdmin = user?.isSuperAdmin || false;
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  const isFeatureEnabled = (page) => {
    // 🛡️ Always allow core system pages or if super admin
    if (page === 'dashboard' || page === 'settings' || page === 'signup') return true; 
    if (isSuperAdmin) return true;
    
    return activeFeatures.includes(page);
  };

  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="fas ${isSuperAdmin ? 'fa-crown' : 'fa-scissors'}"></i>
        <div>
          <h1>${isSuperAdmin ? 'BARBERPRO GLOBAL' : (shopName.length > 14 ? shopName.substring(0, 14) : shopName)}</h1>
          <div class="sidebar-branch-label" style="display: flex; gap: 5px; align-items: center;">
             <span><i class="fas ${isSuperAdmin ? 'fa-server' : 'fa-location-dot'}"></i> ${isSuperAdmin ? 'Platform Control' : (activeBranch?.name || 'Pusat')}</span>
             <span class="badge" style="background: var(--primary-glow); color: var(--primary); font-size: 8px; border: 0.5px solid var(--primary);">${isSuperAdmin ? 'SaaS MASTER' : shopPlan}</span>
          </div>
        </div>
      </div>
      <div class="user-profile-mini">
        <div class="user-avatar-mini" style="background: ${isSuperAdmin ? 'linear-gradient(135deg, #f1c40f, #f39c12)' : 'var(--primary)'}; color: #fff;">
          ${isSuperAdmin ? '<i class="fas fa-user-shield"></i>' : (user?.fullName?.[0] || user?.username?.[0] || 'U')}
        </div>
        <div class="user-info-mini">
          <div class="user-name">${user?.fullName || user?.username || 'User'}</div>
          <div class="user-role">${isSuperAdmin ? 'PLATFORM OWNER' : role}</div>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      ${isSuperAdmin ? `
        <!-- MASTER MENU -->
        <div class="nav-section-title">CONTROL CENTER</div>
        <button class="nav-item active" data-page="super-admin">
          <i class="fas fa-rocket"></i>
          <span>Dashboard Master</span>
        </button>
        <button class="nav-item" data-page="super-admin" onclick="window.location.hash='super-admin'; setTimeout(()=>document.querySelector('[data-tab=shops]')?.click(), 100)">
          <i class="fas fa-store"></i>
          <span>Manajemen Tenant</span>
        </button>
        <button class="nav-item" data-page="super-admin" onclick="window.location.hash='super-admin'; setTimeout(()=>document.querySelector('[data-tab=revenue]')?.click(), 100)">
          <i class="fas fa-money-bill-trend-up"></i>
          <span>Laporan Pendapatan</span>
        </button>
        <button class="nav-item" data-page="super-admin" onclick="window.location.hash='super-admin'; setTimeout(()=>document.querySelector('[data-tab=plans]')?.click(), 100)">
          <i class="fas fa-gem"></i>
          <span>Pengaturan Paket</span>
        </button>
        <div class="nav-section-title">SYSTEM</div>
        <button class="nav-item" data-page="settings">
          <i class="fas fa-cog"></i>
          <span>Pengaturan Global</span>
        </button>
      ` : `
        <!-- SHOP STAFF MENU -->
        <div class="nav-section-title">Menu Utama</div>
        <button class="nav-item active" data-page="dashboard">
          <i class="fas fa-th-large"></i>
          <span>Dashboard</span>
          ${pendingPortal > 0 ? `<span class="nav-badge" style="background: var(--info);">${pendingPortal}</span>` : ''}
        </button>
        
        ${isFeatureEnabled('appointments') ? `
          <button class="nav-item" data-page="appointments">
            <i class="fas fa-calendar-check"></i>
            <span>Janji Temu</span>
            ${todayAppointments > 0 ? `<span class="nav-badge">${todayAppointments}</span>` : ''}
          </button>
        ` : ''}

        ${isFeatureEnabled('queue') ? `
          <button class="nav-item" data-page="queue">
            <i class="fas fa-users-line"></i>
            <span>Antrian</span>
          </button>
        ` : ''}
        
        <div class="nav-section-title">Kelola</div>
        <button class="nav-item" data-page="customers">
          <i class="fas fa-user-group"></i>
          <span>Pelanggan</span>
        </button>

        ${isFeatureEnabled('barbers') ? `
          <button class="nav-item" data-page="barbers">
            <i class="fas fa-user-tie"></i>
            <span>Barber</span>
          </button>
        ` : ''}

        ${(role === 'admin' && !isSuperAdmin) ? `
          <button class="nav-item" data-page="signup">
            <i class="fas fa-user-plus"></i>
            <span>Tambah Staf</span>
          </button>
        ` : ''}

        <button class="nav-item" data-page="services">
          <i class="fas fa-list-check"></i>
          <span>Layanan & Harga</span>
        </button>

        ${isFeatureEnabled('attendance') ? `
          <button class="nav-item" data-page="attendance">
            <i class="fas fa-clock-rotate-left"></i>
            <span>Presensi Barber</span>
          </button>
        ` : ''}
        
        <div class="nav-section-title">Bisnis</div>
        ${isFeatureEnabled('pos') ? `
          <button class="nav-item" data-page="pos">
            <i class="fas fa-cash-register"></i>
            <span>Kasir (POS)</span>
          </button>
        ` : ''}

        ${isFeatureEnabled('payments') ? `
          <button class="nav-item" data-page="payments">
            <i class="fas fa-wallet"></i>
            <span>Pembayaran</span>
          </button>
        ` : ''}

        ${isFeatureEnabled('promos') ? `
          <button class="nav-item" data-page="promos">
            <i class="fas fa-tags"></i>
            <span>Promo & Diskon</span>
          </button>
        ` : ''}

        ${isFeatureEnabled('reports') ? `
          <button class="nav-item" data-page="reports">
            <i class="fas fa-chart-line"></i>
            <span>Laporan</span>
          </button>
        ` : ''}

        ${isFeatureEnabled('expenses') ? `
          <button class="nav-item" data-page="expenses">
            <i class="fas fa-receipt"></i>
            <span>Pengeluaran</span>
          </button>
        ` : ''}

        ${isFeatureEnabled('inventory') ? `
          <button class="nav-item" data-page="inventory">
            <i class="fas fa-boxes-stacked"></i>
            <span>Inventori</span>
          </button>
        ` : ''}
        ${isFeatureEnabled('memberships') ? `
          <button class="nav-item" data-page="memberships">
            <i class="fas fa-id-card"></i>
            <span>Membership</span>
          </button>
        ` : ''}
        
        <div class="nav-section-title">Lainnya</div>
        ${isFeatureEnabled('gallery') ? `
          <button class="nav-item" data-page="gallery">
            <i class="fas fa-images"></i>
            <span>Galeri Style</span>
          </button>
        ` : ''}

        ${isFeatureEnabled('logbook') ? `
          <button class="nav-item" data-page="logbook">
            <i class="fas fa-book"></i>
            <span>Catatan Harian</span>
          </button>
        ` : ''}
        
        ${role === 'admin' ? `
          <button class="nav-item" data-page="settings">
            <i class="fas fa-cog"></i>
            <span>Pengaturan</span>
          </button>
        ` : ''}
      `}

      <div style="margin-top: auto; padding-top: 20px;">
        <button class="nav-item text-danger" id="logout-btn" style="color: var(--danger);">
          <i class="fas fa-sign-out-alt"></i>
          <span>Keluar</span>
        </button>
      </div>
    </nav>
    <div style="padding: 14px; border-top: 1px solid var(--border); text-align: center;">
      <small style="color: var(--text-muted); font-size: 11px;">BarberPro v2.0</small>
    </div>
  `;

  // Navigation click handlers
  container.querySelectorAll('.nav-item').forEach(item => {
    if (item.id === 'logout-btn') {
      item.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          storage.logout();
        }
      });
      return;
    }
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });

  // Role-based visibility for sections
  if (role === 'barber') {
    const adminPages = ['barbers', 'services', 'reports', 'expenses', 'inventory'];
    container.querySelectorAll('.nav-item').forEach(item => {
      if (adminPages.includes(item.dataset.page)) {
        item.style.display = 'none';
      }
    });

    // Hide labels
    container.querySelectorAll('.nav-section-title').forEach(title => {
      if (title.textContent === 'Kelola' || title.textContent === 'Bisnis') {
        // We might want to keep some items in Bisnis, but usually admin only
        // Re-check specific ones if needed
      }
    });
  }
}

function _renderSuperAdminSidebar(container, user) {
  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="fas fa-crown" style="color: var(--primary);"></i>
        <div>
          <h1>MASTER PLATFORM</h1>
          <div class="sidebar-branch-label">
            <i class="fas fa-shield-halved"></i> Root Access
          </div>
        </div>
      </div>
      <div class="user-profile-mini">
        <div class="user-avatar-mini" style="background: var(--primary); color: black;">
          ${user?.fullName?.[0] || 'S'}
        </div>
        <div class="user-info-mini">
          <div class="user-name">${user?.fullName || 'Super Admin'}</div>
          <div class="user-role">Platform Owner</div>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">Manajemen Utama</div>
      <button class="nav-item active" data-page="super-admin">
        <i class="fas fa-building-shield"></i>
        <span>Master Control</span>
      </button>

      <div class="nav-section-title">Tampilan</div>
      <button class="nav-item" id="theme-toggle-btn">
        <i class="fas fa-circle-half-stroke"></i>
        <span>Ganti Tema (Light/Dark)</span>
      </button>
      
      <div style="margin-top: auto; padding-top: 20px;">
        <button class="nav-item text-danger" id="logout-btn" style="color: var(--danger);">
          <i class="fas fa-sign-out-alt"></i>
          <span>Keluar Sistem</span>
        </button>
      </div>
    </nav>
  `;

  container.querySelectorAll('.nav-item').forEach(item => {
    if (item.id === 'theme-toggle-btn') {
      item.addEventListener('click', () => {
        const current = storage.get('theme', 'dark');
        const next = current === 'dark' ? 'light' : 'dark';
        storage.set('theme', next);
        document.documentElement.setAttribute('data-theme', next);
        if (next === 'light') {
          document.documentElement.classList.add('light-theme');
        } else {
          document.documentElement.classList.remove('light-theme');
        }
        showToast(`Tema diubah ke ${next.toUpperCase()}`, 'info');
      });
      return;
    }
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });
}

function getTodayAppointmentCount() {
  const today = new Date().toISOString().split('T')[0];
  const appointments = storage.getAll('appointments');
  return appointments.filter(a => a.date === today && a.status !== 'cancelled' && a.status !== 'done' && a.status !== 'pending' && a.status !== 'rejected').length;
}

function getPendingPortalCount() {
  const appointments = storage.getAll('appointments');
  return appointments.filter(a => a.status === 'pending' && a.source === 'portal').length;
}
