import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export async function renderSuperAdmin(container) {
  container.innerHTML = `
    <div class="super-admin-header fade-in">
      <div class="header-content">
        <h1>Master Dashboard Platform</h1>
        <p>Manajemen seluruh tenant dan langganan BarberPro</p>
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

  const addShopBtn = container.querySelector('#add-shop-btn');
  addShopBtn.addEventListener('click', () => renderAddShopModal(container));

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

  function slugify(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
              <label>No. HP / WA</label>
              <input type="tel" id="new-shop-phone" class="form-control" placeholder="08..." />
            </div>
            <div>
              <label>Status Awal</label>
              <select id="new-shop-status" class="form-control">
                <option value="trial">Trial (7 Hari)</option>
                <option value="active">Langsung Aktif</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Alamat</label>
            <textarea id="new-shop-address" class="form-control" rows="2" placeholder="Jl. Contoh..."></textarea>
          </div>

          <div class="card-section-title" style="margin-top: 20px;">Akun Admin Pemberi Akses</div>
          <div class="form-group">
            <label>Username Admin *</label>
            <input type="text" id="new-admin-username" class="form-control" placeholder="admin_shopname" required />
            <small style="color: var(--text-muted); font-size: 11px;">Email otomatis: username@barberpro.local</small>
          </div>
          <div class="form-group">
            <label>Password Admin *</label>
            <input type="password" id="new-admin-password" class="form-control" placeholder="Min. 6 karakter" required minlength="6" />
          </div>

          <div style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary btn-block" id="submit-shop-btn">
              <i class="fas fa-save"></i> Daftarkan Barbershop
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.remove();

    const nameInput = modal.querySelector('#new-shop-name');
    const slugInput = modal.querySelector('#new-shop-slug');
    const userInput = modal.querySelector('#new-admin-username');
    
    nameInput.addEventListener('input', () => {
      slugInput.value = slugify(nameInput.value);
      userInput.value = `admin_${slugInput.value.replace(/-/g, '_')}`;
    });

    const form = modal.querySelector('#add-shop-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = modal.querySelector('#submit-shop-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Memproses...';

      try {
        const name = nameInput.value.trim();
        const slug = slugInput.value.trim();
        const phone = modal.querySelector('#new-shop-phone').value.trim();
        const status = modal.querySelector('#new-shop-status').value;
        const address = modal.querySelector('#new-shop-address').value.trim();
        const username = userInput.value.trim();
        const password = modal.querySelector('#new-admin-password').value;

        // 1. Create Auth User
        const email = `${username}@barberpro.local`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: `Admin ${name}`, role: 'admin', username },
          },
        });

        if (authErr) throw authErr;
        const userId = authData.user?.id;

        // 2. Create Shop
        const { data: newShop, error: shopErr } = await supabase
          .from('shops')
          .insert([{
            name,
            slug,
            phone,
            address,
            status,
            owner_id: userId,
            plan_id: status === 'active' ? 'pro-unlimited' : null
          }])
          .select()
          .single();

        if (shopErr) throw shopErr;

        // 3. Update Profile with Shop ID
        await supabase.from('profiles').update({ shop_id: newShop.id }).eq('id', userId);

        // 4. Create default settings
        await supabase.from('settings').insert([{
          shop_id: newShop.id,
          shop_name: name,
          phone,
          address
        }]);

        showToast(`Tenant "${name}" berhasil didaftarkan!`, 'success');
        modal.remove();
        loadShops();

      } catch (err) {
        console.error('Error adding shop:', err);
        showToast(`Gagal: ${err.message}`, 'danger');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Daftarkan Barbershop';
      }
    });
  }
}
