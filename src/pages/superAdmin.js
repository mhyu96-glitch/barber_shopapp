import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export async function renderSuperAdmin(container) {
  let activeTab = 'shops'; // 'shops', 'revenue', 'plans'

  function renderLayout() {
    container.innerHTML = `
      <div class="super-admin-header fade-in" style="padding: 20px 0; border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #f1c40f, #f39c12); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);">
              <i class="fas fa-crown"></i>
            </div>
            <div>
              <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #2c3e50;">Master Platform Control</h2>
              <p style="margin: 2px 0 0 0; color: #7f8c8d; font-size: 13px; font-weight: 500;">Multi-Tenant SaaS Management • Executive Edition</p>
            </div>
          </div>
          <div class="header-actions" style="display: flex; gap: 12px;">
            <button id="add-shop-btn" class="btn btn-primary" style="box-shadow: 0 4px 10px var(--primary-shadow);">
              <i class="fas fa-plus"></i> Tambah Tenant Baru
            </button>
            <button id="refresh-btn" class="btn btn-secondary">
              <i class="fas fa-sync-alt"></i> Refresh Data
            </button>
          </div>
        </div>

        <!-- Master Nav Tabs -->
        <div class="master-tabs fade-in" style="margin-top: 35px; display: flex; gap: 30px; border-bottom: 2px solid #ecf0f1;">
          <button class="tab-btn ${activeTab === 'shops' ? 'active' : ''}" data-tab="shops" style="padding: 12px 5px; border: none; background: none; font-weight: 700; color: ${activeTab === 'shops' ? 'var(--primary)' : '#bdc3c7'}; cursor: pointer; border-bottom: 3px solid ${activeTab === 'shops' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s; font-size: 15px;">
            <i class="fas fa-store" style="margin-right: 8px;"></i> Daftar Toko
          </button>
          <button class="tab-btn ${activeTab === 'revenue' ? 'active' : ''}" data-tab="revenue" style="padding: 12px 5px; border: none; background: none; font-weight: 700; color: ${activeTab === 'revenue' ? 'var(--primary)' : '#bdc3c7'}; cursor: pointer; border-bottom: 3px solid ${activeTab === 'revenue' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s; font-size: 15px;">
            <i class="fas fa-chart-line" style="margin-right: 8px;"></i> Laporan Pendapatan
          </button>
          <button class="tab-btn ${activeTab === 'plans' ? 'active' : ''}" data-tab="plans" style="padding: 12px 5px; border: none; background: none; font-weight: 700; color: ${activeTab === 'plans' ? 'var(--primary)' : '#bdc3c7'}; cursor: pointer; border-bottom: 3px solid ${activeTab === 'plans' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s; font-size: 15px;">
            <i class="fas fa-gem" style="margin-right: 8px;"></i> Pengaturan Paket
          </button>
        </div>
      </div>

      <div id="master-sub-content">
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
      const results = await Promise.all([
        supabase.from('payments').select('amount'),
        supabase.from('appointments').select('id'),
        supabase.from('shops').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*').order('price', { ascending: true })
      ]);

      // Check for errors in any of the results
      const errors = results.filter(r => r.error).map(r => r.error.message);
      if (errors.length > 0) {
        console.warn('Partial data load failure:', errors);
      }

      const globalPayments = results[0].data || [];
      const globalAppts = results[1].data || [];
      const shops = results[2].data || [];
      const plans = results[3].data || [];

      if (activeTab === 'shops') {
        renderShopsTab(contentArea, shops, plans, globalPayments, globalAppts);
      } else if (activeTab === 'revenue') {
        renderRevenueTab(contentArea, shops, plans);
      } else if (activeTab === 'plans') {
        renderPlansTab(contentArea, plans);
      }

    } catch (err) {
      console.error('CRITICAL MASTER LOAD ERROR:', err);
      showToast('Gagal memuat data: ' + err.message, 'danger');
      contentArea.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #7f8c8d;">
          <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #e74c3c; margin-bottom: 20px;"></i>
          <h3>Gagal Memuat Data</h3>
          <p>${err.message}</p>
          <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-top: 20px;">
            <i class="fas fa-sync"></i> Muat Ulang Halaman
          </button>
        </div>
      `;
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

    // Use a closure variable to keep track of plans for the manage modal
    const currentPlans = plans;

    contentArea.innerHTML = `
      ${criticalShops.length > 0 ? `
        <div class="alert alert-warning fade-in" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <i class="fas fa-bell"></i> <strong>Peringatan Masa Aktif:</strong> ${criticalShops.length} toko akan segera berakhir dalam 3 hari!
          </div>
          <button class="btn btn-sm btn-outline-warning" onclick="this.parentElement.remove()">Tutup</button>
        </div>
      ` : ''}

      <div class="stats-grid fade-in" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="stat-card" style="background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 20px; border: 1px solid rgba(0,0,0,0.05); border-left: 5px solid #f39c12;">
           <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(243, 156, 18, 0.1); display: flex; align-items: center; justify-content: center; color: #f39c12; font-size: 22px;">
             <i class="fas fa-money-bill-trend-up"></i>
           </div>
           <div>
             <div style="font-size: 24px; font-weight: 800; color: #2c3e50;">Rp ${mrr.toLocaleString('id-ID')}</div>
             <div style="font-size: 11px; color: #7f8c8d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">PENDAPATAN (MRR)</div>
           </div>
        </div>
        <div class="stat-card" style="background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 20px; border: 1px solid rgba(0,0,0,0.05); border-left: 5px solid #2ecc71;">
           <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(46, 204, 113, 0.1); display: flex; align-items: center; justify-content: center; color: #2ecc71; font-size: 22px;">
             <i class="fas fa-store"></i>
           </div>
           <div>
             <div style="font-size: 24px; font-weight: 800; color: #2c3e50;">${activeShops.length}</div>
             <div style="font-size: 11px; color: #7f8c8d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">TENANT AKTIF</div>
           </div>
        </div>
        <div class="stat-card" style="background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 20px; border: 1px solid rgba(0,0,0,0.05); border-left: 5px solid #3498db;">
           <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(52, 152, 219, 0.1); display: flex; align-items: center; justify-content: center; color: #3498db; font-size: 22px;">
             <i class="fas fa-flask"></i>
           </div>
           <div>
             <div style="font-size: 24px; font-weight: 800; color: #2c3e50;">${trialShops.length}</div>
             <div style="font-size: 11px; color: #7f8c8d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">TENANT TRIAL</div>
           </div>
        </div>
      </div>

      <div class="card fade-in" style="margin-top: 20px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 15px; overflow: hidden;">
        <div class="card-header" style="background: #f8f9fa; padding: 20px 25px; border-bottom: 1px solid rgba(0,0,0,0.05);">
           <h2 style="font-size: 18px; font-weight: 800; color: #2c3e50; margin: 0; display: flex; align-items: center; gap: 10px;">
             <i class="fas fa-list-check" style="color: var(--primary);"></i> Daftar Tenant
           </h2>
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
                          <button class="btn-icon manage-btn" data-id="${shop.id}" title="Edit"><i class="fas fa-edit"></i></button>
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

    contentArea.querySelectorAll('.manage-btn').forEach(btn => {
      btn.addEventListener('click', () => handleManageShop(btn.dataset.id, currentPlans));
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
    if (!confirm('HAPUS TOKO INI PERMANEN?\n\nTindakan ini akan menghapus SELURUH data transaksi, pelanggan, layanan, dan pengaturan toko tersebut.\n\nAPAKAH ANDA YAKIN?')) return;

    try {
      showToast('Menghubungkan ke database...', 'info');
      
      // 🖇️ Precise Order of Deletion (Most dependent to least)
      const tables = [
        'payments',       // (1) Depends on appointments
        'appointments',    // (2) Depends on barbers, customers, services
        'attendance',      // (3) Depends on profiles
        'inventory',       // (4) Independent
        'expenses',        // (5) Independent
        'promos',          // (6) Independent
        'gallery',         // (7) Independent
        'holidays',        // (8) Independent
        'services',        // (9) Independent
        'barbers',         // (10) Independent
        'customers',       // (11) Independent
        'memberships',     // (12) Extra
        'logbook'          // (13) Extra
      ];

      for (const table of tables) {
        showToast(`Membersihkan: ${table.toUpperCase()}...`, 'info');
        const { error } = await supabase.from(table).delete().eq('shop_id', shopId);
        if (error) {
           console.warn(`Skip ${table}:`, error.message);
           // If error is FK but not shop_id, this might be a problem later
        }
      }

      // 👤 Clear Profiles & Settings
      showToast('Membersihkan: PROFIL & SETTINGS...', 'info');
      await supabase.from('profiles').delete().eq('shop_id', shopId);
      await supabase.from('settings').delete().eq('shop_id', shopId);

      // 🏠 Finally, delete the shop row
      showToast('Menghapus Baris Toko Utama...', 'info');
      const { error: shopErr } = await supabase.from('shops').delete().eq('id', shopId);
      
      if (shopErr) throw new Error(`Database Error (${shopErr.code}): ${shopErr.message}`);

      showToast('Toko dan seluruh datanya telah dihapus selamanya!', 'success');
      loadMasterData();
    } catch (err) {
      console.error('Final Shop Delete Failure:', err);
      // Give the user specific info if it's a FK constraint error
      let errMsg = err.message;
      if (errMsg.includes('violates foreign key constraint')) {
          errMsg = "Masih ada data yang tersangkut. Harap hubungi developer atau jalankan query pembersihan manual.";
      }
      showToast('Gagal menghapus total: ' + errMsg, 'danger');
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
