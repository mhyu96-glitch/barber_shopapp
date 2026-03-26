// ========================================
// Attendance Page
// Clock in/out for barbers, shift logs
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { showToast } from '../components/toast.js';

export function renderAttendance(container) {
    const barbers = storage.getAll('barbers');
    const logs = storage.getAll('attendanceLogs');
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
    <div class="page-header">
      <h2>Presensi & Shift</h2>
      <p>Clock-in / Clock-out harian barber</p>
    </div>

    <div class="grid-2" style="align-items: start;">
      <!-- Clock Action -->
      <div class="card">
        <h3 style="margin-bottom: 18px;"><i class="fas fa-clock" style="color: var(--accent);"></i> Form Presensi</h3>
        <form id="attendance-form">
          <div class="form-group">
            <label>Pilih Barber</label>
            <select class="form-control" id="barber-select" required>
              <option value="">-- Pilih Nama Anda --</option>
              ${barbers.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
            </select>
          </div>
          
          <div id="barber-status-container" style="margin-bottom: 20px;">
             <!-- Status will be loaded here -->
             <p class="text-sm text-muted">Silakan pilih nama barber untuk melihat status saat ini.</p>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-primary" id="clock-in-btn" disabled>
              <i class="fas fa-sign-in-alt"></i> Clock In
            </button>
            <button type="button" class="btn btn-danger" id="clock-out-btn" disabled>
              <i class="fas fa-sign-out-alt"></i> Clock Out
            </button>
          </div>
        </form>
      </div>

      <!-- Today's Logs -->
      <div class="card">
        <h3 style="margin-bottom: 18px;"><i class="fas fa-list-ul" style="color: var(--info);"></i> Log Hari Ini</h3>
        <div class="queue-list" id="today-logs">
          ${renderLogs(logs, today, barbers)}
        </div>
      </div>
    </div>
  `;

    const barberSelect = container.querySelector('#barber-select');
    const statusContainer = container.querySelector('#barber-status-container');
    const clockInBtn = container.querySelector('#clock-in-btn');
    const clockOutBtn = container.querySelector('#clock-out-btn');

    barberSelect.addEventListener('change', () => {
        const barberId = barberSelect.value;
        if (!barberId) {
            statusContainer.innerHTML = '<p class="text-sm text-muted">Silakan pilih nama barber untuk melihat status saat ini.</p>';
            clockInBtn.disabled = true;
            clockOutBtn.disabled = true;
            return;
        }

        const lastLog = logs.filter(l => l.barberId === barberId && l.date === today).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        const isClockedIn = lastLog && !lastLog.clockOut;

        statusContainer.innerHTML = `
          <div class="badge ${isClockedIn ? 'badge-success' : 'badge-warning'}" style="margin-bottom: 8px;">
            Status: ${isClockedIn ? 'Bekerja (Online)' : 'Belum Mulai / Selesai'}
          </div>
          ${lastLog ? `<p class="text-xs text-muted">Aktivitas terakhir: ${lastLog.clockOut ? 'Clock Out pada ' + lastLog.clockOut : 'Clock In pada ' + lastLog.clockIn}</p>` : ''}
        `;

        clockInBtn.disabled = isClockedIn;
        clockOutBtn.disabled = !isClockedIn;
    });

    clockInBtn.addEventListener('click', () => {
        const barberId = barberSelect.value;
        const time = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });

        storage.add('attendanceLogs', {
            barberId,
            date: today,
            clockIn: time,
            clockOut: null
        });

        showToast('Berhasil Clock In! Selamat bekerja. ✂️', 'success');
        renderAttendance(container);
    });

    clockOutBtn.addEventListener('click', () => {
        const barberId = barberSelect.value;
        const time = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const lastLog = logs.filter(l => l.barberId === barberId && l.date === today && !l.clockOut).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

        if (lastLog) {
            storage.update('attendanceLogs', lastLog.id, { clockOut: time });
            showToast('Berhasil Clock Out! Terima kasih untuk hari ini. 🙏', 'success');
            renderAttendance(container);
        }
    });
}

function renderLogs(logs, date, barbers) {
    const todayLogs = logs.filter(l => l.date === date).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (todayLogs.length === 0) return '<p class="text-sm text-muted text-center py-20">Belum ada aktivitas hari ini</p>';

    return todayLogs.map(l => {
        const barber = barbers.find(b => b.id === l.barberId);
        return `
          <div class="queue-item">
            <div style="flex: 1;">
              <div class="fw-600">${barber?.name || 'Barber'}</div>
              <div class="text-xs text-muted">
                <i class="fas fa-sign-in-alt text-success"></i> ${l.clockIn} 
                ${l.clockOut ? ` • <i class="fas fa-sign-out-alt text-danger"></i> ${l.clockOut}` : ''}
              </div>
            </div>
            ${!l.clockOut ? '<span class="badge badge-success">Online</span>' : '<span class="badge badge-warning">Selesai</span>'}
          </div>
        `;
    }).join('');
}
