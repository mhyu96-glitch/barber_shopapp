// ========================================
// BarberPro - Main Entry Point
// SPA Router + App Initialization
// ========================================

import './styles/index.css';
import { supabase } from './utils/supabaseClient.js';
import { storage } from './utils/storage.js';
import { initSampleData } from './utils/sampleData.js';
import { renderSidebar } from './components/sidebar.js';
import { showToast } from './components/toast.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAppointments } from './pages/appointments.js';
import { renderCustomers } from './pages/customers.js';
import { renderBarbers } from './pages/barbers.js';
import { renderPayments } from './pages/payments.js';
import { renderReports } from './pages/reports.js';
import { renderServices } from './pages/services.js';
import { renderGallery } from './pages/gallery.js';
import { renderPromos } from './pages/promos.js';
import { renderQueue } from './pages/queue.js';
import { renderSettings, initTheme } from './pages/settings.js';
import { renderLogbook } from './pages/logbook.js';
import { renderExpenses } from './pages/expenses.js';
import { renderInventory } from './pages/inventory.js';
import { renderAttendance } from './pages/attendance.js';
import { renderMemberships } from './pages/memberships.js';
import { renderLogin } from './pages/login.js';
import { renderSignup } from './pages/signup.js';
import { renderPOS } from './pages/pos.js';
import { renderSuperAdmin } from './pages/superAdmin.js';

// Initialize sample data (disabled for Supabase real DB)
// initSampleData();

// Initialize theme
initTheme();

// Routes
const routes = {
  dashboard: { render: renderDashboard, title: 'Dashboard' },
  attendance: { render: renderAttendance, title: 'Presensi Barber' },
  memberships: { render: renderMemberships, title: 'Membership' },
  appointments: { render: renderAppointments, title: 'Janji Temu' },
  customers: { render: renderCustomers, title: 'Pelanggan' },
  barbers: { render: renderBarbers, title: 'Barber' },
  payments: { render: renderPayments, title: 'Pembayaran' },
  reports: { render: renderReports, title: 'Laporan' },
  services: { render: renderServices, title: 'Layanan' },
  gallery: { render: renderGallery, title: 'Galeri' },
  promos: { render: renderPromos, title: 'Promo' },
  queue: { render: renderQueue, title: 'Antrian' },
  settings: { render: renderSettings, title: 'Pengaturan' },
  logbook: { render: renderLogbook, title: 'Catatan Harian' },
  expenses: { render: renderExpenses, title: 'Pengeluaran' },
  inventory: { render: renderInventory, title: 'Inventori' },
  login: { render: renderLogin, title: 'Login' },
  signup: { render: renderSignup, title: 'Tambah Staf' },
  pos: { render: renderPOS, title: 'Kasir (POS)' },
  'super-admin': { render: renderSuperAdmin, title: 'Master Platform' },
};

let currentPage = 'dashboard';

// Navigate to page
export function navigateTo(page) {
  // Session check
  const user = storage.getCurrentUser();
  if (!user && page !== 'login') {
    window.location.hash = 'login';
    return;
  }

  // Master Redirect: If Master tries to go to shop dashboard, send to master platform
  if (user?.isSuperAdmin && (page === 'dashboard' || !page)) {
    page = 'super-admin';
  }

  if (!routes[page]) page = user?.isSuperAdmin ? 'super-admin' : 'dashboard';
  currentPage = page;

  const container = document.getElementById('page-container');
  container.innerHTML = '';
  container.className = 'page-container fade-in';

  routes[page].render(container);
  document.title = `${routes[page].title} - BarberPro`;

  // Update sidebar active
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');

  // Update URL hash
  window.location.hash = page;
}

// Get current page
export function getCurrentPage() {
  return currentPage;
}

