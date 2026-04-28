import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export function renderSuperAdminReports(container) {
  container.innerHTML = `
    <div class="reports-container fade-in">

      <!-- Stats Row -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px;">
        <div class="card" style="padding: 14px; text-align: center; border-top: 3px solid #22c55e;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(34,197,94,0.1); color: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 16px; margin: 0 auto 8px;">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <div id="platform-revenue" style="font-size: 15px; font-weight: 900; letter-spacing: -0.5px;">-</div>
          <div style="font-size: 9px; color: var(--text-muted); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Estimasi Pendapatan</div>
        </div>
        <div class="card" style="padding: 14px; text-align: center; border-top: 3px solid var(--accent);">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-subtle); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 16px; margin: 0 auto 8px;">
            <i class="fas fa-chart-line"></i>
          </div>
          <div id="new-tenants-month" style="font-size: 22px; font-weight: 900;">-</div>
          <div style="font-size: 9px; color: var(--text-muted); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Tenant Baru</div>
        </div>
        <div class="card" style="padding: 14px; text-align: center; border-top: 3px solid #6366f1;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(99,102,241,0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 16px; margin: 0 auto 8px;">
            <i class="fas fa-users"></i>
          </div>
          <div id="total-users-platform" style="font-size: 22px; font-weight: 900;">-</div>
          <div style="font-size: 9px; color: var(--text-muted); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Total Pengguna</div>
        </div>
      </div>

      <!-- Status Breakdown -->
      <div class="card" style="margin-top: 14px; padding: 16px;">
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">
          <i class="fas fa-chart-pie" style="color: var(--accent);"></i> Status Tenant
        </div>
        <div id="status-breakdown" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="text-align:center; color: var(--text-muted); font-size: 12px; padding: 10px;">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
        </div>
      </div>

      <!-- Top Tenants -->
      <div class="card" style="margin-top: 14px; padding: 16px;">
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">
          <i class="fas fa-star" style="color: var(--accent);"></i> Tenant Teraktif
        </div>
        <div id="top-tenants-list" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="text-align:center; color: var(--text-muted); font-size: 12px; padding: 10px;">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
        </div>
      </div>

      <!-- Pertumbuhan placeholder -->
      <div class="card" style="margin-top: 14px; padding: 16px;">
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px;">
          <i class="fas fa-history" style="color: var(--accent);"></i> Pertumbuhan 30 Hari
        </div>
        <div style="padding: 20px; text-align: center; background: var(--bg-input); border-radius: 10px;">
          <i class="fas fa-chart-area" style="font-size: 28px; color: var(--text-muted); opacity: 0.3; display: block; margin-bottom: 8px;"></i>
          <div style="font-size: 12px; color: var(--text-muted);">Visualisasi segera hadir</div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px; opacity: 0.6;">Sedang mengumpulkan data harian</div>
        </div>
      </div>

    </div>
  `;

  loadPlatformStats(container);
}

async function loadPlatformStats(container) {
  try {
    const { data: shops } = await supabase.from('shops').select('id, name, created_at, status');
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newShops = shops.filter(s => new Date(s.created_at) >= startOfMonth).length;
    const activeShops = shops.filter(s => s.status === 'active').length;
    const revenue = activeShops * 100000;

    // Stats
    container.querySelector('#platform-revenue').textContent = `Rp ${revenue.toLocaleString('id-ID')}`;
    container.querySelector('#new-tenants-month').textContent = newShops;
    container.querySelector('#total-users-platform').textContent = totalUsers;

    // Status breakdown
    const statusGroups = { active: 0, trial: 0, expired: 0, deactivated: 0 };
    shops.forEach(s => { statusGroups[s.status || 'trial'] = (statusGroups[s.status || 'trial'] || 0) + 1; });
    const total = shops.length || 1;
    const statusColors = { active: '#22c55e', trial: '#f59e0b', expired: '#ef4444', deactivated: '#6b7280' };
    const statusLabels = { active: 'Aktif', trial: 'Trial', expired: 'Kedaluwarsa', deactivated: 'Nonaktif' };

    container.querySelector('#status-breakdown').innerHTML = Object.entries(statusGroups)
      .filter(([, v]) => v > 0)
      .map(([key, val]) => {
        const pct = Math.round((val / total) * 100);
        return `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 12px; font-weight: 600; color: ${statusColors[key]};">${statusLabels[key]}</span>
              <span style="font-size: 12px; font-weight: 700;">${val} <span style="color: var(--text-muted); font-weight: 400;">(${pct}%)</span></span>
            </div>
            <div style="height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: ${statusColors[key]}; border-radius: 3px; transition: width 0.6s ease;"></div>
            </div>
          </div>
        `;
      }).join('') || '<div style="font-size:12px;color:var(--text-muted);">Belum ada data.</div>';

    // Top tenants
    const { data: activity } = await supabase.from('appointments').select('shop_id');
    const stats = (activity || []).reduce((acc, curr) => {
      acc[curr.shop_id] = (acc[curr.shop_id] || 0) + 1;
      return acc;
    }, {});

    const topEntries = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const listEl = container.querySelector('#top-tenants-list');

    if (topEntries.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:10px;">Belum ada aktivitas.</div>';
      return;
    }

    const rows = await Promise.all(topEntries.map(async ([shopId, count], i) => {
      const shop = shops.find(s => s.id === shopId);
      const medals = ['🥇', '🥈', '🥉'];
      return `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg-input); border-radius: 10px;">
          <div style="font-size: 18px; flex-shrink: 0;">${medals[i] || `#${i+1}`}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${shop?.name || 'Unknown'}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${count} transaksi</div>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #22c55e; background: rgba(34,197,94,0.1); padding: 3px 8px; border-radius: 6px; flex-shrink: 0;">
            Online
          </div>
        </div>
      `;
    }));

    listEl.innerHTML = rows.join('');

  } catch (err) {
    console.error('Platform Stats Load Error:', err);
    showToast('Gagal memuat laporan platform.', 'danger');
  }
}

