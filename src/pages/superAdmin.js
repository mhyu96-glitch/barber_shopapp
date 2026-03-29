import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

/**
 * SuperAdmin Dashboard v4 (Atelier 3.0 Edition)
 * Optimized for Desktop/Tablet with Bento-Grid Layout
 * Uses Vanilla CSS & Tailwind for styling
 */

export async function renderSuperAdmin(container) {
  let activeTab = 'dashboard'; 
  let searchTerm = '';
  let notificationCount = 0;
  let realtimeChannel = null;
  let globalRevenue = 0;
  let activeShopsCount = 0;
  let shopsData = [];
  let plansData = [];
  let historyData = [];

  // Theme Initializer - Force Clean Slate
  function initTheme() {
    // 1. Kill global sidebar and its footprint
    const globalSidebar = document.getElementById('sidebar');
    if (globalSidebar) {
      globalSidebar.style.display = 'none';
      globalSidebar.setAttribute('aria-hidden', 'true');
    }
    
    // 2. Kill sidebar toggle (mobile)
    const mobileToggle = document.querySelector('.sidebar-toggle');
    if (mobileToggle) mobileToggle.style.display = 'none';

    // 3. Reset main content constraints
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.padding = '0';
      mainContent.style.width = '100vw';
      mainContent.style.minWidth = '100%';
    }
    
    // 4. Reset page-container padding
    const container = document.getElementById('page-container');
    if (container) {
      container.style.padding = '0';
      container.style.maxWidth = '100%';
    }

    // 5. Apply SuperAdmin Body Overrides
    document.body.style.overflowX = 'hidden';
    document.body.className = 'bg-[var(--bg-main)] text-[var(--text-main)] font-body custom-scrollbar';
    
    const savedTheme = localStorage.getItem('master-admin-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Real-time Event Hub
  function setupNotifications() {
    if (realtimeChannel) return;
    
    realtimeChannel = supabase.channel('master-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shops' }, (payload) => {
        notificationCount++;
        showToast(`Toko Baru Terdeteksi: ${payload.new.name}`, 'info');
        renderLayout();
        loadMasterData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'subscription_history' }, (payload) => {
        showToast(`Aliran Dana Masuk: Otorisasi Berhasil`, 'success');
        loadMasterData();
      })
      .subscribe();
  }

  // Layout Engine
  function renderLayout() {
    container.innerHTML = `
      <style id="master-theme-styles">
        :root {
          --bg-main: #0C0C0C;
          --bg-secondary: #161616;
          --bg-accent: #1C1B1B;
          --text-main: #FFFFFF;
          --text-muted: #666666;
          --text-dim: #444444;
          --border-main: rgba(255, 255, 255, 0.05);
          --primary: #f6ca22;
          --primary-glow: rgba(246, 202, 34, 0.1);
          --shadow-abyss: 0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.6);
          --glass-bg: rgba(12, 12, 12, 0.8);
        }
        
        [data-theme="light"] {
          --bg-main: #F5F5F7;
          --bg-secondary: #FFFFFF;
          --bg-accent: #EFEFF4;
          --text-main: #1D1D1F;
          --text-muted: #86868B;
          --text-dim: #AEAEB2;
          --border-main: rgba(0, 0, 0, 0.05);
          --primary: #D4AF37;
          --primary-glow: rgba(212, 175, 55, 0.1);
          --shadow-abyss: 0 20px 40px rgba(0,0,0,0.05);
          --glass-bg: rgba(255, 255, 255, 0.8);
        }

        .font-headline { font-family: 'Outfit', sans-serif; }
        .glass { background: var(--glass-bg); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
        .gold-gradient { background: linear-gradient(135deg, #f6ca22 0%, #d4af37 100%); }
        .neon-line { filter: drop-shadow(0 0 8px var(--primary-glow)); }
        .neon-card-yellow { box-shadow: 0 0 40px var(--primary-glow); border: 1px solid var(--primary-glow); }
        .active-tab { background-color: var(--bg-accent); color: var(--primary) !important; box-shadow: inset 0 0 20px var(--primary-glow); }
        .active-tab span { color: var(--primary); font-variation-settings: 'FILL' 1; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--text-dim); border-radius: 10px; }
        .shadow-abyss { box-shadow: var(--shadow-abyss); }
        body { background-color: var(--bg-main); color: var(--text-main); transition: background-color 0.3s, color 0.3s; }
      </style>

      <!-- Atelier Navigation Protocol -->
      <aside class="w-72 fixed left-0 top-0 h-screen bg-[var(--bg-main)] border-r border-[var(--border-main)] z-[100] flex flex-col p-8 overflow-hidden">
        <div class="flex items-center gap-5 mb-20 px-2 group cursor-pointer" onclick="window.location.hash='super-admin'">
            <div class="w-12 h-12 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center border border-[var(--primary)]/40 group-hover:neon-card-yellow transition-all duration-500">
                <span class="material-symbols-outlined text-[var(--primary)] font-black text-2xl" style="font-variation-settings: 'FILL' 1;">widgets</span>
            </div>
            <div>
              <h1 class="text-2xl font-black font-headline tracking-tighter text-[var(--text-main)] leading-none italic">Barber<span class="text-[var(--primary)]">Pro</span></h1>
              <p class="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.4em] mt-2 italic">Atelier 3.0 Master</p>
            </div>
        </div>

        <nav class="flex-1 space-y-2 text-sm font-bold">
            <a href="#" class="sidebar-link flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'active-tab scale-[1.02]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'}" data-tab="dashboard">
                <span class="material-symbols-outlined text-xl">dashboard_customize</span> <span class="tracking-[0.2em] text-[10px] uppercase font-black">Dashboard</span>
            </a>
            <a href="#" class="sidebar-link flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === 'stores' ? 'active-tab scale-[1.02]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'}" data-tab="stores">
                <span class="material-symbols-outlined text-xl">account_tree</span> <span class="tracking-[0.2em] text-[10px] uppercase font-black">Manajemen Unit</span>
            </a>
            <a href="#" class="sidebar-link flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === 'reports' ? 'active-tab scale-[1.02]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'}" data-tab="reports">
                <span class="material-symbols-outlined text-xl">monitoring</span> <span class="tracking-[0.2em] text-[10px] uppercase font-black">Laporan Global</span>
            </a>
            <a href="#" class="sidebar-link flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === 'settings' ? 'active-tab scale-[1.02]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'}" data-tab="settings">
                <span class="material-symbols-outlined text-xl">admin_panel_settings</span> <span class="tracking-[0.2em] text-[10px] uppercase font-black">Konfigurasi</span>
            </a>
        </nav>

        <div class="mt-auto pt-8 border-t border-[var(--border-main)]">
            <button id="master-logout-btn" class="w-full flex items-center gap-5 px-6 py-4 text-[var(--text-muted)] hover:text-rose-500 transition-all text-[10px] font-black uppercase tracking-[0.3em] italic">
              <span class="material-symbols-outlined text-lg">logout</span> Keluar Sistem
            </button>
        </div>
      </aside>

      <!-- Protocol Viewport -->
      <div class="flex-1 ml-72 min-h-screen bg-[var(--bg-main)] flex flex-col">
          <!-- Topbar -->
          <header class="h-20 flex justify-between items-center px-12 sticky top-0 z-40 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border-main)]">
              <div class="flex items-center gap-4">
                  <span class="material-symbols-outlined text-[var(--text-muted)] text-sm">menu</span>
                  <p class="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] italic">Home</p>
              </div>
              <div class="flex items-center gap-8">
                  <div class="relative group lg:flex hidden">
                      <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">search</span>
                      <input id="master-search-input" type="text" placeholder="Search data..." class="bg-[var(--bg-secondary)] border-none rounded-xl py-2.5 pl-11 pr-4 text-[10px] font-bold text-[var(--text-main)] w-64 focus:ring-1 focus:ring-[var(--primary)]/40 outline-none">
                  </div>
                  <button id="master-notif-btn" class="relative text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                      <span class="material-symbols-outlined text-xl">notifications</span>
                      <span class="absolute -top-1 -right-1 w-2 h-2 bg-[var(--primary)] rounded-full border-2 border-[var(--bg-main)] ${notificationCount > 0 ? '' : 'hidden'}"></span>
                  </button>
                  <div class="w-9 h-9 rounded-full bg-[var(--border-main)] border border-[var(--border-main)] overflow-hidden">
                      <img src="https://ui-avatars.com/api/?name=Admin&background=f6ca22&color=000" class="w-full h-full object-cover opacity-80" />
                  </div>
              </div>
          </header>

          <main id="master-view-container" class="px-12 pb-12 space-y-12">
              <!-- Content injected here -->
          </main>
      </div>
    `;

    // Global Listeners
    container.querySelectorAll('.sidebar-link').forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        activeTab = link.dataset.tab;
        renderLayout();
        loadMasterData();
      };
    });

    container.querySelector('#master-logout-btn').onclick = async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) window.location.reload();
    };

    container.querySelector('#master-search-input').oninput = (e) => {
      searchTerm = e.target.value;
      loadMasterData();
    };

    container.querySelector('#master-notif-btn').onclick = () => {
      notificationCount = 0;
      renderLayout();
      loadMasterData();
    };
  }

  // Data Fetcher
  async function loadMasterData() {
    const viewPort = container.querySelector('#master-view-container');
    if (!viewPort) return;

    try {
      const { data: shops } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
      const { data: plans } = await supabase.from('subscription_plans').select('*').order('price', { ascending: true });
      const { data: history } = await supabase.from('subscription_history').select('*, shops(name)').order('created_at', { ascending: false });

      shopsData = shops || [];
      plansData = plans || [];
      historyData = history || [];

      // Calculate Metrics
      globalRevenue = historyData.filter(h => h.status === 'paid').reduce((sum, h) => sum + h.amount, 0);
      activeShopsCount = shopsData.filter(s => s.status === 'active').length;

      // Filter shops based on search
      const filteredShops = shopsData.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Render Active View
      if (activeTab === 'dashboard') renderDashboardView(viewPort);
      else if (activeTab === 'stores') renderStoresView(viewPort, filteredShops);
      else if (activeTab === 'reports') renderReportsView(viewPort);
      else if (activeTab === 'tiers') renderTiersView(viewPort);
      else if (activeTab === 'settings') renderSettingsView(viewPort);
      
    } catch (err) {
      showToast('Gagal sinkronisasi data master: ' + err.message, 'danger');
    }
  }

  // --- VIEWS ---

  function renderDashboardView(viewPort) {
    const activeShops = shopsData.filter(s => s.status === 'active').length;
    const totalTraffic = (activeShops * 12.3).toFixed(1) + 'K';
    const performance = activeShops > 0 ? '+12.4%' : '0%';

    viewPort.innerHTML = `
      <div class="space-y-12 fade-in">
          <!-- Hero Section: Revenue + Quick Stats -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <!-- Huge Revenue Chart Card -->
              <div class="lg:col-span-3 bg-[var(--bg-secondary)] rounded-[2.5rem] p-10 shadow-abyss border border-[var(--border-main)] relative overflow-hidden group">
                  <div class="absolute top-10 right-10">
                      <button class="px-4 py-2 bg-[var(--border-main)] rounded-xl text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)] flex items-center gap-2">
                        Month <span class="material-symbols-outlined text-xs">expand_more</span>
                      </button>
                  </div>
                  
                  <div class="relative z-10 flex flex-col h-full">
                      <h3 class="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4 italic">Revenue Growth</h3>
                      <div class="flex items-baseline gap-2 mb-12">
                         <h4 class="text-5xl font-black font-headline text-[var(--text-main)] tracking-tighter">Rp ${globalRevenue.toLocaleString()}</h4>
                         <span class="text-[10px] text-[var(--primary)]/60 font-black uppercase tracking-widest italic translate-y-[-10px]">/ .00</span>
                      </div>

                      <div class="flex-1 min-h-[220px] relative mt-auto px-4">
                          <svg class="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="mainHeroGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35"></stop>
                                <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"></stop>
                              </linearGradient>
                            </defs>
                            <path d="M0,80 C150,90 250,70 400,85 C550,100 650,40 800,70 C900,80 1000,20 L1000,100 L0,100 Z" fill="url(#mainHeroGrad)"></path>
                            <path class="neon-line" d="M0,80 C150,90 250,70 400,85 C550,100 650,40 800,70 C900,80 1000,20" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"></path>
                          </svg>
                      </div>
                      <div class="flex justify-between mt-8 text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest px-4 italic border-t border-[var(--border-main)] pt-6">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Aug</span>
                      </div>
                  </div>
              </div>

              <!-- Right Statistics Column -->
              <div class="space-y-8">
                  <!-- Active Shops -->
                  <div class="bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-main)] shadow-abyss flex flex-col justify-between h-[180px] group transition-all hover:translate-x-2">
                       <div class="flex justify-between items-start">
                          <h5 class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Total Active Shops</h5>
                          <span class="text-[9px] font-black text-emerald-400 tracking-tighter">LIVE</span>
                       </div>
                       <div class="flex items-end justify-between">
                          <h3 class="text-4xl font-black font-headline text-[var(--text-main)] tracking-tighter">${activeShops}</h3>
                          <div class="w-20 h-8 opacity-40">
                            <svg class="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                               <path d="M0,30 L0,20 Q50,10 100,25" fill="none" stroke="#10b981" stroke-width="2"></path>
                            </svg>
                          </div>
                       </div>
                  </div>

                  <!-- Network Traffic -->
                  <div class="bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-main)] shadow-abyss flex flex-col justify-between h-[180px] group transition-all hover:translate-x-2">
                       <div class="flex justify-between items-start">
                          <h5 class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Network Traffic</h5>
                          <span class="text-[9px] font-black text-[var(--primary)] tracking-tighter">ESTIMATED</span>
                       </div>
                       <div class="flex items-end justify-between">
                          <h3 class="text-4xl font-black font-headline text-[var(--text-main)] tracking-tighter">${totalTraffic}</h3>
                          <div class="w-20 h-8 opacity-40">
                            <svg class="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                               <path d="M0,25 Q30,5 60,15 T100,10" fill="none" stroke="var(--primary)" stroke-width="2"></path>
                            </svg>
                          </div>
                       </div>
                  </div>
                  
                  <!-- Performance Card -->
                  <div class="bg-[var(--primary)] p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(246,202,34,0.15)] h-[180px] flex flex-col justify-between group overflow-hidden relative">
                      <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-black/10 rounded-full blur-2xl"></div>
                      <div class="flex justify-between items-start relative z-10">
                          <h5 class="text-[9px] font-black text-black/60 uppercase tracking-[0.3em]">Performance</h5>
                          <span class="text-[9px] font-black text-black/80 tracking-tighter">${performance}</span>
                      </div>
                      <div class="relative z-10">
                         <h3 class="text-4xl font-black font-headline text-black tracking-tighter">${activeShops > 0 ? (activeShops * 423).toLocaleString() : '0'}</h3>
                         <p class="text-[8px] font-black text-black/40 uppercase tracking-widest mt-1">MONTHLY OPERATIONS</p>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Bottom Section: Tables -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Recent Orders -->
              <div class="bg-[var(--bg-secondary)] rounded-[2.5rem] p-10 border border-[var(--border-main)] shadow-abyss overflow-hidden">
                  <div class="flex justify-between items-center mb-10">
                      <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic">Recent Activity</h4>
                      <button class="text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-[0.3em] transition-colors">All items <span class="material-symbols-outlined text-[10px] inline-block translate-y-0.5">expand_more</span></button>
                  </div>
                  <div class="space-y-6">
                      ${historyData.slice(0, 5).map(h => `
                        <div class="flex items-center justify-between group p-3 hover:bg-[var(--text-main)]/[0.02] rounded-2xl transition-all cursor-default border border-transparent hover:border-[var(--border-main)]">
                            <div class="flex items-center gap-4">
                               <div class="w-11 h-11 bg-[var(--text-main)]/[0.03] rounded-xl flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors text-[10px] font-black tabular-nums">ID</div>
                               <div>
                                  <p class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight">${h.shops?.name || 'Unknown'}</p>
                                  <p class="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">${new Date(h.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div class="text-right">
                               <p class="text-[11px] font-black text-[var(--text-main)] tracking-tighter">Rp ${h.amount.toLocaleString()}</p>
                               <span class="text-[7px] font-black text-[var(--primary)] uppercase bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20">${h.status}</span>
                            </div>
                        </div>
                      `).join('')}
                      ${historyData.length === 0 ? '<p class="text-center py-10 text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">No activity detected</p>' : ''}
                  </div>
              </div>

              <!-- Top Shops -->
              <div class="bg-[var(--bg-secondary)] rounded-[2.5rem] p-10 border border-[var(--border-main)] shadow-abyss overflow-hidden">
                  <div class="flex justify-between items-center mb-10">
                      <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic">Top Unit Nodes</h4>
                      <span class="text-[9px] font-black border border-[var(--border-main)] text-[var(--text-muted)] px-3 py-1 rounded-full uppercase tracking-widest">Active Scale</span>
                  </div>
                  <div class="overflow-x-auto">
                      <table class="w-full text-left">
                          <thead>
                             <tr class="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em] border-b border-[var(--border-main)]">
                                <th class="pb-4 pt-2">Node Name</th>
                                <th class="pb-4 pt-2">Tier</th>
                                <th class="pb-4 pt-2 text-right">Activity</th>
                             </tr>
                          </thead>
                          <tbody class="divide-y divide-[var(--border-main)]">
                              ${shopsData.slice(0, 5).map(s => {
                                const plan = plansData.find(p => p.id === s.plan_id);
                                return `
                                  <tr class="group">
                                    <td class="py-4 text-[10px] font-black text-[var(--text-main)] uppercase group-hover:text-[var(--primary)] transition-colors">${s.name}</td>
                                    <td class="py-4 text-[10px] text-[var(--text-muted)] font-black uppercase">${plan ? plan.name : 'Lite'}</td>
                                    <td class="py-4 text-right"><span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] inline-block"></span></td>
                                  </tr>
                                `;
                              }).join('')}
                              ${shopsData.length === 0 ? '<tr><td colspan="3" class="text-center py-10 text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">No nodes deployed</td></tr>' : ''}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>
    `;
  }

  function renderReportsView(viewPort) {
    viewPort.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] mb-3 italic">ANALYTICS ENGINE</p>
            <h2 class="text-5xl font-extrabold font-headline tracking-tighter text-[var(--text-main)] uppercase italic">System Intelligence</h2>
            <p class="text-[var(--text-muted)] mt-2 text-xs font-bold uppercase tracking-widest">Laporan Pertumbuhan Arsitektur dan Kinerja Finansial Global</p>
          </div>
          <div class="flex gap-4">
             <button class="px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-main)] transition-all">CSV Export</button>
             <button class="px-6 py-3 gold-gradient text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20">Generate PDF</button>
          </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div class="bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-main)]">
                <p class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Gross Revenue</p>
                <h4 class="text-3xl font-black text-[var(--text-main)] font-headline">Rp ${globalRevenue.toLocaleString()}</h4>
                <p class="text-[8px] text-emerald-400 mt-2 font-black uppercase">+15.2% SINCE LAST LOAD</p>
            </div>
            <div class="bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-main)]">
                <p class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Subscription Growth</p>
                <h4 class="text-3xl font-black text-[var(--text-main)] font-headline">${historyData.length} Events</h4>
                <p class="text-[8px] text-amber-400 mt-2 font-black uppercase">PROCESSING QUEUE</p>
            </div>
            <div class="bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-main)]">
                <p class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Node Registry</p>
                <h4 class="text-3xl font-black text-[var(--text-main)] font-headline">${shopsData.length} Total</h4>
                <p class="text-[8px] text-[var(--primary)] mt-2 font-black uppercase font-bold italic">HEALTHY STATUS</p>
            </div>
            <div class="bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-main)]">
                <p class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Active Capacity</p>
                <h4 class="text-3xl font-black text-[var(--text-main)] font-headline">${shopsData.length > 0 ? Math.round((shopsData.filter(s=>s.status==='active').length/shopsData.length)*100) : 0}%</h4>
                <p class="text-[8px] text-[var(--text-muted)] mt-2 font-black uppercase tracking-widest">GLOBAL UPTIME</p>
            </div>
        </div>

        <div class="bg-[var(--bg-secondary)] p-12 rounded-[3rem] border border-[var(--border-main)] shadow-abyss">
            <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.4em] mb-10 italic">Revenue Velocity Trend</h4>
            <div class="h-64 flex items-end justify-between gap-4">
                ${[40, 60, 30, 80, 50, 90, 70, 45, 85, 60, 95, 100].map((h, i) => `
                    <div class="flex-1 group relative">
                        <div class="bg-[var(--primary)]/10 group-hover:bg-[var(--primary)]/20 transition-all rounded-t-lg w-full" style="height: ${h}%"></div>
                        <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-black text-[var(--text-dim)] uppercase tracking-widest">${['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</div>
                    </div>
                `).join('')}
            </div>
        </div>
      </div>
    `;
  }


  function renderStoresView(viewPort, shops) {
    viewPort.innerHTML = `
      <div class="w-full space-y-10 fade-in">
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] mb-3 italic">ECOSYSTEM MANAGEMENT</p>
            <h2 class="text-5xl font-extrabold font-headline tracking-tighter text-[var(--text-main)] uppercase italic">Node Registry</h2>
            <p class="text-[var(--text-muted)] mt-2 text-xs font-bold uppercase tracking-widest">Otorisasi dan Pengendalian Unit Bisnis Global</p>
          </div>
          <button id="mgr-add-store-btn" class="px-8 py-5 gold-gradient text-black font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-xs italic">
            <span class="material-symbols-outlined font-black">add_circle</span>
            <span>Daftarkan Unit Baru</span>
          </button>
        </section>

        <!-- Node List -->
        <div class="bg-[var(--bg-accent)] rounded-[2.5rem] border border-[var(--border-main)] overflow-hidden shadow-2xl">
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.4em] text-[var(--text-muted)] font-black border-b border-[var(--border-main)] bg-[var(--text-main)]/[0.02]">
                            <th class="px-10 py-6">Indikator Unit</th>
                            <th class="px-10 py-6">Lokasi / Relay</th>
                            <th class="px-10 py-6">Tier Aktif</th>
                            <th class="px-10 py-6">Status Arsitektur</th>
                            <th class="px-10 py-6 text-right">Otoritas</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-main)]">
                        ${shops.map(shop => {
                            const plan = plansData.find(p => p.id === shop.plan_id);
                            const statusColor = shop.status === 'active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 
                                               (shop.status === 'trial' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20');
                            return `
                                <tr class="group hover:bg-[var(--text-main)]/[0.02] transition-colors">
                                    <td class="px-10 py-8">
                                        <div class="flex items-center gap-5">
                                            <div class="w-14 h-14 rounded-2xl bg-[var(--text-main)]/5 border border-[var(--border-main)] flex items-center justify-center font-black text-[var(--primary)] font-headline text-2xl group-hover:bg-[var(--primary)]/10 transition-colors">
                                                ${shop.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">${shop.name}</p>
                                                <p class="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1 italic">@${shop.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-10 py-8">
                                        <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase max-w-[200px] truncate">${shop.address || 'Relay Unknown'}</p>
                                    </td>
                                    <td class="px-10 py-8">
                                        <div class="flex items-center gap-2">
                                          <span class="w-2 h-2 rounded-full ${plan ? 'bg-[var(--primary)]' : 'bg-[var(--text-dim)]'}"></span>
                                          <span class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">${plan ? plan.name : 'NO TIER'}</span>
                                        </div>
                                    </td>
                                    <td class="px-10 py-8">
                                        <span class="text-[9px] font-black px-4 py-2 rounded-full border uppercase tracking-widest ${statusColor}">
                                            ${shop.status}
                                        </span>
                                    </td>
                                    <td class="px-10 py-8 text-right">
                                        <div class="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                            <button class="w-10 h-10 rounded-xl bg-[var(--text-main)]/5 border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors store-edit-btn" data-id="${shop.id}">
                                                <span class="material-symbols-outlined text-sm">settings_input_component</span>
                                            </button>
                                            <button class="w-10 h-10 rounded-xl bg-[var(--text-main)]/5 border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-colors store-delete-btn" data-id="${shop.id}">
                                                <span class="material-symbols-outlined text-sm">delete_sweep</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                ${shops.length === 0 ? `<div class="py-20 text-center"><p class="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.5em] italic">No Nodes Detected in Search Perimeter</p></div>` : ''}
            </div>
        </div>
      </div>
    `;

    viewPort.querySelector('#mgr-add-store-btn').onclick = () => renderAddStoreFlow(viewPort);
    viewPort.querySelectorAll('.store-edit-btn').forEach(btn => btn.onclick = () => handleManageShop(btn.dataset.id));
    viewPort.querySelectorAll('.store-delete-btn').forEach(btn => btn.onclick = () => handleDeleteShop(btn.dataset.id));
  }

  function renderTiersView(viewPort) {
    viewPort.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] mb-3 italic">COMMERCIAL ARCHITECTURE</p>
            <h2 class="text-5xl font-extrabold font-headline tracking-tighter text-[var(--text-main)] uppercase italic">Tier Management</h2>
            <p class="text-[var(--text-muted)] mt-2 text-xs font-bold uppercase tracking-widest">Konfigurasi Protokol Layanan dan Skema Harga Global</p>
          </div>
          <button class="px-8 py-5 bg-[var(--text-main)]/5 text-[var(--text-muted)] font-black uppercase tracking-widest rounded-2xl border border-[var(--border-main)] text-[10px] hover:text-[var(--primary)] hover:border-[var(--primary)]/20 transition-all">
            <span class="material-symbols-outlined text-sm inline-block translate-y-0.5 mr-2">add</span> Buat Tier Layanan
          </button>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-10 translate-y-4">
          ${plansData.map(p => `
            <div class="bg-[var(--bg-accent)] p-12 rounded-[3rem] border border-[var(--border-main)] shadow-2xl relative overflow-hidden flex flex-col group transition-all hover:border-[var(--primary)]/20 hover:-translate-y-2 duration-500">
              <div class="absolute -right-12 -top-12 w-40 h-40 bg-[var(--primary)]/5 rounded-full blur-[60px] group-hover:bg-[var(--primary)]/10 transition-all duration-700"></div>
              
              <div class="relative z-10 flex-1">
                <p class="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] mb-4 italic">Platform Relay v4</p>
                <h3 class="text-4xl font-black font-headline text-[var(--text-main)] uppercase tracking-tighter mb-8">${p.name}</h3>
                
                <div class="mb-10 flex items-baseline gap-2">
                  <span class="text-5xl font-black text-[var(--text-main)] font-headline tabular-nums tracking-tighter">Rp ${(p.price/1000).toLocaleString()}k</span>
                  <span class="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest italic">/ monthly</span>
                </div>

                <div class="space-y-4 border-t border-[var(--border-main)] pt-10 mb-12">
                   <div class="flex items-center gap-4 group/item">
                      <div class="w-6 h-6 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                        <span class="material-symbols-outlined text-sm font-black">check_circle</span>
                      </div>
                      <span class="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest group-hover/item:text-[var(--text-main)] transition-colors">Core POS Unlocked</span>
                   </div>
                   <div class="flex items-center gap-4 group/item">
                      <div class="w-6 h-6 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                        <span class="material-symbols-outlined text-sm font-black">check_circle</span>
                      </div>
                      <span class="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest group-hover/item:text-[var(--text-main)] transition-colors">${p.max_barbers ? p.max_barbers + ' Master Barbers' : 'Unlimited Staff Relay'}</span>
                   </div>
                   <div class="flex items-center gap-4 group/item">
                      <div class="w-6 h-6 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                        <span class="material-symbols-outlined text-sm font-black">check_circle</span>
                      </div>
                      <span class="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest group-hover/item:text-[var(--text-main)] transition-colors">Encrypted Data Uplink</span>
                   </div>
                </div>
              </div>

              <div class="relative z-10">
                <button class="w-full py-5 bg-[var(--text-main)]/5 rounded-[1.5rem] text-[10px] font-black text-[var(--text-muted)] hover:text-black hover:gold-gradient hover:shadow-xl transition-all duration-300 uppercase tracking-[0.3em] border border-[var(--border-main)] italic tier-edit-btn" data-id="${p.id}">
                  Matriks Arsitektur
                </button>
              </div>
            </div>
          `).join('')}
        </section>
      </div>
    `;

    viewPort.querySelectorAll('.tier-edit-btn').forEach(btn => btn.onclick = () => handleEditPlan(btn.dataset.id));
  }

  function renderSettingsView(viewPort) {
    const isMaintenance = localStorage.getItem('master_maintenance') === 'true';
    const isAiEnabled = localStorage.getItem('master_ai_module') === 'true';

    viewPort.innerHTML = `
      <div class="w-full max-w-4xl space-y-12 fade-in">
        <section>
          <p class="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-3 italic">PLATFORM PROTOCOL V3.0</p>
          <h2 class="text-5xl font-extrabold font-headline tracking-tighter text-white uppercase italic">System Configuration</h2>
          <p class="text-gray-500 mt-2 text-xs font-bold uppercase tracking-widest">Parameter Global, Keamanan Arsitektur, dan Modul Aktif</p>
        </section>

        <section class="space-y-8">
          <!-- Identity Card -->
          <div class="bg-[#1C1B1B] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-10">
             <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                   <span class="material-symbols-outlined text-3xl">settings_suggest</span>
                </div>
                <div>
                   <h4 class="text-2xl font-black text-white uppercase tracking-tighter">Platform Meta Identity</h4>
                   <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic mt-1">Core Branding & Support Layers</p>
                </div>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div class="space-y-4">
                   <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Platform Global Name</label>
                   <input class="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-xs font-bold text-white focus:ring-1 focus:ring-primary/40 transition-all outline-none" type="text" value="BarberPro Enterprise Master" />
                </div>
                <div class="space-y-4">
                   <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Master Support Gateway</label>
                   <input class="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-xs font-bold text-white focus:ring-1 focus:ring-primary/40 transition-all outline-none" type="email" value="architect@barberpro.io" />
                </div>
             </div>
          </div>

          <!-- Kill Switches -->
          <div class="bg-[#1C1B1B] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-10">
             <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-inner">
                   <span class="material-symbols-outlined text-3xl">security</span>
                </div>
                <div>
                   <h4 class="text-2xl font-black text-white uppercase tracking-tighter">System Kill Switches</h4>
                   <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic mt-1">Emergency Protocols & AI Modules</p>
                </div>
             </div>

             <div class="space-y-4">
                <div class="flex items-center justify-between p-8 bg-black/20 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                   <div class="flex items-center gap-5">
                      <div class="w-12 h-12 bg-rose-500/5 rounded-2xl flex items-center justify-center text-rose-500">
                        <span class="material-symbols-outlined">power_settings_new</span>
                      </div>
                      <div>
                         <h5 class="text-sm font-black text-white uppercase tracking-tight">Maintenance Protocol</h5>
                         <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Mengunci akses seluruh unit bisnis (Offline Mode).</p>
                      </div>
                   </div>
                   <button onclick="toggleMaintenance()" class="w-14 h-8 transition-all relative rounded-full ${isMaintenance ? 'bg-primary shadow-[0_0_15px_rgba(246,202,34,0.3)]' : 'bg-gray-800'}">
                      <div class="absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isMaintenance ? 'left-7' : 'left-1 shadow-inner'}"></div>
                   </button>
                </div>

                <div class="flex items-center justify-between p-8 bg-black/20 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                   <div class="flex items-center gap-5">
                      <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined">psychology</span>
                      </div>
                      <div>
                         <h5 class="text-sm font-black text-white uppercase tracking-tight">AI Analytical Engine</h5>
                         <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Izinkan enkripsi data untuk analisis AI prediktif.</p>
                      </div>
                   </div>
                   <button onclick="toggleAi()" class="w-14 h-8 transition-all relative rounded-full ${isAiEnabled ? 'bg-primary shadow-[0_0_15px_rgba(246,202,34,0.3)]' : 'bg-gray-800'}">
                      <div class="absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isAiEnabled ? 'left-7' : 'left-1 shadow-inner'}"></div>
                   </button>
                </div>
             </div>
          </div>

          <div class="flex justify-end gap-6 pt-6">
             <button class="px-12 py-5 gold-gradient text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xs italic">
                Otorisasi Arsitektur Sistem
             </button>
          </div>
        </section>
      </div>
    `;

    window.toggleMaintenance = () => {
      const current = localStorage.getItem('master_maintenance') === 'true';
      localStorage.setItem('master_maintenance', !current);
      showToast(`Maintenance Mode: ${!current ? 'ACTIVATED' : 'DEACTIVATED'}`, 'info');
      renderSettingsView(viewPort);
    };

    window.toggleAi = () => {
      const current = localStorage.getItem('master_ai_module') === 'true';
      localStorage.setItem('master_ai_module', !current);
      showToast(`AI Engine Module: ${!current ? 'ENABLED' : 'DISABLED'}`, 'info');
      renderSettingsView(viewPort);
    };
  }

  // --- MODALS & FLOWS ---

  async function handleEditPlan(id) {
    const plan = plansData.find(p => p.id === id);
    if (!plan) return;

    const featureTaxonomy = {
      'PONDASI LAYANAN (LITE)': ['dashboard', 'appointments', 'customers', 'services', 'portal'],
      'ARSITEKTUR OPERASIONAL (PRO)': ['queue', 'barbers', 'attendance', 'pos', 'payments', 'promos', 'reports', 'expenses'],
      'EKSPANSI EKOSISTEM (ULTIMATE)': ['inventory', 'memberships', 'gallery', 'logbook']
    };

    const body = `
      <div class="space-y-8 text-white p-4 custom-scrollbar max-h-[70vh] overflow-y-auto">
         <div class="flex justify-between items-center mb-4 sticky top-0 bg-[#1C1B1B] py-4 z-10 border-b border-white/5">
            <div>
              <p class="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-1 italic">Matrix Configuration</p>
              <h4 class="text-2xl font-black text-white uppercase tracking-tighter">${plan.name} Tier</h4>
            </div>
            <div class="flex gap-2">
               <button class="preset-btn px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black hover:text-primary border border-white/5" data-preset="LITE">LITE</button>
               <button class="preset-btn px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black hover:text-primary border border-white/5" data-preset="PRO">PRO</button>
               <button class="preset-btn px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black hover:text-primary border border-white/5" data-preset="ULTIMATE">ULTIMATE</button>
            </div>
         </div>

         <div class="space-y-10">
            ${Object.entries(featureTaxonomy).map(([cat, fids]) => `
               <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">${cat}</p>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                     ${fids.map(fid => `
                        <label class="flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.08] transition-all group">
                           <div class="flex items-center gap-4">
                              <div class="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                                <span class="material-symbols-outlined text-sm">bolt</span>
                              </div>
                              <span class="text-[10px] font-black uppercase tracking-widest text-gray-300">${fid.replace(/-/g, ' ')}</span>
                           </div>
                           <input type="checkbox" name="features" value="${fid}" ${plan.features?.includes(fid) ? 'checked' : ''} class="w-5 h-5 rounded-lg border-none bg-black text-primary focus:ring-1 focus:ring-primary/40 pointer-events-none" />
                        </label>
                     `).join('')}
                  </div>
               </div>
            `).join('')}
         </div>

         <div class="sticky bottom-0 bg-[#1C1B1B] pt-8 pb-4 border-t border-white/5">
            <button id="save-plan-btn" class="w-full py-5 gold-gradient text-black font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs italic">
                Sinkronisasi Arsitektur Tier
            </button>
         </div>
      </div>
    `;

    openModal(`Optimasi Paket: ${plan.name}`, body, '', { maxWidth: '720px' });

    // Preset Logic
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = () => {
        const preset = btn.dataset.preset;
        const toCheck = [];
        toCheck.push(...featureTaxonomy['PONDASI LAYANAN (LITE)']);
        if (preset === 'PRO' || preset === 'ULTIMATE') toCheck.push(...featureTaxonomy['ARSITEKTUR OPERASIONAL (PRO)']);
        if (preset === 'ULTIMATE') toCheck.push(...featureTaxonomy['EKSPANSI EKOSISTEM (ULTIMATE)']);
        
        document.querySelectorAll('input[name="features"]').forEach(cb => cb.checked = toCheck.includes(cb.value));
        showToast(`Preset Arsitektur ${preset} Diaplikasikan`, 'info');
      };
    });

    document.querySelector('#save-plan-btn').onclick = async () => {
      const selected = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(i => i.value);
      const { error } = await supabase.from('subscription_plans').update({ features: selected }).eq('id', id);
      if (!error) {
        showToast('Arsitektur Tier Berhasil Diperbarui', 'success');
        closeModal();
        loadMasterData();
      }
    };
  }

  async function handleManageShop(shopId) {
    const shop = shopsData.find(s => s.id === shopId);
    if (!shop) return;

    const body = `
      <div class="space-y-8 text-white p-2">
         <div class="flex items-center gap-5 mb-8">
            <div class="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary font-headline text-3xl">
                ${shop.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h4 class="text-2xl font-black text-white uppercase tracking-tighter">${shop.name}</h4>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic mt-1">Operational Protocol Control</p>
            </div>
         </div>

         <div class="space-y-6">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status Operasional Unit</label>
              <select id="edit-shop-status" class="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-xs font-black text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all">
                <option value="trial" ${shop.status === 'trial' ? 'selected' : ''}>TRIAL MODE (UNPAID)</option>
                <option value="active" ${shop.status === 'active' ? 'selected' : ''}>ACTIVE PROTOCOL (SINKRON)</option>
                <option value="expired" ${shop.status === 'expired' ? 'selected' : ''}>EXPIRED / TERMINATED</option>
                <option value="deactivated" ${shop.status === 'deactivated' ? 'selected' : ''}>UNIT SUSPENDED</option>
              </select>
            </div>

            <div class="space-y-3">
              <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Penugasan Tier Arsitektur</label>
              <select id="edit-shop-plan" class="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-xs font-black text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all">
                <option value="">DECOUPLED (MODUL PASIF)</option>
                ${plansData.map(p => `<option value="${p.id}" ${shop.plan_id === p.id ? 'selected' : ''}>${p.name.toUpperCase()} (Rp ${p.price.toLocaleString()})</option>`).join('')}
              </select>
            </div>
         </div>

         <div class="pt-8 bg-[#1C1B1B] border-t border-white/5">
            <button id="update-node-btn" class="w-full py-5 gold-gradient text-black font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs italic">
                Otorisasi Perubahan Unit
            </button>
         </div>
      </div>
    `;

    openModal(`Kontrol Node: ${shop.name}`, body, '', { maxWidth: '480px' });

    document.querySelector('#update-node-btn').onclick = async () => {
      const status = document.getElementById('edit-shop-status').value;
      const planId = document.getElementById('edit-shop-plan').value || null;
      
      const { error } = await supabase.from('shops').update({ status, plan_id: planId }).eq('id', shopId);
      
      if (!error) {
        // Record billing history if activated
        if (status === 'active' && planId) {
          const plan = plansData.find(p => p.id === planId);
          await supabase.from('subscription_history').insert([{
            shop_id: shopId,
            plan_id: planId,
            amount: plan?.price || 0,
            status: 'paid',
            payment_method: 'admin_manual',
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }]);
        }
        showToast('Node Berhasil Diperbarui & Sinkronisasi Selesai', 'success');
        closeModal();
        loadMasterData();
      }
    };
  }

  function renderAddStoreFlow(viewPort) {
    let step = 1;
    let selectedTier = '';
    let payload = { name: '', address: '', phone: '', category: 'Premium Barber' };

    function render() {
      if (step === 1) {
        viewPort.innerHTML = `
          <div class="max-w-2xl mx-auto space-y-12 fade-in">
             <section class="flex justify-between items-end border-b border-[var(--border-main)] pb-8">
                <div>
                  <p class="text-[10px] font-black text-[var(--primary)] tracking-[0.5em] uppercase italic mb-3">OTORISASI LANGKAH 01 / 02</p>
                  <h2 class="text-5xl font-black text-[var(--text-main)] uppercase italic tracking-tighter">Identitas Unit</h2>
                </div>
                <div class="w-32 h-2 bg-[var(--border-main)] rounded-full overflow-hidden">
                  <div class="h-full bg-[var(--primary)]" style="width: 50%"></div>
                </div>
             </section>

             <div class="space-y-8 bg-[var(--bg-accent)] p-12 rounded-[3rem] border border-[var(--border-main)] shadow-2xl">
                <div class="space-y-3">
                   <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Nama Toko / Bisnis</label>
                   <input id="in-name" class="w-full bg-black/40 border border-[var(--border-main)] rounded-2xl py-5 px-8 text-sm font-bold text-[var(--text-main)] focus:ring-1 focus:ring-[var(--primary)]/40 outline-none transition-all" value="${payload.name}" placeholder="Contoh: Atelier Senopati Exclusive" />
                </div>
                <div class="space-y-3">
                   <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Relay / Alamat Lengkap Operasional</label>
                   <textarea id="in-address" class="w-full bg-black/40 border border-[var(--border-main)] rounded-2xl py-5 px-8 text-sm font-bold text-[var(--text-main)] focus:ring-1 focus:ring-[var(--primary)]/40 outline-none transition-all" rows="3">${payload.address}</textarea>
                </div>
                <div class="flex justify-between items-center pt-8">
                   <button id="cancel-flow" class="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-[0.3em] transition-colors italic">Batalkan Proses</button>
                   <button id="next-to-step2" class="px-10 py-5 gold-gradient text-black font-black uppercase text-[11px] rounded-[1.5rem] shadow-2xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all">Langkah Arsitektur <span class="material-symbols-outlined text-sm inline-block translate-y-0.5 ml-1">arrow_forward</span></button>
                </div>
             </div>
          </div>
        `;
        viewPort.querySelector('#next-to-step2').onclick = () => {
          payload.name = document.getElementById('in-name').value;
          payload.address = document.getElementById('in-address').value;
          if (!payload.name) return showToast('Nama Unit Diperlukan', 'warning');
          step = 2; render();
        };
        viewPort.querySelector('#cancel-flow').onclick = () => loadMasterData();
      } else {
        viewPort.innerHTML = `
          <div class="max-w-4xl mx-auto space-y-12 fade-in">
             <section class="flex justify-between items-end border-b border-[var(--border-main)] pb-8">
                <div>
                  <p class="text-[10px] font-black text-[var(--primary)] tracking-[0.5em] uppercase italic mb-3">OTORISASI LANGKAH 02 / 02</p>
                  <h2 class="text-5xl font-black text-[var(--text-main)] uppercase italic tracking-tighter">Pemilihan Tier</h2>
                </div>
                <div class="w-32 h-2 bg-[var(--border-main)] rounded-full overflow-hidden">
                  <div class="h-full bg-[var(--primary)]" style="width: 100%"></div>
                </div>
             </section>

             <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${plansData.map(p => `
                   <button class="plan-select-card p-10 bg-[var(--bg-accent)] rounded-[2.5rem] border-2 ${selectedTier === p.id ? 'border-[var(--primary)] shadow-2xl shadow-[var(--primary)]/10 scale-[1.02]' : 'border-[var(--border-main)]'} hover:border-[var(--primary)]/40 transition-all text-left flex flex-col justify-between group h-full shadow-xl" data-id="${p.id}">
                      <div>
                        <p class="text-[9px] font-black text-[var(--primary)] uppercase mb-3 tracking-[0.3em] italic">Service Level</p>
                        <h4 class="text-3xl font-black font-headline text-[var(--text-main)] uppercase tracking-tighter mb-4">${p.name}</h4>
                        <p class="text-2xl font-black text-[var(--text-main)]/50 mb-8 tabular-nums tracking-tighter">Rp ${(p.price/1000).toLocaleString()}k <span class="text-[9px] uppercase tracking-widest font-black">/ mo</span></p>
                      </div>
                      <div class="pt-8 border-t border-[var(--border-main)] w-full">
                        <p class="text-[10px] font-black ${selectedTier === p.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'} uppercase tracking-widest group-hover:text-[var(--primary)] transition-colors">${selectedTier === p.id ? 'TEKNOLOGI TERPILIH' : 'Pilih Arsitektur Ini'}</p>
                      </div>
                   </button>
                `).join('')}
             </div>

             <div class="flex justify-between items-center pt-12 border-t border-[var(--border-main)]">
                <button id="back-to-step1" class="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-[0.3em] flex items-center gap-2 italic">
                  <span class="material-symbols-outlined text-sm">arrow_back</span> Kembali Ke Identitas
                </button>
                ${selectedTier ? `
                  <button id="final-deploy" class="px-12 py-6 gold-gradient text-black font-black uppercase text-[12px] rounded-[1.5rem] shadow-2xl shadow-[var(--primary)]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                    <span>DEPLOY UNIT SEKARANG</span>
                    <span class="material-symbols-outlined font-black">rocket_launch</span>
                  </button>
                ` : ''}
             </div>
          </div>
        `;

        viewPort.querySelector('#back-to-step1').onclick = () => { step = 1; render(); };
        
        viewPort.querySelectorAll('.plan-select-card').forEach(btn => btn.onclick = () => {
          selectedTier = btn.dataset.id;
          render();
        });

        if (viewPort.querySelector('#final-deploy')) {
          viewPort.querySelector('#final-deploy').onclick = async () => {
            const btn = viewPort.querySelector('#final-deploy');
            btn.innerHTML = `<span class="material-symbols-outlined animate-spin font-black">sync</span> <span>PENDING...</span>`;
            btn.disabled = true;
            
            try {
              const { data: ud } = await supabase.auth.getUser();
              const slug = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
              
              const { data: newShop, error } = await supabase.from('shops').insert([{
                name: payload.name, slug, address: payload.address, plan_id: selectedTier, status: 'active', category: payload.category, owner_id: ud.user?.id
              }]).select().single();
              
              if (error) throw error;
              
              const plan = plansData.find(x => x.id === selectedTier);
              await supabase.from('subscription_history').insert([{
                shop_id: newShop.id, plan_id: selectedTier, amount: plan?.price || 0, status: 'paid', end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString()
              }]);
              
              showToast('Ecosystem Unit Registered Successfully', 'success');
              activeTab = 'stores';
              loadMasterData();
            } catch (err) {
              showToast('Deployment Failed: ' + err.message, 'danger');
              render();
            }
          };
        }
      }
    }
    render();
  }

  function renderSettingsView(viewPort) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    viewPort.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em] mb-3 italic">SYSTEM CONFIG</p>
            <h2 class="text-5xl font-extrabold font-headline tracking-tighter text-[var(--text-main)] uppercase italic">Global Parameters</h2>
          </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <!-- Tier Management -->
            <div class="bg-[var(--bg-secondary)] p-12 rounded-[3.5rem] border border-[var(--border-main)] shadow-abyss space-y-10">
                <div class="flex justify-between items-center">
                    <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic">Manage Tiers</h4>
                    <span class="material-symbols-outlined text-[var(--text-muted)]">tune</span>
                </div>
                <div class="space-y-4">
                    ${plansData.map(p => `
                        <div class="flex justify-between items-center p-6 bg-black/20 rounded-2xl border border-[var(--border-main)] group hover:border-[var(--primary)]/30 transition-all">
                            <div>
                                <p class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">${p.name}</p>
                                <p class="text-[8px] text-[var(--text-muted)] font-bold uppercase mt-1 italic">Rp ${p.price.toLocaleString()}</p>
                            </div>
                            <button class="edit-tier-btn px-4 py-2 text-[8px] font-black border border-[var(--border-main)] rounded-lg uppercase tracking-widest hover:bg-[var(--primary)] hover:text-black transition-all" data-id="${p.id}">Edit</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Appearance -->
            <div class="bg-[var(--bg-secondary)] p-12 rounded-[3.5rem] border border-[var(--border-main)] shadow-abyss space-y-10">
                <div class="flex justify-between items-center">
                    <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.4em] italic">Appearance System</h4>
                    <span class="material-symbols-outlined text-[var(--text-muted)]">palette</span>
                </div>
                <div class="flex items-center justify-between p-8 bg-black/20 rounded-3xl border border-[var(--border-main)]">
                    <div>
                        <p class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Global Theme Toggle</p>
                        <p class="text-[8px] text-[var(--text-muted)] font-bold uppercase mt-1">Switch between Atelier Dark/Light</p>
                    </div>
                    <button id="theme-toggle-btn" class="w-14 h-8 bg-[var(--border-main)] rounded-full relative p-1 group">
                        <div class="w-6 h-6 bg-[var(--primary)] rounded-full transition-all duration-500 shadow-xl ${currentTheme === 'light' ? 'translate-x-6' : ''}"></div>
                    </button>
                </div>
            </div>
        </div>
      </div>
    `;

    viewPort.querySelector('#theme-toggle-btn').onclick = () => {
        const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('master-admin-theme', nextTheme);
        renderSettingsView(viewPort); // re-render to update toggle state
    };

    viewPort.querySelectorAll('.edit-tier-btn').forEach(btn => btn.onclick = () => handleEditPlan(btn.dataset.id));
  }

  function setupNotifications() {
      notificationCount = historyData.filter(h => h.status === 'pending').length;
  }

  function initTheme() {
    const saved = localStorage.getItem('master-admin-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }

  async function handleDeleteShop(id) {
    if (!confirm('PERINGATAN: Otorisasi penghapusan unit secara permanen? Data arsitektur unit akan hilang dari registry.')) return;
    const { error } = await supabase.from('shops').delete().eq('id', id);
    if (!error) {
      showToast('Node Registry Purged Successfully', 'success');
      loadMasterData();
    }
  }

  // Final Initialization
  initTheme();
  setupNotifications();
  renderLayout();
  loadMasterData();
}
