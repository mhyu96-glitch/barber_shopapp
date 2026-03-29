import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export async function renderSuperAdmin(container) {
  let activeTab = 'overview'; // 'overview', 'tenants', 'revenue', 'plans', 'analytics'
  let searchTerm = '';        // Real-time search filter

  // Inject Tailwind and Config
  if (!document.getElementById('tailwind-master-script')) {
    const script = document.createElement('script');
    script.id = 'tailwind-master-script';
    script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
    document.head.appendChild(script);

    const config = document.createElement('script');
    config.innerHTML = `
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface": "#11131c",
              "background": "#11131c",
              "on-surface-variant": "#d0c5af",
              "surface-container": "#1d1f29",
              "surface-container-high": "#282933",
              "surface-container-lowest": "#0c0e17",
              "primary": "#f2ca50",
              "on-primary": "#3c2f00",
              "outline-variant": "#4d4635",
              "accent": "#f2ca50",
            },
            fontFamily: {
              "headline": ["Manrope", "sans-serif"],
              "body": ["Inter", "sans-serif"]
            }
          }
        }
      }
    `;
    document.head.appendChild(config);

    const googleFonts = document.createElement('link');
    googleFonts.rel = 'stylesheet';
    googleFonts.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    document.head.appendChild(googleFonts);
  }

  function renderLayout() {
    // Hide global sidebar and remove left margin to use full viewport
    const globalSidebar = document.getElementById('sidebar');
    if (globalSidebar) globalSidebar.style.display = 'none';
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.width = '100%';
    }

    container.innerHTML = `
      <style>
        .gold-gradient { background: linear-gradient(135deg, #f2ca50 0%, #d4af37 100%); }
        .glass-header { background: rgba(29, 31, 41, 0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .sidebar-link.active { background: #32343e; color: #f2ca50; }
        .sidebar-link.active span[data-fill="1"] { font-variation-settings: 'FILL' 1; }
      </style>

      <div class="flex min-h-screen bg-background text-on-surface font-body seleccion:bg-primary/30">
        <!-- Sidebar Navigation -->
        <aside class="fixed left-0 h-full w-64 bg-[#191b24] flex flex-col z-40 border-r border-white/5">
          <div class="p-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 gold-gradient rounded-lg flex items-center justify-center shadow-lg shadow-primary/10">
                <span class="material-symbols-outlined text-on-primary" style="font-variation-settings: 'FILL' 1;">content_cut</span>
              </div>
              <div>
                <h1 class="text-lg font-black text-[#f2ca50] font-headline tracking-tighter">Master Control</h1>
                <p class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Global Admin</p>
              </div>
            </div>
          </div>
          <nav class="flex flex-col py-6 gap-2 px-4 flex-grow" id="master-nav">
            <a href="#" class="sidebar-link ${activeTab === 'overview' ? 'active' : ''} text-[#d0c5af] flex items-center gap-3 px-4 py-3 hover:bg-[#282933] hover:text-[#f2ca50] rounded-sm transition-all" data-tab="overview">
              <span class="material-symbols-outlined" data-fill="${activeTab === 'overview' ? 1 : 0}">dashboard</span>
              <span>Beranda</span>
            </a>
            <a href="#" class="sidebar-link ${activeTab === 'revenue' ? 'active' : ''} text-[#d0c5af] flex items-center gap-3 px-4 py-3 hover:bg-[#282933] hover:text-[#f2ca50] rounded-sm transition-all" data-tab="revenue">
              <span class="material-symbols-outlined" data-fill="${activeTab === 'revenue' ? 1 : 0}">payments</span>
              <span>Laporan</span>
            </a>
            <a href="#" class="sidebar-link ${activeTab === 'settings' ? 'active' : ''} text-[#d0c5af] flex items-center gap-3 px-4 py-3 hover:bg-[#282933] hover:text-[#f2ca50] rounded-sm transition-all" data-tab="settings">
              <span class="material-symbols-outlined" data-fill="${activeTab === 'settings' ? 1 : 0}">settings</span>
              <span>Pengaturan Master</span>
            </a>
          </nav>
          <div class="p-6 border-t border-outline-variant/10">
            <button class="text-[#d0c5af] flex items-center gap-3 px-4 py-3 hover:text-red-400 transition-all w-full text-left" id="master-logout-btn">
              <span class="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="ml-64 flex-grow min-h-screen relative">
          <!-- Top Navigation Bar -->
          <header class="fixed top-0 right-0 left-64 h-16 glass-header z-50 px-8 flex justify-between items-center shadow-lg border-b border-white/5">
            <div class="flex items-center gap-4 flex-1 max-w-xl">
              <div class="relative w-full group">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                <input type="text" id="master-global-search" class="w-full bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-gray-500 text-white transition-all" placeholder="Search Master Control..." value="${searchTerm}">
              </div>
            </div>
            <div class="flex items-center gap-6">
              <button id="master-refresh-btn" class="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <span class="material-symbols-outlined">refresh</span>
              </button>
              <div class="h-8 w-[1px] bg-outline-variant/20"></div>
              <div class="flex items-center gap-3 pl-2">
                <div class="text-right hidden sm:block">
                  <p class="text-xs font-bold text-on-surface font-headline">Master Admin</p>
                  <p class="text-[10px] text-on-surface-variant font-medium">System Director</p>
                </div>
                <div class="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-on-primary font-bold">
                  M
                </div>
              </div>
            </div>
          </header>

          <!-- Page Content -->
          <div class="pt-24 pb-12 px-12 max-w-[1600px] mx-auto" id="master-sub-content">
            <!-- Dynamic Content Here -->
          </div>
        </main>
      </div>
    `;

    // Sidebar Tab Listeners
    container.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activeTab = link.dataset.tab;
        renderLayout();
        loadMasterData();
      });
    });

    // Logout
    container.querySelector('#master-logout-btn')?.addEventListener('click', () => {
      supabase.auth.signOut().then(() => window.location.reload());
    });

    // Global Search
    const searchInput = container.querySelector('#master-global-search');
    searchInput?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      loadMasterData();
    });
    // Focus search if it was previously focused
    if (searchTerm) {
      searchInput.focus();
      searchInput.setSelectionRange(searchTerm.length, searchTerm.length);
    }

    // Refresh
    const refreshBtn = container.querySelector('#master-refresh-btn');
    refreshBtn?.addEventListener('click', async () => {
      const icon = refreshBtn.querySelector('span');
      if (icon) icon.classList.add('animate-spin');
      showToast('Syncing global data from Supabase...', 'info');
      await loadMasterData();
      if (icon) icon.classList.remove('animate-spin');
    });
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

      if (activeTab === 'overview') {
        renderOverviewTab(contentArea, shops, plans, globalPayments, globalAppts);
      } else if (activeTab === 'revenue') {
        renderRevenueTab(contentArea, shops, plans, globalPayments, globalAppts);
      } else if (activeTab === 'settings') {
        renderSettingsTab(contentArea, plans);
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

  function renderOverviewTab(contentArea, shops, plans, payments, appointments) {
    const activeShops = shops.filter(s => s.status === 'active');
    const trialShops = shops.filter(s => s.status === 'trial');
    const mrr = activeShops.reduce((sum, shop) => {
      const p = plans?.find(pl => pl.id === shop.plan_id);
      return sum + (p?.price || 0);
    }, 0);

    contentArea.innerHTML = `
      <section class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 fade-in">
        <div>
          <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Pusat Kendali Master</h2>
          <p class="text-on-surface-variant max-w-xl font-medium">Ringkasan performa platform. Anda mengelola ${shops.length} toko aktif.</p>
        </div>
      </section>

      <!-- Metrics Grid -->
      <section class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 fade-in">
        <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl relative overflow-hidden group">
          <div class="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 text-primary">Estimasi MRR</p>
          <h4 class="text-3xl font-black font-headline tracking-tighter">Rp ${(mrr/1000000).toFixed(2)}M</h4>
        </div>
        <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
          <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 text-emerald-400">Total Toko</p>
          <h4 class="text-3xl font-black font-headline tracking-tighter">${shops.length} Node</h4>
        </div>
        <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
          <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 text-blue-400">Traffic Global</p>
          <h4 class="text-3xl font-black font-headline tracking-tighter">${appointments.length} Sess</h4>
        </div>
        <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-white"></div>
          <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 text-white">System Uptime</p>
          <h4 class="text-3xl font-black font-headline tracking-tighter">99.9%</h4>
        </div>
      </section>

      <!-- Tiers Snapshot -->
      <section class="mb-12 fade-in">
        <h4 class="text-xl font-bold font-headline text-on-surface mb-6">Paket Langganan (Tiers)</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${plans.map(p => {
             const count = activeShops.filter(s => s.plan_id === p.id).length;
             return `
              <div class="bg-surface-container rounded-2xl border border-white/5 p-6 hover:border-primary/30 transition-all">
                <div class="flex justify-between items-center mb-4">
                  <p class="text-xs font-black text-primary uppercase tracking-[0.2em]">${p.name}</p>
                  <span class="text-xs font-bold bg-white/5 px-2 py-1 rounded-sm">${count} Toko</span>
                </div>
                <h3 class="text-2xl font-black font-headline text-white mb-2 tracking-tighter">
                  Rp ${(p.price / 1000).toLocaleString()}k <span class="text-[10px] text-on-surface-variant font-medium tracking-normal">/ mo</span>
                </h3>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Tenant Management Section -->
      <section class="bg-surface-container rounded-2xl p-1 fade-in border border-white/5 shadow-2xl">
        <div class="p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h4 class="text-xl font-bold font-headline text-on-surface">Daftar Toko (Tenants)</h4>
              <p class="text-sm text-on-surface-variant font-medium">Manajemen jaringan barbershop yang terdaftar di platform.</p>
            </div>
            <button id="add-shop-btn-table" class="px-5 py-2.5 rounded-lg gold-gradient text-on-primary font-bold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">add_circle</span>
              <span>Daftar Toko Baru</span>
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr class="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  <th class="px-6 py-3">Tenant Identity</th>
                  <th class="px-6 py-3">Identifier (Slug)</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="text-sm">
                ${shops.map((shop) => {
                  const statusColors = {
                    'active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    'trial': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
                    'expired': 'bg-red-400/10 text-red-400 border-red-400/20',
                    'deactivated': 'bg-gray-400/10 text-gray-400 border-gray-400/20'
                  };
                  return `
                   <tr class="group hover:bg-white/5 transition-all duration-300">
                    <td class="bg-surface-container-low px-6 py-5 first:rounded-l-lg border-y border-l border-white/5">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold font-headline border border-primary/20">
                          ${shop.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p class="font-bold text-on-surface cursor-pointer hover:text-primary transition-colors" onclick="window.handleShopDetail('${shop.id}')">${shop.name}</p>
                          <p class="text-[10px] text-on-surface-variant font-medium">Aktif: ${getTimeAgo(shop.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td class="bg-surface-container-low px-6 py-5 border-y border-white/5">
                      <code class="text-xs bg-surface-container-lowest px-2.5 py-1.5 rounded-md text-primary font-mono border border-white/5">@${shop.slug}</code>
                    </td>
                    <td class="bg-surface-container-low px-6 py-5 border-y border-white/5">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${statusColors[shop.status] || statusColors.deactivated} text-[10px] font-bold uppercase tracking-wider">
                        <span class="w-1.5 h-1.5 rounded-full ${shop.status === 'active' ? 'bg-emerald-400' : (shop.status === 'trial' ? 'bg-blue-400' : 'bg-red-400')}"></span>
                        ${shop.status}
                      </span>
                    </td>
                    <td class="bg-surface-container-low px-6 py-5 text-right rounded-r-lg border-y border-r border-white/5">
                      <div class="flex items-center justify-end gap-2">
                        <button class="p-2 hover:bg-white/10 rounded-lg text-on-surface-variant hover:text-primary transition-all manage-btn" data-id="${shop.id}">
                          <span class="material-symbols-outlined text-lg">settings</span>
                        </button>
                        <button class="p-2 hover:bg-white/10 rounded-lg text-on-surface-variant hover:text-primary transition-all" onclick="window.open('/portal.html?shop=${shop.slug}', '_blank')">
                          <span class="material-symbols-outlined text-lg">open_in_new</span>
                        </button>
                        <button class="p-2 hover:bg-white/10 rounded-lg text-on-surface-variant hover:text-red-400 transition-all delete-shop-btn" data-id="${shop.id}">
                          <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                   </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;

    contentArea.querySelectorAll('.manage-btn').forEach(btn => btn.onclick = () => handleManageShop(btn.dataset.id, plans));
    contentArea.querySelectorAll('.delete-shop-btn').forEach(btn => btn.onclick = () => handleDeleteShop(btn.dataset.id));
    contentArea.querySelector('#add-shop-btn-hero')?.addEventListener('click', () => renderAddShopModal(container));
    contentArea.querySelector('#add-shop-btn-table')?.addEventListener('click', () => renderAddShopModal(container));
  }

  function renderRevenueTab(contentArea, shops, plans, payments, appointments) {
    const activeShops = shops.filter(s => s.status === 'active');
    const mrrHistory = activeShops.map(s => {
      const p = plans?.find(pl => pl.id === s.plan_id);
      return { name: s.name, plan: p?.name || '?', amount: p?.price || 0 };
    });
    const totalMRR = mrrHistory.reduce((sum, h) => sum + h.amount, 0);

    contentArea.innerHTML = `
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 fade-in">
        <div class="bg-surface-container p-8 rounded-xl border border-white/5 min-h-[400px] flex flex-col shadow-2xl">
          <div class="flex justify-between items-start mb-10">
            <div>
              <h5 class="text-lg font-bold font-headline text-on-surface">Grafik Pendapatan Platform</h5>
              <p class="text-sm text-on-surface-variant font-medium">Akumulasi biaya langganan toko bulanan.</p>
            </div>
            <div class="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-widest">
              +MRR Growth
            </div>
          </div>
          <div class="flex-grow flex items-end gap-3 px-4">
            <div class="w-full bg-primary/10 h-[20%] rounded-t-lg group relative transition-all hover:bg-primary/20"></div>
            <div class="w-full bg-primary/20 h-[30%] rounded-t-lg group relative transition-all hover:bg-primary/30"></div>
            <div class="w-full bg-primary/30 h-[45%] rounded-t-lg group relative transition-all hover:bg-primary/40"></div>
            <div class="w-full bg-primary/40 h-[70%] rounded-t-lg group relative transition-all hover:bg-primary/50"></div>
            <div class="w-full bg-primary/50 h-[85%] rounded-t-lg group relative transition-all hover:bg-primary/60"></div>
            <div class="w-full gold-gradient h-[100%] rounded-t-lg group relative shadow-[0_0_30px_rgba(242,202,80,0.15)] hover:brightness-110 transition-all">
              <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-high border border-primary/30 px-3 py-1.5 rounded-lg text-[10px] font-black text-primary shadow-xl whitespace-nowrap">Rp ${ (totalMRR/1000000).toFixed(1) }M Total</div>
            </div>
          </div>
          <div class="flex justify-between mt-6 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest px-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Bulan Ini</span>
          </div>
        </div>

        <div class="flex flex-col gap-6">
          <div class="bg-surface-container p-8 rounded-xl border border-white/5 shadow-xl flex-grow">
            <h5 class="text-lg font-bold font-headline mb-6">Distribusi Tier Toko</h5>
            <div class="space-y-4">
              ${plans.map(p => {
                const count = activeShops.filter(s => s.plan_id === p.id).length;
                const share = activeShops.length > 0 ? (count / activeShops.length) * 100 : 0;
                return `
                  <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div class="flex justify-between items-center mb-3">
                      <div>
                        <p class="text-sm font-bold text-on-surface">${p.name}</p>
                        <p class="text-[10px] text-on-surface-variant">Rp ${p.price.toLocaleString()} / mo</p>
                      </div>
                      <span class="text-xs font-black text-primary">${count} Shops</span>
                    </div>
                    <div class="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div class="h-full gold-gradient rounded-full" style="width: ${share}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderSettingsTab(contentArea, plans) {
    contentArea.innerHTML = `
      <section class="mb-12 text-center fade-in">
        <h2 class="text-4xl font-black font-headline tracking-tighter text-on-surface mb-3 uppercase italic">Konfigurasi Sistem Global</h2>
        <p class="text-on-surface-variant max-w-2xl mx-auto font-medium">Kelola fitur dan batasan operasional untuk setiap tier langganan di platform multi-tenant anda.</p>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in">
        ${plans.map(p => `
          <div class="bg-surface-container rounded-2xl border border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl flex flex-col">
            <div class="p-8 pb-0 text-center relative pointer-events-none">
              <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all"></div>
              <p class="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4">${p.name}</p>
              <h3 class="text-4xl font-black font-headline text-white mb-2 tracking-tighter">
                Rp ${(p.price / 1000).toLocaleString()}k
              </h3>
            </div>
            
            <div class="p-8 flex-grow">
              <div class="space-y-4">
                <div class="flex items-center gap-3 text-sm text-gray-300">
                  <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                  <span>Max <strong>${p.max_barbers || '∞'}</strong> Global Staff</span>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-300">
                  <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                  <span>Max <strong>${p.max_branches || '∞'}</strong> Kedai Cabang</span>
                </div>
                <div class="h-[1px] bg-white/5 my-6"></div>
                ${(() => {
                  let feats = p.features;
                  if (typeof feats === 'string') {
                    feats = feats.replace(/[{}"[\]]/g, '').split(',');
                  }
                  if (!Array.isArray(feats)) feats = [];
                  return feats.slice(0, 6).map(f => `
                    <div class="flex items-center gap-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                      <span class="material-symbols-outlined text-primary/40 text-sm">add</span>
                      <span>${f.trim().replace(/_/g, ' ')}</span>
                    </div>
                  `).join('');
                })()}
              </div>
            </div>

            <div class="p-8 bg-black/20 border-t border-white/5 mt-auto">
              <button onclick="window.handleEditPlan('${p.id}')" class="w-full py-4 bg-surface-container-high hover:bg-primary/10 hover:text-primary text-white font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center justify-center gap-3 text-xs">
                <span class="material-symbols-outlined text-lg">settings_suggest</span>
                <span>Edit Fitur Paket</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async function handleDeleteShop(shopId) {
    if (!confirm('HAPUS TOKO INI PERMANEN?\nTindakan ini akan menghapus SELURUH data transaksi dan pengaturan toko tersebut.')) return;

    try {
      showToast('Membersihkan data platform...', 'info');
      const tables = ['payments', 'appointments', 'attendance', 'inventory', 'expenses', 'promos', 'gallery', 'holidays', 'services', 'barbers', 'customers', 'memberships', 'logbook'];

      for (const table of tables) {
        await supabase.from(table).delete().eq('shop_id', shopId);
      }

      await supabase.from('profiles').delete().eq('shop_id', shopId);
      await supabase.from('settings').delete().eq('shop_id', shopId);
      const { error: shopErr } = await supabase.from('shops').delete().eq('id', shopId);
      
      if (shopErr) throw shopErr;

      showToast('Node berhasil dihapus dari sistem global.', 'success');
      loadMasterData();
    } catch (err) {
      showToast('Gagal menghapus node: ' + err.message, 'danger');
    }
  }

  window.handleShopDetail = async (shopId) => {
    try {
      const { data: shop } = await supabase.from('shops').select('*, subscription_plans(name)').eq('id', shopId).single();
      const { data: settings } = await supabase.from('settings').select('*').eq('shop_id', shopId).maybeSingle();
      if (!shop) return;

      const body = `
        <div class="space-y-6 text-white font-body p-2">
          <div class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div class="w-16 h-16 rounded-xl gold-gradient flex items-center justify-center text-on-primary font-black text-2xl font-headline">
              ${shop.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 class="text-xl font-black font-headline text-primary">${shop.name}</h4>
              <p class="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Global Node Identification Unit</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white/5 p-4 rounded-xl border border-white/5">
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Status</p>
              <p class="text-sm font-black uppercase text-primary">${shop.status}</p>
            </div>
            <div class="bg-white/5 p-4 rounded-xl border border-white/5">
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tier Plan</p>
              <p class="text-sm font-black uppercase text-white">${shop.subscription_plans?.name || 'Standard'}</p>
            </div>
          </div>

          <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
             <div class="flex items-center gap-3 mb-4">
               <span class="material-symbols-outlined text-primary">location_on</span>
               <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Node Location Header</p>
             </div>
             <p class="text-sm leading-relaxed text-gray-300 font-medium">
               ${settings?.address || 'Geolocation data not synchronized by operator.'}
             </p>
             <div class="mt-4 flex items-center gap-2 text-xs text-primary font-bold">
               <span class="material-symbols-outlined text-sm">call</span>
               <span>${settings?.phone || shop.phone || 'N/A'}</span>
             </div>
          </div>

          <div class="flex gap-3 pt-4">
             <button onclick="closeModal()" class="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-xs uppercase tracking-widest border border-white/10">Dismiss</button>
             <a href="/portal.html?shop=${shop.slug}" target="_blank" class="flex-1 py-3 gold-gradient text-on-primary rounded-xl font-black transition-all text-xs uppercase tracking-widest text-center shadow-lg shadow-primary/20">Access Portal</a>
          </div>
        </div>
      `;

      openModal(`${shop.name}`, body, '', { maxWidth: '480px' });
    } catch (err) {
      showToast('Failure loading node detail.', 'danger');
    }
  };

  window.handleEditPlan = async (id) => {
    const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', id).single();
    if (!plan) return;

    const allFeatures = ['dashboard', 'appointments', 'queue', 'customers', 'barbers', 'attendance', 'pos', 'payments', 'promos', 'reports', 'expenses', 'inventory', 'memberships', 'gallery', 'logbook', 'portal'];

    const body = `
      <form id="edit-plan-form" class="space-y-6 text-white p-2">
        <div class="bg-white/5 p-6 rounded-2xl border border-white/5 mb-6">
          <label class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3 block">Operational Cost / Mo</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">Rp</span>
            <input type="number" id="edit-plan-price" class="w-full bg-surface-container border-white/10 rounded-xl pl-12 pr-4 py-4 text-xl font-black text-white focus:ring-1 focus:ring-primary/30" value="${plan.price}" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-white/5 p-4 rounded-xl border border-white/5">
            <label class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 block">Max Global Staff</label>
            <input type="number" id="edit-plan-barbers" class="w-full bg-surface-container border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:ring-1 focus:ring-primary/30" value="${plan.max_barbers || 0}" placeholder="0 for unlimited" required />
          </div>
          <div class="bg-white/5 p-4 rounded-xl border border-white/5">
            <label class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 block">Max Linked Nodes</label>
            <input type="number" id="edit-plan-branches" class="w-full bg-surface-container border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:ring-1 focus:ring-primary/30" value="${plan.max_branches || 0}" placeholder="0 for unlimited" required />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 block">Integrated Feature Matrix</label>
          <div class="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            ${allFeatures.map(f => `
              <label class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                <input type="checkbox" name="features" value="${f}" ${plan.features?.includes(f) ? 'checked' : ''} class="w-5 h-5 rounded border-white/20 bg-black/40 text-primary focus:ring-OFFSET-0 focus:ring-primary/30" />
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">${f.replace(/_/g, ' ')}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="w-full py-4 gold-gradient text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">
          Commit Logistic changes
        </button>
      </form>
    `;

    openModal(`Config: ${plan.name}`, body, '', { maxWidth: '520px' });

    document.querySelector('#edit-plan-form').onsubmit = async (e) => {
      e.preventDefault();
      const price = document.querySelector('#edit-plan-price').value;
      const barbers = document.querySelector('#edit-plan-barbers').value;
      const branches = document.querySelector('#edit-plan-branches').value;
      const selected = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(i => i.value);

      try {
        await supabase.from('subscription_plans').update({ 
          price: parseInt(price), 
          max_barbers: parseInt(barbers) || null,
          max_branches: parseInt(branches) || null,
          features: selected 
        }).eq('id', id);
        showToast('System configuration updated.', 'success');
        closeModal();
        loadMasterData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  };

  window.handleManageShop = async (shopId, plans) => {
    const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).single();
    if (!shop) return;

    const body = `
      <form id="edit-shop-form" class="space-y-6 text-white p-2">
        <div class="space-y-4">
          <div>
            <label class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 block">Operational Status</label>
            <select id="edit-shop-status" class="w-full bg-surface-container border-white/10 rounded-xl px-4 py-4 text-sm font-bold text-white focus:ring-primary/20">
              <option value="trial" ${shop.status === 'trial' ? 'selected' : ''}>TRIAL MODE</option>
              <option value="active" ${shop.status === 'active' ? 'selected' : ''}>ACTIVE PROTOCOL</option>
              <option value="expired" ${shop.status === 'expired' ? 'selected' : ''}>PERIOD EXPIRED</option>
              <option value="deactivated" ${shop.status === 'deactivated' ? 'selected' : ''}>NODE SUSPENDED</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2 block">Subscription Tier</label>
            <select id="edit-shop-plan" class="w-full bg-surface-container border-white/10 rounded-xl px-4 py-4 text-sm font-bold text-white focus:ring-primary/20">
              <option value="">NO ACTIVE TIER</option>
              ${plans.map(p => `<option value="${p.id}" ${shop.plan_id === p.id ? 'selected' : ''}>${p.name.toUpperCase()} (Rp ${p.price.toLocaleString()})</option>`).join('')}
            </select>
          </div>
        </div>
        <p class="text-[10px] text-on-surface-variant font-medium leading-relaxed italic opacity-60">
          * Transitioning node to 'ACTIVE PROTOCOL' will synchronize all premium features and impact platform MRR metrics.
        </p>
        <button type="submit" class="w-full py-4 gold-gradient text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
          Execute Protocol Update
        </button>
      </form>
    `;

    openModal(`Relay Control: ${shop.name}`, body, '', { maxWidth: '420px' });

    document.querySelector('#edit-shop-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await supabase.from('shops').update({ 
          status: document.querySelector('#edit-shop-status').value,
          plan_id: document.querySelector('#edit-shop-plan').value || null
        }).eq('id', shopId);
        showToast('Node relay updated successfully.', 'success');
        closeModal();
        loadMasterData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
  };

  async function renderAddShopModal(container) {
    let { data: plans } = await supabase.from('subscription_plans').select('*');
    if (!plans) plans = [];
    
    const body = `
      <form id="add-shop-form" class="space-y-6 text-white p-2">
        <div class="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
          <p class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Node Credentials</p>
          <div class="space-y-4">
            <input type="text" id="new-shop-name" class="w-full bg-surface-container border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white" placeholder="Node Display Name" required />
            <input type="text" id="new-shop-slug" class="w-full bg-surface-container border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-primary font-mono" placeholder="operational-slug" required />
            <select id="new-shop-plan" class="w-full bg-surface-container border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white">
              <optgroup label="Select SaaS Deployment Tier">
              ${plans.map(p => `<option value="${p.id}">${p.name} (Rp ${p.price.toLocaleString()})</option>`).join('')}
              </optgroup>
            </select>
          </div>
        </div>

        <div class="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
          <p class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Admin Authentication</p>
          <div class="space-y-4">
            <input type="text" id="new-admin-username" class="w-full bg-surface-container border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white" placeholder="Operator Identity" required />
            <input type="password" id="new-admin-password" class="w-full bg-surface-container border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white" placeholder="Security Access Key" required minlength="6" />
          </div>
        </div>

        <button type="submit" class="w-full py-4 gold-gradient text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] transition-all" id="submit-shop-btn">
          Deploy New Global Node
        </button>
      </form>
    `;

    const modal = openModal('Initialize New Node', body, '', { maxWidth: '520px' });

    const nameInput = modal.querySelector('#new-shop-name');
    const slugInput = modal.querySelector('#new-shop-slug');
    const userInput = modal.querySelector('#new-admin-username');
    
    function slugify(text) { return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(); }

    nameInput.addEventListener('input', () => {
      slugInput.value = slugify(nameInput.value);
      userInput.value = `admin_${slugInput.value.replace(/-/g, '_')}`;
    });

    modal.querySelector('#add-shop-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = modal.querySelector('#submit-shop-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin text-lg">sync</span> INITIALIZING...';

      try {
        const name = nameInput.value;
        const slug = slugInput.value;
        const planId = modal.querySelector('#new-shop-plan').value;
        const username = userInput.value;
        const password = modal.querySelector('#new-admin-password').value;

        const email = `${username}@barberpro.local`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: `Admin ${name}`, role: 'admin', username } }
        });

        if (authErr) throw authErr;
        const userId = authData.user?.id;

        const { data: newShop, error: shopErr } = await supabase.from('shops').insert([{ name, slug, status: 'trial', owner_id: userId, plan_id: planId }]).select().single();
        if (shopErr) throw shopErr;

        await supabase.from('profiles').update({ shop_id: newShop.id }).eq('id', userId);
        await supabase.from('settings').insert([{ shop_id: newShop.id, shop_name: name }]);

        showToast(`Node "${name}" successfully deployed.`, 'success');
        closeModal();
        loadMasterData();
      } catch (err) {
        showToast(`Deployment Failure: ${err.message}`, 'danger');
        btn.disabled = false;
        btn.innerHTML = 'Retry Deployment';
      }
    });
  }
}
