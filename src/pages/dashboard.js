// ========================================
// Dashboard Page
// Calendar, stats, appointments, reminders
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { whatsapp } from '../components/whatsapp.js';
import { navigateTo } from '../main.js';
import { supabase } from '../utils/supabaseClient.js';

let calendarYear, calendarMonth;

export function renderDashboard(container) {
  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth();

  const appointments = storage.getAll('appointments');
  const customers = storage.getAll('customers');
  const todayStr = now.toISOString().split('T')[0];

  // Stats
  const todayAppts = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled');
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekAppts = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= weekStart && d <= now && a.status !== 'cancelled';
  });
  const monthRevenue = appointments
    .filter(a => a.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`) && a.status === 'done')
    .reduce((sum, a) => sum + (a.paymentAmount || 0), 0);

  // Upcoming (not done/cancelled)
  const upcoming = appointments
    .filter(a => a.date >= todayStr && a.status !== 'done' && a.status !== 'cancelled')
    .sort((a, b) => (`${a.date}${a.time}`).localeCompare(`${b.date}${b.time}`));

  // Birthday reminders
  const todayMMDD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const birthdayCustomers = customers.filter(c => c.birthday && c.birthday.slice(5) === todayMMDD);

  const user = storage.getCurrentUser();
  const isSuperAdmin = user?.isSuperAdmin || false;

  container.innerHTML = `
    ${isSuperAdmin ? `
      <div class="card" style="background: var(--accent-subtle); border: 1px dashed var(--accent); margin-bottom: 24px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 20px;">🛡️</div>
          <div>
            <div class="fw-700 text-accent">Mode Master Aktif</div>
            <p class="text-xs text-muted">Anda sedang melihat data spesifik toko ini. Fitur edit mungkin terbatas.</p>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.location.hash='super-admin'">
          <i class="fas fa-arrow-left"></i> Kembali ke Master Hub
        </button>
      </div>
    ` : ''}

    <div class="page-header">
      <h2>Dashboard</h2>
      <p>${dateUtils.formatDate(now, 'day')}, ${dateUtils.formatDate(now, 'long')}</p>
    </div>

    <!-- Attendance Widget (Dynamic by Role) -->
    <div id="dashboard-attendance-container" style="margin-bottom: 24px;"></div>

    <!-- Stats -->
    <div class="stats-grid stagger">
      <div class="card stat-card">
        <div class="stat-icon gold"><i class="fas fa-calendar-check"></i></div>
        <div class="stat-info">
          <h3>${todayAppts.length}</h3>
          <p>Janji Hari Ini</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon blue"><i class="fas fa-calendar-week"></i></div>
        <div class="stat-info">
          <h3>${weekAppts.length}</h3>
          <p>Minggu Ini</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon green"><i class="fas fa-money-bill-wave"></i></div>
        <div class="stat-info">
          <h3>${formatter.currency(monthRevenue)}</h3>
          <p>Pendapatan Bulan Ini</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon purple"><i class="fas fa-users"></i></div>
        <div class="stat-info">
          <h3>${customers.length}</h3>
          <p>Total Pelanggan</p>
        </div>
      </div>
    </div>

    <!-- Birthday Alert -->
    ${birthdayCustomers.length > 0 ? `
      <div class="card" style="border-left: 3px solid var(--warning); margin-bottom: 20px; padding: 16px 20px;">
        <div class="flex gap-sm" style="align-items: center;">
          <span style="font-size: 24px;">🎂</span>
          <div style="flex: 1;">
            <strong>Ulang Tahun Hari Ini!</strong>
            <p class="text-sm text-muted">${birthdayCustomers.map(c => c.name).join(', ')}</p>
          </div>
          ${birthdayCustomers.map(c => `
            <button class="btn btn-wa btn-sm" onclick="window.__sendBirthdayWA('${c.id}')">
              <i class="fab fa-whatsapp"></i> Kirim Ucapan
            </button>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- AI Advisor -->
    ${renderAIAdvisor(appointments, customers, storage.get('settings', {}))}

    <!-- Pending Portal Bookings -->
    ${renderPendingBookings(appointments)}

    <!-- Target Progress -->
    ${renderTargetSection(appointments, customers, now)}

    <!-- Monthly Revenue Trend -->
    ${renderMonthlyTrend(appointments)}

    <!-- Analytics Row -->
    <div class="grid-2" style="align-items: start; margin-bottom: 20px;">
      ${renderPeakHoursHeatmap(appointments)}
      ${renderBarberPerformance(appointments)}
    </div>

    <div class="grid-2" style="align-items: start;">
      <!-- Calendar -->
      <div class="calendar-container" id="dashboard-calendar"></div>

      <!-- Today's Appointments + Upcoming -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Next Appointment -->
        ${upcoming.length > 0 ? `
          <div class="card" style="border: 1px solid var(--accent); background: linear-gradient(135deg, var(--bg-card), rgba(212,168,67,0.05));">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">
              <i class="fas fa-bell" style="color: var(--accent);"></i>
              <span class="fw-600 text-accent">Janji Berikutnya</span>
            </div>
            <div class="flex-between">
              <div>
                <h3 style="font-size: 18px;">${upcoming[0].customerName}</h3>
                <p class="text-sm text-muted">${upcoming[0].serviceName} • ${upcoming[0].barberName}</p>
                <p class="text-sm" style="margin-top: 4px;">
                  <i class="fas fa-clock" style="color: var(--accent);"></i>
                  ${dateUtils.formatDate(upcoming[0].date, 'short')} - ${upcoming[0].time}
                  <span class="badge badge-info" style="margin-left: 6px;">${dateUtils.getRelativeTime(upcoming[0].date + 'T' + upcoming[0].time)}</span>
                </p>
              </div>
              <button class="btn btn-wa btn-sm" id="wa-next-btn">
                <i class="fab fa-whatsapp"></i>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Today's Schedule -->
        <div class="card">
          <div class="flex-between mb-md">
            <span class="fw-700">Jadwal Hari Ini</span>
            <span class="badge badge-gold">${todayAppts.length} janji</span>
          </div>
          ${todayAppts.length > 0 ? `
            <div class="queue-list">
              ${todayAppts.sort((a, b) => a.time.localeCompare(b.time)).map(apt => `
                <div class="queue-item ${apt.status === 'done' ? '' : (apt.status === 'confirmed' ? 'next' : '')}">
                  <div class="queue-number">${apt.time}</div>
                  <div style="flex: 1;">
                    <div class="fw-600">${apt.customerName}</div>
                    <div class="text-sm text-muted">${apt.serviceName}</div>
                  </div>
                  <span class="badge ${apt.status === 'done' ? 'badge-success' : apt.status === 'confirmed' ? 'badge-info' : 'badge-warning'}">
                    ${apt.status === 'done' ? 'Selesai' : apt.status === 'confirmed' ? 'Dikonfirmasi' : 'Terjadwal'}
                  </span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state" style="padding: 30px;">
              <i class="fas fa-calendar-day"></i>
              <p>Tidak ada janji hari ini</p>
            </div>
          `}
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <span class="fw-700" style="display: block; margin-bottom: 12px;">Aksi Cepat</span>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" id="quick-add-appt">
              <i class="fas fa-plus"></i> Janji Baru
            </button>
            <button class="btn btn-secondary btn-sm" id="quick-add-customer">
              <i class="fas fa-user-plus"></i> Pelanggan Baru
            </button>
            <button class="btn btn-wa btn-sm" id="quick-send-reminders">
              <i class="fab fa-whatsapp"></i> Kirim Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render calendar
  renderCalendar(container.querySelector('#dashboard-calendar'));
  
  // Render Attendance Widget
  renderAttendanceWidget(container.querySelector('#dashboard-attendance-container'));

  // Event listeners
  container.querySelector('#quick-add-appt')?.addEventListener('click', () => navigateTo('appointments'));
  container.querySelector('#quick-add-customer')?.addEventListener('click', () => navigateTo('customers'));
  container.querySelector('#quick-send-reminders')?.addEventListener('click', () => {
    sendTodayReminders();
  });

  if (upcoming.length > 0) {
    container.querySelector('#wa-next-btn')?.addEventListener('click', () => {
      const customer = storage.find('customers', upcoming[0].customerId);
      if (customer) whatsapp.sendReminder(upcoming[0], customer);
    });
  }

  // Birthday WA
  window.__sendBirthdayWA = (customerId) => {
    const customer = storage.find('customers', customerId);
    if (customer) whatsapp.sendBirthdayGreeting(customer);
  };
}

function renderCalendar(container) {
  const appointments = storage.getAll('appointments');
  const daysInMonth = dateUtils.getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = dateUtils.getFirstDayOfMonth(calendarYear, calendarMonth);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Count appointments per day
  const aptsByDate = {};
  appointments.forEach(a => {
    if (a.status === 'cancelled') return;
    if (!aptsByDate[a.date]) aptsByDate[a.date] = [];
    aptsByDate[a.date].push(a);
  });

  let daysHTML = '';
  // Day headers
  ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].forEach(d => {
    daysHTML += `<div class="calendar-day-header">${d}</div>`;
  });

  // Previous month padding
  const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
  const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
  const daysInPrev = dateUtils.getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDay - 1; i >= 0; i--) {
    daysHTML += `<div class="calendar-day other-month"><span class="day-number">${daysInPrev - i}</span></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayAppts = aptsByDate[dateStr] || [];

    let dotsHTML = '';
    if (dayAppts.length > 0) {
      dotsHTML = '<div class="day-dots">';
      dayAppts.slice(0, 4).forEach(a => {
        const cls = a.status === 'done' ? 'confirmed' : a.status === 'confirmed' ? 'confirmed' : 'pending';
        dotsHTML += `<div class="day-dot ${cls}"></div>`;
      });
      dotsHTML += '</div>';
    }

    daysHTML += `<div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
      <span class="day-number">${d}</span>
      ${dotsHTML}
    </div>`;
  }

  // Next month padding
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    daysHTML += `<div class="calendar-day other-month"><span class="day-number">${i}</span></div>`;
  }

  container.innerHTML = `
    <div class="calendar-header">
      <h3>${dateUtils.getMonthName(calendarMonth)} ${calendarYear}</h3>
      <div class="calendar-nav">
        <button id="cal-prev"><i class="fas fa-chevron-left"></i></button>
        <button id="cal-today" style="font-size: 12px; width: auto; padding: 0 10px;">Hari Ini</button>
        <button id="cal-next"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
    <div class="calendar-grid">${daysHTML}</div>
  `;

  // Calendar navigation
  container.querySelector('#cal-prev').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar(container);
  });

  container.querySelector('#cal-next').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar(container);
  });

  container.querySelector('#cal-today').addEventListener('click', () => {
    calendarYear = today.getFullYear();
    calendarMonth = today.getMonth();
    renderCalendar(container);
  });

  // Click date to view appointments
  container.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
    day.addEventListener('click', () => {
      const date = day.dataset.date;
      if (date) showDateAppointments(date);
    });
  });
}

function showDateAppointments(date) {
  const appointments = storage.getAll('appointments').filter(a => a.date === date && a.status !== 'cancelled');
  const { openModal } = require_modal();

  let body = `<p class="text-muted mb-md">${dateUtils.formatDate(date, 'long')}</p>`;

  if (appointments.length === 0) {
    body += `<div class="empty-state" style="padding: 20px;"><p>Tidak ada janji di tanggal ini</p></div>`;
  } else {
    body += '<div class="queue-list">';
    appointments.sort((a, b) => a.time.localeCompare(b.time)).forEach(apt => {
      body += `
        <div class="queue-item">
          <div class="queue-number">${apt.time}</div>
          <div style="flex: 1;">
            <div class="fw-600">${apt.customerName}</div>
            <div class="text-sm text-muted">${apt.serviceName} • ${apt.barberName}</div>
          </div>
          <span class="badge ${apt.status === 'done' ? 'badge-success' : 'badge-info'}">
            ${apt.status === 'done' ? 'Selesai' : 'Aktif'}
          </span>
        </div>
      `;
    });
    body += '</div>';
  }

  openModal(`Janji - ${dateUtils.formatDate(date, 'short')}`, body);
}

function require_modal() {
  return {
    openModal: (title, body) => {
      import('../components/modal.js').then(m => m.openModal(title, body));
    }
  };
}

function sendTodayReminders() {
  const todayStr = new Date().toISOString().split('T')[0];
  const appointments = storage.getAll('appointments')
    .filter(a => a.date === todayStr && a.status !== 'done' && a.status !== 'cancelled');

  if (appointments.length === 0) {
    import('../components/toast.js').then(m => m.showToast('Tidak ada janji aktif hari ini', 'info'));
    return;
  }

  appointments.forEach((apt, i) => {
    const customer = storage.find('customers', apt.customerId);
    if (customer) {
      setTimeout(() => whatsapp.sendReminder(apt, customer), i * 1000);
    }
  });
}

function renderTargetSection(appointments, customers, now) {
  const settings = storage.get('settings', {});
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthAppts = appointments.filter(a => a.date?.startsWith(monthStr) && a.status !== 'cancelled');
  const monthRevenue = appointments
    .filter(a => a.date?.startsWith(monthStr) && a.status === 'done')
    .reduce((s, a) => s + (a.paymentAmount || 0), 0);
  const newCustomers = customers.filter(c => c.firstVisit?.startsWith(monthStr)).length;

  const revenueTarget = settings.revenueTarget || 5000000;
  const customerTarget = settings.newCustomerTarget || 10;
  const appointmentTarget = settings.appointmentTarget || 100;

  const revPct = Math.min(Math.round((monthRevenue / revenueTarget) * 100), 150);
  const custPct = Math.min(Math.round((newCustomers / customerTarget) * 100), 150);
  const apptPct = Math.min(Math.round((monthAppts.length / appointmentTarget) * 100), 150);

  return `
    <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
      <div class="card target-card" style="padding: 16px 18px;">
        <div class="flex-between">
          <span class="text-sm fw-600">💰 Target Pendapatan</span>
          <span class="text-sm ${revPct >= 100 ? 'text-accent' : 'text-muted'}">${revPct}%</span>
        </div>
        <div class="flex-between mt-sm">
          <span class="fw-700">${formatter.currency(monthRevenue)}</span>
          <span class="text-sm text-muted">/ ${formatter.currency(revenueTarget)}</span>
        </div>
        <div class="target-progress">
          <div class="target-progress-bar ${revPct >= 100 ? 'green' : ''}" style="width: ${Math.min(revPct, 100)}%;"></div>
        </div>
      </div>
      <div class="card target-card" style="padding: 16px 18px;">
        <div class="flex-between">
          <span class="text-sm fw-600">👥 Pelanggan Baru</span>
          <span class="text-sm ${custPct >= 100 ? 'text-accent' : 'text-muted'}">${custPct}%</span>
        </div>
        <div class="flex-between mt-sm">
          <span class="fw-700">${newCustomers} orang</span>
          <span class="text-sm text-muted">/ ${customerTarget}</span>
        </div>
        <div class="target-progress">
          <div class="target-progress-bar ${custPct >= 100 ? 'green' : ''}" style="width: ${Math.min(custPct, 100)}%;"></div>
        </div>
      </div>
      <div class="card target-card" style="padding: 16px 18px;">
        <div class="flex-between">
          <span class="text-sm fw-600">📅 Total Janji</span>
          <span class="text-sm ${apptPct >= 100 ? 'text-accent' : 'text-muted'}">${apptPct}%</span>
        </div>
        <div class="flex-between mt-sm">
          <span class="fw-700">${monthAppts.length}</span>
          <span class="text-sm text-muted">/ ${appointmentTarget}</span>
        </div>
        <div class="target-progress">
          <div class="target-progress-bar ${apptPct >= 100 ? 'green' : ''}" style="width: ${Math.min(apptPct, 100)}%;"></div>
        </div>
      </div>
    </div>
  `;
}

function renderMonthlyTrend(appointments) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const revenue = appointments
      .filter(a => a.date?.startsWith(monthStr) && a.status === 'done')
      .reduce((s, a) => s + (a.paymentAmount || 0), 0);
    const count = appointments.filter(a => a.date?.startsWith(monthStr) && a.status !== 'cancelled').length;
    months.push({
      label: dateUtils.getMonthShort(d.getMonth()),
      revenue,
      count
    });
  }

  const maxRevenue = Math.max(...months.map(m => m.revenue), 1);

  return `
    <div class="card" style="margin-bottom: 20px;">
      <div class="flex-between" style="margin-bottom: 14px;">
        <h3 style="font-size: 15px;"><i class="fas fa-chart-bar" style="color: var(--accent);"></i> Tren 6 Bulan Terakhir</h3>
      </div>
      <div style="display: flex; align-items: flex-end; gap: 10px; height: 120px;">
        ${months.map(m => `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%;">
            <div class="text-sm fw-600" style="color: var(--accent);">${m.revenue > 0 ? (m.revenue >= 1000000 ? (m.revenue / 1000000).toFixed(1) + 'jt' : Math.round(m.revenue / 1000) + 'rb') : '-'}</div>
            <div style="flex: 1; width: 100%; display: flex; align-items: flex-end;">
              <div style="width: 100%; height: ${Math.max((m.revenue / maxRevenue) * 100, 4)}%; background: linear-gradient(to top, var(--accent-dark), var(--accent-light)); border-radius: 6px 6px 0 0; min-height: 4px;"></div>
            </div>
            <div class="text-sm text-muted">${m.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPendingBookings(appointments) {
  const pending = appointments.filter(a => a.status === 'pending' && a.source === 'portal');
  if (pending.length === 0) return '';

  // Play sound for new bookings
  try {
    const lastCheck = sessionStorage.getItem('lastPendingCheck') || '0';
    const newBookings = pending.filter(a => new Date(a.createdAt) > new Date(parseInt(lastCheck)));
    if (newBookings.length > 0) {
      playNotificationSound();
      sessionStorage.setItem('lastPendingCheck', Date.now().toString());
    }
  } catch { }

  return `
    <div class="card" style="border-left: 3px solid var(--info); margin-bottom: 20px; padding: 0;">
      <div style="padding: 16px 20px; border-bottom: 1px solid var(--border);">
        <div class="flex-between">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">📲</span>
            <strong>Booking dari Portal</strong>
            <span class="badge badge-info">${pending.length} pending</span>
          </div>
        </div>
      </div>
      <div style="padding: 0;">
        ${pending.map(apt => `
          <div style="padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 14px;">
            <div style="flex: 1;">
              <div class="fw-600">${apt.customerName}</div>
              <div class="text-sm text-muted">
                ${apt.serviceName} • ${apt.barberName} • ${dateUtils.formatDate(apt.date, 'short')} ${apt.time}
              </div>
              <div class="text-sm text-muted">📱 ${apt.customerPhone || ''} ${apt.bookingCode ? `• Kode: ${apt.bookingCode}` : ''}</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-success btn-sm" onclick="window.__approveBooking('${apt.id}')">
                <i class="fas fa-check"></i> Terima
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.__rejectBooking('${apt.id}')">
                <i class="fas fa-times"></i> Tolak
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

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

// Global approve/reject handlers
window.__approveBooking = function (id) {
  const apt = storage.find('appointments', id);
  if (!apt) return;
  storage.update('appointments', id, { status: 'confirmed' });

  // Send WA
  if (apt.customerPhone) {
    const phone = apt.customerPhone.replace(/\D/g, '');
    const msg = `Halo ${apt.customerName}! ✅\n\nBooking Anda telah DITERIMA!\n\n📅 ${dateUtils.formatDate(apt.date, 'short')}\n⏰ ${apt.time}\n💇 ${apt.serviceName}\n💈 ${apt.barberName}\n${apt.bookingCode ? `🔖 Kode: ${apt.bookingCode}` : ''}\n\nSampai jumpa! 😊`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  import('../components/toast.js').then(m => m.showToast('Booking diterima! ✅', 'success'));
  renderDashboard(document.getElementById('page-container'));
};

window.__rejectBooking = function (id) {
  const apt = storage.find('appointments', id);
  if (!apt) return;
  storage.update('appointments', id, { status: 'rejected' });

  if (apt.customerPhone) {
    const phone = apt.customerPhone.replace(/\D/g, '');
    const msg = `Halo ${apt.customerName},\n\nMohon maaf, booking Anda untuk tanggal ${dateUtils.formatDate(apt.date, 'short')} jam ${apt.time} tidak dapat kami terima saat ini.\n\nSilakan pilih jadwal lain melalui portal kami. Terima kasih 🙏`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  import('../components/toast.js').then(m => m.showToast('Booking ditolak', 'warning'));
  renderDashboard(document.getElementById('page-container'));
};

// === Peak Hours Heatmap ===
function renderPeakHoursHeatmap(appointments) {
  const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const hours = [];
  for (let h = 8; h <= 20; h++) hours.push(`${String(h).padStart(2, '0')}:00`);

  // Build matrix [day][hour] = count
  const matrix = Array.from({ length: 7 }, () => Array(hours.length).fill(0));
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

  appointments.filter(a => a.status !== 'cancelled' && new Date(a.date) >= thirtyDaysAgo).forEach(a => {
    const d = new Date(a.date);
    const day = d.getDay();
    const hour = parseInt(a.time?.split(':')[0] || '0');
    const hIdx = hour - 8;
    if (hIdx >= 0 && hIdx < hours.length) matrix[day][hIdx]++;
  });

  const maxVal = Math.max(...matrix.flat(), 1);

  return `
    <div class="card">
      <h3 style="font-size: 15px; margin-bottom: 14px;">
        <i class="fas fa-fire" style="color: var(--danger);"></i> Peak Hours (30 Hari)
      </h3>
      <div style="overflow-x: auto;">
        <div style="display: grid; grid-template-columns: 40px repeat(${hours.length}, 1fr); gap: 2px; min-width: 400px;">
          <div></div>
          ${hours.map(h => `<div style="text-align: center; font-size: 9px; color: var(--text-muted);">${h.split(':')[0]}</div>`).join('')}
          ${daysShort.map((day, di) => `
            <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center;">${day}</div>
            ${matrix[di].map(val => {
    const intensity = val / maxVal;
    const bg = val === 0 ? 'var(--bg-input)' : `rgba(212, 168, 67, ${0.15 + intensity * 0.85})`;
    return `<div style="aspect-ratio: 1; border-radius: 3px; background: ${bg}; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: ${intensity > 0.5 ? '#0f1117' : 'var(--text-muted)'};" title="${day} ${hours[matrix[di].indexOf(val)]}: ${val}">${val || ''}</div>`;
  }).join('')}
          `).join('')}
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; margin-top: 10px; justify-content: flex-end;">
        <span style="font-size: 10px; color: var(--text-muted);">Sepi</span>
        ${[0.1, 0.3, 0.5, 0.7, 1].map(i => `<div style="width: 14px; height: 14px; border-radius: 2px; background: rgba(212, 168, 67, ${0.15 + i * 0.85});"></div>`).join('')}
        <span style="font-size: 10px; color: var(--text-muted);">Ramai</span>
      </div>
    </div>
  `;
}

// === Barber Performance ===
function renderBarberPerformance(appointments) {
  const barbers = storage.getAll('barbers');
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = barbers.map(b => {
    const monthAppts = appointments.filter(a => a.barberId === b.id && a.date?.startsWith(monthStr) && a.status === 'done');
    const revenue = monthAppts.reduce((s, a) => s + (a.paymentAmount || 0), 0);
    const rated = monthAppts.filter(a => a.rating > 0);
    const avgRating = rated.length > 0 ? (rated.reduce((s, a) => s + a.rating, 0) / rated.length) : (b.rating || 0);
    return { ...b, monthCuts: monthAppts.length, monthRevenue: revenue, avgRating };
  }).sort((a, b) => b.monthRevenue - a.monthRevenue);

  const maxRev = Math.max(...stats.map(s => s.monthRevenue), 1);

  return `
    <div class="card">
      <h3 style="font-size: 15px; margin-bottom: 14px;">
        <i class="fas fa-trophy" style="color: var(--warning);"></i> Performa Barber (Bulan Ini)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${stats.map((b, i) => `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${i === 0 ? 'var(--accent)' : 'var(--bg-input)'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: ${i === 0 ? '#0f1117' : 'var(--text-muted)'}; flex-shrink: 0;">${i + 1}</div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span class="fw-600 text-sm">${b.name}</span>
                <span class="text-sm" style="color: var(--accent);">${formatter.currency(b.monthRevenue)}</span>
              </div>
              <div style="height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${(b.monthRevenue / maxRev) * 100}%; background: linear-gradient(90deg, var(--accent-dark), var(--accent-light)); border-radius: 3px; transition: width 0.5s ease;"></div>
              </div>
              <div class="text-sm text-muted" style="margin-top: 2px;">${b.monthCuts} potong · ${'⭐'.repeat(Math.round(b.avgRating))} ${b.avgRating.toFixed(1)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// === AI Financial Advisor ===
function renderAIAdvisor(appointments, customers, settings) {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Logic 1: Revenue vs Target
  const monthRevenue = appointments
    .filter(a => a.date?.startsWith(monthStr) && a.status === 'done')
    .reduce((sum, a) => sum + (a.paymentAmount || 0), 0);
  const revTarget = settings.revenueTarget || 5000000;
  const revPercent = (monthRevenue / revTarget) * 100;

  // Logic 2: Peak Hours Analysis
  const matrix = Array.from({ length: 7 }, () => Array(13).fill(0)); // 8:00 - 20:00
  appointments.filter(a => a.status !== 'cancelled').forEach(a => {
    const d = new Date(a.date);
    const hour = parseInt(a.time?.split(':')[0] || '0');
    if (hour >= 8 && hour <= 20) matrix[d.getDay()][hour - 8]++;
  });

  const insights = [];

  if (revPercent < 50 && now.getDate() > 15) {
    insights.push({
      title: "Target Pendapatan Terancam",
      desc: `Pendapatan baru ${Math.round(revPercent)}% sedangkan bulan sudah berjalan setengah. Coba kirim promo WhatsApp ke pelanggan setia!`,
      type: 'danger',
      icon: 'fa-chart-line'
    });
  } else if (revPercent > 90) {
    insights.push({
      title: "Hampir Mencapai Target",
      desc: `Luar biasa! Tersisa sedikit lagi untuk mencapai target bulan ini. Tetap semangat!`,
      type: 'success',
      icon: 'fa-medal'
    });
  }

  // Find quietest day/time
  let minCount = 999;
  let quietDay = 0;
  let quietHour = 8;
  matrix.forEach((dayRow, di) => {
    dayRow.forEach((count, hi) => {
      if (count < minCount) {
        minCount = count;
        quietDay = di;
        quietHour = hi + 8;
      }
    });
  });

  const daysShort = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  insights.push({
    title: "Slot Sepi Terdeteksi",
    desc: `Hari ${daysShort[quietDay]} jam ${quietHour}:00 biasanya sangat sepi. Pertimbangkan membuat "Happy Hour" di jam tersebut untuk menarik pelanggan.`,
    type: 'info',
    icon: 'fa-clock'
  });

  // Inventory logic (stub for now)
  const inventory = storage.getAll('inventory');
  const lowStock = inventory.filter(p => (p.stock || 0) <= (p.minStock || 5));
  if (lowStock.length > 0) {
    insights.push({
      title: "Stok Menipis",
      desc: `${lowStock.length} produk hampir habis (e.g., ${lowStock[0].name}). Segera lakukan restock!`,
      type: 'warning',
      icon: 'fa-box-open'
    });
  }

  return `
    <div class="card ai-advisor-card" style="margin-bottom: 20px; background: linear-gradient(135deg, var(--bg-card), rgba(212,168,67,0.08)); border: 1px solid var(--accent-glow);">
      <div class="flex-between mb-md">
        <h3 style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">🤖</span> AI Financial Advisor
        </h3>
        <span class="badge badge-gold">Premium</span>
      </div>
      
      <div class="insights-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        ${insights.length > 0 ? insights.map(i => `
          <div class="insight-item" style="display: flex; gap: 12px; padding: 12px; background: var(--bg-input); border-radius: var(--radius-sm); border-left: 3px solid var(--${i.type});">
            <div class="insight-icon" style="color: var(--${i.type}); font-size: 18px; margin-top: 2px;">
              <i class="fas ${i.icon}"></i>
            </div>
            <div>
              <div class="fw-700 text-sm" style="margin-bottom: 4px;">${i.title}</div>
              <p class="text-xs text-muted" style="line-height: 1.4;">${i.desc}</p>
            </div>
          </div>
        `).join('') : `
          <p class="text-sm text-muted">Belum ada saran saat ini. Terus kumpulkan data untuk mendapatkan insight!</p>
        `}
      </div>
    </div>
  `;
}

async function renderAttendanceWidget(container) {
  const user = storage.getCurrentUser();
  const role = user?.role || 'barber';
  const now = new Date();
  const today = [
      now.getFullYear(),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0')
  ].join('-');

  try {
    const { data: logs, error } = await supabase.from('attendance').select('*, profiles(full_name, username)').eq('date', today);
    if (error) throw error;

    if (role === 'admin') {
      const onlineCount = logs ? logs.filter(l => !l.check_out).length : 0;
      container.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--success); display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="stat-icon" style="background: var(--success-bg); color: var(--success); width: 44px; height: 44px; font-size: 18px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-user-check"></i>
            </div>
            <div>
              <div class="fw-700" style="font-size: 18px;">${onlineCount} Barber Online</div>
              <p class="text-sm text-muted">Staf sedang bekerja saat ini</p>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='attendance'">
            <i class="fas fa-list"></i> Lihat Laporan
          </button>
        </div>
      `;
    } else {
      const activeLog = logs ? logs.find(l => l.profile_id === user.id && !l.check_out) : null;
      container.innerHTML = `
        <div class="card" style="border-left: 4px solid ${activeLog ? 'var(--success)' : 'var(--warning)'}; display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="stat-icon" style="background: ${activeLog ? 'var(--success-bg)' : 'var(--warning-bg)'}; color: ${activeLog ? 'var(--success)' : 'var(--warning)'}; width: 44px; height: 44px; font-size: 18px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                <i class="fas ${activeLog ? 'fa-clock' : 'fa-door-open'}"></i>
            </div>
            <div>
              <div class="fw-700" style="font-size: 18px;">Status: ${activeLog ? 'Sedang Bekerja' : 'Belum Check-In'}</div>
              <p class="text-sm text-muted">${activeLog ? 'Mulai sejak ' + activeLog.check_in.substring(0, 5) : 'Silakan lakukan presensi hari ini'}</p>
            </div>
          </div>
          <button class="btn ${activeLog ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="window.location.hash='attendance'">
            <i class="fas fa-sign-in-alt"></i> ${activeLog ? 'Check-Out' : 'Check-In'}
          </button>
        </div>
      `;
    }
  } catch (err) {
    console.error('Widget error:', err);
  }
}
