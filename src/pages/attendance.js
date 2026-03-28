// ========================================
// Attendance Page
// Professional Clock-in/out via Supabase
// ========================================

import { storage, getShopId } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { dateUtils } from '../utils/dateUtils.js';
import { showToast } from '../components/toast.js';

export function renderAttendance(container) {
    const user = storage.getCurrentUser();
    const role = user?.role || 'barber';
    const profileId = user?.id;
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
      ${role === 'admin' ? `<button class="btn btn-secondary" id="download-attendance-report"><i class="fas fa-download"></i> Unduh Laporan (CSV)</button>` : ''}
    </div>

    <div class="grid-2" style="align-items: start;">
      <!-- Clock Action -->
      <div class="card" id="attendance-action-card">
        <div class="attendance-hero" style="background: var(--bg-secondary); padding: 30px; border-radius: var(--radius-lg); text-align: center; border: 1px solid var(--border);">
            <div class="digital-clock" id="clock-display" style="font-size: 48px; font-weight: 800; color: var(--accent); font-family: 'Courier New', monospace; letter-spacing: 2px;">00:00:00</div>
            <div class="date-display" style="color: var(--text-secondary); margin-top: 8px; font-weight: 500;">${dateUtils.formatDate(new Date(), 'long')}</div>
        </div>

        <div id="attendance-status-card" class="card-glass mt-md" style="text-align: center; border: 1px solid var(--border-accent); padding: 20px; margin-top: 20px;">
            <div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Memuat status...</div>
        </div>

        <div class="attendance-actions mt-md" style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="btn btn-primary btn-block py-16" id="check-in-btn" disabled style="height: 54px;">
                <i class="fas fa-sign-in-alt"></i> Masuk (Check-In)
            </button>
            <button class="btn btn-danger btn-block py-16" id="check-out-btn" disabled style="height: 54px;">
                <i class="fas fa-sign-out-alt"></i> Pulang (Check-Out)
            </button>
        </div>
      </div>

      <!-- Logs -->
      <div class="card">
        <div class="flex-between mb-md" style="margin-bottom: 20px;">
            <h3 style="display: flex; align-items: center; gap: 8px;"><i class="fas fa-history text-accent"></i> ${role === 'admin' ? 'Laporan Presensi Hari Ini' : 'Riwayat Anda Hari Ini'}</h3>
            <span class="badge badge-gold">${today}</span>
        </div>
        <div id="attendance-logs-list" class="queue-list">
            <div class="loading-spinner py-20 text-center"><i class="fas fa-circle-notch fa-spin"></i> Memuat data...</div>
        </div>
      </div>
    </div>
    `;

    // Initialize clock
    const clockDisplay = container.querySelector('#clock-display');
    const updateTime = () => {
        clockDisplay.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false });
    };
    setInterval(updateTime, 1000);
    updateTime();

    // Load data
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

    try {
        // Get Today's logs
        const shopId = getShopId();
        const settings = storage.get('settings', {});
        const activeBranchId = settings.activeBranchId;

        let query = supabase.from('attendance')
            .select('*, profiles(full_name, username)')
            .eq('date', today);
        
        if (shopId) query = query.eq('shop_id', shopId);
        if (activeBranchId) query = query.eq('branch_id', activeBranchId);
        
        if (role !== 'admin') {
            query = query.eq('profile_id', profileId);
        }

        const { data: logs, error } = await query.order('check_in', { ascending: false });
        if (error) throw error;

        // Find current active log for current user
        const activeLog = logs?.find(l => l.profile_id === profileId && !l.check_out);

        // Update UI Status
        if (activeLog) {
            statusCard.innerHTML = `
                <div class="pulse-indicator" style="width: 12px; height: 12px; background: var(--success); border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 10px var(--success);"></div>
                <div class="text-accent fw-700" style="font-size: 18px; display: inline-block;">SEDANG BEKERJA</div>
                <div class="text-sm text-muted" style="margin-top: 4px;">Mulai sejak ${formatTimeFromDB(activeLog.check_in)}</div>
            `;
            inBtn.disabled = true;
            outBtn.disabled = false;
        } else {
            const finishedToday = logs?.find(l => l.profile_id === profileId && l.check_out);
            statusCard.innerHTML = `
                <div class="text-muted fw-600" style="font-size: 18px;">${finishedToday ? 'TUGAS SELESAI' : 'BELUM PRESENSI'}</div>
                <div class="text-sm text-muted" style="margin-top: 4px;">${finishedToday ? 'Sesi kerja Anda telah berakhir hari ini.' : 'Silakan tekan tombol di bawah untuk mulai.'}</div>
            `;
            inBtn.disabled = !!finishedToday; 
            outBtn.disabled = true;
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
            const shopId = getShopId();
            const settings = storage.get('settings', {});
            const { error } = await supabase.from('attendance').insert([{
                profile_id: id,
                date: today,
                check_in: time,
                status: 'hadir',
                shop_id: shopId,
                branch_id: settings.activeBranchId
            }]);
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
