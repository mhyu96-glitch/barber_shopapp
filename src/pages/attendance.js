// ========================================
// Attendance Page — Enhanced
// Check-in/out, durasi, rekap, izin/sakit
// ========================================

import { storage, getShopId } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { dateUtils } from '../utils/dateUtils.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export function renderAttendance(container) {
    const user = storage.getCurrentUser();
    const role = user?.role || 'barber';
    const profileId = user?.id;
    const isBarber = role === 'barber';
    const now = new Date();
    const today = [
        now.getFullYear(),
        (now.getMonth() + 1).toString().padStart(2, '0'),
        now.getDate().toString().padStart(2, '0')
    ].join('-');

    container.innerHTML = `
    <div class="page-header flex-between">
      <div>
        <h2>Presensi Staf</h2>
        <p>Kelola jam kerja dan kehadiran tim Profesional</p>
      </div>
      <div style="display:flex;gap:8px;">
        ${isBarber ? `
          <button class="btn btn-secondary" id="izin-btn">
            <i class="fas fa-file-medical"></i> Ajukan Izin
          </button>
        ` : `
          <button class="btn btn-secondary" id="download-attendance-report">
            <i class="fas fa-download"></i> Unduh CSV
          </button>
          <button class="btn btn-wa btn-sm" id="wa-alert-btn">
            <i class="fab fa-whatsapp"></i> Alert Belum Hadir
          </button>
        `}
      </div>
    </div>

    <div class="grid-2" style="align-items: start;">
      <!-- Clock Action -->
      <div>
        <div class="card" id="attendance-action-card">
          <div style="background: var(--bg-secondary); padding: 28px; border-radius: var(--radius-lg); text-align: center; border: 1px solid var(--border);">
            <div id="clock-display" style="font-size: 48px; font-weight: 800; color: var(--accent); font-family: 'Courier New', monospace; letter-spacing: 2px;">00:00:00</div>
            <div style="color: var(--text-secondary); margin-top: 6px; font-weight: 500; font-size: 14px;">${dateUtils.formatDate(new Date(), 'long')}</div>
          </div>

          <div id="attendance-status-card" style="text-align: center; border: 1px solid var(--border-accent); padding: 18px; margin-top: 16px; border-radius: var(--radius-md); background: var(--bg-input);">
            <div><i class="fas fa-circle-notch fa-spin"></i> Memuat status...</div>
          </div>

          <!-- Durasi kerja hari ini -->
          <div id="work-duration-card" style="display:none; margin-top: 12px; padding: 14px 18px; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:13px;color:var(--text-muted);"><i class="fas fa-stopwatch" style="color:var(--accent);"></i> Durasi Kerja</span>
              <span id="work-duration-text" style="font-size:16px;font-weight:800;color:var(--accent);">-</span>
            </div>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 16px;">
            <button class="btn btn-primary btn-block" id="check-in-btn" disabled style="height: 52px; font-size: 14px; font-weight: 700;">
              <i class="fas fa-sign-in-alt"></i> Masuk (Check-In)
            </button>
            <button class="btn btn-danger btn-block" id="check-out-btn" disabled style="height: 52px; font-size: 14px; font-weight: 700;">
              <i class="fas fa-sign-out-alt"></i> Pulang (Check-Out)
            </button>
          </div>
        </div>

        <!-- Rekap Minggu Ini (barber only) -->
        ${isBarber ? `
        <div class="card" style="margin-top: 16px;">
          <h3 style="font-size: 14px; margin-bottom: 14px;">
            <i class="fas fa-calendar-week" style="color:var(--accent);"></i> Rekap 7 Hari Terakhir
          </h3>
          <div id="weekly-recap" style="display:flex;gap:6px;justify-content:space-between;">
            ${['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => `
              <div style="flex:1;text-align:center;">
                <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">${d}</div>
                <div class="weekly-dot" style="width:32px;height:32px;border-radius:50%;background:var(--bg-input);border:2px solid var(--border);margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;">-</div>
              </div>
            `).join('')}
          </div>
          <div id="monthly-summary" style="margin-top:14px;padding:12px;background:var(--bg-input);border-radius:var(--radius-sm);display:flex;justify-content:space-between;">
            <div style="text-align:center;">
              <div style="font-size:18px;font-weight:800;color:var(--accent);" id="total-hadir">-</div>
              <div style="font-size:10px;color:var(--text-muted);">Hadir</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:18px;font-weight:800;color:var(--warning);" id="total-terlambat">-</div>
              <div style="font-size:10px;color:var(--text-muted);">Terlambat</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:18px;font-weight:800;color:var(--info);" id="total-izin">-</div>
              <div style="font-size:10px;color:var(--text-muted);">Izin</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:18px;font-weight:800;color:var(--success);" id="total-jam">-</div>
              <div style="font-size:10px;color:var(--text-muted);">Total Jam</div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Logs -->
      <div class="card">
        <div class="flex-between mb-md" style="margin-bottom: 16px;">
          <h3 style="display:flex;align-items:center;gap:8px;font-size:14px;">
            <i class="fas fa-history text-accent"></i>
            ${role === 'admin' ? 'Laporan Presensi Hari Ini' : 'Riwayat Anda Hari Ini'}
          </h3>
          <span class="badge badge-gold">${today}</span>
        </div>
        <div id="attendance-logs-list" class="queue-list">
          <div style="text-align:center;padding:20px;color:var(--text-muted);"><i class="fas fa-circle-notch fa-spin"></i></div>
        </div>

        <!-- Daftar Izin Pending (admin) -->
        ${!isBarber ? `
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
          <h3 style="font-size:14px;margin-bottom:12px;">
            <i class="fas fa-file-medical" style="color:var(--warning);"></i> Pengajuan Izin Pending
          </h3>
          <div id="izin-pending-list">
            <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">Memuat...</div>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
    `;

    // Clock
    const clockEl = container.querySelector('#clock-display');
    const tick = () => { clockEl.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false }); };
    setInterval(tick, 1000);
    tick();

    // Izin button
    container.querySelector('#izin-btn')?.addEventListener('click', () => showIzinModal(profileId, today, container));

    // WA alert button (admin)
    container.querySelector('#wa-alert-btn')?.addEventListener('click', () => {
        const shopId = getShopId();
        sendLateCheckInAlert(shopId);
    });

    loadAttendanceData(container, profileId, role, today);
}

function formatTimeFromDB(timeStr) {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
        return timeStr.split('T')[1].substring(0, 5);
    }
    return timeStr.substring(0, 5);
}

async function loadAttendanceData(container, profileId, role, today) {
    const statusCard = container.querySelector('#attendance-status-card');
    const logsList = container.querySelector('#attendance-logs-list');
    const inBtn = container.querySelector('#check-in-btn');
    const outBtn = container.querySelector('#check-out-btn');

    // Guard: pastikan profileId ada
    if (!profileId) {
        if (statusCard) statusCard.innerHTML = '<div style="color:var(--danger);">Sesi tidak valid. Silakan login ulang.</div>';
        return;
    }

    try {
        // Get Today's logs
        const shopId = getShopId();
        const settings = storage.get('settings', {});
        const activeBranchId = settings.activeBranchId;

        let query = supabase.from('attendance')
            .select('*, profiles(full_name, username)')
            .eq('date', today);
        
        if (shopId) query = query.eq('shop_id', shopId);
        
        if (role !== 'admin') {
            query = query.eq('profile_id', profileId);
        }

        const { data: logs, error } = await query.order('check_in', { ascending: false });
        if (error) throw error;

        // Hapus data corrupt (check_in == check_out) otomatis
        const corruptLogs = logs?.filter(l => {
            if (!l.check_out) return false;
            // Bandingkan hanya bagian menit (bukan detik) untuk toleransi
            const ci = new Date(l.check_in).getTime();
            const co = new Date(l.check_out).getTime();
            return Math.abs(co - ci) < 60000; // kurang dari 1 menit = corrupt
        });
        if (corruptLogs?.length > 0) {
            for (const cl of corruptLogs) {
                await supabase.from('attendance').update({ check_out: null }).eq('id', cl.id);
            }
            renderAttendance(container);
            return;
        }

        // Find current active log — hanya yang belum check_out
        let activeLog = logs?.find(l => l.profile_id === profileId && !l.check_out);
        // Fallback: jika tidak ketemu by profile_id, cari log aktif pertama (belum checkout)
        if (!activeLog && role !== 'admin') {
            activeLog = logs?.find(l => !l.check_out);
        }

        // Update UI Status
        if (activeLog) {
            statusCard.innerHTML = `
                <div class="pulse-indicator" style="width: 12px; height: 12px; background: var(--success); border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 10px var(--success);"></div>
                <div class="text-accent fw-700" style="font-size: 18px; display: inline-block;">SEDANG BEKERJA</div>
                <div class="text-sm text-muted" style="margin-top: 4px;">Mulai sejak ${formatTimeFromDB(activeLog.check_in)}</div>
            `;
            inBtn.disabled = true;
            inBtn.style.opacity = '0.4';
            outBtn.disabled = false;
            outBtn.style.opacity = '1';
        } else {
            const finishedToday = logs?.find(l => l.profile_id === profileId && l.check_out)
                || (role !== 'admin' ? logs?.find(l => l.check_out) : null);

            // Jika check_in == check_out (data corrupt, < 1 menit), anggap belum selesai
            const validFinished = finishedToday && 
                Math.abs(new Date(finishedToday.check_out) - new Date(finishedToday.check_in)) >= 60000
                ? finishedToday : null;
            statusCard.innerHTML = `
                <div class="text-muted fw-600" style="font-size: 18px;">${validFinished ? 'TUGAS SELESAI' : 'BELUM PRESENSI'}</div>
                <div class="text-sm text-muted" style="margin-top: 4px;">${validFinished ? 'Sesi kerja Anda telah berakhir hari ini.' : 'Silakan tekan tombol di bawah untuk mulai.'}</div>
            `;
            inBtn.disabled = !!validFinished; 
            inBtn.style.opacity = validFinished ? '0.4' : '1';
            outBtn.disabled = true;
            outBtn.style.opacity = '0.4';
        }

        // Update Logs List
        if (logs && logs.length > 0) {
            logsList.innerHTML = logs.map(l => `
                <div class="queue-item" style="padding: 15px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                        <div class="fw-600">${l.profiles?.full_name || l.profiles?.username || 'Staff'}</div>
                        <div class="text-xs text-muted" style="margin-top: 2px;">
                            <i class="fas fa-sign-in-alt text-success"></i> ${formatTimeFromDB(l.check_in)}
                            ${l.check_out ? ` • <i class="fas fa-sign-out-alt text-danger"></i> ${formatTimeFromDB(l.check_out)}` : ' • <span class="text-accent fw-600">Aktif</span>'}
                        </div>
                    </div>
                    <span class="badge ${l.check_out ? 'badge-secondary' : 'badge-success'}" style="text-transform: capitalize;">${l.status}</span>
                </div>
            `).join('');
        } else {
            logsList.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);"><i class="fas fa-calendar-xmark" style="font-size: 32px; display: block; margin-bottom: 12px; opacity: 0.3;"></i> Belum ada aktivitas hari ini.</div>';
        }

        // ── Durasi kerja ──
        const durationCard = container.querySelector('#work-duration-card');
        const durationText = container.querySelector('#work-duration-text');
        const myLog = logs?.find(l => l.profile_id === profileId);
        if (myLog && durationCard && durationText) {
            durationCard.style.display = 'block';
            const checkIn = new Date(myLog.check_in);
            const checkOut = myLog.check_out ? new Date(myLog.check_out) : new Date();
            const diffMs = checkOut - checkIn;
            const hours = Math.floor(diffMs / 3600000);
            const mins = Math.floor((diffMs % 3600000) / 60000);
            durationText.textContent = `${hours}j ${mins}m`;
        }

        // ── Status terlambat ──
        if (activeLog || logs?.find(l => l.profile_id === profileId)) {
            const settings = storage.get('settings', {});
            const workStart = settings.openTime || '08:00';
            const checkInLog = logs?.find(l => l.profile_id === profileId);
            if (checkInLog) {
                const checkInTime = formatTimeFromDB(checkInLog.check_in);
                if (checkInTime > workStart) {
                    const statusEl = container.querySelector('#attendance-status-card');
                    if (statusEl && !activeLog) {
                        const lateNote = `<div style="margin-top:6px;font-size:11px;color:var(--warning);"><i class="fas fa-clock"></i> Masuk ${checkInTime} (Jam kerja ${workStart})</div>`;
                        statusEl.innerHTML += lateNote;
                    }
                }
            }
        }

        // ── Rekap mingguan (barber) ──
        if (role === 'barber') {
            loadWeeklyRecap(container, profileId, shopId);
        }

        // ── Izin pending (admin) ──
        if (role === 'admin') {
            loadIzinPending(container, shopId);
        }

        // Attach events
        inBtn.onclick = () => handleCheckAction('in', profileId, today, container);
        outBtn.onclick = () => handleCheckAction('out', activeLog?.id, today, container);

        // Download Report CSV
        container.querySelector('#download-attendance-report')?.addEventListener('click', () => {
            if (logs && logs.length > 0) {
                const csvRows = [
                    ['Nama Staf', 'Tanggal', 'Masuk', 'Pulang', 'Status'],
                    ...logs.map(l => [
                        l.profiles?.full_name || l.profiles?.username,
                        l.date,
                        formatTimeFromDB(l.check_in),
                        l.check_out ? formatTimeFromDB(l.check_out) : 'Aktif',
                        l.status
                    ])
                ];
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `laporan_absensi_${today}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                showToast('Tidak ada data untuk diunduh', 'warning');
            }
        });

    } catch (err) {
        console.error('Attendance load error:', err);
        showToast('Gagal memuat data presensi', 'danger');
    }
}

