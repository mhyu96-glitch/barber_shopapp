import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export async function renderSuperAdmin(container) {
  // Initial structure
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
          <i class="fas fa-sync-alt"></i> Refresh Data
        </button>
      </div>
    </div>

    <!-- Global Monitoring Stats -->
    <div class="stats-grid fade-in" style="margin-top: 24px;">
      <div class="stat-card" style="border-left: 4px solid var(--primary);">
        <div class="stat-info">
          <h3 id="global-revenue">Rp 0</h3>
          <p>Total Pendapatan Global</p>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid var(--success);">
        <div class="stat-info">
          <h3 id="global-appts">0</h3>
          <p>Total Janji Temu</p>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid var(--info);">
        <div class="stat-info">
          <h3 id="global-customers">0</h3>
          <p>Total Basis Pelanggan</p>
        </div>
      </div>
    </div>

    <div class="card fade-in" style="margin-top: 24px;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 18px;"><i class="fas fa-list"></i> Daftar Barbershop Terdaftar</h2>
        <span class="badge" id="shop-count-badge">... Toko</span>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nama Toko</th>
              <th>Status</th>
              <th>Paket</th>
              <th>Terdaftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="shops-table-body">
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px;">
                <i class="fas fa-circle-notch fa-spin"></i> Memuat data utama...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const refreshBtn = container.querySelector('#refresh-btn');
  refreshBtn.addEventListener('click', loadMasterData);

  const addShopBtn = container.querySelector('#add-shop-btn');
  addShopBtn.addEventListener('click', () => renderAddShopModal(container));

  // Load data immediately
  loadMasterData();

  async function loadMasterData() {
    try {
      // 1. Fetch Global Core Data
      const [pRes, aRes, cRes, sRes] = await Promise.all([
        supabase.from('payments').select('amount'),
        supabase.from('appointments').select('id'),
        supabase.from('customers').select('id'),
        supabase.from('shops').select('*').order('created_at', { ascending: false })
      ]);

      if (sRes.error) throw sRes.error;

      const payments = pRes.data || [];
      const appointments = aRes.data || [];
      const customers = cRes.data || [];
      const shops = sRes.data || [];

      // 2. Update Stats
      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      container.querySelector('#global-revenue').textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
      container.querySelector('#global-appts').textContent = appointments.length;
      container.querySelector('#global-customers').textContent = customers.length;
      container.querySelector('#shop-count-badge').textContent = `${shops.length} Toko`;

      // 3. Render Table
      const tableBody = container.querySelector('#shops-table-body');
      if (shops.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">Belum ada toko yang didaftarkan.</td></tr>';
        return;
      }

      tableBody.innerHTML = shops.map(shop => `
        <tr>
          <td>
            <div class="shop-avatar" style="background: var(--primary-glow); color: var(--primary); width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
              ${shop.name?.[0] || 'S'}
            </div>
          </td>
          <td>
            <div style="font-weight: bold;">${shop.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${shop.slug}</div>
          </td>
          <td>
            <span class="status-badge status-${shop.status || 'trial'}">
              ${(shop.status || 'trial').toUpperCase()}
            </span>
          </td>
          <td>
            <div style="font-size: 13px; color: var(--primary); font-weight: 500;">
              ${shop.plan_id ? 'Pro Unlimited' : 'Basic Tier'}
            </div>
          </td>
          <td style="font-size: 13px; color: var(--text-muted);">
            ${new Date(shop.created_at).toLocaleDateString('id-ID')}
          </td>
          <td>
            <button class="btn-icon manage-btn" data-id="${shop.id}" title="Kelola Tenant">
              <i class="fas fa-cog"></i>
            </button>
          </td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('.manage-btn').forEach(btn => {
        btn.addEventListener('click', () => handleManageShop(btn.dataset.id));
      });

    } catch (err) {
      console.error('Master data load failed:', err);
      showToast('Gagal memuat data master.', 'danger');
    }
  }

  async function handleManageShop(shopId) {
    const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).single();
    if (!shop) return;

    const newStatus = prompt(`Ubah status untuk ${shop.name}?\n(active, trial, expired, atau deactivated):`, shop.status);
    if (newStatus && ['active', 'trial', 'expired', 'deactivated'].includes(newStatus.toLowerCase())) {
        const { error } = await supabase.from('shops').update({ status: newStatus.toLowerCase() }).eq('id', shopId);
        if (error) {
            showToast('Gagal mengubah status.', 'danger');
        } else {
            showToast(`Status ${shop.name} diperbarui.`, 'success');
            loadMasterData();
        }
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
          <div class="form-group">
            <label>Nama Barbershop *</label>
            <input type="text" id="new-shop-name" class="form-control" placeholder="Contoh: Barbershop Pusat" required />
          </div>
          <div class="form-group">
            <label>URL Slug *</label>
            <input type="text" id="new-shop-slug" class="form-control" placeholder="barbershop-pusat" required />
          </div>
          <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label>No. WA Toko</label>
              <input type="tel" id="new-shop-phone" class="form-control" placeholder="08..." />
            </div>
            <div>
              <label>Status Awal</label>
              <select id="new-shop-status" class="form-control">
                <option value="trial">Trial (Uji Coba)</option>
                <option value="active">Active (Langganan)</option>
              </select>
            </div>
          </div>

          <div class="card-section-title" style="margin-top: 20px;">Akun Admin Utama</div>
          <div class="form-group">
            <label>Username Admin *</label>
            <input type="text" id="new-admin-username" class="form-control" placeholder="admin_toko" required />
          </div>
          <div class="form-group">
            <label>Password Admin *</label>
            <input type="password" id="new-admin-password" class="form-control" placeholder="Min. 6 karakter" required minlength="6" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="submit-shop-btn" style="margin-top: 24px;">
            <i class="fas fa-save"></i> Daftarkan Barbershop
          </button>
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
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Memproses...';

      try {
        const name = nameInput.value;
        const slug = slugInput.value;
        const phone = modal.querySelector('#new-shop-phone').value;
        const status = modal.querySelector('#new-shop-status').value;
        const username = userInput.value;
        const password = modal.querySelector('#new-admin-password').value;

        const email = `${username}@barberpro.local`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: `Admin ${name}`, role: 'admin', username } }
        });

        if (authErr) throw authErr;
        const userId = authData.user?.id;

        const { data: newShop, error: shopErr } = await supabase.from('shops').insert([{
          name, slug, phone, status, owner_id: userId,
          plan_id: status === 'active' ? 'pro-unlimited' : null
        }]).select().single();

        if (shopErr) throw shopErr;

        await supabase.from('profiles').update({ shop_id: newShop.id }).eq('id', userId);
        await supabase.from('settings').insert([{ shop_id: newShop.id, shop_name: name, phone }]);

        showToast(`Tenant "${name}" berhasil didaftarkan!`, 'success');
        modal.remove();
        loadMasterData();

      } catch (err) {
        showToast(`Gagal: ${err.message}`, 'danger');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Daftarkan Barbershop';
      }
    });
  }
}
