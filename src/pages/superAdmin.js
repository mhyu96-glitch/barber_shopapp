import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export async function renderSuperAdmin(container) {
  let activeTab = 'shops'; // 'shops', 'revenue', 'plans'
  let searchTerm = '';     // Real-time search filter

  function renderLayout() {
    container.innerHTML = `
      <style>
        .master-glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; }
        .glow-crown { box-shadow: 0 0 20px rgba(243, 156, 18, 0.4); animation: crown-pulse 3s infinite; }
        @keyframes crown-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .tab-btn { position: relative; overflow: hidden; }
        .tab-btn.active::after { content:''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--accent); }
        .master-search-group { position: relative; margin-bottom: 25px; }
        .master-search-group i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .master-search-group input { padding-left: 45px !important; border-radius: 50px !important; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2) !important; color: white !important; }
      </style>

      <div class="super-admin-header fade-in" style="padding: 25px 0; margin-bottom: 35px;">
        <div class="master-glass" style="padding: 25px 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div class="glow-crown" style="width: 65px; height: 65px; background: linear-gradient(135deg, #f1c40f, #d4a843); border-radius: 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 30px;">
              <i class="fas fa-crown"></i>
            </div>
            <div>
              <div style="font-size: 11px; letter-spacing: 2px; color: #f1c40f; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">GLOBAL PLATFORM</div>
              <h2 style="margin: 0; font-size: 28px; font-weight: 900; color: white; letter-spacing: -0.5px;">Master Control Center</h2>
            </div>
          </div>
          <div class="header-actions" style="display: flex; gap: 15px;">
            <button id="add-shop-btn" class="btn btn-primary" style="padding: 12px 25px; border-radius: 50px; font-weight: 700; background: linear-gradient(to right, var(--accent), var(--accent-dark)); border: none;">
              <i class="fas fa-plus"></i> <span class="hide-mobile">Tenant Baru</span>
            </button>
            <button id="refresh-btn" class="btn btn-ghost" style="border-radius: 50px; border: 1px solid rgba(255,255,255,0.1);">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <!-- Master Nav Nav -->
        <div class="master-tabs fade-in" style="margin-top: 30px; display: flex; gap: 40px; padding: 0 10px;">
          <button class="tab-btn ${activeTab === 'shops' ? 'active' : ''}" data-tab="shops" style="padding: 15px 5px; border: none; background: none; font-weight: 800; color: ${activeTab === 'shops' ? 'var(--accent)' : 'var(--text-muted)'}; cursor: pointer; transition: all 0.3s; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Daftar Toko
          </button>
          <button class="tab-btn ${activeTab === 'revenue' ? 'active' : ''}" data-tab="revenue" style="padding: 15px 5px; border: none; background: none; font-weight: 800; color: ${activeTab === 'revenue' ? 'var(--accent)' : 'var(--text-muted)'}; cursor: pointer; transition: all 0.3s; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Pendapatan
          </button>
          <button class="tab-btn ${activeTab === 'plans' ? 'active' : ''}" data-tab="plans" style="padding: 15px 5px; border: none; background: none; font-weight: 800; color: ${activeTab === 'plans' ? 'var(--accent)' : 'var(--text-muted)'}; cursor: pointer; transition: all 0.3s; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
            Paket & Fitur
          </button>
        </div>
        <div style="height: 1px; background: rgba(255,255,255,0.05); width: 100%; margin-top: -1px;"></div>
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
      let shops = results[2].data || [];
      const plans = results[3].data || [];

      // Apply Search Filter locally
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        shops = shops.filter(s => 
          s.name.toLowerCase().includes(query) || 
          s.slug.toLowerCase().includes(query)
        );
      }

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

  function getTimeAgo(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    if (diffInDays === 1) return 'Kemarin';
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
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
    const mrr = activeShops.reduce((sum, shop) => {
      const p = plans?.find(pl => pl.id === shop.plan_id);
      return sum + (p?.price || 0);
    }, 0);

    const currentPlans = plans;

    contentArea.innerHTML = `
      ${criticalShops.length > 0 ? `
        <div class="alert alert-warning fade-in" style="margin-bottom: 25px; border-radius: 12px; background: rgba(243, 156, 18, 0.1); border: 1px solid rgba(243, 156, 18, 0.2); color: #f39c12; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <i class="fas fa-exclamation-circle"></i> <strong>Peringatan Urgen:</strong> ${criticalShops.length} tenant memiliki masa aktif kritis (< 3 hari).
          </div>
          <button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()" style="color: #f39c12;"><i class="fas fa-times"></i></button>
        </div>
      ` : ''}

      <div class="stats-grid fade-in" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;">
        <div class="master-glass" style="padding: 25px; display: flex; align-items: center; gap: 20px; border-left: 4px solid var(--accent);">
           <div style="width: 55px; height: 55px; border-radius: 12px; background: rgba(212, 168, 67, 0.1); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 24px;">
             <i class="fas fa-sack-dollar"></i>
           </div>
           <div>
             <div style="font-size: 26px; font-weight: 900; color: white;">Rp ${mrr.toLocaleString('id-ID')}</div>
             <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Estimasi MRR</div>
           </div>
        </div>
        <div class="master-glass" style="padding: 25px; display: flex; align-items: center; gap: 20px; border-left: 4px solid #34d399;">
           <div style="width: 55px; height: 55px; border-radius: 12px; background: rgba(52, 211, 153, 0.1); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 24px;">
             <i class="fas fa-shop"></i>
           </div>
           <div>
             <div style="font-size: 26px; font-weight: 900; color: white;">${activeShops.length}</div>
             <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Tenant Aktif</div>
           </div>
        </div>
        <div class="master-glass" style="padding: 25px; display: flex; align-items: center; gap: 20px; border-left: 4px solid #60a5fa;">
           <div style="width: 55px; height: 55px; border-radius: 12px; background: rgba(96, 165, 250, 0.1); display: flex; align-items: center; justify-content: center; color: #60a5fa; font-size: 24px;">
             <i class="fas fa-vial"></i>
           </div>
           <div>
             <div style="font-size: 26px; font-weight: 900; color: white;">${trialShops.length}</div>
             <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Masa Uji Coba</div>
           </div>
        </div>
      </div>

      <!-- Search & Filter Area -->
      <div class="master-search-group fade-in">
        <i class="fas fa-search"></i>
        <input type="text" id="tenant-search" class="form-control" placeholder="Cari tenant berdasarkan nama atau slug..." value="${searchTerm}">
      </div>

      <div class="master-glass fade-in" style="overflow: hidden; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <div style="background: rgba(255,255,255,0.02); padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
           <h3 style="font-size: 16px; font-weight: 800; color: white; margin: 0;">
             <i class="fas fa-list-ul" style="margin-right: 10px; color: var(--accent);"></i> Data Tenant (${shops.length})
           </h3>
        </div>
        <div class="table-container">
          <table class="data-table" style="width: 100%;">
            <thead>
              <tr>
                <th style="padding: 15px 25px;">Barbershop</th>
                <th>Status</th>
                <th>Paket</th>
                <th>Terdaftar</th>
                <th style="text-align: right; padding-right: 25px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
               ${shops.length > 0 ? shops.map(shop => {
                 const plan = plans?.find(p => p.id === shop.plan_id);
                 return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                      <td style="padding: 15px 25px;">
                        <div style="font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px;" onclick="window.handleShopDetail('${shop.id}')">
                          ${shop.name}
                          <i class="fas fa-external-link-alt" style="font-size: 10px; opacity: 0.5;"></i>
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">@${shop.slug}</div>
                      </td>
                      <td>
                        <div class="status-badge" style="background: ${shop.status === 'active' ? 'var(--success-bg)' : 'var(--warning-bg)'}; color: ${shop.status === 'active' ? 'var(--success)' : 'var(--warning)'}; border: 1px solid ${shop.status === 'active' ? 'var(--success)' : 'var(--warning)'}40; padding: 4px 10px; border-radius: 50px; font-size: 10px; font-weight: 800; display: inline-block;">
                          ${shop.status.toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <span style="font-weight: 600; font-size: 13px;">${plan?.name || '<span style="color: var(--text-muted);">Trial</span>'}</span>
                      </td>
                      <td style="font-size: 13px; color: var(--text-secondary);">${getTimeAgo(shop.created_at)}</td>
                      <td style="text-align: right; padding-right: 25px;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                          <button class="btn-icon manage-btn" data-id="${shop.id}" style="background: rgba(255,255,255,0.05); color: white;" title="Manage Subscr."><i class="fas fa-cog"></i></button>
                          <button class="btn-icon text-danger delete-shop-btn" data-id="${shop.id}" style="background: rgba(248, 113, 113, 0.1);" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                        </div>
                      </td>
                    </tr>
                 `;
               }).join('') : `
                 <tr>
                    <td colspan="5" style="padding: 60px; text-align: center; color: var(--text-muted);">
                      <i class="fas fa-search" style="font-size: 30px; margin-bottom: 15px; display: block; opacity: 0.3;"></i>
                      Tidak ada tenant yang cocok dengan pencarian Anda.
                    </td>
                 </tr>
               `}
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

    const searchInput = contentArea.querySelector('#tenant-search');
    searchInput?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      // Debounced or direct trigger
      loadMasterData();
    });
    searchInput?.focus();
    // Move cursor to end
    searchInput?.setSelectionRange(searchTerm.length, searchTerm.length);
  }

  function renderRevenueTab(contentArea, shops, plans) {
    const activeShops = shops.filter(s => s.status === 'active');
    const mrrHistory = activeShops.map(s => {
      const p = plans?.find(pl => pl.id === s.plan_id);
      return { name: s.name, plan: p?.name || '?', amount: p?.price || 0 };
    });

    const totalMRR = mrrHistory.reduce((sum, h) => sum + h.amount, 0);

    contentArea.innerHTML = `
      <div class="stats-grid fade-in" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px;">
        <div class="master-glass" style="padding: 35px; text-align: center; border-bottom: 4px solid var(--accent); grid-column: 1 / -1;">
           <div style="font-size: 14px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Total Monthly Recurring Revenue</div>
           <div style="font-size: 56px; font-weight: 900; color: white; letter-spacing: -1.5px; line-height: 1;">Rp ${totalMRR.toLocaleString('id-ID')}</div>
           <div style="font-size: 13px; color: var(--success); margin-top: 15px; font-weight: 700; background: var(--success-bg); display: inline-block; padding: 5px 15px; border-radius: 50px;">
             <i class="fas fa-arrow-up"></i> Berdasarkan ${activeShops.length} tenant aktif berbayar
           </div>
        </div>
      </div>

      <div class="grid-2 fade-in" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 25px;">
        <div class="master-glass" style="padding: 25px;">
           <h3 style="margin-bottom: 25px; font-size: 16px; font-weight: 800; border-left: 3px solid var(--accent); padding-left: 15px;">
             <i class="fas fa-chart-pie" style="margin-right: 10px;"></i> Distribusi Kontrak Tenant
           </h3>
           <div class="table-container">
             <table class="data-table">
                <thead>
                  <tr>
                    <th>Barbershop</th>
                    <th style="text-align: right;">Nilai / Bln</th>
                  </tr>
                </thead>
                <tbody>
                  ${mrrHistory.map(h => `
                    <tr>
                      <td style="padding: 12px 10px;">
                        <div style="font-weight: 700; color: white;">${h.name}</div>
                        <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">${h.plan}</div>
                      </td>
                      <td style="text-align: right; font-weight: 800; color: var(--success); font-size: 15px;">Rp ${h.amount.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
             </table>
           </div>
        </div>

        <div class="master-glass" style="padding: 25px;">
           <h3 style="margin-bottom: 25px; font-size: 16px; font-weight: 800; border-left: 3px solid #60a5fa; padding-left: 15px;">
             <i class="fas fa-layer-group" style="margin-right: 10px;"></i> Komposisi Paket SaaS
           </h3>
           <div style="display: flex; flex-direction: column; gap: 18px;">
              ${plans.map(p => {
                const count = activeShops.filter(s => s.plan_id === p.id).length;
                const totalActive = activeShops.length;
                const share = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
                return `
                  <div style="background: rgba(255,255,255,0.02); padding: 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
                      <div>
                        <span style="font-weight: 800; color: white; font-size: 13px; text-transform: uppercase;">${p.name}</span>
                        <div style="font-size: 10px; color: var(--text-muted);">Rp ${p.price.toLocaleString()} / bln</div>
                      </div>
                      <span style="font-size: 12px; font-weight: 800; color: var(--accent);">${count} Toko</span>
                    </div>
                    <div style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden; position: relative;">
                      <div style="width: ${share}%; height: 100%; background: linear-gradient(to right, var(--accent), var(--accent-light)); box-shadow: 0 0 10px var(--accent-glow);"></div>
                    </div>
                  </div>
                `;
              }).join('')}
           </div>
        </div>
      </div>
    `;
  }

  function renderPlansTab(contentArea, plans) {
    contentArea.innerHTML = `
      <div class="page-header" style="margin-bottom: 40px; text-align: center; max-width: 600px; margin-left: auto; margin-right: auto;">
         <h2 style="font-weight: 950; font-size: 32px; letter-spacing: -0.5px; color: white; margin-bottom: 10px;">Tiered Business Logic</h2>
         <p style="color: var(--text-muted); font-size: 14px; line-height: 1.6;">Atur batasan fitur dan skema harga untuk setiap tingkatan paket SaaS platform Anda.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;" class="fade-in">
        ${plans.map(p => `
          <div class="master-glass" style="padding: 0; display: flex; flex-direction: column; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default;" onmouseover="this.style.transform='translateY(-8px)'; this.style.borderColor='var(--accent)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255,255,255,0.08)';">
            <div style="padding: 35px; text-align: center; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="color: var(--accent); font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 20px;">${p.name}</div>
              <div style="font-size: 38px; font-weight: 950; color: white; line-height: 1;">Rp ${(p.price / 1000).toLocaleString()}k <span style="font-size: 14px; color: var(--text-muted); font-weight: 500; letter-spacing: 0;">/ bln</span></div>
            </div>
            <div style="padding: 30px; flex-grow: 1;">
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 12px; font-size: 14px; color: white;">
                  <div style="color: var(--success); background: var(--success-bg); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;"><i class="fas fa-check"></i></div>
                  Max <b>${p.max_barbers || '∞'}</b> Barber Staff
                </li>
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 12px; font-size: 14px; color: white;">
                  <div style="color: var(--success); background: var(--success-bg); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;"><i class="fas fa-check"></i></div>
                  Max <b>${p.max_branches || '∞'}</b> Cabang / Outlet
                </li>
                <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 20px 0;"></div>
                ${(p.features || []).slice(0, 6).map(f => `
                  <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-secondary);">
                    <i class="fas fa-plus" style="color: var(--accent); font-size: 10px; width: 22px; text-align: center;"></i> 
                    ${f.replace(/_/g, ' ').toUpperCase()}
                  </li>
                `).join('')}
              </ul>
            </div>
            <div style="padding: 25px; background: rgba(255,255,255,0.03);">
              <button class="btn btn-ghost btn-block" onclick="window.handleEditPlan('${p.id}')" style="border: 1px solid rgba(255,255,255,0.15); color: white; padding: 12px; border-radius: 12px; font-weight: 700;">
                <i class="fas fa-cog" style="margin-right: 8px;"></i> Edit Konfigurasi
              </button>
            </div>
          </div>
        `).join('')}
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
