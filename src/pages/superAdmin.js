import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export async function renderSuperAdmin(container) {
  let activeTab = 'shops'; // 'shops', 'revenue', 'plans'

  function renderLayout() {
    container.innerHTML = `
      <div class="super-admin-header fade-in">
        <div class="header-content">
          <h1>Master Platform Control</h1>
          <p>Sistem Manajemen Multi-Tenant BarberPro</p>
        </div>
        <div class="header-actions" style="display: flex; gap: 12px;">
          <button id="add-shop-btn" class="btn btn-primary">
            <i class="fas fa-plus"></i> Tambah Tenant Baru
          </button>
          <button id="refresh-btn" class="btn btn-secondary">
            <i class="fas fa-sync-alt"></i> Refresh Data
          </button>
        </div>
      </div>

      <!-- Master Nav Tabs -->
      <div class="master-tabs fade-in" style="margin-top: 24px; display: flex; gap: 4px; border-bottom: 1px solid var(--border);">
        <button class="tab-btn ${activeTab === 'shops' ? 'active' : ''}" data-tab="shops">Daftar Toko</button>
        <button class="tab-btn ${activeTab === 'revenue' ? 'active' : ''}" data-tab="revenue">Laporan Pendapatan</button>
        <button class="tab-btn ${activeTab === 'plans' ? 'active' : ''}" data-tab="plans">Pengaturan Paket (Tier)</button>
      </div>

      <div id="master-sub-content" style="margin-top: 20px;">
        <!-- Dynamic Content Here -->
      </div>
    `;

    // Tab Listeners
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        renderLayout();
        loadMasterData();
      });
    });

    // Action Listeners
    const refreshBtn = container.querySelector('#refresh-btn');
    refreshBtn?.addEventListener('click', loadMasterData);

    const addShopBtn = container.querySelector('#add-shop-btn');
    addShopBtn?.addEventListener('click', () => renderAddShopModal(container));
  }

  // Initial render
  renderLayout();
  loadMasterData();

  async function loadMasterData() {
    const contentArea = container.querySelector('#master-sub-content');
    if (!contentArea) return;

    try {
      const [pRes, aRes, sRes, plansRes] = await Promise.all([
        supabase.from('payments').select('amount'),
        supabase.from('appointments').select('id'),
        supabase.from('shops').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*').order('price', { ascending: true })
      ]);

      const shops = sRes.data || [];
      const plans = plansRes.data || [];
      const globalPayments = pRes.data || [];
      const globalAppts = aRes.data || [];

      if (activeTab === 'shops') {
        renderShopsTab(contentArea, shops, plans, globalPayments, globalAppts);
      } else if (activeTab === 'revenue') {
        renderRevenueTab(contentArea, shops, plans);
      } else if (activeTab === 'plans') {
        renderPlansTab(contentArea, plans);
      }

    } catch (err) {
      console.error('Master data load failed:', err);
      showToast('Gagal memuat data master.', 'danger');
    }
  }

  function renderShopsTab(contentArea, shops, plans, payments, appointments) {
    // 1. Expiry Check for Banner
    const criticalShops = shops.filter(s => {
      if (s.status !== 'trial' && s.status !== 'active') return false;
      if (!s.trial_end_date) return false;
      const daysLeft = Math.ceil((new Date(s.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 3;
    });

    const activeShops = shops.filter(s => s.status === 'active');
    const trialShops = shops.filter(s => s.status === 'trial');
    const totalShopRev = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const mrr = activeShops.reduce((sum, shop) => {
      const p = plans?.find(pl => pl.id === shop.plan_id);
      return sum + (p?.price || 0);
    }, 0);

    contentArea.innerHTML = `
      ${criticalShops.length > 0 ? `
        <div class="alert alert-warning fade-in" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <i class="fas fa-bell"></i> <strong>Peringatan Masa Aktif:</strong> ${criticalShops.length} toko akan segera berakhir dalam 3 hari!
          </div>
          <button class="btn btn-sm btn-outline-warning" onclick="this.parentElement.remove()">Tutup</button>
        </div>
      ` : ''}

      <div class="stats-grid fade-in">
        <div class="stat-card" style="border-left: 4px solid #f39c12;">
          <div class="stat-info">
            <h3>Rp ${mrr.toLocaleString('id-ID')}</h3>
            <p>Potensi Pendapatan (MRR)</p>
          </div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #2ecc71;">
          <div class="stat-info">
            <h3>${activeShops.length}</h3>
            <p>Toko Active</p>
          </div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #3498db;">
          <div class="stat-info">
            <h3>${trialShops.length}</h3>
            <p>Toko Trial</p>
          </div>
        </div>
      </div>

      <div class="card fade-in" style="margin-top: 20px;">
        <div class="card-header">
           <h2 style="font-size: 16px;">Daftar Tenant</h2>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Toko</th>
                <th>Status</th>
                <th>Paket</th>
                <th>Masa Berlaku</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="shops-table-body">
               ${shops.map(shop => {
                 const plan = plans?.find(p => p.id === shop.plan_id);
                 const expiry = shop.trial_end_date ? new Date(shop.trial_end_date).toLocaleDateString('id-ID') : (shop.status === 'active' ? 'Selamanya' : '-');
                 return `
                    <tr>
                      <td>
                        <div style="font-weight: bold; cursor: pointer; color: var(--primary);" onclick="window.handleShopDetail('${shop.id}')">${shop.name}</div>
                        <div style="font-size: 10px; color: var(--text-muted);">${shop.slug}</div>
                      </td>
                      <td><span class="status-badge status-${shop.status}">${shop.status.toUpperCase()}</span></td>
                      <td>${plan?.name || '-'}</td>
                      <td>${expiry}</td>
                      <td>
                        <div style="display: flex; gap: 4px;">
                          <button class="btn-icon manage-btn" onclick="window.handleManageShop('${shop.id}', ${JSON.stringify(plans).replace(/"/g, '&quot;')})" title="Edit"><i class="fas fa-edit"></i></button>
                          <button class="btn-icon text-danger delete-shop-btn" data-id="${shop.id}" title="Hapus"><i class="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                 `;
               }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Listeners for shops tab
    contentArea.querySelectorAll('.delete-shop-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteShop(btn.dataset.id));
    });
  }

  function renderRevenueTab(contentArea, shops, plans) {
    const activeShops = shops.filter(s => s.status === 'active');
    const mrrHistory = activeShops.map(s => {
      const p = plans?.find(pl => pl.id === s.plan_id);
      return { name: s.name, plan: p?.name || '?', amount: p?.price || 0 };
    });

    const totalMRR = mrrHistory.reduce((sum, h) => sum + h.amount, 0);

    contentArea.innerHTML = `
      <div class="card fade-in">
        <div class="card-header">
          <h2><i class="fas fa-money-bill-trend-up"></i> Ringkasan Pendapatan Langganan (MRR)</h2>
        </div>
        <div style="padding: 20px; text-align: center; background: var(--bg-secondary); margin: 20px; border-radius: 12px;">
          <div style="font-size: 14px; color: var(--text-muted);">Total Pendapatan Bulanan (Estimasi)</div>
          <div style="font-size: 32px; font-weight: 800; color: var(--primary);">Rp ${totalMRR.toLocaleString('id-ID')}</div>
        </div>
        <div class="table-container" style="padding: 0 20px 20px 20px;">
           <table class="data-table">
              <thead>
                <tr>
                  <th>Nama Toko</th>
                  <th>Paket</th>
                  <th>Nilai Kontrak / Bln</th>
                </tr>
              </thead>
              <tbody>
                ${mrrHistory.map(h => `
                  <tr>
                    <td>${h.name}</td>
                    <td><span class="badge">${h.plan}</span></td>
                    <td style="font-weight: bold; color: var(--success);">Rp ${h.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
           </table>
        </div>
      </div>
    `;
  }

  function renderPlansTab(contentArea, plans) {
    contentArea.innerHTML = `
      <div class="card fade-in">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2><i class="fas fa-tags"></i> Pengaturan Tier & Fitur</h2>
          <button class="btn btn-sm btn-primary" onclick="showToast('Fitur tambah paket manual segera hadir!', 'info')">Tambah Tier</button>
        </div>
        <div class="plans-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 20px;">
          ${plans.map(p => `
            <div class="plan-card" style="border: 1px solid var(--border); padding: 15px; border-radius: 12px; background: var(--bg-primary);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="color: var(--primary);">${p.name}</h3>
                <span class="badge">Rp ${p.price.toLocaleString()}</span>
              </div>
              <div style="margin-top: 15px;">
                <label style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Fitur Aktif:</label>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                   ${(p.features || []).map(f => `
                     <span style="font-size: 9px; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border);">${f}</span>
                   `).join('')}
                </div>
              </div>
              <button class="btn btn-block btn-secondary btn-sm" style="margin-top: 15px;" onclick="window.handleEditPlan('${p.id}')">
                <i class="fas fa-cog"></i> Edit Fitur
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async function handleDeleteShop(shopId) {
    if (!confirm('HAPUS TOKO INI PERMANEN?\n\nTindakan ini akan menghapus semua data transaksi, pelanggan, dan pengaturan toko tersebut. Tidak bisa dibatalkan.')) return;

    try {
      showToast('Menghapus toko...', 'info');
      // 1. Get owner profile to delete auth user? (Maybe risky, skip for now, just delete data)
      // 2. Delete data (RLS and Cascades should handle most, but we'll do main ones)
      const { error } = await supabase.from('shops').delete().eq('id', shopId);
      if (error) throw error;

      showToast('Toko dan seluruh datanya berhasil dihapus!', 'success');
      loadMasterData();
    } catch (err) {
      showToast('Gagal menghapus: ' + err.message, 'danger');
    }
  }

  // Bind handlers to window for onclick work in templates
  window.handleShopDetail = handleShopDetail;
  window.handleManageShop = handleManageShop;
  window.handleEditPlan = async (id) => {
    const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', id).single();
    if (!plan) return;

    // All available features in code
    const allFeatures = ['dashboard', 'appointments', 'queue', 'customers', 'barbers', 'attendance', 'pos', 'payments', 'promos', 'reports', 'expenses', 'inventory', 'memberships', 'gallery', 'logbook', 'portal'];

    const body = `
      <form id="edit-plan-form">
        <div class="form-group">
          <label>Harga Paket (Bulanan)</label>
          <input type="number" id="edit-plan-price" class="form-control" value="${plan.price}" required />
        </div>
        <div class="form-group">
          <label>Pilih Fitur yang Diaktifkan:</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
            ${allFeatures.map(f => `
              <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" name="features" value="${f}" ${plan.features?.includes(f) ? 'checked' : ''} />
                ${f.toUpperCase()}
              </label>
            `).join('')}
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">Update Plan</button>
      </form>
    `;

    openModal(`Edit Fitur: ${plan.name}`, body, '', { maxWidth: '500px' });

    document.querySelector('#edit-plan-form').onsubmit = async (e) => {
      e.preventDefault();
      const price = document.querySelector('#edit-plan-price').value;
      const selected = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(i => i.value);

      try {
        const { error } = await supabase.from('subscription_plans').update({
          price: parseInt(price),
          features: selected
        }).eq('id', id);

        if (error) throw error;
        showToast('Paket berhasil diperbarui!', 'success');
        closeModal();
        loadMasterData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  };

  async function handleManageShop(shopId, plans) {
    const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).single();
    if (!shop) return;

    const body = `
      <form id="edit-shop-form">
        <div class="form-group">
          <label>Status Toko</label>
          <select id="edit-shop-status" class="form-control">
            <option value="trial" ${shop.status === 'trial' ? 'selected' : ''}>Trial (Uji Coba)</option>
            <option value="active" ${shop.status === 'active' ? 'selected' : ''}>Active (Berbayar)</option>
            <option value="expired" ${shop.status === 'expired' ? 'selected' : ''}>Expired</option>
            <option value="deactivated" ${shop.status === 'deactivated' ? 'selected' : ''}>Deactivated (Blokir)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Pilih Paket Langganan</label>
          <select id="edit-shop-plan" class="form-control">
            <option value="">-- Pilih Paket --</option>
            ${plans.map(p => `
              <option value="${p.id}" ${shop.plan_id === p.id ? 'selected' : ''}>${p.name} (Rp ${p.price.toLocaleString()})</option>
            `).join('')}
          </select>
        </div>
        <p style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin: 12px 0;">
          * Perubahan status ke 'Active' akan memasukkan toko ke dalam hitungan MRR Anda.
        </p>
        <button type="submit" class="btn btn-primary btn-block">Simpan Perubahan</button>
      </form>
    `;

    openModal(`Kelola Langganan: ${shop.name}`, body, '', { maxWidth: '400px' });

    document.querySelector('#edit-shop-form').onsubmit = async (e) => {
      e.preventDefault();
      const newStatus = document.querySelector('#edit-shop-status').value;
      const newPlan = document.querySelector('#edit-shop-plan').value;

      try {
        const { error } = await supabase.from('shops').update({ 
          status: newStatus,
          plan_id: newPlan || null
        }).eq('id', shopId);

        if (error) throw error;
        
        showToast('Langganan berhasil diperbarui!', 'success');
        closeModal();
        loadMasterData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  }

  async function handleShopDetail(shopId) {
    try {
      showToast('Memuat detail toko...', 'info');
      
      const { data: shop } = await supabase.from('shops').select('*, subscription_plans(name)').eq('id', shopId).single();
      const { data: settings } = await supabase.from('settings').select('*').eq('shop_id', shopId).maybeSingle();
      
      if (!shop) return;

      let remainingDays = 'N/A';
      let issueAlert = '';

      if (shop.status === 'trial' && shop.trial_end_date) {
        const end = new Date(shop.trial_end_date);
        const diff = end - new Date();
        remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (remainingDays <= 3) issueAlert = `<div class="alert alert-warning" style="margin-top:15px; font-size:12px;"><i class="fas fa-exclamation-triangle"></i> Masa trial hampir habis (${remainingDays} hari lagi). Segera hubungi pemilik!</div>`;
        if (remainingDays < 0) remainingDays = 'Expired';
      } else if (shop.status === 'active') {
        remainingDays = 'Unlimited / Active';
      } else {
        remainingDays = 'Expired / Inactive';
        issueAlert = `<div class="alert alert-danger" style="margin-top:15px; font-size:12px;"><i class="fas fa-times-circle"></i> Akun toko telah ditangguhkan atau masa aktif habis.</div>`;
      }

      const body = `
        <div class="shop-detail-view" style="padding: 5px;">
          <div style="margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 15px;">
            <label style="font-size:11px; color: var(--text-muted); text-transform:uppercase;">Nama Toko</label>
            <div style="font-size: 18px; font-weight:800; color: var(--primary);">${shop.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">Slug: ${shop.slug}</div>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="font-size:11px; color: var(--text-muted); text-transform:uppercase;"><i class="fas fa-map-marker-alt"></i> Lokasi / Alamat</label>
            <div style="font-size: 14px; line-height: 1.6; margin-top:5px;">
              ${settings?.address || 'Alamat belum diatur oleh pemilik toko.'}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top:5px;">WA: ${settings?.phone || shop.phone || '-'}</div>
          </div>

          <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-top: 20px;">
             <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                   <label style="font-size:11px; color: var(--text-muted); text-transform:uppercase;">Masa Aktif</label>
                   <div style="font-size: 15px; font-weight:700;">${remainingDays} ${typeof remainingDays === 'number' ? 'Hari' : ''}</div>
                </div>
                <div style="text-align: right;">
                   <label style="font-size:11px; color: var(--text-muted); text-transform:uppercase;">Paket</label>
                   <div style="font-size: 13px; font-weight:600; color: var(--primary);">${shop.subscription_plans?.name || 'No Plan'}</div>
                </div>
             </div>
             ${issueAlert}
          </div>

          <div style="margin-top: 25px; display: flex; gap: 10px;">
             <button class="btn btn-secondary btn-block" onclick="closeModal()">Tutup</button>
             <a href="/portal.html?shop=${shop.slug}" target="_blank" class="btn btn-primary btn-block" style="text-decoration:none; text-align:center;">Lihat Portal</a>
          </div>
        </div>
      `;

      openModal(`${shop.name}`, body, '', { maxWidth: '450px' });

    } catch (err) {
      showToast('Gagal memuat detail.', 'danger');
    }
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }

  async function renderAddShopModal(container) {
    let { data: plans } = await supabase.from('subscription_plans').select('*');
    if (!plans) plans = [];
    
    const body = `
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
            <label>Pilih Paket</label>
            <select id="new-shop-plan" class="form-control">
              ${plans.length > 0 ? plans.map(p => `
                <option value="${p.id}">${p.name}</option>
              `).join('') : '<option value="">-- Jalankan SQL Terlebih Dahulu --</option>'}
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
    `;

    const modal = openModal('Tambah Tenant Baru', body, '', { maxWidth: '500px' });

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
        const planId = modal.querySelector('#new-shop-plan').value;
        const username = userInput.value;
        const password = modal.querySelector('#new-admin-password').value;

        const email = `${username}@barberpro.local`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: `Admin ${name}`, role: 'admin', username } }
        });

        if (authErr) throw authErr;
        const userId = authData.user?.id;

        const { data: newShop, error: shopErr } = await supabase.from('shops').insert([{
          name, slug, phone, status: 'trial', owner_id: userId,
          plan_id: planId
        }]).select().single();

        if (shopErr) throw shopErr;

        await supabase.from('profiles').update({ shop_id: newShop.id }).eq('id', userId);
        await supabase.from('settings').insert([{ shop_id: newShop.id, shop_name: name, phone }]);

        showToast(`Tenant "${name}" berhasil didaftarkan!`, 'success');
        closeModal();
        loadMasterData();

      } catch (err) {
        showToast(`Gagal: ${err.message}`, 'danger');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Daftarkan Barbershop';
      }
    });
  }
}
