import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export async function renderSuperAdmin(container) {
  let activeTab = 'dashboard'; 
  let searchTerm = '';

  // CSS already handled in index.html, keeping specific superAdmin overrides if any

  function renderLayout() {
    const globalSidebar = document.getElementById('sidebar');
    if (globalSidebar) globalSidebar.style.display = 'none';
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.width = '100%';
    }
    document.body.className = '';
    document.body.classList.add('bg-background', 'text-on-surface', 'font-body', 'min-h-screen');

    container.innerHTML = `
      <style>
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-panel { background: rgba(28, 27, 27, 0.8); backdrop-filter: blur(12px); }
        .active-tab { background-color: #353534; color: #E5E2E1 !important; border-right: 3px solid #f6ca22; }
        .active-tab span[data-icon] { font-variation-settings: 'FILL' 1; color: #f6ca22; }
      </style>

      <!-- SideNavBar Shell -->
      <aside class="h-screen w-64 fixed left-0 top-0 border-r-0 bg-[#1C1B1B] dark:bg-[#1C1B1B]/80 backdrop-blur-xl shadow-2xl shadow-[#000000]/40 z-50 transition-all">
        <div class="flex flex-col h-full p-6 justify-between">
          <div class="space-y-8">
            <!-- Brand Header -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span class="material-symbols-outlined text-on-primary-container" style="font-variation-settings: 'FILL' 1;">content_cut</span>
              </div>
              <div>
                <h1 class="text-2xl font-bold tracking-tighter text-[#E5E2E1] font-headline leading-tight">BarberPro</h1>
                <p class="text-[10px] uppercase tracking-[0.2em] text-outline font-bold">Digital Excellence</p>
              </div>
            </div>
            
            <!-- Navigation Links -->
            <nav class="space-y-1.5">
              <p class="text-[10px] uppercase tracking-[0.2em] text-outline font-bold px-4 mb-4 mt-6">Core Monitor</p>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-xl transition-all text-sm font-medium tracking-wide ${activeTab === 'dashboard' ? 'active-tab' : ''}" href="#" data-tab="dashboard">
                <span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
                <span>Main Dashboard</span>
              </a>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-xl transition-all text-sm font-medium tracking-wide ${activeTab === 'sales' ? 'active-tab' : ''}" href="#" data-tab="sales">
                <span class="material-symbols-outlined" data-icon="query_stats">query_stats</span>
                <span>Sales Analytics</span>
              </a>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-xl transition-all text-sm font-medium tracking-wide ${activeTab === 'subscriptions' ? 'active-tab' : ''}" href="#" data-tab="subscriptions">
                <span class="material-symbols-outlined" data-icon="notifications_active">notifications_active</span>
                <span>Subscription Report</span>
              </a>

              <p class="text-[10px] uppercase tracking-[0.2em] text-outline font-bold px-4 mb-4 mt-10">Resource Registry</p>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-xl transition-all text-sm font-medium tracking-wide ${activeTab === 'stores' ? 'active-tab' : ''}" href="#" data-tab="stores">
                <span class="material-symbols-outlined" data-icon="storefront">storefront</span>
                <span>Store Management</span>
              </a>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-xl transition-all text-sm font-medium tracking-wide ${activeTab === 'tiers' ? 'active-tab' : ''}" href="#" data-tab="tiers">
                <span class="material-symbols-outlined" data-icon="layers">layers</span>
                <span>Tier Management</span>
              </a>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-xl transition-all text-sm font-medium tracking-wide ${activeTab === 'settings' ? 'active-tab' : ''}" href="#" data-tab="settings">
                <span class="material-symbols-outlined" data-icon="tune">tune</span>
                <span>Application Settings</span>
              </a>
            </nav>
          </div>
          
          <!-- Sidebar CTA -->
          <div class="mt-auto space-y-4">
            <button id="sidebar-add-node-btn" class="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-2xl font-black active:scale-95 duration-150 transition-all hover:shadow-[0_8px_20px_rgba(246,202,34,0.3)] text-xs uppercase tracking-widest">
              <span class="material-symbols-outlined text-sm" data-icon="add">add_circle</span>
              <span>Deploy Node</span>
            </button>
            <button id="master-logout-btn" class="w-full flex items-center justify-center gap-2 text-error/80 hover:text-error py-2 text-sm font-medium transition-colors">
              <span class="material-symbols-outlined text-sm">logout</span>
              Keluarkan Sesi
            </button>
          </div>
        </div>
      </aside>

      <header class="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-[#131313] dark:bg-[#131313]/90 backdrop-blur-md">
        <div class="flex items-center justify-between px-8 w-full h-full border-b border-outline-variant/10">
          <div class="flex items-center gap-4 flex-1">
            <div class="relative w-full max-w-md group">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">search</span>
              <input id="master-global-search" class="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/30 placeholder:text-outline/50 transition-all text-white" placeholder="Cari data toko..." type="text" value="${searchTerm}"/>
            </div>
            <button id="master-refresh-btn" class="ml-2 w-8 h-8 flex items-center justify-center text-outline hover:text-primary transition-colors rounded-full hover:bg-white/5">
              <span class="material-symbols-outlined text-xl">refresh</span>
            </button>
          </div>
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-4 text-on-surface-variant mr-4">
              <button class="hover:text-primary cursor-pointer transition-colors relative">
                <span class="material-symbols-outlined">notifications</span>
                <span class="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
              </button>
              <button class="hover:text-primary cursor-pointer transition-colors">
                <span class="material-symbols-outlined">help_outline</span>
              </button>
            </div>
            <div class="h-8 w-[1px] bg-outline-variant/30"></div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-sm font-semibold text-on-surface leading-tight">Admin Utama</p>
                <p class="text-[10px] text-outline uppercase tracking-wider">Master Dashboard</p>
              </div>
              <img class="w-10 h-10 rounded-full object-cover border-2 border-surface-container-highest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcsAXma4QE8tgrqdMJmLUIwb6OqWI_49Zf5krzu2lXrLTz4UPKNVAtU2270Floy6EJH4594W-9h4awIbg_g_6Ps9DHdBnjM9qwxGXU3by04RJOB72wjFELcWwd7B1ymnx4adjlAspk7QTJQUYii1zy-etYTsErOQ16QQbU1YDVsjMMGhvlDIjABA-nsjx86emH6LrcBBmBIu-PgJ935fMVGTXm_hLFWteogThMF2upfwpRhEE3Od32fF9VmLgD6N4V19U0hID8-9U"/>
            </div>
          </div>
        </div>
      </header>

      <!-- Floating Appointment Ribbon (The Atelier Touch) -->
      <div class="fixed right-0 top-1/2 -translate-y-1/2 glass-panel border-l border-y border-outline-variant/20 rounded-l-2xl p-4 shadow-2xl z-50">
        <div class="flex flex-col items-center gap-6">
          <div class="flex flex-col items-center">
            <p class="text-[9px] font-bold text-outline uppercase tracking-widest mb-4" style="writing-mode: vertical-rl; transform: rotate(180deg);">STATUS KURSII</p>
            <div class="space-y-3">
              <div class="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(246,202,34,0.8)]"></div>
              <div class="w-3 h-3 rounded-full bg-primary/30"></div>
              <div class="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(246,202,34,0.8)]"></div>
              <div class="w-3 h-3 rounded-full bg-surface-container-highest"></div>
            </div>
          </div>
          <button class="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container hover:scale-110 transition-transform shadow-[0_0_15px_rgba(246,202,34,0.5)]">
            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">bolt</span>
          </button>
        </div>
      </div>

      <!-- Main Content Canvas -->
      <main class="ml-64 pt-16 min-h-screen relative">
        <!-- Signature Texture Decoration -->
        <div class="fixed bottom-0 right-0 w-96 h-96 pointer-events-none opacity-20 z-0">
          <div class="absolute inset-0 bg-gradient-to-tl from-primary/20 to-transparent blur-[120px]"></div>
        </div>
        
        <div id="master-sub-content" class="p-8 relative z-10 w-full max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col items-center">
          <!-- Dynamic Content Rendered Here -->
        </div>
      </main>
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

    // Logout Modal
    container.querySelector('#master-logout-btn')?.addEventListener('click', async () => {
      try { await supabase.auth.signOut(); } catch(e) {}
      import('../utils/storage.js').then(m => m.storage.logout());
      window.location.reload(); // Force full reset
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
      const len = searchInput.value.length;
      searchInput.setSelectionRange(len, len);
    }

    // Refresh
    const refreshBtn = container.querySelector('#master-refresh-btn');
    refreshBtn?.addEventListener('click', async () => {
      const icon = refreshBtn.querySelector('span');
      if (icon) icon.classList.add('animate-spin');
      showToast('Menyinkronisasi data global...', 'info');
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
        supabase.from('subscription_plans').select('*', { count: 'exact' }).order('price', { ascending: true }),
        supabase.from('subscription_history').select('*, shops(name)').order('created_at', { ascending: false })
      ]);

      const globalPayments = results[0].data || [];
      const globalAppts = results[1].data || [];
      let shops = results[2].data || [];
      const plans = results[3].data || [];
      const history = results[4].data || [];

      // Check for errors
      const errors = results.filter(r => r.error).map(r => r.error.message);
      if (errors.length > 0) console.warn('Sync issues:', errors);

      // Apply Search Filter locally
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        shops = shops.filter(s => 
          s.name.toLowerCase().includes(query) || 
          s.slug.toLowerCase().includes(query)
        );
      }

      if (activeTab === 'dashboard') {
        renderDashboardTab(contentArea, shops, plans, globalPayments, globalAppts);
      } else if (activeTab === 'sales') {
        renderSalesAnalyticsTab(contentArea, history, plans);
      } else if (activeTab === 'subscriptions') {
        renderSubscriptionReportTab(contentArea, shops, plans);
      } else if (activeTab === 'stores') {
        renderStoreManagementTab(contentArea, shops, plans);
      } else if (activeTab === 'tiers') {
        renderTierManagementTab(contentArea, plans);
      } else if (activeTab === 'settings') {
        renderSystemSettingsTab(contentArea);
      }

      // Action Listeners for sidebar (inside loadMasterData to share results)
      const addNodeBtn = container.querySelector('#sidebar-add-node-btn');
      if (addNodeBtn) {
        addNodeBtn.onclick = () => {
          activeTab = 'stores';
          renderAddStoreFlow(contentArea, plans);
        };
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

  function renderDashboardTab(contentArea, shops, plans, payments, appointments) {
    const activeShops = shops.filter(s => s.status === 'active');
    const totalMRR = activeShops.reduce((sum, shop) => {
      const p = plans?.find(pl => pl.id === shop.plan_id);
      return sum + (p?.price || 0);
    }, 0);

    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <!-- Header Section -->
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">SYSTEM MONITOR</p>
            <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface uppercase italic tracking-tighter">Pusat Kendali Master</h2>
            <p class="text-on-surface-variant mt-2 max-w-xl">Status operasional ekosistem BarberPro: ${shops.length} Node Terhubung.</p>
          </div>
          <div class="flex gap-4">
            <button id="dashboard-refresh-stats" class="px-6 py-4 bg-surface-container rounded-2xl border border-outline-variant/10 text-xs font-bold text-outline hover:text-primary transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-lg">sync</span>
              Refresh Metrics
            </button>
          </div>
        </section>

        <!-- Metrics Bento Grid -->
        <section class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Widget 1: Revenue -->
          <div class="md:col-span-2 bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-2xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-primary/10 transition-all"></div>
            <div class="flex justify-between items-start mb-8">
              <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">payments</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">+14% GROWTH</span>
              </div>
            </div>
            <p class="text-xs font-bold text-outline uppercase tracking-widest mb-1">Estimated Plateform MRR</p>
            <h4 class="text-5xl font-black font-headline text-on-surface tracking-tighter tabular-nums">Rp ${(totalMRR/1000).toLocaleString()}k</h4>
            <p class="text-[10px] text-on-surface-variant mt-4 font-medium uppercase tracking-widest italic">Aggregated from active subscriptions</p>
          </div>

          <!-- Widget 2: Node Distribution -->
          <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-xl flex flex-col justify-between group cursor-pointer hover:border-primary/20 transition-all">
            <div>
              <div class="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-outline mb-6 group-hover:text-primary transition-colors">
                <span class="material-symbols-outlined">hub</span>
              </div>
              <p class="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Total Active Nodes</p>
              <h4 class="text-3xl font-black font-headline text-on-surface tracking-tight">${activeShops.length}</h4>
            </div>
            <div class="mt-4 flex items-center gap-2">
               <div class="flex-1 h-1 bg-surface-container rounded-full overflow-hidden">
                 <div class="h-full bg-primary" style="width: ${(activeShops.length/shops.length)*100}%"></div>
               </div>
               <span class="text-[10px] font-bold text-outline">${Math.round((activeShops.length/shops.length)*100)}%</span>
            </div>
          </div>

          <!-- Widget 3: Real-time Traffic -->
          <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-xl flex flex-col justify-between group">
            <div>
              <div class="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-outline mb-6">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bolt</span>
              </div>
              <p class="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Global Traffic</p>
              <h4 class="text-3xl font-black font-headline text-on-surface tracking-tight">${appointments.length}</h4>
            </div>
            <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Operations Sync
            </p>
          </div>
        </section>

        <!-- Performance Graph (Simplified for Dashboard) -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-2 bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-2xl min-h-[300px] flex flex-col justify-between">
             <div class="flex justify-between items-center mb-6">
                <h4 class="text-sm font-black font-headline text-on-surface tracking-widest uppercase italic">Network Performance Delta</h4>
                <div class="flex gap-2">
                   <div class="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-widest">
                      <span class="w-2 h-2 rounded-full bg-primary"></span> Revenue
                   </div>
                   <div class="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-widest">
                      <span class="w-2 h-2 rounded-full bg-surface-container-highest"></span> Sessions
                   </div>
                </div>
             </div>
             <div class="flex-1 flex items-end gap-2 px-2 pb-2">
                ${Array.from({length: 24}).map((_, i) => {
                  const h = Math.random() * 60 + 20;
                  return `<div class="flex-1 bg-surface-container-highest/30 rounded-t-sm hover:bg-primary/40 transition-all cursor-crosshair" style="height: ${h}%"></div>`;
                }).join('')}
             </div>
          </div>

          <!-- Recent Logs Widget -->
          <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-xl flex flex-col">
             <h4 class="text-[10px] font-black font-headline text-outline tracking-widest uppercase mb-6">Critical Alerts</h4>
             <div class="space-y-4 flex-1">
                <div class="flex items-start gap-4 p-3 rounded-xl bg-red-400/5 border border-red-400/10">
                   <span class="material-symbols-outlined text-red-400 text-lg">error</span>
                   <div>
                      <p class="text-xs font-bold text-on-surface">Node Expired</p>
                      <p class="text-[9px] text-outline">Senopati Center requires billing update.</p>
                   </div>
                </div>
                <div class="flex items-start gap-4 p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
                   <span class="material-symbols-outlined text-amber-400 text-lg">warning</span>
                   <div>
                      <p class="text-xs font-bold text-on-surface">System Load High</p>
                      <p class="text-[9px] text-outline">Delta traffic peak detected across 8 nodes.</p>
                   </div>
                </div>
             </div>
             <button class="w-full py-3 mt-6 bg-surface-container rounded-xl text-[10px] font-black text-outline hover:text-on-surface transition-all uppercase tracking-[0.2em] border border-white/5">
                View Global Logs
             </button>
          </div>
        </section>
      </div>
    `;

    contentArea.querySelector('#dashboard-refresh-stats')?.addEventListener('click', () => loadMasterData());
  }

  function renderSalesAnalyticsTab(contentArea, history, plans) {
    const totalRev = history.reduce((sum, h) => sum + (h.amount || 0), 0);
    const recentHistory = history.slice(0, 10);

    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section>
          <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 italic">FINANCIAL PROTOCOL ALPHA</p>
          <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Sales & Revenue Intelligence</h2>
          <p class="text-on-surface-variant mt-2 max-w-xl">Deep analytics on platform subscription cycles and payment distributions.</p>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Main Revenue Chart Container -->
          <div class="lg:col-span-8 bg-surface-container-low p-10 rounded-3xl border border-outline-variant/10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[450px]">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"></div>
            
            <div class="relative z-10 flex justify-between items-start">
              <div>
                 <p class="text-xs font-bold text-outline uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-primary">auto_graph</span>
                    Gross Combined Revenue
                 </p>
                 <h3 class="text-6xl font-black font-headline text-on-surface tracking-tighter">
                   Rp ${(totalRev/1000).toLocaleString()}k
                 </h3>
              </div>
              <div class="flex gap-2">
                 <button class="px-4 py-2 bg-surface-container rounded-lg text-[10px] font-bold text-on-surface border border-outline-variant/10">30D</button>
                 <button class="px-4 py-2 bg-primary/20 rounded-lg text-[10px] font-bold text-primary border border-primary/20">90D</button>
              </div>
            </div>

            <!-- Detailed Graph Visualization -->
            <div class="h-48 mt-12 flex items-end gap-4 px-4 overflow-hidden group">
               ${Array.from({length: 15}).map((_, i) => {
                 const v = 30 + Math.random() * 70;
                 return `
                    <div class="flex-1 min-w-[20px] bg-surface-container-highest rounded-t-lg relative transition-all duration-700 hover:bg-primary shadow-lg group-hover:opacity-50 hover:!opacity-100 cursor-pointer" style="height: ${v}%">
                       <div class="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline-variant/20 px-3 py-1.5 rounded-lg opacity-0 hover:opacity-100 transition-opacity text-[10px] font-black text-primary whitespace-nowrap shadow-2xl">
                          Day ${i+1}: Rp ${Math.floor(v*100)}k
                       </div>
                    </div>
                 `;
               }).join('')}
            </div>
          </div>

          <!-- Tier Performance -->
          <div class="lg:col-span-4 bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-xl flex flex-col">
             <h4 class="text-xs font-black font-headline text-outline uppercase tracking-[0.2em] mb-8">Node Tier Performance</h4>
             <div class="space-y-6 flex-1">
                ${plans.map(p => {
                  const items = history.filter(h => h.plan_id === p.id);
                  const rev = items.reduce((sum, x) => sum + x.amount, 0);
                  const percent = totalRev > 0 ? (rev / totalRev * 100) : 0;
                  return `
                    <div class="space-y-3">
                       <div class="flex justify-between items-end">
                          <span class="text-xs font-bold text-on-surface uppercase tracking-wider">${p.name}</span>
                          <span class="text-xs font-black text-primary">${Math.round(percent)}%</span>
                       </div>
                       <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div class="h-full bg-primary shadow-[0_0_10px_rgba(246,202,34,0.3)] transition-all duration-1000" style="width: ${percent}%"></div>
                       </div>
                    </div>
                  `;
                }).join('')}
             </div>
             <div class="mt-10 pt-8 border-t border-outline-variant/5">
                <div class="flex justify-between items-center text-xs text-outline font-bold mb-4">
                   <span>Avg Subscription Cycle</span>
                   <span class="text-on-surface">32.4 Days</span>
                </div>
                <button class="w-full py-4 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 rounded-xl border border-primary/20 hover:bg-primary hover:text-on-primary transition-all">
                   Full Audit Ledger
                </button>
             </div>
          </div>
        </div>

        <!-- Sales Ledger Table -->
        <section class="bg-surface-container-low rounded-3xl border border-outline-variant/5 overflow-hidden shadow-2xl">
          <div class="p-8 border-b border-outline-variant/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <h4 class="text-xl font-bold font-headline text-on-surface italic uppercase tracking-tighter">Transaction Ledger</h4>
               <p class="text-sm text-outline">Real-time recording of all node relay financial triggers.</p>
             </div>
             <button class="px-6 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-outline hover:text-on-surface transition-all flex items-center gap-2 uppercase tracking-widest">
                <span class="material-symbols-outlined text-sm">filter_list</span> Filter Ledger
             </button>
          </div>
          <div class="overflow-x-auto">
             <table class="w-full text-left">
                <thead>
                   <tr class="text-[10px] uppercase tracking-[0.3em] text-outline font-black bg-surface-container-highest/20">
                      <th class="px-8 py-6">Node Instance</th>
                      <th class="px-8 py-6">Protocol Action</th>
                      <th class="px-8 py-6">Amount</th>
                      <th class="px-8 py-6 text-right">Relay Status</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                   ${history.map(h => `
                     <tr class="group hover:bg-white/[0.01] transition-all">
                        <td class="px-8 py-6">
                           <p class="text-xs font-black text-on-surface tracking-wider uppercase">${h.shops?.name || 'NODE-' + h.id.slice(0,4)}</p>
                           <p class="text-[10px] text-outline tabular-nums italic">${new Date(h.created_at).toLocaleString('id-ID')}</p>
                        </td>
                        <td class="px-8 py-6">
                           <div class="flex items-center gap-2">
                              <span class="px-2 py-0.5 rounded bg-surface-container-highest text-[9px] font-black text-outline border border-outline-variant/10 uppercase tracking-widest">SUB_SYNC</span>
                              <span class="text-[10px] font-bold text-on-surface-variant">Tier Uplink</span>
                           </div>
                        </td>
                        <td class="px-8 py-6">
                           <span class="text-sm font-black text-emerald-400 tabular-nums">Rp ${h.amount.toLocaleString()}</span>
                        </td>
                        <td class="px-8 py-6 text-right">
                           <span class="text-[10px] font-black text-primary px-3 py-1 rounded-full border border-primary/20 bg-primary/5 uppercase tracking-[0.2em]">VERIFIED</span>
                        </td>
                     </tr>
                   `).join('')}
                </tbody>
             </table>
          </div>
        </section>
      </div>
    `;
  }

  function renderSubscriptionReportTab(contentArea, shops, plans) {
    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section class="flex justify-between items-end">
          <div>
            <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 italic">NODE STATUS REGISTRY</p>
            <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface uppercase tracking-tighter italic text-on-surface/90">Subscription Monitor</h2>
            <p class="text-on-surface-variant mt-2 max-w-xl">Daftar lengkap node dan siklus berlangganan yang sedang berjalan di ekosistem.</p>
          </div>
          <div class="flex gap-3">
             <div class="relative group">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-sm">search</span>
                <input class="bg-surface-container-low border border-outline-variant/10 rounded-2xl py-3 pl-10 pr-6 text-xs text-on-surface focus:ring-1 focus:ring-primary focus:border-none transition-all w-64" placeholder="Cari Node Master..." type="text" />
             </div>
          </div>
        </section>

        <!-- Status Filter Cards -->
        <section class="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/5 shadow-xl transition-all cursor-pointer hover:bg-surface-container hover:-translate-y-1">
              <p class="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Total Instances</p>
              <h4 class="text-2xl font-black font-headline text-on-surface uppercase">${shops.length} Units</h4>
           </div>
           <div class="bg-surface-container-low p-6 rounded-2xl border border-emerald-400/10 shadow-xl transition-all cursor-pointer hover:bg-surface-container-high hover:-translate-y-1">
              <p class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Active RELAY</p>
              <h4 class="text-2xl font-black font-headline text-on-surface uppercase">${shops.filter(s=>s.status==='active').length} Nodes</h4>
           </div>
           <div class="bg-surface-container-low p-6 rounded-2xl border border-amber-400/10 shadow-xl transition-all cursor-pointer hover:bg-surface-container-high hover:-translate-y-1">
              <p class="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1 italic">Trial Protocol</p>
              <h4 class="text-2xl font-black font-headline text-on-surface uppercase">${shops.filter(s=>s.status==='trial').length} Nodes</h4>
           </div>
           <div class="bg-surface-container-low p-6 rounded-2xl border border-red-400/10 shadow-xl transition-all cursor-pointer hover:bg-surface-container-high hover:-translate-y-1">
              <p class="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 italic">Expired Nodes</p>
              <h4 class="text-2xl font-black font-headline text-on-surface uppercase">${shops.filter(s=>s.status==='expired').length} Nodes</h4>
           </div>
        </section>

        <section class="bg-surface-container-low rounded-3xl border border-outline-variant/5 overflow-hidden shadow-2xl">
          <div class="overflow-x-auto">
             <table class="w-full text-left">
                <thead>
                   <tr class="text-[10px] uppercase tracking-[0.3em] text-outline font-black bg-surface-container-highest/20">
                      <th class="px-8 py-6">Node Identity</th>
                      <th class="px-8 py-6">Active Tier</th>
                      <th class="px-8 py-6">Access Protocol</th>
                      <th class="px-8 py-6">Status Delta</th>
                      <th class="px-8 py-6 text-right">Control</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                   ${shops.map(shop => {
                     const plan = plans.find(p => p.id === shop.plan_id);
                     const sInfo = {
                       'active': { color: '#4ade80', label: 'OPERATIONAL' },
                       'trial': { color: '#fbbf24', label: 'SANDBOX' },
                       'expired': { color: '#f87171', label: 'OFFLINE' }
                     }[shop.status] || { color: '#9ca3af', label: 'UNKNOWN' };

                     return `
                       <tr class="group hover:bg-white/[0.015] transition-all">
                          <td class="px-8 py-6">
                             <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-surface-container-highest/50 flex items-center justify-center font-black text-primary border border-outline-variant/5">
                                   ${shop.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                   <p class="text-xs font-black text-on-surface uppercase tracking-[0.05em]">${shop.name}</p>
                                   <p class="text-[9px] text-outline italic tabular-nums">RELAY-ID: ...${shop.id.slice(-8)}</p>
                                </div>
                             </div>
                          </td>
                          <td class="px-8 py-6">
                             <span class="text-[10px] font-black text-on-surface px-3 py-1 bg-surface-container-highest rounded-lg border border-outline-variant/10 uppercase tracking-widest">
                                ${plan ? plan.name : 'NO_TIER'}
                             </span>
                          </td>
                          <td class="px-8 py-6">
                             <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 italic">Multi-Tenant v3.0</p>
                             <p class="text-[9px] font-medium text-outline uppercase tracking-[0.2em]">Enabled Access: CORE, POS, CRM</p>
                          </td>
                          <td class="px-8 py-6">
                             <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full shadow-[0_0_8px_${sInfo.color}]" style="background: ${sInfo.color}"></div>
                                <span class="text-[10px] font-black uppercase tracking-[0.2em]" style="color: ${sInfo.color}">${sInfo.label}</span>
                             </div>
                          </td>
                          <td class="px-8 py-6 text-right">
                             <div class="flex items-center justify-end gap-2">
                                <button class="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-outline hover:text-primary transition-all shop-edit-btn" data-id="${shop.id}">
                                   <span class="material-symbols-outlined text-lg">edit_note</span>
                                </button>
                                <button class="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-outline hover:text-emerald-400 transition-all shop-relay-btn" data-id="${shop.id}">
                                   <span class="material-symbols-outlined text-lg">sensors</span>
                                </button>
                             </div>
                          </td>
                       </tr>
                     `;
                   }).join('')}
                </tbody>
             </table>
          </div>
        </section>
      </div>
    `;

    contentArea.querySelectorAll('.shop-edit-btn').forEach(btn => btn.onclick = () => handleManageShop(btn.dataset.id, plans));
    contentArea.querySelectorAll('.shop-relay-btn').forEach(btn => btn.onclick = () => window.handleShopDetail(btn.dataset.id));
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

      // Fetch individual billing history for this shop
      const { data: bHistory } = await supabase.from('subscription_history').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(5);

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
              <div class="flex items-center gap-2">
                 <div class="w-1.5 h-1.5 rounded-full ${shop.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}"></div>
                 <p class="text-sm font-black uppercase text-primary">${shop.status}</p>
              </div>
            </div>
            <div class="bg-white/5 p-4 rounded-xl border border-white/5">
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tier Plan</p>
              <p class="text-sm font-black uppercase text-white">${shop.subscription_plans?.name || 'Standard'}</p>
            </div>
          </div>

          <!-- Audit Timeline -->
          <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
             <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-xs">history</span>
                Audit Timeline
             </p>
             <div class="space-y-3">
               ${bHistory?.length ? bHistory.map(bh => `
                 <div class="flex items-center justify-between text-xs py-2 border-b border-white/[0.03] last:border-0">
                    <div class="flex flex-col">
                       <span class="text-gray-300 font-bold">${bh.plan_id ? 'Renewal Sync' : 'Activation'}</span>
                       <span class="text-[9px] text-gray-500">${new Date(bh.created_at).toLocaleDateString()}</span>
                    </div>
                    <span class="font-black text-emerald-400">Rp ${bh.amount.toLocaleString()}</span>
                 </div>
               `).join('') : '<p class="text-[10px] text-gray-500 italic py-4">No historical records found for this node.</p>'}
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

    // Comprehensive list of available system modules
    const allFeatures = [
      { id: 'dashboard', label: 'Dashboard Overview', icon: 'grid_view' },
      { id: 'pos', label: 'Point of Sale (Kasir)', icon: 'point_of_sale' },
      { id: 'appointments', label: 'Janji Temu Online', icon: 'calendar_month' },
      { id: 'queue', label: 'Management Antrian', icon: 'group' },
      { id: 'customers', label: 'CRM Pelanggan', icon: 'person' },
      { id: 'barbers', label: 'Manajemen Staff', icon: 'content_cut' },
      { id: 'attendance', label: 'Presensi Digital', icon: 'alarm' },
      { id: 'payments', label: 'Audit Pembayaran', icon: 'payments' },
      { id: 'promos', label: 'Marketing & Promosi', icon: 'sell' },
      { id: 'reports', label: 'Analisis Pendapatan', icon: 'analytics' },
      { id: 'expenses', label: 'Buku Pengeluaran', icon: 'receipt_long' },
      { id: 'inventory', label: 'Stok Barang', icon: 'inventory_2' },
      { id: 'memberships', label: 'Program Loyalitas', icon: 'id_card' },
      { id: 'gallery', label: 'Galeri Style', icon: 'imagesmode' },
      { id: 'logbook', label: 'Catatan Harian', icon: 'book' },
      { id: 'portal', label: 'Portal Booking Publik', icon: 'public' }
    ];

    const body = `
      <form id="edit-plan-form" class="space-y-6 text-on-surface">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Price Card -->
          <div class="col-span-full bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Biaya Operasional Bulanan</label>
            <div class="relative">
              <span class="absolute left-5 top-1/2 -translate-y-1/2 font-black text-primary text-xl">Rp</span>
              <input type="number" id="edit-plan-price" class="w-full bg-surface-container-high border-none rounded-xl pl-16 pr-5 py-5 text-2xl font-black text-on-surface focus:ring-2 focus:ring-primary/50" value="${plan.price}" required />
            </div>
            <p class="text-[10px] text-outline mt-3 flex items-center gap-2 italic">
               <span class="material-symbols-outlined text-xs">info</span>
               Perubahan biaya akan berdampak pada proyeksi MRR Global secara instan.
            </p>
          </div>

          <!-- Limits -->
          <div class="bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Limitasi Staff (Nodes)</label>
            <div class="flex items-center gap-4">
              <span class="material-symbols-outlined text-outline">group</span>
              <input type="number" id="edit-plan-barbers" class="flex-1 bg-surface-container-high border-none rounded-xl px-4 py-4 text-lg font-bold text-on-surface focus:ring-2 focus:ring-primary/50" value="${plan.max_barbers || 0}" />
            </div>
            <p class="text-[10px] text-outline mt-3">0 = Unlimited Nodes</p>
          </div>

          <div class="bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Limitasi Cabang (Network)</label>
            <div class="flex items-center gap-4">
              <span class="material-symbols-outlined text-outline">hub</span>
              <input type="number" id="edit-plan-branches" class="flex-1 bg-surface-container-high border-none rounded-xl px-4 py-4 text-lg font-bold text-on-surface focus:ring-2 focus:ring-primary/50" value="${plan.max_branches || 0}" />
            </div>
            <p class="text-[10px] text-outline mt-3">0 = Single Node only</p>
          </div>
        </div>

        <!-- Feature Matrix -->
        <div class="bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
          <div class="flex justify-between items-center mb-6">
            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Matrix Fitur Terintegrasi</label>
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider counter-label">0 Fitur Aktif</span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            ${allFeatures.map(f => {
              const isChecked = plan.features?.includes(f.id);
              return `
                <label class="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/5 cursor-pointer hover:bg-surface-container-highest transition-all group relative overflow-hidden">
                  <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <input type="checkbox" name="features" value="${f.id}" ${isChecked ? 'checked' : ''} class="feature-checkbox w-5 h-5 rounded border-outline bg-surface-container text-primary focus:ring-primary/30" />
                  <div class="flex items-center gap-3 relative z-10">
                    <span class="material-symbols-outlined text-xl text-outline group-hover:text-primary transition-colors">${f.icon}</span>
                    <span class="text-xs font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">${f.label}</span>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <button type="submit" class="w-full py-5 gold-gradient text-on-primary font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
          <span class="material-symbols-outlined">security_update_good</span>
          SYNC PLATFORM ARCHITECTURE
        </button>
      </form>
    `;

    openModal(`Relay Optimization: ${plan.name}`, body, '', { maxWidth: '640px' });

    // Update counter on change
    const updateCounter = () => {
      const count = document.querySelectorAll('input[name="features"]:checked').length;
      document.querySelector('.counter-label').textContent = `${count} Fitur Aktif`;
    };
    document.querySelectorAll('.feature-checkbox').forEach(i => i.onchange = updateCounter);
    updateCounter();

    document.querySelector('#edit-plan-form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> SYNCING...';

      const price = document.querySelector('#edit-plan-price').value;
      const barbers = document.querySelector('#edit-plan-barbers').value;
      const branches = document.querySelector('#edit-plan-branches').value;
      const selected = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(i => i.value);

      try {
        const { error } = await supabase.from('subscription_plans').update({ 
          price: parseInt(price), 
          max_barbers: parseInt(barbers) || null,
          max_branches: parseInt(branches) || null,
          features: selected 
        }).eq('id', id);

        if (error) throw error;
        
        showToast('System architecture updated successfully.', 'success');
        closeModal();
        loadMasterData();
      } catch (err) {
        showToast('Sync Failed: ' + err.message, 'danger');
        btn.disabled = false;
        btn.innerHTML = originalText;
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
      const newStatus = document.querySelector('#edit-shop-status').value;
      const newPlanId = document.querySelector('#edit-shop-plan').value || null;
      
      try {
        // 1. Update Shop status/plan
        const { error: updateErr } = await supabase.from('shops').update({ 
          status: newStatus,
          plan_id: newPlanId
        }).eq('id', shopId);
        
        if (updateErr) throw updateErr;

        // 2. If status is active, record a billing entry
        if (newStatus === 'active' && newPlanId) {
            const plan = plans.find(p => p.id === newPlanId);
            if (plan) {
                await supabase.from('subscription_history').insert([{
                    shop_id: shopId,
                    plan_id: newPlanId,
                    amount: plan.price,
                    billing_cycle: 'monthly',
                    payment_method: 'admin_manual',
                    status: 'paid',
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
                    notes: `Aktivasi manual oleh Super Admin`
                }]);
            }
        }

        showToast('Node relay updated successfully & billing recorded.', 'success');
        closeModal();
        loadMasterData();
      } catch (err) {
        showToast('Update failed: ' + err.message, 'danger');
      }
    };
  }

  function renderStoreManagementTab(contentArea, shops, plans) {
    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 italic">FLEET OPERATIONS</p>
            <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface uppercase italic tracking-tighter">Store Management</h2>
            <p class="text-on-surface-variant mt-2 max-w-xl">Konfigurasi dan aktivasi instance toko dalam jaringan global.</p>
          </div>
          <button id="mgr-add-store-btn" class="px-8 py-4 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 text-xs">
            <span class="material-symbols-outlined text-lg">add_circle</span>
            <span>Deploy New Node</span>
          </button>
        </section>

        <!-- Node List -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${shops.map(shop => {
            const plan = plans.find(p => p.id === shop.plan_id);
            return `
              <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-xl group hover:border-primary/20 transition-all flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-6">
                    <div class="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center text-primary font-black text-xl border border-outline-variant/5">
                      ${shop.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/10 text-[9px] font-black text-outline uppercase tracking-widest">
                      ${shop.status}
                    </div>
                  </div>
                  <h4 class="text-xl font-black text-on-surface uppercase tracking-tight mb-1">${shop.name}</h4>
                  <p class="text-xs text-outline mb-4">@${shop.slug}</p>
                  <div class="space-y-3 pt-4 border-t border-outline-variant/5">
                    <div class="flex justify-between text-[10px] font-bold text-outline uppercase tracking-widest">
                       <span>Active Tier</span>
                       <span class="text-primary">${plan ? plan.name : 'NONE'}</span>
                    </div>
                    <div class="flex justify-between text-[10px] font-bold text-outline uppercase tracking-widest">
                       <span>Database Sync</span>
                       <span class="text-emerald-400">ENCRYPTED</span>
                    </div>
                  </div>
                </div>
                <div class="mt-8 flex gap-2">
                  <button class="flex-1 py-3 bg-surface-container-high rounded-xl text-[10px] font-black text-outline hover:text-on-surface transition-all uppercase tracking-widest border border-white/5 store-edit-btn" data-id="${shop.id}">
                    Manage Node
                  </button>
                  <button class="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-outline hover:text-red-400 transition-all border border-white/5 store-delete-btn" data-id="${shop.id}">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </section>
      </div>
    `;

    contentArea.querySelector('#mgr-add-store-btn')?.addEventListener('click', () => renderAddStoreFlow(contentArea, plans));
    contentArea.querySelectorAll('.store-edit-btn').forEach(btn => btn.onclick = () => handleManageShop(btn.dataset.id, plans));
    contentArea.querySelectorAll('.store-delete-btn').forEach(btn => btn.onclick = () => handleDeleteShop(btn.dataset.id));
  }

  function renderTierManagementTab(contentArea, plans) {
    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 italic">COMMERCIAL PROTOCOL</p>
            <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface uppercase italic tracking-tighter">Tier Management</h2>
            <p class="text-on-surface-variant mt-2 max-w-xl">Konfigurasi paket layanan, limitasi fitur, dan skema harga platform.</p>
          </div>
          <button class="px-8 py-4 bg-surface-container-highest text-outline font-black uppercase tracking-widest rounded-2xl border border-outline-variant/10 text-xs hover:text-primary transition-all">
            + Create New Plan
          </button>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
          ${plans.map(p => `
            <div class="bg-surface-container-low p-10 rounded-3xl border border-outline-variant/10 shadow-2xl relative overflow-hidden flex flex-col group">
              <div class="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
              
              <div class="relative z-10 flex-1">
                <p class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Service Level</p>
                <h3 class="text-3xl font-black font-headline text-on-surface uppercase tracking-tight mb-6">${p.name}</h3>
                
                <div class="mb-8">
                  <span class="text-4xl font-black text-on-surface tabular-nums">Rp ${(p.price/1000).toLocaleString()}k</span>
                  <span class="text-xs text-outline font-bold uppercase tracking-widest ml-2">/ month</span>
                </div>

                <ul class="space-y-4 mb-10">
                   <li class="flex items-center gap-3 text-xs text-on-surface-variant font-bold">
                      <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
                      Full POS Architecture
                   </li>
                   <li class="flex items-center gap-3 text-xs text-on-surface-variant font-bold">
                      <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
                      Cloud Sync Protocol
                   </li>
                   <li class="flex items-center gap-3 text-xs text-on-surface-variant font-bold">
                      <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
                      Up to 24/7 Support
                   </li>
                </ul>
              </div>

              <div class="relative z-10 pt-8 border-t border-outline-variant/5">
                <button class="w-full py-4 bg-surface-container-high rounded-xl text-[10px] font-black text-outline hover:text-primary transition-all uppercase tracking-[0.2em] border border-white/5" onclick="showToast('Feature Coming Soon: Plan Editor', 'info')">
                  Edit Plan Architecture
                </button>
              </div>
            </div>
          `).join('')}
        </section>
      </div>
    `;
  }

  function renderSystemSettingsTab(contentArea) {
    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section>
          <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 italic">CORE SYSTEM v3.0</p>
          <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface uppercase italic tracking-tighter">Application Settings</h2>
          <p class="text-on-surface-variant mt-2 max-w-xl">Konfigurasi mendalam parameter sistem, API keys, dan variabel lingkungan global.</p>
        </section>

        <section class="max-w-4xl space-y-8">
          <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-xl space-y-8">
             <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                   <span class="material-symbols-outlined">settings_suggest</span>
                </div>
                <div>
                   <h4 class="text-xl font-black text-on-surface uppercase tracking-tight">Platform Identity</h4>
                   <p class="text-[10px] text-outline font-bold uppercase tracking-widest">Global Meta Configuration</p>
                </div>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-3">
                   <label class="text-[10px] font-black text-outline uppercase tracking-widest ml-1">Platform Name</label>
                   <input class="w-full bg-surface-container border border-outline-variant/10 rounded-xl py-4 px-6 text-sm text-on-surface focus:ring-1 focus:ring-primary transition-all" type="text" value="BarberPro Master" />
                </div>
                <div class="space-y-3">
                   <label class="text-[10px] font-black text-outline uppercase tracking-widest ml-1">Support Email</label>
                   <input class="w-full bg-surface-container border border-outline-variant/10 rounded-xl py-4 px-6 text-sm text-on-surface focus:ring-1 focus:ring-primary transition-all" type="email" value="admin@barberpro.io" />
                </div>
             </div>
          </div>

          <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-xl space-y-8">
             <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-red-400/10 rounded-2xl flex items-center justify-center text-red-400">
                   <span class="material-symbols-outlined">security</span>
                </div>
                <div>
                   <h4 class="text-xl font-black text-on-surface uppercase tracking-tight">Security & Protocol</h4>
                   <p class="text-[10px] text-outline font-bold uppercase tracking-widest">Access & Encryption Layers</p>
                </div>
             </div>

             <div class="space-y-6">
                <div class="flex items-center justify-between p-6 bg-surface-container rounded-2xl border border-outline-variant/5">
                   <div>
                      <h5 class="text-xs font-black text-on-surface uppercase tracking-wider mb-1">Two-Factor Authentication</h5>
                      <p class="text-[10px] text-outline">Require 2FA for all Superadmin accounts.</p>
                   </div>
                   <button class="w-12 h-6 bg-primary rounded-full relative shadow-lg shadow-primary/20">
                      <div class="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full"></div>
                   </button>
                </div>
                <div class="flex items-center justify-between p-6 bg-surface-container rounded-2xl border border-outline-variant/5">
                   <div>
                      <h5 class="text-xs font-black text-on-surface uppercase tracking-wider mb-1">Audit Log Retention</h5>
                      <p class="text-[10px] text-outline">Keep system logs for 90 days.</p>
                   </div>
                   <select class="bg-surface-container-highest border-none rounded-lg text-[10px] font-black uppercase text-on-surface p-2">
                      <option>30 Days</option>
                      <option selected>90 Days</option>
                      <option>365 Days</option>
                   </select>
                </div>
             </div>
          </div>

          <div class="flex justify-end gap-4 pt-4">
             <button class="px-10 py-4 bg-primary text-on-primary font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-xs">
                Save Core Config
             </button>
          </div>
        </section>
      </div>
    `;
  }

  function renderAddStoreFlow(contentArea, plans) {
    let currentStep = 1;
    let formData = {
      name: '',
      address: '',
      phone: '',
      category: 'Premium Barber',
      plan_id: plans[0]?.id
    };

    function updateView() {
      if (currentStep === 1) {
        contentArea.innerHTML = `
          <div class="w-full max-w-4xl space-y-12 fade-in">
            <section class="flex justify-between items-end">
               <div>
                  <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 italic">STEP 01 / 02</p>
                  <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface uppercase italic tracking-tighter">Node Identity</h2>
                  <p class="text-on-surface-variant mt-2 max-w-xl">Masukkan informasi dasar untuk instance toko baru Anda.</p>
               </div>
               <div class="w-32 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: 50%"></div>
               </div>
            </section>

            <form id="add-store-step1" class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="md:col-span-2 space-y-3">
                  <label class="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1">Store Name</label>
                  <input id="in-name" class="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-5 px-8 text-on-surface focus:ring-1 focus:ring-primary transition-all" value="${formData.name}" placeholder="e.g. BarberPro Downtown" required />
               </div>
               <div class="md:col-span-2 space-y-3">
                  <label class="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1">Full Address</label>
                  <textarea id="in-address" class="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-5 px-8 text-on-surface focus:ring-1 focus:ring-primary transition-all" rows="3" placeholder="Street, City, Province...">${formData.address}</textarea>
               </div>
               <div class="space-y-3">
                  <label class="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1">Phone Number</label>
                  <input id="in-phone" class="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-5 px-8 text-on-surface focus:ring-1 focus:ring-primary transition-all" value="${formData.phone}" placeholder="812 xxxx xxxx" />
               </div>
               <div class="space-y-3">
                  <label class="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-1">Service Category</label>
                  <select id="in-category" class="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-5 px-8 text-on-surface focus:ring-1 focus:ring-primary transition-all">
                     <option ${formData.category === 'Premium Barber' ? 'selected' : ''}>Premium Barber</option>
                     <option ${formData.category === 'Classic Cut' ? 'selected' : ''}>Classic Cut</option>
                     <option ${formData.category === 'Express Cut' ? 'selected' : ''}>Express Cut</option>
                  </select>
               </div>
               <div class="md:col-span-2 flex justify-between pt-8 border-t border-outline-variant/10">
                  <button type="button" class="px-8 py-4 text-xs font-black text-outline uppercase tracking-widest hover:text-on-surface transition-all" onclick="loadMasterData()">Cancel Process</button>
                  <button type="submit" class="px-10 py-4 bg-primary text-on-primary font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all text-xs flex items-center gap-2">
                     Next Module
                     <span class="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
               </div>
            </form>
          </div>
        `;

        contentArea.querySelector('#add-store-step1').onsubmit = (e) => {
          e.preventDefault();
          formData.name = contentArea.querySelector('#in-name').value;
          formData.address = contentArea.querySelector('#in-address').value;
          formData.phone = contentArea.querySelector('#in-phone').value;
          formData.category = contentArea.querySelector('#in-category').value;
          currentStep = 2;
          updateView();
        };
      } else {
        contentArea.innerHTML = `
          <div class="w-full max-w-5xl space-y-12 fade-in">
            <section class="flex justify-between items-end">
               <div>
                  <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 italic">STEP 02 / 02</p>
                  <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface uppercase italic tracking-tighter">Protocol Selection</h2>
                  <p class="text-on-surface-variant mt-2 max-w-xl">Pilih paket layanan (Tier) yang akan diaktifkan untuk instance ini.</p>
               </div>
               <div class="w-32 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div class="h-full bg-primary shadow-[0_0_10px_rgba(246,202,34,0.5)]" style="width: 100%"></div>
               </div>
            </section>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
               ${plans.map(p => `
                  <div class="plan-card bg-surface-container-low p-8 rounded-3xl border-2 transition-all cursor-pointer group hover:shadow-2xl ${formData.plan_id === p.id ? 'border-primary bg-primary/5 shadow-2xl' : 'border-outline-variant/10 hover:border-primary/40'}" data-id="${p.id}">
                     <div class="flex justify-between items-start mb-6">
                        <div class="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                           <span class="material-symbols-outlined">${p.name === 'Enterprise' ? 'rocket_launch' : 'terminal'}</span>
                        </div>
                        ${formData.plan_id === p.id ? '<span class="material-symbols-outlined text-primary">verified</span>' : ''}
                     </div>
                     <h4 class="text-xl font-black text-on-surface uppercase tracking-tight mb-2">${p.name}</h4>
                     <p class="text-2xl font-black text-on-surface mb-6">Rp ${(p.price/1000).toLocaleString()}k <span class="text-[10px] text-outline italic">/ mo</span></p>
                     <ul class="space-y-3 mb-8 opacity-60 group-hover:opacity-100 transition-opacity">
                        <li class="flex items-center gap-2 text-[10px] font-bold text-outline uppercase italic">
                           <span class="w-1 h-1 rounded-full bg-primary"></span>
                           Uplink Capacity Alpha
                        </li>
                        <li class="flex items-center gap-2 text-[10px] font-bold text-outline uppercase italic">
                           <span class="w-1 h-1 rounded-full bg-primary"></span>
                           Core Data Layer v3
                        </li>
                     </ul>
                  </div>
               `).join('')}
            </div>

            <div class="flex justify-between pt-12 border-t border-outline-variant/10">
               <button type="button" class="px-8 py-4 text-xs font-black text-outline uppercase tracking-widest hover:text-on-surface transition-all flex items-center gap-2" onclick="currentStep = 1; updateView()">
                  <span class="material-symbols-outlined text-lg">arrow_back</span>
                  Identity Module
               </button>
               <button id="submit-relay-btn" class="px-12 py-5 bg-primary text-on-primary font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-3">
                  Authorize Deployment
                  <span class="material-symbols-outlined">bolt</span>
               </button>
            </div>
          </div>
        `;

        contentArea.querySelectorAll('.plan-card').forEach(card => {
          card.onclick = () => {
            formData.plan_id = card.dataset.id;
            updateView();
          };
        });

        contentArea.querySelector('#submit-relay-btn').onclick = async () => {
          const btn = contentArea.querySelector('#submit-relay-btn');
          btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Provisioning...';
          btn.disabled = true;

          try {
            const { data: ud, error: ue } = await supabase.auth.getUser();
            if (ue) throw ue;
            const uid = ud.user?.id;
            const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

            const { data: newShop, error } = await supabase.from('shops').insert([{
              name: formData.name,
              slug: slug,
              address: `${formData.address} (Telp: ${formData.phone})`,
              category: formData.category,
              status: 'active',
              plan_id: formData.plan_id,
              owner_id: uid
            }]).select().single();

            if (error) throw error;

            // Record initial billing
            const plan = plans.find(p => p.id === formData.plan_id);
            await supabase.from('subscription_history').insert([{
              shop_id: newShop.id,
              plan_id: formData.plan_id,
              amount: plan?.price || 0,
              billing_cycle: 'monthly',
              payment_method: 'admin_manual',
              status: 'paid',
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }]);

            showToast('Node Authorised & Relay Deployed successfully.', 'success');
            activeTab = 'stores';
            loadMasterData();
          } catch (err) {
            showToast('Deployment Failed: ' + err.message, 'danger');
            btn.innerHTML = 'Authorize Deployment <span class="material-symbols-outlined">bolt</span>';
            btn.disabled = false;
          }
        };
      }
    }

    updateView();
  }

}
