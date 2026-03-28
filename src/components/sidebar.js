// ========================================
// Sidebar Component
// ========================================

import { navigateTo } from '../main.js';
import { storage } from '../utils/storage.js';

export function renderSidebar(container) {
  const todayAppointments = getTodayAppointmentCount();
  const pendingPortal = getPendingPortalCount();
  const settings = storage.get('settings', {});
  const shopName = settings.shopName || 'BarberPro';
  const activeBranchId = settings.activeBranchId || 'main';
  const branches = settings.branches || [{ id: 'main', name: 'Pusat' }];
  const user = storage.getCurrentUser();
  const role = user?.role || 'barber';
  const isSuperAdmin = user?.isSuperAdmin || false;
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  if (isSuperAdmin) {
    return _renderSuperAdminSidebar(container, user);
  }

  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="fas fa-scissors"></i>
        <div>
          <h1>${shopName.length > 14 ? shopName.substring(0, 14) : shopName}</h1>
          <div class="sidebar-branch-label">
            <i class="fas fa-location-dot"></i> ${activeBranch.name}
          </div>
        </div>
      </div>
      <div class="user-profile-mini">
        <div class="user-avatar-mini">
          ${user?.fullName?.[0] || user?.username?.[0] || 'U'}
        </div>
        <div class="user-info-mini">
          <div class="user-name">${user?.fullName || user?.username || 'User'}</div>
          <div class="user-role">${role}</div>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">Menu Utama</div>
      <button class="nav-item active" data-page="dashboard">
        <i class="fas fa-th-large"></i>
        <span>Dashboard</span>
        ${pendingPortal > 0 ? `<span class="nav-badge" style="background: var(--info);">${pendingPortal}</span>` : ''}
      </button>
      <button class="nav-item" data-page="appointments">
        <i class="fas fa-calendar-check"></i>
        <span>Janji Temu</span>
        ${todayAppointments > 0 ? `<span class="nav-badge">${todayAppointments}</span>` : ''}
      </button>
      <button class="nav-item" data-page="queue">
        <i class="fas fa-users-line"></i>
        <span>Antrian</span>
      </button>
      
      <div class="nav-section-title">Kelola</div>
      <button class="nav-item" data-page="customers">
        <i class="fas fa-user-group"></i>
        <span>Pelanggan</span>
      </button>
      <button class="nav-item" data-page="barbers">
        <i class="fas fa-user-tie"></i>
        <span>Barber</span>
      </button>
      ${role === 'admin' ? `
        <button class="nav-item" data-page="signup">
          <i class="fas fa-user-plus"></i>
          <span>Tambah Staf</span>
        </button>
      ` : ''}
      <button class="nav-item" data-page="services">
        <i class="fas fa-list-check"></i>
        <span>Layanan & Harga</span>
      </button>
      <button class="nav-item" data-page="attendance">
        <i class="fas fa-clock-rotate-left"></i>
        <span>Presensi Barber</span>
      </button>
      
      <div class="nav-section-title">Bisnis</div>
      <button class="nav-item" data-page="pos">
        <i class="fas fa-cash-register"></i>
        <span>Kasir (POS)</span>
      </button>
      <button class="nav-item" data-page="payments">
        <i class="fas fa-wallet"></i>
        <span>Pembayaran</span>
      </button>
      <button class="nav-item" data-page="promos">
        <i class="fas fa-tags"></i>
        <span>Promo & Diskon</span>
      </button>
      <button class="nav-item" data-page="reports">
        <i class="fas fa-chart-line"></i>
        <span>Laporan</span>
      </button>
      <button class="nav-item" data-page="expenses">
        <i class="fas fa-receipt"></i>
        <span>Pengeluaran</span>
      </button>
      <button class="nav-item" data-page="inventory">
        <i class="fas fa-boxes-stacked"></i>
        <span>Inventori</span>
      </button>
      <button class="nav-item" data-page="memberships">
        <i class="fas fa-id-card"></i>
        <span>Membership</span>
      </button>
      
      <div class="nav-section-title">Lainnya</div>
      <button class="nav-item" data-page="gallery">
        <i class="fas fa-images"></i>
        <span>Galeri Style</span>
      </button>
      <button class="nav-item" data-page="logbook">
        <i class="fas fa-book"></i>
        <span>Catatan Harian</span>
      </button>
      
      ${role === 'admin' ? `
        <button class="nav-item" data-page="settings">
          <i class="fas fa-cog"></i>
          <span>Pengaturan</span>
        </button>
      ` : ''}

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
        if (confirm('Keluar dari sistem Master?')) storage.logout();
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
