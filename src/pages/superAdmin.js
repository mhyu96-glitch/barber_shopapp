import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export async function renderSuperAdmin(container) {
  container.innerHTML = `
    <div class="super-admin-header fade-in">
      <div class="header-content">
        <h1>Master Dashboard Platform</h1>
        <p>Manajemen seluruh tenant dan langganan BarberPro</p>
      </div>
      <div class="header-actions">
        <button id="refresh-btn" class="btn btn-secondary">
          <i class="fas fa-sync-alt"></i> Refresh Data
        </button>
      </div>
    </div>

    <div class="stats-grid fade-in" style="margin-top: 24px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(186, 155, 102, 0.1); color: var(--primary);">
          <i class="fas fa-store"></i>
        </div>
        <div class="stat-info">
          <h3 id="total-shops-stat">-</h3>
          <p>Total Barbershop</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e;">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <h3 id="active-shops-stat">-</h3>
          <p>Toko Aktif</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <h3 id="trial-shops-stat">-</h3>
          <p>Masa Trial</p>
        </div>
      </div>
    </div>

    <div class="card fade-in" style="margin-top: 24px;">
      <div class="card-header">
        <h2 style="font-size: 18px;"><i class="fas fa-list" style="margin-right: 10px;"></i> Daftar Tenant Platform</h2>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nama Toko</th>
              <th>Status</th>
              <th>Paket</th>
              <th>Tanggal Daftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="shops-table-body">
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px;">
                <i class="fas fa-circle-notch fa-spin"></i> Memuat data toko...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const refreshBtn = container.querySelector('#refresh-btn');
  refreshBtn.addEventListener('click', loadShops);

  loadShops();

  async function loadShops() {
    const tableBody = container.querySelector('#shops-table-body');
    try {
      // 1. Fetch Shops
      const { data: shops, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Update Stats
      container.querySelector('#total-shops-stat').textContent = shops.length;
      container.querySelector('#active-shops-stat').textContent = shops.filter(s => s.status === 'active').length;
      container.querySelector('#trial-shops-stat').textContent = shops.filter(s => s.status === 'trial').length;

      // 3. Render Table
      if (shops.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">Belum ada toko terdaftar.</td></tr>';
        return;
      }

      tableBody.innerHTML = shops.map(shop => `
        <tr>
          <td>
            <div class="shop-avatar" style="background: var(--primary-glow); color: var(--primary); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
              ${shop.name?.[0] || 'S'}
            </div>
          </td>
          <td>
            <div style="font-weight: bold;">${shop.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${shop.phone || 'No Phone'}</div>
          </td>
          <td>
            <span class="status-badge status-${shop.status || 'trial'}">
              ${(shop.status || 'trial').toUpperCase()}
            </span>
          </td>
          <td>
            <div style="font-size: 13px; color: var(--primary); font-weight: 500;">${shop.plan_id ? 'Pro Unlimited' : 'Basic Tier'}</div>
          </td>
          <td style="font-size: 13px; color: var(--text-muted);">
            ${new Date(shop.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </td>
          <td>
            <button class="btn-icon manage-btn" data-id="${shop.id}" title="Kelola Tenant">
              <i class="fas fa-edit"></i>
            </button>
          </td>
        </tr>
      `).join('');

      // Add event listeners to manage buttons
      tableBody.querySelectorAll('.manage-btn').forEach(btn => {
        btn.addEventListener('click', () => handleManageShop(btn.dataset.id));
      });

    } catch (err) {
      console.error('Error loading shops:', err);
      showToast('Gagal memuat data toko.', 'danger');
    }
  }

  async function handleManageShop(shopId) {
    const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).single();
    if (!shop) return;

    const newStatus = prompt(`Ubah status untuk ${shop.name}?\n(Ketik: active, trial, expired, atau deactivated):`, shop.status);
    if (newStatus && ['active', 'trial', 'expired', 'deactivated'].includes(newStatus.toLowerCase())) {
        const { error } = await supabase.from('shops').update({ status: newStatus.toLowerCase() }).eq('id', shopId);
        if (error) {
            showToast('Gagal mengubah status.', 'danger');
        } else {
            showToast(`Status ${shop.name} diperbarui ke ${newStatus.toUpperCase()}`, 'success');
            loadShops();
        }
    }
  }
}
