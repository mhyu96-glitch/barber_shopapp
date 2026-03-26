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
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="fas fa-scissors"></i>
        <div>
          <h1 style="margin: 0; font-size: 18px;">${shopName.length > 14 ? shopName.substring(0, 14) : shopName}</h1>
          <div style="font-size: 11px; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
            <i class="fas fa-location-dot" style="font-size: 9px;"></i> ${activeBranch.name}
          </div>
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
      <button class="nav-item" data-page="services">
        <i class="fas fa-list-check"></i>
        <span>Layanan & Harga</span>
      </button>
      <button class="nav-item" data-page="attendance">
        <i class="fas fa-clock-rotate-left"></i>
        <span>Presensi Barber</span>
      </button>
      
      <div class="nav-section-title">Bisnis</div>
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
      <button class="nav-item" data-page="settings">
        <i class="fas fa-cog"></i>
        <span>Pengaturan</span>
      </button>
    </nav>
    <div style="padding: 14px; border-top: 1px solid var(--border); text-align: center;">
      <small style="color: var(--text-muted); font-size: 11px;">BarberPro v2.0</small>
    </div>
  `;

  // Navigation click handlers
  container.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
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
