// ========================================
// Sidebar Component
// ========================================

import { navigateTo } from '../main.js';
import { storage } from '../utils/storage.js';
import { showToast } from './toast.js';

export function renderSidebar(container, activePage) {
  const hash = activePage || window.location.hash.replace('#', '') || 'dashboard';
  
  // 🛡️ Master Redirect: Prevent global sidebar from rendering on specific layouts
  if (hash === 'super-admin' || hash === 'login' || hash === 'feedback' || hash === 'register-shop') {
    container.style.display = 'none';
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.padding = (hash === 'super-admin') ? '' : '0';
    }
    return;
  }
  
  container.style.display = 'flex'; // Reset display for valid app routes
  const todayAppointments = getTodayAppointmentCount();
  const pendingPortal = getPendingPortalCount();
  const settings = storage.get('settings', {});
  const shopName = settings.shopName || 'BarberPro';
  const activeBranchId = settings.activeBranchId || 'main';
  const branches = settings.branches || [{ id: 'main', name: 'Pusat' }];
  const user = storage.getCurrentUser();
  const role = user?.role || 'barber';
  let activeFeatures = storage.get('active_features', ['dashboard', 'appointments', 'customers', 'services', 'portal']);
  if (typeof activeFeatures === 'string') {
    activeFeatures = activeFeatures.replace(/[{}"[\]]/g, '').split(',').map(s => s.trim());
  }
  if (!Array.isArray(activeFeatures)) activeFeatures = ['dashboard', 'appointments', 'customers', 'services', 'portal'];
  
  const shopPlan = storage.get('shop_plan', 'Premium Access');
  const isSuperAdmin = user?.isSuperAdmin || false;
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  const renderNavItem = (page, icon, label, colorHex = '#a0aec0', extraHtml = '') => {
    const isActive = hash === page;
    return `
      <button class="nav-item ${isActive ? 'active' : ''}" data-page="${page}">
        <div style="background: ${colorHex}15; color: ${colorHex}; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px; box-shadow: 0 2px 4px ${colorHex}10;">
          <i class="${icon}"></i>
        </div>
        <span style="font-weight: 600;">${label}</span>
        ${extraHtml}
      </button>
    `;
  };

  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="fas ${isSuperAdmin ? 'fa-crown' : 'fa-scissors'}"></i>
        <div>
          <h1>${isSuperAdmin ? 'BARBERPRO GLOBAL' : (shopName.length > 14 ? shopName.substring(0, 14) : shopName)}</h1>
          <div class="sidebar-branch-label" style="display: flex; gap: 5px; align-items: center;">
             <span><i class="fas ${isSuperAdmin ? 'fa-server' : 'fa-location-dot'}"></i> ${isSuperAdmin ? 'Platform Control' : (activeBranch?.name || 'Pusat')}</span>
             <span class="badge" style="background: var(--primary-glow); color: var(--primary); font-size: 8px; border: 0.5px solid var(--primary);">${isSuperAdmin ? 'SaaS MASTER' : 'LICENSE ACTIVE'}</span>
          </div>
        </div>
      </div>
      <div class="user-profile-mini">
        <div class="user-avatar-mini" style="background: ${isSuperAdmin ? 'linear-gradient(135deg, #f1c40f, #f39c12)' : 'var(--primary)'}; color: #fff;">
          ${isSuperAdmin ? '<i class="fas fa-user-shield"></i>' : (user?.fullName?.[0] || user?.username?.[0] || 'U')}
        </div>
        <div class="user-info-mini">
          <div class="user-name">${user?.fullName || user?.username || 'Pengguna'}</div>
          <div class="user-role">${isSuperAdmin ? 'PLATFORM OWNER' : (user?.role || 'Staff').toUpperCase()}</div>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      ${isSuperAdmin ? `
        <!-- MASTER MENU -->
        <div class="nav-section-title">CONTROL CENTER</div>
        <button class="nav-item active" data-page="super-admin">
          <div style="background: #e74c3c15; color: #e74c3c; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;"><i class="fas fa-rocket"></i></div>
          <span style="font-weight: 600;">Dashboard Master</span>
        </button>
        <button class="nav-item" data-page="super-admin" onclick="window.location.hash='super-admin'; setTimeout(()=>document.querySelector('[data-tab=shops]')?.click(), 100)">
          <div style="background: #3498db15; color: #3498db; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;"><i class="fas fa-store"></i></div>
          <span style="font-weight: 600;">Manajemen Tenant</span>
        </button>
        <button class="nav-item" data-page="super-admin" onclick="window.location.hash='super-admin'; setTimeout(()=>document.querySelector('[data-tab=revenue]')?.click(), 100)">
          <div style="background: #2ecc7115; color: #2ecc71; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;"><i class="fas fa-money-bill-trend-up"></i></div>
          <span style="font-weight: 600;">Laporan Pendapatan</span>
        </button>
        <button class="nav-item" data-page="super-admin" onclick="window.location.hash='super-admin'; setTimeout(()=>document.querySelector('[data-tab=plans]')?.click(), 100)">
          <div style="background: #9b59b615; color: #9b59b6; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;"><i class="fas fa-gem"></i></div>
          <span style="font-weight: 600;">Pengaturan Paket</span>
        </button>
        <div class="nav-section-title">SYSTEM</div>
        <button class="nav-item" data-page="settings">
          <div style="background: #7f8c8d15; color: #7f8c8d; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;"><i class="fas fa-cog"></i></div>
          <span style="font-weight: 600;">Pengaturan Global</span>
        </button>
      ` : `
        <!-- SHOP STAFF MENU -->
        <div class="nav-section-title">Menu Utama</div>
        <button class="nav-item ${hash === 'dashboard' ? 'active' : ''}" data-page="dashboard">
          <div style="background: #3498db15; color: #3498db; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;"><i class="fas fa-th-large"></i></div>
          <span style="font-weight: 600;">Dashboard</span>
          ${pendingPortal > 0 ? `<span class="nav-badge" style="background: var(--info);">${pendingPortal}</span>` : ''}
        </button>
        
        ${renderNavItem('appointments', 'fas fa-calendar-check', 'Janji Temu', '#9b59b6', todayAppointments > 0 ? `<span class="nav-badge">${todayAppointments}</span>` : '')}
        ${renderNavItem('queue', 'fas fa-users-line', 'Antrian', '#00cec9')}
        
        <div class="nav-section-title">Kelola</div>
        ${renderNavItem('customers', 'fas fa-user-group', 'Pelanggan', '#1abc9c')}
        ${renderNavItem('barbers', 'fas fa-user-tie', 'Barber', '#34495e')}
        
        ${(role === 'admin' && !isSuperAdmin) ? renderNavItem('signup', 'fas fa-user-plus', 'Tambah Staf', '#2ecc71') : ''}
        
        ${renderNavItem('services', 'fas fa-list-check', 'Layanan & Harga', '#e67e22')}
        ${renderNavItem('attendance', 'fas fa-clock-rotate-left', 'Presensi Barber', '#e84393')}
        
        <div class="nav-section-title">Bisnis</div>
        ${renderNavItem('pos', 'fas fa-cash-register', 'Kasir (POS)', '#f1c40f')}
        ${renderNavItem('promos', 'fas fa-tags', 'Promo & Diskon', '#fd79a8')}
        ${renderNavItem('reports', 'fas fa-chart-line', 'Laporan', '#0984e3')}
        ${renderNavItem('expenses', 'fas fa-receipt', 'Pengeluaran', '#d63031')}
        ${renderNavItem('inventory', 'fas fa-boxes-stacked', 'Inventori', '#636e72')}
        ${renderNavItem('memberships', 'fas fa-id-card', 'Membership', '#00b894')}
        
        <div class="nav-section-title">Lainnya</div>
        ${renderNavItem('gallery', 'fas fa-images', 'Galeri Style', '#a29bfe')}
        ${renderNavItem('logbook', 'fas fa-book', 'Catatan Harian', '#fdcb6e')}
        
        ${role === 'admin' ? renderNavItem('settings', 'fas fa-cog', 'Pengaturan', '#b2bec3') : ''}
      `}

      <div style="margin-top: auto; padding-top: 20px;">
        <button class="nav-item" id="logout-btn" style="color: var(--danger);">
          <div style="background: #e74c3c15; color: #e74c3c; border-radius: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;"><i class="fas fa-sign-out-alt"></i></div>
          <span style="font-weight: 700;">Keluar Sistem</span>
        </button>
      </div>
    </nav>
    <div style="padding: 14px; border-top: 1px solid var(--border); text-align: center;">
      <small style="color: var(--text-muted); font-size: 11px;">BarberPro v2.5</small>
    </div>
  `;

  // Navigation click handlers
  container.querySelectorAll('.nav-item').forEach(item => {
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
      <div class="user-profile-mini" style="margin-top: 10px;">
        <div class="user-avatar-mini" style="background: linear-gradient(135deg, #f1c40f, #f39c12); color: #fff;">
          <i class="fas fa-user-shield"></i>
        </div>
        <div class="user-info-mini">
          <div class="user-name">${user?.fullName || 'Super Admin'}</div>
          <div class="user-role">PLATFORM OWNER</div>
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
    if (item.id === 'logout-btn') {
      item.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          storage.logout();
        }
      });
      return;
    }
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
