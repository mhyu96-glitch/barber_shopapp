import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export function renderSuperAdminReports(container) {
  container.innerHTML = `
    <div class="reports-container fade-in">
      <div class="stats-grid" style="margin-top: 24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e;">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <div class="stat-info">
            <h3 id="platform-revenue">-</h3>
            <p>Estimasi Pendapatan Platform</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(186, 155, 102, 0.1); color: var(--primary);">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <h3 id="new-tenants-month">-</h3>
            <p>Tenant Baru Bulan Ini</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info">
            <h3 id="total-users-platform">-</h3>
            <p>Total Pengguna Terdaftar</p>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top: 24px;">
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-history"></i> Pertumbuhan Tenant (30 Hari Terakhir)</h3>
          </div>
          <div class="chart-container" style="height: 300px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.05); border-radius: 12px; margin-top: 15px;">
            <div style="text-align: center; color: var(--text-muted);">
               <i class="fas fa-chart-area fa-3x" style="margin-bottom: 10px; opacity: 0.3;"></i>
               <p>Visualisasi Pertumbuhan Segera Hadir</p>
               <small>(Sedang mengumpulkan titik data harian)</small>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-star"></i> Tenant Teraktif</h3>
          </div>
          <div class="table-container" style="margin-top: 15px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Total Transaksi</th>
                  <th>Last Sync</th>
                </tr>
              </thead>
              <tbody id="top-tenants-body">
                <tr><td colspan="3" style="text-align:center; padding: 20px;">Memuat data...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  loadPlatformStats(container);
}

async function loadPlatformStats(container) {
  try {
    // 1. Fetch Basic Stats
    const { data: shops } = await supabase.from('shops').select('id, created_at, status');
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    // 2. Calculate Stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newShops = shops.filter(s => new Date(s.created_at) >= startOfMonth).length;
    const activeShops = shops.filter(s => s.status === 'active').length;
    
    // Estimate revenue (Active * 100k - placeholder logic)
    const revenue = activeShops * 100000;

    // 3. Update UI
    container.querySelector('#platform-revenue').textContent = `Rp ${revenue.toLocaleString('id-ID')}`;
    container.querySelector('#new-tenants-month').textContent = newShops;
    container.querySelector('#total-users-platform').textContent = totalUsers;

    // 4. Load Top Tenants (based on row count in appointments as activity proxy)
    // In a real app, you'd want an 'activities' table, but we use appointments/transactions
    const { data: activity } = await supabase.from('appointments').select('shop_id');
    const stats = activity.reduce((acc, curr) => {
      acc[curr.shop_id] = (acc[curr.shop_id] || 0) + 1;
      return acc;
    }, {});

    const topEntries = Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const tbody = container.querySelector('#top-tenants-body');
    if (topEntries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Belum ada aktivitas tercatat.</td></tr>';
      return;
    }

    const rows = await Promise.all(topEntries.map(async ([shopId, count]) => {
      const { data: shop } = await supabase.from('shops').select('name').eq('id', shopId).single();
      return `
        <tr>
          <td><div class="fw-600">${shop?.name || 'Unknown'}</div></td>
          <td>${count} Layanan</td>
          <td><span class="badge badge-success">Online</span></td>
        </tr>
      `;
    }));

    tbody.innerHTML = rows.join('');

  } catch (err) {
    console.error('Platform Stats Load Error:', err);
    showToast('Gagal memuat laporan platform.', 'danger');
  }
}