// Init app
async function initApp() {
  console.log('🚀 BarberPro Booting...');
  try {
    // 1. Initial background logic (Theme, Mobile UI)
    initTheme();
    
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) renderSidebar(sidebarEl);

    // Mobile setup
    const toggle = document.createElement('button');
    toggle.className = 'sidebar-toggle';
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    
    toggle.addEventListener('click', () => {
      sidebarEl?.classList.toggle('open');
      overlay.classList.toggle('active');
    });
    
    overlay.addEventListener('click', () => {
      sidebarEl?.classList.remove('open');
      overlay.classList.remove('active');
    });
    
    document.body.appendChild(toggle);
    document.body.appendChild(overlay);

    // 2. Real Session Verification (Local First)
    let session = null;
    try {
      // Use race to prevent hanging if Supabase is unreachable
      const sessionRes = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 3000))
      ]);
      session = sessionRes.data?.session;
    } catch (e) {
      console.warn('Auth check skipped/failed:', e);
    }
    
    // Do NOT force logout on missing Supabase session to support offline apps
    if (session) {
      const localUser = storage.getCurrentUser();
      if (!localUser) {
        // Sync in background
        storage.syncFromSupabase();
      }
    }

    // 3. Perform First Navigation
    const user = storage.getCurrentUser();
    let hash = (window.location.hash || '').replace('#', '');
    
    if (!hash) {
      hash = user?.isSuperAdmin ? 'super-admin' : 'dashboard';
    }

    console.log(`📍 Boot Navulating to: ${hash}`);

    // Navigate to login if not authenticated
    if (!user && hash !== 'login' && hash !== 'register-shop') {
      navigateTo('login');
    } else {
      navigateTo(hash || 'dashboard');
    }

    // 4. Background Maintenance
    storage.migrateLocalToSupabase();
    console.log('✅ Boot sequence finished.');
  } catch (err) {
    console.error('❌ CRITICAL BOOT ERROR:', err);
    // Ultimate fallback to prevent total blank screen
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = 'login';
    }
  }
  
  storage.setupRealtime();

  // Listen for realtime Supabase Updates
  window.addEventListener('supabase-synced', () => {
    navigateTo(currentPage);
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) renderSidebar(sidebarEl);
  });

  // 🔔 Instant notification for new portal bookings (via Supabase Realtime)
  window.addEventListener('new-portal-booking', (e) => {
    const apt = e.detail;
    const title = `📲 Booking Baru dari Portal!`;
    const body = `${apt.customerName || 'Pelanggan'} - ${apt.serviceName || 'Layanan'} (${apt.time || ''})`;

    // Toast notification
    showToast(`${title} ${body}`, 'info', 10000);

    // Sound alert
    playNotificationSound();

    // Browser notification
    sendBrowserNotification(title, body);

    // Electron native notification
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(title, body);
    }

    // Refresh current page to show updated data
    navigateTo(currentPage);
    renderSidebar(document.getElementById('sidebar'));
  });

  // Request browser notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Handle hash change
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(page);
  });

  // Sync between tabs (Portal -> Admin)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigateTo(currentPage);
      renderSidebar(document.getElementById('sidebar'));
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('appointments')) {
      navigateTo(currentPage);
      renderSidebar(document.getElementById('sidebar'));
    }
  });

  // Check for reminders periodically
  checkReminders();
  setInterval(checkReminders, 60000); // every minute
}

// Check upcoming appointment reminders
function checkReminders() {
  const appointments = storage.getAll('appointments');
  const now = new Date();

  appointments.forEach(apt => {
    if (apt.status === 'done' || apt.status === 'cancelled') return;

    const aptTime = new Date(`${apt.date}T${apt.time}:00`);
    const diffMs = aptTime - now;
    const diffMins = Math.floor(diffMs / 60000);

    // Reminder 60 minutes before
    if (diffMins > 55 && diffMins <= 60) {
      showToast(`⏰ ${apt.customerName} punya janji 1 jam lagi (${apt.time})`, 'warning', 10000);
      sendBrowserNotification(`⏰ Janji 1 jam lagi`, `${apt.customerName} - ${apt.serviceName} jam ${apt.time}`);
    }

    // Reminder 15 minutes before
    if (diffMins > 10 && diffMins <= 15) {
      showToast(`🔔 ${apt.customerName} akan segera datang! (${apt.time})`, 'info', 10000);
      sendBrowserNotification(`🔔 Janji segera!`, `${apt.customerName} akan datang jam ${apt.time}`);
    }
  });

  checkNewPortalBookings();
}

// Check for new pending bookings from portal
function checkNewPortalBookings() {
  const appointments = storage.getAll('appointments');
  const pending = appointments.filter(a => a.status === 'pending' && a.source === 'portal');

  if (pending.length === 0) return;

  const lastCheck = sessionStorage.getItem('lastPortalBookCheck') || '0';
  const newBookings = pending.filter(a => new Date(a.createdAt) > new Date(parseInt(lastCheck)));

  if (newBookings.length > 0) {
    const latest = newBookings[0];
    const title = `📲 Booking Baru!`;
    const body = `${latest.customerName} - ${latest.serviceName} (${latest.time})`;

    sendBrowserNotification(title, body);
    playNotificationSound();
    showToast(`${title} ${body}`, 'info', 8000);

    sessionStorage.setItem('lastPortalBookCheck', Date.now().toString());
  }
}

// Sound Alert
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch { }
}

// Send browser notification
function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'barberpro-reminder',
    });
  }
}

// 🚀 Global Event Delegation for Logout (Persistent & Responsive)
document.addEventListener('click', async (e) => {
  const logoutBtn = e.target.closest('#logout-btn') || e.target.closest('#master-logout-btn');
  if (logoutBtn) {
    e.preventDefault();
    e.stopPropagation();

    // Visual feedback: notify the user that logout is in progress
    const originalText = logoutBtn.innerHTML;
    logoutBtn.disabled = true;
    logoutBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span style="margin-left: 8px;">MENINGGALKAN ATELIER...</span>`;

    try {
      await storage.logout();
    } catch (err) {
      console.error('Logout failure:', err);
      logoutBtn.disabled = false;
      logoutBtn.innerHTML = originalText;
      showToast('Gagal keluar. Silakan coba lagi.', 'danger');
    }
  }
});

// Boot
document.addEventListener('DOMContentLoaded', initApp);
