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
            <div class="flex gap-2">
              <button class="btn-icon manage-btn" data-id="${shop.id}" title="Kelola Tenant">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon provision-btn" data-id="${shop.id}" data-name="${shop.name}" data-slug="${shop.slug}" title="Daftarkan Akun Admin" style="color: #6366f1;">
                <i class="fas fa-user-plus"></i>
              </button>
              <button class="btn-icon delete-btn" data-id="${shop.id}" title="Hapus Unit" style="color: #ef4444;">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Add event listeners
      tableBody.querySelectorAll('.manage-btn').forEach(btn => {
        btn.addEventListener('click', () => handleManageShop(btn.dataset.id));
      });
      tableBody.querySelectorAll('.provision-btn').forEach(btn => {
        btn.onclick = () => {
          const { id, name, slug } = btn.dataset;
          renderAdminProvisioning(id, name, slug);
        };
      });
      tableBody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const shop = shops.find(s => s.id === btn.dataset.id);
          if (shop) handleDeleteShop(shop);
        });
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

  function renderAdminProvisioning(shopId, shopName, shopSlug) {
    const body = `
      <div style="padding: 15px 0;">
        <p style="margin-bottom: 20px; font-size: 14px; color: var(--text-muted);">
          Membuat akun admin utama untuk <strong>${shopName}</strong>.
        </p>
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; margin-bottom: 5px; color: var(--primary);">NAMA LENGKAP OWNER</label>
          <input type="text" id="prov-full-name" class="form-control" placeholder="Wahyu Pratama" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; margin-bottom: 5px; color: var(--primary);">USERNAME LOGIN</label>
          <input type="text" id="prov-admin-user" class="form-control" placeholder="wahyu_admin" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
          <small style="color: #999; font-size: 10px;">ID Toko: ${shopSlug}</small>
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; margin-bottom: 5px; color: var(--primary);">PASSWORD TEMPORARY</label>
          <input type="password" id="prov-admin-pass" class="form-control" placeholder="••••••••" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        </div>
      </div>
    `;

    const footer = `
      <div style="display: flex; gap: 10px; width: 100%;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="closeModal()">Batal</button>
        <button id="provision-confirm-btn" class="btn" style="flex: 2; background: var(--primary); color: white;">Buat Akun Admin</button>
      </div>
    `;

    openModal(`Provision Admin: ${shopName}`, body, footer, { maxWidth: '450px' });

    document.getElementById('provision-confirm-btn').onclick = async (e) => {
      const btn = e.target;
      const fullName = document.getElementById('prov-full-name').value.trim();
      const username = document.getElementById('prov-admin-user').value.trim().toLowerCase();
      const password = document.getElementById('prov-admin-pass').value;

      if (!fullName || !username || password.length < 6) {
        showToast('Mohon lengkapi field (Password min. 6 karakter)', 'danger');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

      try {
        // Scoped Email for Multi-tenancy
        const email = `${username}.${shopSlug}@barberpro.local`;

        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName, 
              role: 'admin', 
              username: username,
              shop_id: shopId
            }
          }
        });

        if (authErr) throw authErr;

        const userId = authData.user?.id;
        if (!userId) throw new Error('User registry failed');

        // Create profile (triggered automatically but we upsert for safety)
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: fullName,
          username: username,
          role: 'admin',
          shop_id: shopId
        });

        // Update shop owner
        await supabase.from('shops').update({ owner_id: userId }).eq('id', shopId);

        showToast('Admin Account Provisioned Successfully!', 'success');
        closeModal();
      } catch (err) {
        console.error('Provisioning failed:', err);
        showToast('Gagal: ' + err.message, 'danger');
        btn.disabled = false;
        btn.innerHTML = 'Buat Akun Admin';
      }
    };
  }

  async function handleDeleteShop(shop) {
    const shopId = shop.id;
    const shopName = shop.name;

    const body = `
      <div style="padding: 10px 0;">
        <p style="color: #ef4444; font-weight: bold; margin-bottom: 15px;">
          TINDAKAN INI BERSIFAT PERMANEN!
        </p>
        <p style="margin-bottom: 15px; font-size: 14px; line-height: 1.5;">
          Menghapus unit <strong>${shopName}</strong> akan menghapus seluruh data terkait termasuk Barber, Layanan, Janji Temu, dan Pengaturan.
        </p>
        <p style="margin-bottom: 8px; font-size: 13px;">Ketik nama toko untuk konfirmasi:</p>
        <input type="text" id="confirm-shop-name" class="form-control" placeholder="${shopName}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
      </div>
    `;

    const footer = `
      <div style="display: flex; gap: 10px; width: 100%;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="closeModal()">Batal</button>
        <button id="final-delete-btn" class="btn" style="flex: 1; background: #ef4444; color: white; opacity: 0.5;" disabled>Hapus Permanen</button>
      </div>
    `;

    openModal('Double-Lock Confirmation', body, footer, { maxWidth: '400px' });

    const input = document.getElementById('confirm-shop-name');
    const deleteBtn = document.getElementById('final-delete-btn');

    input.oninput = (e) => {
      if (e.target.value === shopName) {
        deleteBtn.disabled = false;
        deleteBtn.style.opacity = '1';
      } else {
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.5';
      }
    };

    deleteBtn.onclick = async () => {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Purging...';

      try {
        const tables = [
          'settings', 'barbers', 'services', 'appointments', 
          'customers', 'attendance', 'subscriptions', 'profiles'
        ];

        for (const table of tables) {
          const { error: purgeError } = await supabase.from(table).delete().eq('shop_id', shopId);
          if (purgeError) console.warn(`Note: Purge check - ${table}:`, purgeError.message);
        }

        const { error: finalError } = await supabase.from('shops').delete().eq('id', shopId);
        
        if (finalError) throw finalError;

        showToast('Node Registry Purged Successfully', 'success');
        closeModal();
        loadShops();
      } catch (err) {
        showToast('Purge Failed: ' + err.message, 'danger');
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = 'Hapus Permanen';
      }
    };
  }
}