async function handleCheckAction(type, id, today, container) {
    const now = new Date();
    const time = now.toISOString();
    
    try {
        if (type === 'in') {
            // Cek apakah sudah ada check-in hari ini
            const shopId = getShopId();
            const { data: existing } = await supabase
                .from('attendance')
                .select('id')
                .eq('profile_id', id)
                .eq('date', today)
                .is('check_out', null)
                .limit(1);
            
            if (existing && existing.length > 0) {
                showToast('Anda sudah check-in hari ini', 'warning');
                renderAttendance(container);
                return;
            }

            const insertData = {
                profile_id: id,
                date: today,
                check_in: time,
                status: 'hadir',
            };
            if (shopId) insertData.shop_id = shopId;

            const { error } = await supabase.from('attendance').insert([insertData]);
            if (error) throw error;
            showToast('Check-In Berhasil! Selamat bekerja. ✂️', 'success');
        } else {
            const { error } = await supabase.from('attendance').update({
                check_out: time
            }).eq('id', id);
            if (error) throw error;
            showToast('Check-Out Berhasil! Terima kasih untuk hari ini. 🙏', 'success');
        }
        
        renderAttendance(container);
    } catch (err) {
        console.error('Action error:', err);
        showToast('Gagal memproses presensi: ' + err.message, 'danger');
    }
}

