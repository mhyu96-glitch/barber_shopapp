import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export async function renderSuperAdmin(container) {
  let activeTab = 'tenants'; // 'tenants' or 'analytics'

  function renderLayout() {
    container.innerHTML = `
      <div class="super-admin-header fade-in">
        <div class="header-content">
          <h1>Master Platform Control</h1>
          <p>Monitoring & Manajemen Bisnis BarberPro Global</p>
        </div>
        <div class="header-actions" style="display: flex; gap: 12px;">
          <button id="add-shop-btn" class="btn btn-primary">
            <i class="fas fa-plus"></i> Tambah Barbershop Baru
          </button>
          <button id="refresh-btn" class="btn btn-secondary">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div class="tab-container" style="margin-top: 24px; border-bottom: 1px solid var(--border-accent); display: flex; gap: 32px;">
        <div class="tab-item ${activeTab === 'tenants' ? 'active' : ''}" data-tab="tenants" style="padding: 12px 0; cursor: pointer; font-weight: 600; color: ${activeTab === 'tenants' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: 2px solid ${activeTab === 'tenants' ? 'var(--primary)' : 'transparent'};">
          <i class="fas fa-store"></i> Daftar Tenant
        </div>
        <div class="tab-item ${activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics" style="padding: 12px 0; cursor: pointer; font-weight: 600; color: ${activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: 2px solid ${activeTab === 'analytics' ? 'var(--primary)' : 'transparent'};">
          <i class="fas fa-chart-line"></i> Analitik Global
        </div>
      </div>

      <div id="tab-content" style="margin-top: 24px;"></div>
    `;

    const tabItems = container.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
      item.addEventListener('click', () => {
        activeTab = item.dataset.tab;
        renderLayout();
        if (activeTab === 'tenants') renderTenantsContent();
        else renderAnalyticsContent();
      });
    });

    const refreshBtn = container.querySelector('#refresh-btn');
    refreshBtn.addEventListener('click', () => {
      if (activeTab === 'tenants') renderTenantsContent();
      else renderAnalyticsContent();
    });

    const addShopBtn = container.querySelector('#add-shop-btn');
    addShopBtn.addEventListener('click', () => renderAddShopModal(container));
  }

  async function renderTenantsContent() {
    const content = container.querySelector('#tab-content');
    content.innerHTML = `
      <div class="stats-grid fade-in">
        <div class="stat-card"><div class="stat-info"><h3 id="total-shops-stat">-</h3><p>Total Tenant</p></div></div>
        <div class="stat-card"><div class="stat-info"><h3 id="active-shops-stat">-</h3><p>Status Active</p></div></div>
        <div class="stat-card"><div class="stat-info"><h3 id="trial-shops-stat">-</h3><p>Status Trial</p></div></div>
      </div>

      <div class="card fade-in" style="margin-top: 24px;">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Logo</th><th>Nama Toko</th><th>Status</th><th>Paket</th><th>Terdaftar</th><th>Aksi</th></tr>
            </thead>
            <tbody id="shops-table-body">
              <tr><td colspan="6" style="text-align: center; padding: 40px;"><i class="fas fa-circle-notch fa-spin"></i> Memuat data...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const { data: shops, error } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      container.querySelector('#total-shops-stat').textContent = shops.length;
      container.querySelector('#active-shops-stat').textContent = shops.filter(s => s.status === 'active').length;
      container.querySelector('#trial-shops-stat').textContent = shops.filter(s => s.status === 'trial').length;

      const tableBody = container.querySelector('#shops-table-body');
      tableBody.innerHTML = shops.map(shop => `
        <tr>
          <td><div class="shop-avatar" style="background: var(--primary-glow); color: var(--primary); width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${shop.name?.[0] || 'S'}</div></td>
          <td><div style="font-weight: bold;">${shop.name}</div><div style="font-size: 11px; color: var(--text-muted);">${shop.slug}</div></td>
          <td><span class="status-badge status-${shop.status || 'trial'}">${(shop.status || 'trial').toUpperCase()}</span></td>
          <td><div style="font-size: 13px; color: var(--primary); font-weight: 500;">${shop.plan_id ? 'Pro Unlimited' : 'Basic Tier'}</div></td>
          <td style="font-size: 13px; color: var(--text-muted);">${new Date(shop.created_at).toLocaleDateString('id-ID')}</td>
          <td><button class="btn-icon manage-btn" data-id="${shop.id}"><i class="fas fa-cog"></i></button></td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('.manage-btn').forEach(btn => {
        btn.addEventListener('click', () => handleManageShop(btn.dataset.id));
      });
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat tenant.', 'danger');
    }
  }

  async function renderAnalyticsContent() {
    const content = container.querySelector('#tab-content');
    content.innerHTML = `
      <div class="stats-grid fade-in">
        <div class="stat-card" style="border-left: 4px solid var(--accent);"><div class="stat-info"><h3 id="global-revenue">-</h3><p>Omzet Global Platform</p></div></div>
        <div class="stat-card" style="border-left: 4px solid var(--success);"><div class="stat-info"><h3 id="global-appts">-</h3><p>Total Janji Temu</p></div></div>
        <div class="stat-card" style="border-left: 4px solid var(--info);"><div class="stat-info"><h3 id="global-customers">-</h3><p>Total Pelanggan Unik</p></div></div>
      </div>

      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-top: 24px;">
        <div class="card fade-in">
          <div class="card-header"><h2 style="font-size: 16px;"><i class="fas fa-trophy" style="color: gold;"></i> Leaderboard Barbershop (Omzet)</h2></div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr><th>Peringkat</th><th>Barbershop</th><th>Total Transaksi</th><th>Total Omzet</th></tr></thead>
              <tbody id="ranking-body"></tbody>
            </table>
          </div>
        </div>

        <div class="card fade-in">
          <div class="card-header"><h2 style="font-size: 16px;"><i class="fas fa-wallet"></i> Metode Pembayaran Global</h2></div>
          <div id="payment-methods-content" style="padding: 20px;"></div>
        </div>
      </div>
    `;

    try {
      // 1. Fetch Global Data
      const [pRes, aRes, cRes, sRes] = await Promise.all([
        supabase.from('payments').select('amount, method, shop_id'),
        supabase.from('appointments').select('id'),
        supabase.from('customers').select('id'),
        supabase.from('shops').select('id, name')
      ]);

      const payments = pRes.data || [];
      const appointments = aRes.data || [];
      const customers = cRes.data || [];
      const shops = sRes.data || [];

      // 2. Aggregate Stats
      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      container.querySelector('#global-revenue').textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
      container.querySelector('#global-appts').textContent = appointments.length;
      container.querySelector('#global-customers').textContent = customers.length;

      // 3. Shop Ranking
      const shopStats = shops.map(shop => {
        const shopPayments = payments.filter(p => p.shop_id === shop.id);
        return {
          name: shop.name,
          count: shopPayments.length,
          revenue: shopPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        };
      }).sort((a, b) => b.revenue - a.revenue);

      const rankingBody = container.querySelector('#ranking-body');
      rankingBody.innerHTML = shopStats.slice(0, 5).map((shop, i) => `
        <tr>
          <td><span style="font-weight: 800; color: ${i === 0 ? 'gold' : 'inherit'}">#${i + 1}</span></td>
          <td style="font-weight: 600;">${shop.name}</td>
          <td>${shop.count} Transaksi</td>
          <td style="color: var(--success); font-weight: bold;">Rp ${shop.revenue.toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

      // 4. Payment Methods
      const methods = payments.reduce((acc, p) => {
        const m = p.method || 'cash';
        acc[m] = (acc[m] || 0) + 1;
        return acc;
      }, {});

      const payContent = container.querySelector('#payment-methods-content');
      payContent.innerHTML = Object.entries(methods).map(([m, count]) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="text-transform: capitalize; font-size: 13px;">${m}</span>
            <span style="font-weight: bold; font-size: 13px;">${count} TX</span>
          </div>
          <div style="height: 6px; background: var(--bg-body); border-radius: 3px; overflow: hidden;">
            <div style="width: ${(count/payments.length)*100}%; height: 100%; background: var(--primary);"></div>
          </div>
        </div>
      `).join('');

    } catch (err) {
      console.error(err);
      showToast('Gagal memuat analitik.', 'danger');
    }
  }

  // --- Sub-functions (Add Shop, Manage Shop, Slugify) ---
  // [Past implementation functions remains here...]
  
  async function handleManageShop(shopId) {
    const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).single();
    if (!shop) return;
    const newStatus = prompt(`Ubah status untuk ${shop.name}? (active/trial/expired/deactivated):`, shop.status);
    if (newStatus && ['active', 'trial', 'expired', 'deactivated'].includes(newStatus.toLowerCase())) {
        await supabase.from('shops').update({ status: newStatus.toLowerCase() }).eq('id', shopId);
        showToast('Status diperbarui.', 'success');
        if (activeTab === 'tenants') renderTenantsContent();
        else renderAnalyticsContent();
    }
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }

  async function renderAddShopModal(container) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> Tambah Tenant Baru</h3>
          <button class="close-modal">&times;</button>
        </div>
        <form id="add-shop-form">
          <div class="card-section-title">Data Barbershop</div>
          <div class="form-group"><label>Nama Barbershop *</label><input type="text" id="new-shop-name" class="form-control" required /></div>
          <div class="form-group"><label>URL Slug *</label><input type="text" id="new-shop-slug" class="form-control" required /></div>
          <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div><label>No. WA</label><input type="tel" id="new-shop-phone" class="form-control" /></div>
            <div><label>Status</label><select id="new-shop-status" class="form-control"><option value="trial">Trial</option><option value="active">Active</option></select></div>
          </div>
          <div class="card-section-title" style="margin-top: 20px;">Akun Admin</div>
          <div class="form-group"><label>Username *</label><input type="text" id="new-admin-username" class="form-control" required /></div>
          <div class="form-group"><label>Password *</label><input type="password" id="new-admin-password" class="form-control" minlength="6" required /></div>
          <button type="submit" class="btn btn-primary btn-block" id="submit-shop-btn" style="margin-top: 20px;"><i class="fas fa-save"></i> Daftarkan</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    
    const nameInput = modal.querySelector('#new-shop-name');
    const slugInput = modal.querySelector('#new-shop-slug');
    const userInput = modal.querySelector('#new-admin-username');
    nameInput.addEventListener('input', () => {
      slugInput.value = slugify(nameInput.value);
      userInput.value = `admin_${slugInput.value.replace(/-/g, '_')}`;
    });

    modal.querySelector('#add-shop-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = modal.querySelector('#submit-shop-btn');
      btn.disabled = true;
      try {
        const name = nameInput.value;
        const slug = slugInput.value;
        const username = userInput.value;
        const password = modal.querySelector('#new-admin-password').value;
        const status = modal.querySelector('#new-shop-status').value;

        const email = `${username}@barberpro.local`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({ 
            email, password, options: { data: { full_name: `Admin ${name}`, role: 'admin', username } }
        });
        if (authErr) throw authErr;

        const { data: newShop, error: shopErr } = await supabase.from('shops').insert([{ 
            name, slug, status, owner_id: authData.user.id,
            plan_id: status === 'active' ? 'pro-unlimited' : null
        }]).select().single();
        if (shopErr) throw shopErr;

        await supabase.from('profiles').update({ shop_id: newShop.id }).eq('id', authData.user.id);
        await supabase.from('settings').insert([{ shop_id: newShop.id, shop_name: name }]);

        showToast('Tenant berhasil didaftarkan!', 'success');
        modal.remove();
        if (activeTab === 'tenants') renderTenantsContent();
        else renderAnalyticsContent();
      } catch (err) {
        showToast(err.message, 'danger');
        btn.disabled = false;
      }
    });
  }

  // Initial load
  renderLayout();
  renderTenantsContent();
}
