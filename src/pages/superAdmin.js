import { supabase } from '../utils/supabaseClient.js';
import { storage } from '../utils/storage.js';
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

  let isSidebarOpen = true;
  let isReportMenuOpen = false;

  // Theme Initializer - SuperCore v1
  function initTheme() {
    const globalSidebar = document.getElementById('sidebar');
    if (globalSidebar) globalSidebar.style.display = 'none';
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.padding = '0';
      mainContent.style.width = '100vw';
    }

    document.body.className = 'bg-slate-50 font-sans text-slate-900 overflow-hidden';
  }

  // Layout Engine
  function renderLayout() {
    container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        :root {
          --primary: #2563eb;
          --primary-hover: #1d4ed8;
          --bg-sidebar: #0f172a;
        }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .sidebar-transition { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .glass-header { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(8px); border-bottom: 1px solid #e2e8f0; }
        .nav-item-active { background: #2563eb; color: white; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
        .nav-item-hover:hover { background: rgba(30, 41, 59, 0.5); color: white; margin-left: 4px; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      </style>

      <div class="flex h-screen bg-slate-50 overflow-hidden">
        <!-- Sidebar -->
        <aside id="master-sidebar" class="fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white sidebar-transition ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0'}">
          <div class="flex items-center justify-between px-6 py-5 shrink-0">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-900/20">
                <i data-lucide="shield-check" class="text-white"></i>
              </div>
              <span class="text-xl font-bold tracking-tight whitespace-nowrap">SuperCore</span>
            </div>
            <button id="close-sidebar-btn" class="rounded-lg p-1 hover:bg-slate-800 lg:hidden"><i data-lucide="x" size="20"></i></button>
          </div>

          <nav class="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
            ${renderNavItem('dashboard', 'activity', 'Dashboard')}
            ${renderNavItem('stores', 'store', 'Manajemen Unit')}
            ${renderNavItem('tiers', 'layout-grid', 'Tier Management')}

            <div>
              <button id="reports-menu-toggle" class="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 group ${activeTab.startsWith('report') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}">
                <i data-lucide="file-text"></i>
                <span class="font-bold tracking-wide text-sm">Laporan</span>
                <i data-lucide="chevron-down" class="ml-auto transition-transform ${isReportMenuOpen ? 'rotate-180' : ''}" size="16"></i>
              </button>
              
              <div id="reports-submenu" class="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-4 transition-all ${isReportMenuOpen ? '' : 'hidden'}">
                <button data-tab="report-purchase" class="report-sub-link flex w-full py-2 text-sm font-medium transition-colors ${activeTab === 'report-purchase' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}">Pembelian Aplikasi</button>
                <button data-tab="report-subscription" class="report-sub-link flex w-full py-2 text-sm font-medium transition-colors ${activeTab === 'report-subscription' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}">Berlangganan</button>
              </div>
            </div>

            ${renderNavItem('settings', 'settings', 'Konfigurasi')}
          </nav>

          <div class="border-t border-slate-800 p-4 shrink-0">
            <button id="master-logout-btn" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <i data-lucide="log-out"></i>
              <span class="whitespace-nowrap font-bold text-sm">Keluar Sistem</span>
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header class="flex h-16 items-center justify-between glass-header px-6 shrink-0">
            <div class="flex items-center gap-4">
              <button id="toggle-sidebar-btn" class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors">
                <i data-lucide="${isSidebarOpen ? 'panel-left-close' : 'panel-left-open'}" size="22"></i>
              </button>
              <div class="hidden items-center gap-2 text-sm font-black text-slate-500 md:flex">
                <span class="capitalize tracking-wider">${activeTab.replace('-', ' ')}</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="relative hidden sm:block">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size="18"></i>
                <input id="master-search-input" type="text" placeholder="Cari data..." class="h-10 w-48 rounded-full bg-slate-100 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all focus:w-64" value="${searchTerm}">
              </div>
              <button id="master-notif-btn" class="relative rounded-full p-2 hover:bg-slate-100 transition-colors">
                <i data-lucide="bell" size="20" class="text-slate-600"></i>
                <span class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white ${notificationCount > 0 ? '' : 'hidden'}">${notificationCount}</span>
              </button>
              <div class="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-blue-100 shadow-sm ring-1 ring-slate-200">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Avatar" />
              </div>
            </div>
          </header>

          <div id="master-view-container" class="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <!-- View Content Injected Here -->
          </div>
        </main>
      </div>
    `;

    // Initialize Lucide Icons
    if (window.lucide) window.lucide.createIcons();

    // Event Listeners
    container.querySelectorAll('.nav-item').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        renderLayout();
        loadMasterData();
      };
    });

    container.querySelectorAll('.report-sub-link').forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.dataset.tab;
        renderLayout();
        loadMasterData();
      };
    });

    container.querySelector('#reports-menu-toggle').onclick = () => {
      isReportMenuOpen = !isReportMenuOpen;
      renderLayout();
      loadMasterData();
    };

    container.querySelector('#toggle-sidebar-btn').onclick = () => {
      isSidebarOpen = !isSidebarOpen;
      renderLayout();
      loadMasterData();
    };

    container.querySelector('#master-logout-btn').onclick = async () => {
      await storage.logout();
    };

    container.querySelector('#master-search-input').oninput = (e) => {
      searchTerm = e.target.value;
      loadMasterData();
    };

    container.querySelector('#master-search-input').onfocus = () => {
      container.querySelector('#master-search-input').classList.add('w-64');
    };

    container.querySelector('#master-notif-btn').onclick = () => {
      notificationCount = 0;
      renderLayout();
      loadMasterData();
    };
  }

  function renderNavItem(tab, icon, label) {
    const active = activeTab === tab;
    return `
      <button data-tab="${tab}" class="nav-item flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 group ${active ? 'nav-item-active' : 'text-slate-400 nav-item-hover hover:text-white'}">
        <i data-lucide="${icon}" class="${active ? '' : 'group-hover:scale-110'}"></i>
        <span class="font-bold tracking-wide text-sm whitespace-nowrap">${label}</span>
      </button>
    `;
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
    const performance = activeShops > 0 ? '+12%' : '0%';
    const mrr = globalRevenue; // Simplified MRR

    // Mock Chart Data for visualization
    const chartData = [
      { month: 'Jan', value: 45 },
      { month: 'Feb', value: 52 },
      { month: 'Mar', value: 38 },
      { month: 'Apr', value: 65 },
      { month: 'Mei', value: 48 },
      { month: 'Jun', value: 72 },
    ];

    viewPort.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-8 fade-in">
        <!-- Header & Quick Action -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang, Master</h1>
            <p class="text-slate-500 font-medium">Ringkasan performa sistem global Anda hari ini.</p>
          </div>
          <div class="flex gap-2">
             <button id="add-store-quick-btn" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
              <i data-lucide="plus" size="20"></i> Tambah Toko Baru
            </button>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
              <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl"><i data-lucide="store" size="24"></i></div>
              <div class="flex items-center gap-1 text-green-600 text-xs font-bold"><i data-lucide="trending-up" size="14"></i> ${performance}</div>
            </div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Toko Terdaftar</p>
            <p class="text-3xl font-black mt-1">${shopsData.length}</p>
          </div>

          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
              <div class="p-3 bg-green-50 text-green-600 rounded-2xl"><i data-lucide="credit-card" size="24"></i></div>
              <div class="flex items-center gap-1 text-green-600 text-xs font-bold"><i data-lucide="trending-up" size="14"></i> 8.4%</div>
            </div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Pendapatan Global</p>
            <p class="text-2xl font-black mt-2 tracking-tighter">Rp ${mrr.toLocaleString()}</p>
          </div>

          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
              <div class="p-3 bg-yellow-50 text-yellow-600 rounded-2xl"><i data-lucide="shield-check" size="24"></i></div>
              <div class="flex items-center gap-1 text-slate-400 text-xs font-bold">Stable</div>
            </div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Node Aktif</p>
            <p class="text-3xl font-black mt-1">${activeShops}</p>
          </div>

          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
              <div class="p-3 bg-red-50 text-red-600 rounded-2xl"><i data-lucide="alert-triangle" size="24"></i></div>
              <div class="flex items-center gap-1 text-red-600 text-xs font-bold"><i data-lucide="trending-down" size="14"></i> 0</div>
            </div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Anomali Terdeteksi</p>
            <p class="text-3xl font-black mt-1">0</p>
          </div>
        </div>

        <!-- Data Visual & Health Section -->
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h3 class="text-xl font-bold text-slate-900">Pertumbuhan Arsitektur</h3>
                <p class="text-slate-400 text-sm">Simulasi skalabilitas 6 bulan terakhir</p>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2"><div class="h-3 w-3 bg-blue-500 rounded-full"></div><span class="text-xs font-bold text-slate-500">Revenue</span></div>
              </div>
            </div>
            
            <div class="flex items-end justify-between h-48 gap-4 px-2">
              ${chartData.map(d => `
                <div class="flex-1 flex flex-col items-center gap-3 group h-full">
                  <div class="w-full bg-slate-50 rounded-xl relative overflow-hidden h-full flex items-end">
                     <div class="w-full bg-blue-500 group-hover:bg-blue-600 transition-all duration-500 rounded-t-lg" style="height: ${d.value}%"></div>
                  </div>
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">${d.month}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="space-y-6">
            <!-- System Health -->
            <div class="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20">
              <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
                 <i data-lucide="activity" size="20" class="text-blue-400"></i> Status Arsitektur
              </h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3"><i data-lucide="server" size="16" class="text-slate-400"></i><span class="text-xs font-medium">Relay Matrix</span></div>
                  <span class="text-[10px] font-black uppercase text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Online</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3"><i data-lucide="globe" size="16" class="text-slate-400"></i><span class="text-xs font-medium">Global Uplink</span></div>
                  <span class="text-[10px] font-black uppercase text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Stable</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3"><i data-lucide="cpu" size="16" class="text-slate-400"></i><span class="text-xs font-medium">DB Load</span></div>
                  <span class="text-[10px] font-black uppercase text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">7%</span>
                </div>
              </div>
            </div>

            <!-- Top Tier -->
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Paket Dominan</h3>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">P</div>
                <div>
                  <p class="font-black text-slate-900">Premium Plan</p>
                  <p class="text-xs text-slate-400 font-medium">${activeShops} Nodes Terhubung</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Registrations -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b flex justify-between items-center">
             <h3 class="text-lg font-bold">Registrasi Unit Terbaru</h3>
             <button id="view-all-stores-btn" class="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
              Semua Toko <i data-lucide="arrow-up-right" size="14"></i>
             </button>
          </div>
          <div class="overflow-x-auto">
             <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th class="px-6 py-4">Toko</th>
                  <th class="px-6 py-4">Status Relay</th>
                  <th class="px-6 py-4">Tgl Gabung</th>
                  <th class="px-6 py-4 text-right">Otoritas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${shopsData.slice(0, 5).map(s => `
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-900 uppercase tracking-tight">${s.name}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center gap-1.5 text-[11px] font-bold ${s.status === 'active' ? 'text-green-600' : 'text-amber-500'}">
                        <div class="h-1.5 w-1.5 ${s.status === 'active' ? 'bg-green-500' : 'bg-amber-500'} rounded-full"></div> ${s.status.toUpperCase()}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-slate-500 font-medium tracking-tighter italic">${new Date(s.created_at).toLocaleDateString()}</td>
                    <td class="px-6 py-4 text-right">
                       <button class="p-2 text-slate-400 hover:text-blue-600 transition-colors quick-edit-shop" data-id="${s.id}"><i data-lucide="chevron-right"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
             </table>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    viewPort.querySelector('#add-store-quick-btn').onclick = () => {
      activeTab = 'stores';
      renderLayout();
      renderAddStoreFlow(viewPort);
    };

    viewPort.querySelector('#view-all-stores-btn').onclick = () => {
      activeTab = 'stores';
      renderLayout();
      loadMasterData();
    };

    viewPort.querySelectorAll('.quick-edit-shop').forEach(btn => {
      btn.onclick = () => handleManageShop(btn.dataset.id);
    });
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
      <div class="max-w-7xl mx-auto space-y-6 fade-in">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-black tracking-tight tracking-tight">Manajemen Unit Bisnis</h1>
            <p class="text-slate-500 text-sm font-medium">Otorisasi dan pengendalian node mitra global.</p>
          </div>
          <button id="mgr-add-store-btn" class="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
            <i data-lucide="plus" size={18}></i> Daftarkan Toko Baru
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
           <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="px-6 py-4">Informasi Unit</th>
                    <th class="px-6 py-4">Kontak & Admin</th>
                    <th class="px-6 py-4">Protokol Layanan</th>
                    <th class="px-6 py-4">Status Arsitektur</th>
                    <th class="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${shops.map(shop => {
                      const plan = plansData.find(p => p.id === shop.plan_id);
                      const statusColor = shop.status === 'active' ? 'bg-green-500' : 
                                         (shop.status === 'trial' ? 'bg-amber-500' : 'bg-red-400');
                      return `
                        <tr class="hover:bg-slate-50/50 transition-colors group">
                          <td class="px-6 py-4">
                            <div class="font-black text-slate-900 uppercase tracking-tight">${shop.name}</div>
                            <div class="flex items-center gap-1 text-[11px] text-slate-400 font-bold mt-1 line-clamp-1 italic">
                              <i data-lucide="map-pin" size="10"></i> ${shop.address || 'Relay Unknown'}
                            </div>
                          </td>
                          <td class="px-6 py-4">
                             <div class="flex items-center gap-1.5 text-slate-600 font-bold">
                               <i data-lucide="phone" size="12" class="text-slate-400"></i> ${shop.phone || '-'}
                             </div>
                             <div class="flex items-center gap-1.5 text-xs text-blue-600 font-black mt-1">
                               <i data-lucide="user" size="12"></i> @${shop.slug}
                             </div>
                          </td>
                          <td class="px-6 py-4">
                             <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                               shop.plan_id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                             }">
                               ${plan ? plan.name : 'MODUL PASIF'}
                             </span>
                          </td>
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                              <span class="h-2 w-2 rounded-full ${statusColor}"></span>
                              <span class="font-black text-[10px] uppercase tracking-tighter">${shop.status}</span>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-right">
                            <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                               <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors store-edit-btn" data-id="${shop.id}"><i data-lucide="edit" size="16"></i></button>
                               <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors store-delete-btn" data-id="${shop.id}"><i data-lucide="trash-2" size="16"></i></button>
                            </div>
                          </td>
                        </tr>
                      `;
                  }).join('')}
                </tbody>
              </table>
              ${shops.length === 0 ? `<div class="py-20 text-center"><p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">No Nodes Detected</p></div>` : ''}
           </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    viewPort.querySelector('#mgr-add-store-btn').onclick = () => renderAddStoreFlow(viewPort);
    viewPort.querySelectorAll('.store-edit-btn').forEach(btn => btn.onclick = () => handleManageShop(btn.dataset.id));
    viewPort.querySelectorAll('.store-delete-btn').forEach(btn => btn.onclick = () => handleDeleteShop(btn.dataset.id));
  }

  function renderTiersView(viewPort) {
    const serviceColors = {
      'Lite': 'from-orange-400 to-orange-600',
      'Bronze': 'from-orange-400 to-orange-600',
      'Silver': 'from-slate-300 to-slate-500',
      'Gold': 'from-yellow-400 to-yellow-600',
      'Platinum': 'from-blue-400 to-blue-600',
      'Ultimate': 'from-indigo-600 to-purple-700'
    };

    viewPort.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-8 fade-in">
        <h1 class="text-2xl font-black tracking-tight uppercase tracking-[0.2em] italic">Pengaturan Layanan Global</h1>
        <div class="grid gap-8 md:grid-cols-3">
          ${plansData.map((plan) => {
            const color = serviceColors[plan.name] || 'from-blue-600 to-indigo-700';
            return `
              <div class="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
                <div class="h-24 bg-gradient-to-br ${color} p-6 text-white flex items-center justify-between">
                   <h3 class="text-lg font-black uppercase tracking-widest">${plan.name}</h3>
                   <i data-lucide="shield-check" class="opacity-40"></i>
                </div>
                <div class="p-6 flex-1 flex flex-col">
                  <p class="text-3xl font-black mb-6 tracking-tighter tabular-nums">Rp ${(plan.price/1000).toLocaleString('id-ID')}k<span class="text-xs text-slate-400 font-bold tracking-widest uppercase"> / bln</span></p>
                  <div class="space-y-3 mb-8 flex-1">
                    ${(plan.features || []).slice(0, 5).map(f => `
                      <div class="flex items-center gap-2 text-xs text-slate-600 font-black uppercase tracking-tight">
                        <i data-lucide="check-circle-2" size="14" class="text-green-500"></i> ${f.replace(/-/g, ' ')}
                      </div>
                    `).join('')}
                    ${(plan.features || []).length > 5 ? `<p class="text-[10px] text-slate-400 font-bold italic">+ ${(plan.features.length - 5)} Fitur Lainnya</p>` : ''}
                  </div>
                  <button class="w-full py-3 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors tier-edit-btn" data-id="${plan.id}">Edit Konfigurasi</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
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
      <div class="space-y-6 text-slate-900 p-2 custom-scrollbar max-h-[70vh] overflow-y-auto">
         <div class="flex justify-between items-center mb-4 sticky top-0 bg-white py-4 z-10 border-b border-slate-100">
            <div>
              <p class="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] mb-1 italic">Matrix Configuration</p>
              <h4 class="text-2xl font-black text-slate-900 uppercase tracking-tighter">${plan.name} Tier</h4>
            </div>
            <div class="flex gap-2">
               <button class="preset-btn px-3 py-1.5 bg-slate-100 rounded-lg text-[9px] font-black hover:text-blue-600 border border-slate-200" data-preset="LITE">LITE</button>
               <button class="preset-btn px-3 py-1.5 bg-slate-100 rounded-lg text-[9px] font-black hover:text-blue-600 border border-slate-200" data-preset="PRO">PRO</button>
               <button class="preset-btn px-3 py-1.5 bg-slate-100 rounded-lg text-[9px] font-black hover:text-blue-600 border border-slate-200" data-preset="ULTIMATE">ULTIMATE</button>
            </div>
         </div>

         <div class="space-y-8">
            ${Object.entries(featureTaxonomy).map(([cat, fids]) => `
               <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">${cat}</p>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                     ${fids.map(fid => `
                        <label class="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all group">
                           <div class="flex items-center gap-4">
                              <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                <i data-lucide="bolt" size="14"></i>
                              </div>
                              <span class="text-[10px] font-black uppercase tracking-widest text-slate-600">${fid.replace(/-/g, ' ')}</span>
                           </div>
                           <input type="checkbox" name="features" value="${fid}" ${plan.features?.includes(fid) ? 'checked' : ''} class="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-1 focus:ring-blue-500/40 pointer-events-none" />
                        </label>
                     `).join('')}
                  </div>
               </div>
            `).join('')}
         </div>

         <div class="sticky bottom-0 bg-white pt-6 pb-2 border-t border-slate-100">
            <button id="save-plan-btn" class="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all text-xs">
                Sinkronisasi Arsitektur Tier
            </button>
         </div>
      </div>
    `;

    openModal(`Optimasi Paket: ${plan.name}`, body, '', { maxWidth: '720px' });
    if (window.lucide) window.lucide.createIcons();

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
      <div class="space-y-6 text-slate-900 p-2">
         <div class="flex items-center gap-5 mb-8">
            <div class="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-3xl shadow-sm">
                ${shop.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h4 class="text-2xl font-black text-slate-900 uppercase tracking-tighter">${shop.name}</h4>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic mt-1">Operational Protocol Control</p>
            </div>
         </div>

         <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Operasional Unit</label>
              <select id="edit-shop-status" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-xs font-black text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all">
                <option value="trial" ${shop.status === 'trial' ? 'selected' : ''}>TRIAL MODE (UNPAID)</option>
                <option value="active" ${shop.status === 'active' ? 'selected' : ''}>ACTIVE PROTOCOL (SINKRON)</option>
                <option value="expired" ${shop.status === 'expired' ? 'selected' : ''}>EXPIRED / TERMINATED</option>
                <option value="deactivated" ${shop.status === 'deactivated' ? 'selected' : ''}>UNIT SUSPENDED</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penugasan Tier Arsitektur</label>
              <select id="edit-shop-plan" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-xs font-black text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all">
                <option value="">DECOUPLED (MODUL PASIF)</option>
                ${plansData.map(p => `<option value="${p.id}" ${shop.plan_id === p.id ? 'selected' : ''}>${p.name.toUpperCase()} (Rp ${p.price.toLocaleString()})</option>`).join('')}
              </select>
            </div>
         </div>

         <div class="pt-8 border-t border-slate-100">
            <button id="update-node-btn" class="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-xs">
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
    let payload = { name: '', address: '', phone: '', email: '', slug: '' };

    function render() {
      if (step === 1) {
        viewPort.innerHTML = `
          <div class="max-w-2xl mx-auto space-y-10 fade-in py-10">
             <div class="text-center space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                  <i data-lucide="shield-check" size="12"></i> Otorisasi Unit Baru
                </div>
                <h2 class="text-4xl font-black text-slate-900 uppercase tracking-tighter">Identitas Arsitektur</h2>
                <div class="flex justify-center gap-2 mt-4">
                  <div class="h-1.5 w-12 bg-blue-600 rounded-full"></div>
                  <div class="h-1.5 w-12 bg-slate-200 rounded-full"></div>
                </div>
             </div>

             <div class="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Toko / Bisnis</label>
                   <input id="in-name" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all" value="${payload.name}" placeholder="Contoh: BarberPro Senopati" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                   <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Slug</label>
                      <input id="in-slug" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all" value="${payload.slug}" placeholder="senopati-01" />
                   </div>
                   <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telepon</label>
                      <input id="in-phone" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all" value="${payload.phone}" placeholder="0821..." />
                   </div>
                </div>
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relay / Alamat Lengkap</label>
                   <textarea id="in-address" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all" rows="3">${payload.address}</textarea>
                </div>
                <div class="flex justify-between items-center pt-6">
                   <button id="cancel-flow" class="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors font-black">BATALKAN</button>
                   <button id="next-to-step2" class="px-8 py-4 bg-blue-600 text-white font-black uppercase text-[11px] rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                     Selanjutnya <i data-lucide="arrow-right" size="14"></i>
                   </button>
                </div>
             </div>
          </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        viewPort.querySelector('#next-to-step2').onclick = () => {
          payload.name = document.getElementById('in-name').value;
          payload.address = document.getElementById('in-address').value;
          payload.phone = document.getElementById('in-phone').value;
          payload.slug = document.getElementById('in-slug').value;
          if (!payload.name || !payload.slug) return showToast('Nama dan Slug Diperlukan', 'warning');
          step = 2; render();
        };
        viewPort.querySelector('#cancel-flow').onclick = () => loadMasterData();
      } else {
        viewPort.innerHTML = `
          <div class="max-w-5xl mx-auto space-y-10 fade-in py-10">
             <div class="text-center space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                  <i data-lucide="layout-grid" size="12"></i> Penugasan Protokol
                </div>
                <h2 class="text-4xl font-black text-slate-900 uppercase tracking-tighter">Pilih Tier Layanan</h2>
                <div class="flex justify-center gap-2 mt-4">
                  <div class="h-1.5 w-12 bg-blue-600/30 rounded-full"></div>
                  <div class="h-1.5 w-12 bg-blue-600 rounded-full"></div>
                </div>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${plansData.map(p => `
                   <button class="plan-select-card p-8 bg-white rounded-3xl border-2 ${selectedTier === p.id ? 'border-blue-600 shadow-xl ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200'} transition-all text-left flex flex-col justify-between group h-64" data-id="${p.id}">
                      <div>
                        <div class="flex justify-between items-start mb-4">
                           <p class="text-[9px] font-black text-blue-600 uppercase tracking-widest">Service Level</p>
                           ${selectedTier === p.id ? '<i data-lucide="check-circle-2" class="text-blue-600"></i>' : ''}
                        </div>
                        <h4 class="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">${p.name}</h4>
                        <p class="text-xl font-black text-slate-400 tabular-nums tracking-tighter">Rp ${(p.price/1000).toLocaleString()}k <span class="text-[9px] uppercase tracking-widest font-black">/ bln</span></p>
                      </div>
                      <div class="pt-4 border-t border-slate-50 w-full">
                        <p class="text-[10px] font-black uppercase tracking-widest ${selectedTier === p.id ? 'text-blue-600' : 'text-slate-400'}">
                          ${selectedTier === p.id ? 'TEKNOLOGI TERPILIH' : 'PILIH ARSITEKTUR INI'}
                        </p>
                      </div>
                   </button>
                `).join('')}
             </div>

             <div class="flex justify-between items-center pt-10 border-t border-slate-100">
                <button id="back-to-step1" class="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2 transition-colors font-black">
                  <i data-lucide="arrow-left" size="14"></i> KEMBALI
                </button>
                ${selectedTier ? `
                  <button id="final-deploy" class="px-10 py-5 bg-slate-900 text-white font-black uppercase text-[12px] rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
                    <span>DEPLOY UNIT SEKARANG</span>
                    <i data-lucide="rocket" size="18"></i>
                  </button>
                ` : ''}
             </div>
          </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        viewPort.querySelector('#back-to-step1').onclick = () => { step = 1; render(); };
        
        viewPort.querySelectorAll('.plan-select-card').forEach(btn => btn.onclick = () => {
          selectedTier = btn.dataset.id;
          render();
        });

        if (viewPort.querySelector('#final-deploy')) {
          viewPort.querySelector('#final-deploy').onclick = async () => {
             const btn = viewPort.querySelector('#final-deploy');
             btn.disabled = true;
             btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" size="18"></i> <span>PENDING...</span>`;
             if (window.lucide) window.lucide.createIcons();
             
             const { data: newShop, error: shopError } = await supabase.from('shops').insert([{
               name: payload.name, 
               slug: payload.slug,
               address: payload.address,
               phone: payload.phone,
               status: 'trial',
               plan_id: selectedTier
             }]).select().single();

             if (shopError) {
               showToast(shopError.message, 'error');
               btn.disabled = false;
               btn.innerHTML = `<span>RETRY DEPLOY</span> <i data-lucide="rocket" size="18"></i>`;
               if (window.lucide) window.lucide.createIcons();
               return;
             }

             showToast('Unit Berhasil Dideploy ke Network', 'success');
             loadMasterData();
          };
        }
      }
    }
    render();
  }

  function renderSettingsView(viewPort) {
    viewPort.innerHTML = `
      <div class="max-w-xl mx-auto text-center mt-20 fade-in">
         <div class="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div class="flex justify-center mb-6">
              <div class="p-4 bg-slate-50 rounded-full animate-[spin_10s_linear_infinite]">
                 <i data-lucide="settings" size="48" class="text-slate-300"></i>
              </div>
            </div>
            <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tighter">Pengaturan Arsitektur Master</h2>
            <p class="text-slate-500 mt-2 font-medium">Konfigurasi profil superadmin, integrasi uplink API, dan manajemen log keamanan sistem global.</p>
            <hr class="my-6 border-slate-100"/>
            <div class="space-y-4">
               <button class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all">Update Profil Keamanan</button>
               <button id="theme-toggle-btn" class="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                 <i data-lucide="palette" size="14"></i> Toggle Master Theme
               </button>
            </div>
            <button id="back-to-home-btn" class="mt-8 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Kembali ke Beranda</button>
         </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    
    viewPort.querySelector('#back-to-home-btn').onclick = () => {
      activeTab = 'dashboard';
      renderLayout();
      loadMasterData();
    };

    viewPort.querySelector('#theme-toggle-btn').onclick = () => {
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('master-admin-theme', nextTheme);
      showToast('Master Theme Toggled: ' + nextTheme.toUpperCase(), 'info');
    };
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
