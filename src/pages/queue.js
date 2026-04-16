// ========================================
// Queue Page
// Real-time queue system
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { showToast } from '../components/toast.js';
import { whatsapp } from '../components/whatsapp.js';

export function renderQueue(container) {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const appointments = storage.getAll('appointments')
        .filter(a => a.date === todayStr && a.status !== 'cancelled')
        .sort((a, b) => a.time.localeCompare(b.time));

    // Determine queue state
    const done = appointments.filter(a => a.status === 'done');
    const active = appointments.filter(a => a.status !== 'done');

    // Find current (first not done that's past or current time)
    let currentIdx = -1;
    let nextIdx = -1;
    for (let i = 0; i < active.length; i++) {
        if (active[i].time <= currentTime) {
            currentIdx = i;
        }
    }
    nextIdx = currentIdx + 1 < active.length ? currentIdx + 1 : -1;

    const totalWait = active.length > 0 ? active.reduce((sum, a) => sum + (a.duration || 30), 0) : 0;

    container.innerHTML = `
    <div class="page-header">
      <h2>Antrian Hari Ini</h2>
      <p>${dateUtils.formatDate(now, 'day')}, ${dateUtils.formatDate(now, 'long')} • ${currentTime} WITA</p>
    </div>

    <div class="stats-grid stagger" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));">
      <div class="card stat-card" style="padding: 16px;">
        <div class="stat-icon gold" style="width: 40px; height: 40px; font-size: 18px;"><i class="fas fa-users-line"></i></div>
        <div class="stat-info">
          <h3 style="font-size: 20px;">${appointments.length}</h3>
          <p>Total Antrian</p>
        </div>
      </div>
      <div class="card stat-card" style="padding: 16px;">
        <div class="stat-icon green" style="width: 40px; height: 40px; font-size: 18px;"><i class="fas fa-check-circle"></i></div>
        <div class="stat-info">
          <h3 style="font-size: 20px;">${done.length}</h3>
          <p>Selesai</p>
        </div>
      </div>
      <div class="card stat-card" style="padding: 16px;">
        <div class="stat-icon blue" style="width: 40px; height: 40px; font-size: 18px;"><i class="fas fa-hourglass-half"></i></div>
        <div class="stat-info">
          <h3 style="font-size: 20px;">${active.length}</h3>
          <p>Menunggu</p>
        </div>
      </div>
      <div class="card stat-card" style="padding: 16px;">
        <div class="stat-icon purple" style="width: 40px; height: 40px; font-size: 18px;"><i class="fas fa-clock"></i></div>
        <div class="stat-info">
          <h3 style="font-size: 20px;">~${totalWait}m</h3>
          <p>Est. Total</p>
        </div>
      </div>
    </div>

    <!-- Active Queue -->
    <div class="card" style="margin-bottom: 16px;">
      <h3 style="margin-bottom: 16px; font-size: 16px;">
        <i class="fas fa-list-ol" style="color: var(--accent);"></i> Antrian Aktif
      </h3>
      ${active.length > 0 ? `
        <div class="queue-list">
          ${active.map((apt, i) => {
      const isCurrent = i === currentIdx;
      const isNext = i === nextIdx;
      const customer = storage.find('customers', apt.customerId);

      return `
              <div class="queue-item ${isCurrent ? 'current' : isNext ? 'next' : ''}">
                <div class="queue-number" style="${isCurrent ? 'background: var(--success); color: #fff;' : isNext ? 'background: var(--accent); color: var(--text-inverse);' : ''}">
                  ${i + 1}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div class="fw-600" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${apt.customerName}</div>
                  <div class="text-sm text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${apt.serviceName} • ${apt.barberName} • ${apt.time}
                  </div>
                  ${isCurrent ? '<div class="text-sm" style="color: var(--success);">🟢 Sedang dilayani</div>' : ''}
                  ${isNext ? '<div class="text-sm" style="color: var(--accent);">⏳ Selanjutnya</div>' : ''}
                </div>
                <div style="display: flex; gap: 4px; flex-shrink: 0;">
                  <button class="btn btn-ghost btn-sm" title="WhatsApp" onclick="window.__queueWA('${apt.id}')">
                    <i class="fab fa-whatsapp" style="color: #25d366;"></i>
                  </button>
                  <button class="btn btn-ghost btn-sm" title="Selesai" onclick="window.__queueDone('${apt.id}')">
                    <i class="fas fa-check" style="color: var(--success);"></i>
                  </button>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding: 30px;">
          <i class="fas fa-check-circle" style="color: var(--success);"></i>
          <p>Semua antrian selesai! 🎉</p>
        </div>
      `}
    </div>

    <!-- Completed -->
    <div class="card" style="margin-bottom: 16px;">
      <h3 style="margin-bottom: 16px; font-size: 16px;">
        <i class="fas fa-check-double" style="color: var(--success);"></i> Selesai (${done.length})
      </h3>
      ${done.length > 0 ? `
        <div class="queue-list">
          ${done.map(apt => `
            <div class="queue-item" style="opacity: 0.6; border-left-color: var(--success);">
              <div class="queue-number" style="background: var(--success-bg);">
                <i class="fas fa-check" style="color: var(--success); font-size: 12px;"></i>
              </div>
              <div style="flex: 1; min-width: 0;">
                <div class="fw-600">${apt.customerName}</div>
                <div class="text-sm text-muted">
                  ${apt.serviceName} • ${apt.time}
                  ${apt.rating > 0 ? ` • ${'⭐'.repeat(apt.rating)}` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `<p class="text-muted text-sm">Belum ada yang selesai</p>`}
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <button class="btn btn-secondary" id="refresh-queue">
        <i class="fas fa-sync-alt"></i> Refresh Antrian
      </button>
    </div>
  `;

    container.querySelector('#refresh-queue').addEventListener('click', () => renderQueue(container));

    window.__queueWA = (id) => {
        const apt = storage.find('appointments', id);
        const customer = storage.find('customers', apt?.customerId);
        if (apt && customer) {
            const msg = `Halo ${customer.name}! 👋\n\nGiliran Anda segera tiba di BarberPro Studio.\n⏰ Jadwal: ${apt.time}\n💇 Layanan: ${apt.serviceName}\n\nMohon bersiap-siap ya! 😊`;
            whatsapp.sendCustom(customer.phone, msg);
        }
    };

    window.__queueDone = (id) => {
        storage.update('appointments', id, { status: 'done' });
        showToast('Pelanggan selesai dilayani! ✂️', 'success');
        renderQueue(container);
    };
}
