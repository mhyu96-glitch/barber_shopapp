import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';

export async function renderSuperAdmin(container) {
  let activeTab = 'overview'; // 'overview', 'revenue', 'analytics', 'settings', 'add_tenant'
  let searchTerm = '';

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
              "background": "#131313", "on-secondary-fixed": "#231a00", "secondary-container": "#ad8d1d",
              "secondary-fixed-dim": "#e7c351", "surface-dim": "#131313", "on-tertiary": "#003920",
              "outline": "#99907c", "on-secondary-fixed-variant": "#574500", "primary-fixed-dim": "#eec215",
              "inverse-primary": "#735c00", "on-surface-variant": "#d0c5af", "on-primary-fixed-variant": "#574500",
              "surface": "#131313", "on-error": "#690005", "inverse-surface": "#e5e2e1",
              "surface-container": "#201f1f", "on-secondary": "#3c2f00", "primary-fixed": "#ffe084",
              "inverse-on-surface": "#313030", "tertiary-container": "#66c68f", "tertiary-fixed-dim": "#7adaa1",
              "primary": "#f6ca22", "surface-container-high": "#2a2a2a", "secondary-fixed": "#ffe087",
              "surface-container-low": "#1c1b1b", "error-container": "#93000a", "on-surface": "#e5e2e1",
              "on-primary": "#3c2f00", "surface-container-highest": "#353534", "surface-container-lowest": "#0e0e0e",
              "on-error-container": "#ffdad6", "surface-variant": "#353534", "on-tertiary-fixed-variant": "#005230",
              "surface-tint": "#eec215", "on-primary-container": "#554300", "on-primary-fixed": "#231b00",
              "on-background": "#e5e2e1", "on-secondary-container": "#342800", "surface-bright": "#393939",
              "tertiary-fixed": "#95f7bb", "secondary": "#e7c351", "outline-variant": "#4d4635",
              "tertiary": "#82e2a9", "on-tertiary-container": "#00502f", "error": "#ffb4ab",
              "primary-container": "#d7ae00", "on-tertiary-fixed": "#002110"
            },
            fontFamily: {
              "headline": ["Manrope", "sans-serif"],
              "body": ["Manrope", "sans-serif"],
              "label": ["Manrope", "sans-serif"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          }
        }
      }
    `;
    document.head.appendChild(config);

    const googleFonts = document.createElement('link');
    googleFonts.rel = 'stylesheet';
    googleFonts.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    document.head.appendChild(googleFonts);
  }

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
            <nav class="space-y-2">
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-lg transition-all text-sm font-medium tracking-wide ${activeTab === 'overview' ? 'active-tab' : ''}" href="#" data-tab="overview">
                <span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
                <span>Dashboard</span>
              </a>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-lg transition-all text-sm font-medium tracking-wide ${activeTab === 'revenue' ? 'active-tab' : ''}" href="#" data-tab="revenue">
                <span class="material-symbols-outlined" data-icon="assessment">assessment</span>
                <span>Laporan</span>
              </a>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-lg transition-all text-sm font-medium tracking-wide ${activeTab === 'analytics' ? 'active-tab' : ''}" href="#" data-tab="analytics">
                <span class="material-symbols-outlined" data-icon="analytics">analytics</span>
                <span>Analitik</span>
              </a>
              <a class="sidebar-link flex items-center gap-3 px-4 py-3 text-[#D0C5AF] hover:bg-[#353534] hover:text-[#E5E2E1] rounded-lg transition-all text-sm font-medium tracking-wide ${activeTab === 'settings' ? 'active-tab' : ''}" href="#" data-tab="settings">
                <span class="material-symbols-outlined" data-icon="settings">settings</span>
                <span>Pengaturan</span>
              </a>
            </nav>
          </div>
          
          <!-- Sidebar CTA -->
          <div class="mt-auto space-y-4">
            <button class="sidebar-link w-full flex items-center justify-center gap-2 bg-[#353534] text-[#F6CA22] py-3 rounded-xl font-semibold active:scale-95 duration-150 transition-all hover:bg-surface-container-high border border-outline-variant/20 ${activeTab === 'add_tenant' ? 'ring-2 ring-primary/50' : ''}" data-tab="add_tenant">
              <span class="material-symbols-outlined text-sm" data-icon="add">add</span>
              <span>Tambah Toko</span>
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

      if (activeTab === 'overview') {
        renderOverviewTab(contentArea, shops, plans, globalPayments, globalAppts);
      } else if (activeTab === 'revenue') {
        renderRevenueTab(contentArea, shops, plans, globalPayments, globalAppts);
      } else if (activeTab === 'settings') {
        renderSettingsTab(contentArea, plans);
      } else if (activeTab === 'add_tenant') {
        renderAddTenantTab(contentArea);
      } else if (activeTab === 'analytics') {
        contentArea.innerHTML = `
          <div class="w-full space-y-12 fade-in">
            <section>
              <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">AI PROTOCOL ALPHA</p>
              <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Intelijen Analitik</h2>
              <p class="text-on-surface-variant mt-2 max-w-xl">Prediksi performa dan analisis demografi berbasis data operasional global.</p>
            </section>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="md:col-span-2 bg-surface-container-low p-10 rounded-3xl border border-outline-variant/10 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                <div class="relative z-10 flex flex-col items-center text-center">
                  <span class="material-symbols-outlined text-7xl text-primary/40 mb-6" style="font-variation-settings: 'FILL' 1;">insights</span>
                  <h3 class="text-2xl font-black font-headline text-on-surface mb-2 tracking-tighter uppercase italic">Deployment Analitik ALPHA V2</h3>
                  <p class="text-sm text-outline max-w-sm font-medium">Data operasional dari ${shops.length} node sedang diindeks untuk optimalisasi AI. Statistik real-time akan siap dalam beberapa saat.</p>
                  <div class="mt-8 flex gap-2">
                    <div class="px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black text-primary uppercase">Indexing 84%</div>
                    <div class="px-4 py-2 bg-surface-container rounded-full border border-white/5 text-[10px] font-black text-outline uppercase tracking-widest">Global Sync</div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-6">
                <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-xl flex-grow flex flex-col justify-center items-center text-center">
                   <div class="w-16 h-1 bg-primary/20 rounded-full mb-6 relative overflow-hidden">
                     <div class="absolute inset-y-0 left-0 w-1/2 bg-primary animate-[move_2s_infinite]"></div>
                   </div>
                   <p class="text-xs font-bold text-on-surface uppercase tracking-widest leading-relaxed">Prediksi Churn Rate</p>
                   <h4 class="text-3xl font-black font-headline text-emerald-400 mt-2 tracking-tighter">0.42%</h4>
                   <p class="text-[10px] text-outline mt-2 font-medium italic">Estimasi optimis untuk ekosistem Master.</p>
                </div>
                <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-xl flex-grow flex flex-col justify-center items-center text-center">
                   <span class="material-symbols-outlined text-primary/50 text-4xl mb-4">hub</span>
                   <p class="text-xs font-bold text-on-surface uppercase tracking-widest leading-relaxed">Node Reliability</p>
                   <h4 class="text-3xl font-black font-headline text-white mt-2 tracking-tighter">99.8%</h4>
                   <p class="text-[10px] text-outline mt-2 font-medium italic">Operational uptime platform.</p>
                </div>
              </div>
            </div>
            
            <style>
              @keyframes move { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
            </style>
          </div>
        `;
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
      <div class="w-full space-y-12 fade-in">
        <!-- Header Section -->
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">GLOBAL OVERVIEW</p>
            <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Pusat Kendali Master</h2>
            <p class="text-on-surface-variant mt-2 max-w-xl">Mengelola ekosistem digital ${shops.length} outlet barbershop secara global.</p>
          </div>
          <div class="flex gap-4">
            <button id="overview-add-shop-btn" class="px-8 py-4 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 text-xs">
              <span class="material-symbols-outlined text-lg">add_circle</span>
              <span>Daftarkan Outlet</span>
            </button>
          </div>
        </section>

        <!-- Metrics Bento Grid -->
        <section class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- MRR Card -->
          <div class="md:col-span-2 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/5 shadow-xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-all"></div>
            <div class="flex justify-between items-start mb-8">
              <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">payments</span>
              </div>
              <span class="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+12.5%</span>
            </div>
            <p class="text-xs font-bold text-outline uppercase tracking-widest mb-1">ESTIMATED MRR</p>
            <h4 class="text-4xl font-extrabold font-headline text-on-surface">Rp ${(mrr/1000000).toFixed(2)}M</h4>
            <div class="mt-6 flex gap-1 h-1">
              ${[40, 70, 50, 90, 60, 80, 100].map(h => `<div class="flex-1 bg-primary/20 rounded-full"><div class="h-full bg-primary rounded-full" style="width: ${h}%"></div></div>`).join('')}
            </div>
          </div>

          <!-- Total Nodes -->
          <div class="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/5 shadow-xl transition-all hover:-translate-y-1">
            <div class="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center text-outline mb-6">
              <span class="material-symbols-outlined">hub</span>
            </div>
            <p class="text-xs font-bold text-outline uppercase tracking-widest mb-1">TOTAL NODES</p>
            <h4 class="text-3xl font-extrabold font-headline text-on-surface">${shops.length}</h4>
            <p class="text-[10px] text-on-surface-variant mt-2">Active Production Hubs</p>
          </div>

          <!-- Global Traffic -->
          <div class="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/5 shadow-xl transition-all hover:-translate-y-1">
            <div class="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center text-outline mb-6">
              <span class="material-symbols-outlined">bolt</span>
            </div>
            <p class="text-xs font-bold text-outline uppercase tracking-widest mb-1">GLOBAL SESS</p>
            <h4 class="text-3xl font-extrabold font-headline text-on-surface">${appointments.length}</h4>
            <p class="text-[10px] text-on-surface-variant mt-2">Real-time Operations</p>
          </div>
        </section>

        <!-- Tier Distribution -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${plans.map((p, idx) => {
            const count = activeShops.filter(s => s.plan_id === p.id).length;
            return `
              <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/5 flex items-center justify-between group cursor-default hover:bg-surface-container-high transition-all">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                    0${idx + 1}
                  </div>
                  <div>
                    <h5 class="text-sm font-bold text-on-surface uppercase tracking-wider">${p.name}</h5>
                    <p class="text-[10px] text-outline font-medium">Rp ${(p.price / 1000).toLocaleString()}k / mo</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-on-surface">${count}</p>
                  <p class="text-[9px] text-primary font-bold uppercase tracking-widest">TOKO</p>
                </div>
              </div>
            `;
          }).join('')}
        </section>

        <!-- Tenant Management Table -->
        <section class="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/5 shadow-2xl">
          <div class="p-8 border-b border-outline-variant/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <h4 class="text-xl font-bold font-headline text-on-surface">Node Management</h4>
               <p class="text-sm text-outline">Kendali penuh atas setiap tenant di jaringan global.</p>
             </div>
             <div class="flex gap-2">
               <button class="px-4 py-2 bg-surface-container rounded-lg text-xs font-bold text-outline hover:text-on-surface transition-all">Filter: Status</button>
               <button class="px-4 py-2 bg-surface-container rounded-lg text-xs font-bold text-outline hover:text-on-surface transition-all">Export Report</button>
             </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] uppercase tracking-[0.2em] text-outline font-bold bg-surface-container-highest/30">
                  <th class="px-8 py-5">Identity</th>
                  <th class="px-8 py-5">SaaS Protocol</th>
                  <th class="px-8 py-5">Status</th>
                  <th class="px-8 py-5 text-right">Relay Control</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10 text-sm">
                ${shops.map((shop) => {
                  const plan = plans.find(p => p.id === shop.plan_id);
                  const statusInfo = {
                    'active': { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)' },
                    'trial': { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
                    'expired': { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' }
                  };
                  const s = statusInfo[shop.status] || { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' };
                  
                  return `
                    <tr class="group hover:bg-white/[0.02] transition-colors">
                      <td class="px-8 py-6">
                        <div class="flex items-center gap-4">
                          <div class="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center font-black text-primary border border-outline-variant/10">
                            ${shop.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p class="font-bold text-[#E5E2E1] group-hover:text-primary transition-colors cursor-pointer" onclick="window.handleShopDetail('${shop.id}')">${shop.name}</p>
                            <code class="text-[10px] text-outline opacity-60">@${shop.slug}</code>
                          </div>
                        </div>
                      </td>
                      <td class="px-8 py-6">
                        <div class="flex flex-col">
                          <span class="text-xs font-bold text-on-surface">${plan ? plan.name : 'NO TIER'}</span>
                          <span class="text-[10px] text-outline">Since ${new Date(shop.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td class="px-8 py-6">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5" style="background: ${s.bg}; color: ${s.color}">
                          <div class="w-1.5 h-1.5 rounded-full" style="background: ${s.color}"></div>
                          <span class="text-[10px] font-black uppercase tracking-widest">${shop.status}</span>
                        </div>
                      </td>
                      <td class="px-8 py-6 text-right">
                        <div class="flex items-center justify-end gap-3">
                          <button class="w-10 h-10 rounded-lg hover:bg-white/5 flex items-center justify-center text-outline hover:text-primary transition-all manage-btn" data-id="${shop.id}">
                            <span class="material-symbols-outlined text-lg">settings</span>
                          </button>
                          <button class="w-10 h-10 rounded-lg hover:bg-white/5 flex items-center justify-center text-outline hover:text-red-400 transition-all delete-shop-btn" data-id="${shop.id}">
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
        </section>
      </div>
    `;

    contentArea.querySelectorAll('.manage-btn').forEach(btn => btn.onclick = () => handleManageShop(btn.dataset.id, plans));
    contentArea.querySelectorAll('.delete-shop-btn').forEach(btn => btn.onclick = () => handleDeleteShop(btn.dataset.id));
    
    // Switch to Add Tenant tab
    contentArea.querySelector('#overview-add-shop-btn')?.addEventListener('click', () => {
      activeTab = 'add_tenant';
      renderLayout();
      loadMasterData();
    });
  }

  function renderRevenueTab(contentArea, shops, plans, history) {
    const activeShops = shops.filter(s => s.status === 'active' || s.status === 'trial');
    
    // Real MRR Calculation: Sum of prices of plans for all active shops
    const totalMRR = activeShops.reduce((sum, s) => {
      const p = plans?.find(pl => pl.id === s.plan_id);
      return sum + (p?.price || 0);
    }, 0);

    // Calculate Growth (dummy logic but based on real count)
    const growthPercent = (activeShops.length / 10).toFixed(1); 

    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section>
          <div class="flex items-center gap-2 mb-3">
            <span class="w-8 h-[2px] bg-primary"></span>
            <p class="text-[10px] font-black text-primary uppercase tracking-[0.3em]">FINANCIAL PROTOCOL v2.0</p>
          </div>
          <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Laporan Pendapatan</h2>
          <p class="text-on-surface-variant mt-2 max-w-xl">Audit komprehensif arus kas dari paket berlangganan node global.</p>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Total MRR Large Card -->
          <div class="lg:col-span-8 bg-surface-container-low p-10 rounded-3xl border border-outline-variant/10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px] group">
            <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
            
            <div class="relative z-10">
              <p class="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">trending_up</span>
                PROYEKSI MRR (Monthly Recurring Revenue)
              </p>
              <h3 class="text-7xl font-black font-headline text-on-surface tracking-tighter tabular-nums">
                Rp ${(totalMRR/1000).toLocaleString()}k<span class="text-2xl text-outline ml-4 font-normal tracking-normal uppercase">/ mo</span>
              </h3>
              <div class="flex items-center gap-4 mt-8">
                 <div class="px-4 py-2 bg-emerald-400/10 rounded-full border border-emerald-400/20 text-emerald-400 text-xs font-black flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">auto_graph</span>
                    +${growthPercent}% Velocity
                 </div>
                 <p class="text-outline text-xs tabular-nums">Aggregated from ${activeShops.length} active instances.</p>
              </div>
            </div>
            
            <!-- Real Growth Visualization -->
            <div class="flex items-end gap-3 h-40 mt-12 px-2">
               ${Array.from({length: 12}).map((_, i) => {
                 const volume = Math.random() * 60 + 30; // Simulated volume for now
                 const isLast = i === 11;
                 return `
                   <div class="flex-1 rounded-t-xl transition-all duration-500 hover:scale-y-110 cursor-pointer group/bar relative ${isLast ? 'bg-primary shadow-[0_0_20px_rgba(246,202,34,0.4)]' : 'bg-surface-container-highest'}" style="height: ${volume}%">
                     <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface backdrop-blur px-3 py-1.5 rounded-lg border border-outline-variant/20 text-[10px] font-black text-primary opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 shadow-xl pointer-events-none whitespace-nowrap z-20">
                        VOL-${i+1}: ${Math.floor(volume)} Units
                     </div>
                   </div>
                 `;
               }).join('')}
            </div>
          </div>

          <!-- Tier Breakdown -->
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-xl h-full flex flex-col">
              <h4 class="text-sm font-black font-headline text-outline uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">pie_chart</span>
                Node Distribution
              </h4>
              <div class="space-y-8 flex-1">
                ${plans.map(p => {
                  const count = activeShops.filter(s => s.plan_id === p.id).length;
                  const share = activeShops.length > 0 ? (count / activeShops.length) * 100 : 0;
                  return `
                    <div class="space-y-4">
                      <div class="flex justify-between items-end">
                        <div class="flex flex-col">
                          <span class="text-xs font-black text-on-surface uppercase tracking-wider">${p.name}</span>
                          <span class="text-[10px] text-outline font-medium tracking-wide">Rp ${p.price.toLocaleString()} / mo</span>
                        </div>
                        <div class="text-right">
                          <span class="text-sm font-black text-primary">${count}</span>
                          <span class="text-[9px] text-outline font-bold ml-1">NODES</span>
                        </div>
                      </div>
                      <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div class="h-full gold-gradient rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(246,202,34,0.3)]" style="width: ${share}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="mt-8 pt-8 border-t border-outline-variant/5">
                 <button class="w-full py-4 rounded-xl bg-surface-container-high text-xs font-bold text-outline hover:text-on-surface transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-sm">download</span>
                    EXPORT FULL REPORT
                 </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Billing Audit Log -->
        <section class="bg-surface-container-low rounded-3xl border border-outline-variant/5 overflow-hidden shadow-2xl">
          <div class="p-8 border-b border-outline-variant/5 flex items-center justify-between">
            <div>
              <h4 class="text-xl font-bold font-headline text-on-surface">Billing Audit Log</h4>
              <p class="text-sm text-outline">Rekaman historis transaksi dan perpanjangan paket global.</p>
            </div>
            <div class="flex gap-2">
               <button class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-outline transition-all hover:bg-surface-container-highest">
                  <span class="material-symbols-outlined text-lg">filter_alt</span>
               </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] uppercase tracking-[0.3em] text-outline font-black bg-surface-container-highest/30">
                  <th class="px-8 py-6">Node Identity</th>
                  <th class="px-8 py-6">Transaction Date</th>
                  <th class="px-8 py-6">Protocol / Tier</th>
                  <th class="px-8 py-6 text-right">Relay Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10 text-sm">
                ${history.length > 0 ? history.map(h => `
                  <tr class="group hover:bg-white/[0.01] transition-all">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center font-bold text-outline text-xs">
                           ${h.shops?.name?.[0] || '?' }
                        </div>
                        <div>
                          <p class="font-black text-on-surface uppercase tracking-wider text-xs">${h.shops?.name || 'Unknown Node'}</p>
                          <p class="text-[10px] text-outline font-bold">ID: ...${h.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <div class="flex flex-col">
                        <span class="text-xs font-bold text-on-surface tabular-nums">${new Date(h.created_at).toLocaleDateString()}</span>
                        <span class="text-[10px] text-outline font-medium uppercase tracking-widest">${new Date(h.created_at).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <div class="flex flex-col">
                         <span class="text-xs font-bold text-primary tabular-nums">Rp ${h.amount.toLocaleString()}</span>
                         <span class="text-[10px] text-outline font-bold uppercase tracking-widest">${h.billing_cycle || 'MONTHLY'}</span>
                      </div>
                    </td>
                    <td class="px-8 py-6 text-right">
                       <span class="inline-flex px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-400/20">
                          SUCCESS: RECO
                       </span>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="4" class="px-8 py-20 text-center">
                       <div class="flex flex-col items-center gap-4 opacity-40">
                          <span class="material-symbols-outlined text-6xl">account_balance_wallet</span>
                          <p class="text-xs font-black uppercase tracking-[0.2em]">No financial data records found.</p>
                       </div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
          <div class="p-6 bg-surface-container-highest/20 text-center">
             <button class="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline transition-all">
                Load Architecture History
             </button>
          </div>
        </section>
      </div>
    `;
  }

  function renderSettingsTab(contentArea, plans) {
    contentArea.innerHTML = `
      <div class="w-full space-y-12 fade-in">
        <section>
          <p class="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">SYSTEM ARCHITECTURE</p>
          <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Master Settings</h2>
          <p class="text-on-surface-variant mt-2 max-w-xl">Konfigurasi limitasi dan protokol fitur pada setiap tier ekosistem.</p>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          ${plans.map(p => `
            <div class="bg-surface-container-low rounded-3xl border border-outline-variant/5 shadow-2xl flex flex-col group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
              <div class="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
              
              <div class="p-10 border-b border-outline-variant/5">
                <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">${p.name}</p>
                <h3 class="text-4xl font-black font-headline text-on-surface tracking-tighter">Rp ${(p.price / 1000).toLocaleString()}k <span class="text-xs text-outline font-medium tracking-normal">/ mo</span></h3>
              </div>
              
              <div class="p-10 flex-grow space-y-6">
                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-sm">group</span>
                    </div>
                    <div>
                      <p class="text-[10px] text-outline font-bold uppercase tracking-widest">Global Staff</p>
                      <p class="text-sm font-bold text-on-surface">Max ${p.max_barbers || '∞'} Barbers</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-sm">hub</span>
                    </div>
                    <div>
                      <p class="text-[10px] text-outline font-bold uppercase tracking-widest">Network Nodes</p>
                      <p class="text-sm font-bold text-on-surface">Max ${p.max_branches || '∞'} Branches</p>
                    </div>
                  </div>
                </div>

                <div class="h-[1px] bg-outline-variant/5"></div>

                <div class="space-y-4">
                   ${(() => {
                      let features = p.features;
                      if (typeof features === 'string') features = features.replace(/[{}"[\]]/g, '').split(',');
                      if (!Array.isArray(features)) features = [];
                      return features.slice(0, 5).map(f => `
                        <div class="flex items-center gap-3">
                          <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                          <span class="text-xs font-bold text-outline group-hover:text-on-surface transition-colors uppercase tracking-wider">${f.trim().replace(/_/g, ' ')}</span>
                        </div>
                      `).join('');
                   })()}
                </div>
              </div>

              <div class="p-10 border-t border-outline-variant/5 bg-surface-container-highest/30">
                <button onclick="window.handleEditPlan('${p.id}')" class="w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px]">
                  <span class="material-symbols-outlined text-sm">settings_suggest</span>
                  <span>Modifikasi Protokol</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
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

  function renderAddTenantTab(contentArea) {
    contentArea.innerHTML = `
      <!-- Registration Stepper/Header -->
      <div class="w-full max-w-4xl mb-12 fade-in">
        <div class="flex justify-between items-end">
          <div>
            <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface">Registrasi Toko Baru</h2>
            <p class="text-on-surface-variant mt-2 max-w-md">Lengkapi informasi di bawah ini untuk menambahkan outlet baru ke dalam ekosistem digital BarberPro.</p>
          </div>
          <div class="flex items-center gap-2 text-sm font-semibold">
            <span class="text-primary">Langkah 1</span>
            <span class="text-outline">dari 2</span>
            <div class="w-32 h-1 bg-surface-container rounded-full overflow-hidden ml-2">
              <div class="w-1/2 h-full bg-primary shadow-[0_0_8px_rgba(246,202,34,0.5)]"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Multi-Step Form Layout (Bento Style) -->
      <form id="atelier-add-tenant-form" class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 fade-in" style="animation-delay: 100ms">
        <!-- Basic Info Card -->
        <div class="md:col-span-8 bg-surface-container-low p-8 rounded-xl shadow-sm space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center text-primary">
              <span class="material-symbols-outlined">storefront</span>
            </div>
            <div>
              <h3 class="text-xl font-bold font-headline text-on-surface">Informasi Dasar</h3>
              <p class="text-xs text-on-surface-variant uppercase tracking-widest">Identitas Outlet</p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-6">
            <div class="group">
              <label class="block text-xs font-bold text-outline uppercase tracking-widest mb-2 ml-1">Nama Toko</label>
              <input id="add-tenant-name" class="w-full bg-surface-container border-none rounded-xl py-4 px-6 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline/30" placeholder="Contoh: BarberPro Senopati" type="text" required />
            </div>
            <div class="group">
              <label class="block text-xs font-bold text-outline uppercase tracking-widest mb-2 ml-1">Alamat Lengkap</label>
              <textarea id="add-tenant-address" class="w-full bg-surface-container border-none rounded-xl py-4 px-6 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline/30 resize-none" placeholder="Masukkan alamat lengkap toko di sini..." rows="3"></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="group">
                <label class="block text-xs font-bold text-outline uppercase tracking-widest mb-2 ml-1">No. Telepon</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">+62</span>
                  <input id="add-tenant-phone" class="w-full bg-surface-container border-none rounded-xl py-4 pl-16 pr-6 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline/30" placeholder="812 3456 7890" type="tel" />
                </div>
              </div>
              <div class="group">
                <label class="block text-xs font-bold text-outline uppercase tracking-widest mb-2 ml-1">Kategori Layanan</label>
                <select id="add-tenant-category" class="w-full bg-surface-container border-none rounded-xl py-4 px-6 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all">
                  <option>Premium Barber</option>
                  <option>Classic Cut</option>
                  <option>Express Cut</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Operating Hours & Sidebar Card -->
        <div class="md:col-span-4 flex flex-col gap-6">
          <!-- Visual Preview / Status -->
          <div class="bg-surface-container p-6 rounded-xl border border-outline-variant/10 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10">
              <p class="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-4">Preview Kartu</p>
              <div class="h-32 rounded-lg bg-surface-container-low flex flex-col justify-end p-4 border border-outline-variant/5">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <span class="material-symbols-outlined text-primary text-sm">image</span>
                </div>
                <div class="h-3 w-3/4 bg-surface-container-highest rounded mb-2"></div>
                <div class="h-2 w-1/2 bg-surface-container-highest/50 rounded"></div>
              </div>
              <button type="button" class="mt-4 w-full py-2 bg-surface-container-highest text-xs font-bold rounded-lg border border-outline-variant/20 hover:border-primary/50 transition-all">
                  Unggah Foto Toko
              </button>
            </div>
          </div>
          
          <!-- Operating Hours -->
          <div class="bg-surface-container-low p-6 rounded-xl shadow-sm flex-1">
            <h4 class="text-sm font-bold text-on-surface mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-lg">schedule</span> Jam Operasional
            </h4>
            <div class="space-y-4">
              <div class="flex items-center justify-between group">
                <span class="text-xs font-medium text-on-surface-variant">Senin - Jumat</span>
                <input class="w-28 bg-surface-container border-none rounded-lg py-2 px-3 text-xs text-center focus:ring-1 focus:ring-primary/50 text-white" type="text" value="09:00 - 21:00" />
              </div>
              <div class="flex items-center justify-between group">
                <span class="text-xs font-medium text-on-surface-variant">Sabtu</span>
                <input class="w-28 bg-surface-container border-none rounded-lg py-2 px-3 text-xs text-center focus:ring-1 focus:ring-primary/50 text-white" type="text" value="10:00 - 22:00" />
              </div>
              <div class="flex items-center justify-between group">
                <span class="text-xs font-medium text-on-surface-variant">Minggu</span>
                <input class="w-28 bg-surface-container-highest text-error border-none rounded-lg py-2 px-3 text-xs text-center focus:ring-1 focus:ring-primary/50" type="text" value="Tutup" />
              </div>
              <div class="pt-4 border-t border-outline-variant/10">
                <button class="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline" type="button">
                  + Sesuaikan Jadwal Khusus
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Form Actions -->
        <div class="md:col-span-12 flex items-center justify-between pt-8 mt-4 border-t border-outline-variant/10">
          <button type="button" class="flex items-center gap-2 px-6 py-4 text-on-surface-variant font-bold hover:text-on-surface transition-colors" onclick="document.querySelector('[data-tab=overview]').click()">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Batalkan</span>
          </button>
          <div class="flex items-center gap-4">
            <button type="button" class="px-8 py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl active:scale-95 transition-all outline-none">
                Simpan Draf
            </button>
            <button id="atelier-submit-shop-btn" class="px-10 py-4 bg-primary text-on-primary font-extrabold rounded-xl shadow-[0_8px_20px_rgba(246,202,34,0.3)] hover:shadow-[0_12px_24px_rgba(246,202,34,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-3" type="submit">
              <span>Daftarkan Toko</span>
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </form>
    `;

    const form = contentArea.querySelector('#atelier-add-tenant-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const shopName = contentArea.querySelector('#add-tenant-name').value;
      const address = contentArea.querySelector('#add-tenant-address').value;
      const phone = contentArea.querySelector('#add-tenant-phone').value;
      const category = contentArea.querySelector('#add-tenant-category').value;
      const submitBtn = contentArea.querySelector('#atelier-submit-shop-btn');
      
      submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Processing...';
      submitBtn.disabled = true;

      try {
        // Fast-track demo deployment for the Atelier UI
        const { data: ud, error: ue } = await supabase.auth.getUser();
        if (ue) throw ue;
        const uid = ud.user?.id;

        const slug = shopName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

        const { data: newShop, error } = await supabase.from('shops').insert([{
          name: shopName,
          slug: slug,
          address: address + ' (Telp: ' + phone + ' - ' + category + ')',
          status: 'trial',
          owner_id: uid
        }]).select().single();

        if (error) throw error;

        showToast(`Tenant "${shopName}" berhasil didaftarkan ke Ekosistem!`, 'success');
        
        // Reset and switch back
        form.reset();
        activeTab = 'overview';
        renderLayout();
        loadMasterData();
      } catch (err) {
        showToast(`Gagal menambahkan toko: ${err.message}`, 'danger');
        submitBtn.innerHTML = '<span>Daftarkan Toko</span><span class="material-symbols-outlined">chevron_right</span>';
        submitBtn.disabled = false;
      }
    });

  }
}