// ── Rekap Mingguan ────────────────────────────────────────────────────────────
async function loadWeeklyRecap(container, profileId, shopId) {
    try {
        const now = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }

        const { data: logs } = await supabase
            .from('attendance')
            .select('*')
            .eq('profile_id', profileId)
            .in('date', days);

        const dots = container.querySelectorAll('.weekly-dot');
        let totalHadir = 0, totalTerlambat = 0, totalIzin = 0, totalMs = 0;
        const settings = storage.get('settings', {});
        const workStart = settings.openTime || '08:00';

        days.forEach((day, i) => {
            const log = logs?.find(l => l.date === day);
            const dot = dots[i];
            if (!dot) return;

            if (!log) {
                dot.style.background = 'var(--bg-input)';
                dot.style.borderColor = 'var(--border)';
                dot.textContent = '-';
                dot.title = 'Tidak ada data';
            } else if (log.status === 'izin' || log.status === 'sakit' || log.status === 'cuti') {
                dot.style.background = 'rgba(96,165,250,0.15)';
                dot.style.borderColor = 'var(--info)';
                dot.innerHTML = '<i class="fas fa-file-medical" style="font-size:10px;color:var(--info);"></i>';
                dot.title = log.status;
                totalIzin++;
            } else {
                const checkInTime = log.check_in ? log.check_in.split('T')[1]?.substring(0,5) : '';
                const isLate = checkInTime > workStart;
                dot.style.background = isLate ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)';
                dot.style.borderColor = isLate ? 'var(--warning)' : 'var(--success)';
                dot.innerHTML = isLate
                    ? '<i class="fas fa-clock" style="font-size:10px;color:var(--warning);"></i>'
                    : '<i class="fas fa-check" style="font-size:10px;color:var(--success);"></i>';
                dot.title = isLate ? `Terlambat (${checkInTime})` : `Hadir (${checkInTime})`;
                totalHadir++;
                if (isLate) totalTerlambat++;

                // Hitung durasi
                if (log.check_in && log.check_out) {
                    totalMs += new Date(log.check_out) - new Date(log.check_in);
                }
            }
        });

        const totalHours = Math.floor(totalMs / 3600000);
        const totalMins = Math.floor((totalMs % 3600000) / 60000);

        const hadirEl = container.querySelector('#total-hadir');
        const terlambatEl = container.querySelector('#total-terlambat');
        const izinEl = container.querySelector('#total-izin');
        const jamEl = container.querySelector('#total-jam');

        if (hadirEl) hadirEl.textContent = totalHadir;
        if (terlambatEl) terlambatEl.textContent = totalTerlambat;
        if (izinEl) izinEl.textContent = totalIzin;
        if (jamEl) jamEl.textContent = `${totalHours}j`;

    } catch (err) {
        console.warn('Weekly recap error:', err);
    }
}

// ── Izin Pending (Admin) ──────────────────────────────────────────────────────
async function loadIzinPending(container, shopId) {
    const listEl = container.querySelector('#izin-pending-list');
    if (!listEl) return;

    try {
        const { data: pending } = await supabase
            .from('attendance')
            .select('*, profiles(full_name, username)')
            .in('status', ['izin', 'sakit', 'cuti'])
            .eq('shop_id', shopId)
            .order('date', { ascending: false })
            .limit(10);

        if (!pending || pending.length === 0) {
            listEl.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px;">Tidak ada pengajuan izin.</div>';
            return;
        }

        const statusColor = { izin: 'var(--info)', sakit: 'var(--danger)', cuti: 'var(--warning)' };
        listEl.innerHTML = pending.map(p => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
                <div style="width:36px;height:36px;border-radius:10px;background:${statusColor[p.status]}20;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-file-medical" style="color:${statusColor[p.status]};font-size:14px;"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:13px;">${p.profiles?.full_name || p.profiles?.username || 'Staff'}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${p.date} • ${p.notes || '-'}</div>
                </div>
                <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;background:${statusColor[p.status]}20;color:${statusColor[p.status]};text-transform:uppercase;">${p.status}</span>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = '<div style="font-size:12px;color:var(--text-muted);">Gagal memuat.</div>';
    }
}

// ── Notifikasi WA Belum Check-In ──────────────────────────────────────────────
export async function sendLateCheckInAlert(shopId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const settings = storage.get('settings', {});
        const shopPhone = settings.phone || '';
        if (!shopPhone) return;

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('shop_id', shopId)
            .eq('role', 'barber');

        const { data: checkedIn } = await supabase
            .from('attendance')
            .select('profile_id')
            .eq('date', today)
            .eq('shop_id', shopId);

        const checkedIds = new Set((checkedIn || []).map(c => c.profile_id));
        const notChecked = (profiles || []).filter(p => !checkedIds.has(p.id));

        if (notChecked.length > 0) {
            const names = notChecked.map(p => p.full_name).join(', ');
            const msg = `⚠️ *Presensi BarberPro*\n\nBarber belum check-in hari ini:\n${names}\n\nMohon segera konfirmasi kehadiran.`;
            window.open(`https://wa.me/${shopPhone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
        }
    } catch (err) {
        console.warn('WA alert error:', err);
    }
}

function showIzinModal(profileId, today, container) {
  openModal('Ajukan Izin / Sakit', `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="form-group">
        <label>Jenis</label>
        <select class="form-control" id="izin-type">
          <option value="izin">Izin</option>
          <option value="sakit">Sakit</option>
          <option value="cuti">Cuti</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tanggal</label>
        <input type="date" class="form-control" id="izin-date" value="${today}" />
      </div>
      <div class="form-group">
        <label>Alasan</label>
        <textarea class="form-control" id="izin-reason" rows="3" placeholder="Tulis alasan..."></textarea>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="submit-izin-btn"><i class="fas fa-paper-plane"></i> Kirim</button>
  `);

  document.getElementById('submit-izin-btn')?.addEventListener('click', async () => {
    const type = document.getElementById('izin-type').value;
    const date = document.getElementById('izin-date').value;
    const reason = document.getElementById('izin-reason').value.trim();

    if (!reason) { showToast('Tulis alasan terlebih dahulu', 'warning'); return; }

    try {
      const shopId = getShopId();
      const { error } = await supabase.from('attendance').insert([{
        profile_id: profileId,
        date,
        check_in: new Date().toISOString(),
        status: type,
        notes: reason,
        shop_id: shopId,
      }]);
      if (error) throw error;
      showToast(`Pengajuan ${type} berhasil dikirim!`, 'success');
      import('../components/modal.js').then(m => m.closeModal());
      renderAttendance(container);
    } catch (err) {
      showToast('Gagal: ' + err.message, 'danger');
    }
  });
}







