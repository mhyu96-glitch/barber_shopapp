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

  // Theme Initializer
  function initTheme() {
    const globalSidebar = document.getElementById('sidebar');
    if (globalSidebar) globalSidebar.style.display = 'none';
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.width = '100%';
    }
    
    document.body.className = '';
    document.body.classList.add('bg-[#131313]', 'text-[#E5E2E1]', 'font-body', 'min-h-screen');
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
      <style>
        .font-headline { font-family: 'Outfit', sans-serif; }
        .glass { background: rgba(28, 27, 27, 0.75); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .gold-gradient { background: linear-gradient(135deg, #f6ca22 0%, #d4af37 100%); }
        .active-tab { background-color: #353534; color: #f6ca22 !important; border-right: 3px solid #f6ca22; }
        .active-tab span { color: #f6ca22; font-variation-settings: 'FILL' 1; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #353534; border-radius: 10px; }
      </style>

      <!-- Sidebar -->
      <aside class="w-64 fixed left-0 top-0 h-screen bg-[#1C1B1B] border-r border-white/5 z-50 flex flex-col p-6 shadow-2xl shadow-black/50">
        <div class="flex items-center gap-3 mb-12 px-2">
            <div class="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span class="material-symbols-outlined text-black font-black" style="font-variation-settings: 'FILL' 1;">trending_up</span>
            </div>
            <h1 class="text-xl font-black font-headline uppercase tracking-tighter text-white">Barber<span class="text-[#f6ca22] italic">SaaS</span></h1>
        </div>

        <nav class="flex-1 space-y-1.5 text-sm font-bold">
            <p class="text-[9px] uppercase tracking-[0.3em] text-gray-500 mb-6 px-4 font-black">CORE MONITOR</p>
            <a href="#" class="sidebar-link flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'active-tab' : 'text-gray-400 hover:text-white hover:bg-white/5'}" data-tab="dashboard">
                <span class="material-symbols-outlined">dashboard</span> <span class="tracking-tight uppercase italic text-[11px]">Dashboard</span>
            </a>
            <a href="#" class="sidebar-link flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === 'stores' ? 'active-tab' : 'text-gray-400 hover:text-white hover:bg-white/5'}" data-tab="stores">
                <span class="material-symbols-outlined">storefront</span> <span class="tracking-tight uppercase italic text-[11px]">Manajemen Toko</span>
            </a>
            <a href="#" class="sidebar-link flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === 'tiers' ? 'active-tab' : 'text-gray-400 hover:text-white hover:bg-white/5'}" data-tab="tiers">
                <span class="material-symbols-outlined">layers</span> <span class="tracking-tight uppercase italic text-[11px]">Tier & Fitur</span>
            </a>
            <a href="#" class="sidebar-link flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === 'settings' ? 'active-tab' : 'text-gray-400 hover:text-white hover:bg-white/5'}" data-tab="settings">
                <span class="material-symbols-outlined">tune</span> <span class="tracking-tight uppercase italic text-[11px]">Pengaturan</span>
            </a>
        </nav>

        <div class="mt-auto pt-6 border-t border-white/5">
            <div class="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5 group hover:border-primary/20 transition-all">
                <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20 transition-transform group-hover:scale-110">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">person_check</span>
                </div>
                <div>
                    <p class="text-[10px] font-black text-white leading-tight uppercase">Admin Pusat</p>
                    <p class="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">PLATFORM ARCHITECT</p>
                </div>
            </div>
            <button id="master-logout-btn" class="w-full mt-4 flex items-center justify-center gap-2 text-gray-500 hover:text-rose-400 py-2 text-[10px] font-black uppercase tracking-widest transition-colors">
              <span class="material-symbols-outlined text-sm">logout</span> Keluarkan Sesi
            </button>
        </div>
      </aside>

      <!-- Content Area -->
      <div class="flex-1 ml-64 min-h-screen">
          <!-- Topbar -->
          <header class="h-20 glass sticky top-0 px-10 border-b border-white/5 flex justify-between items-center z-40">
              <div class="flex-1 max-w-lg">
                  <div class="relative group">
                      <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-primary">search</span>
                      <input id="master-search-input" type="text" value="${searchTerm}" placeholder="Cari partner, transaksi, atau log unit..." class="w-full bg-[#1C1B1B] border-none rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all">
                  </div>
              </div>
              <div class="flex items-center gap-6">
                  <button id="master-notif-btn" class="relative group w-11 h-11 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:text-primary transition-all border border-white/5 hover:border-primary/20">
                      <span class="material-symbols-outlined">notifications</span>
                      ${notificationCount > 0 ? `<span class="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#131313] animate-pulse"></span>` : ''}
                  </button>
                  <button class="w-11 h-11 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:text-emerald-400 transition-all border border-white/5 lg:flex hidden">
                      <span class="material-symbols-outlined text-sm">security_update_good</span>
                  </button>
              </div>
          </header>

          <main id="master-view-container" class="p-10 space-y-10">
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
      else if (activeTab === 'tiers') renderTiersView(viewPort);
      else if (activeTab === 'settings') renderSettingsView(viewPort);
      
    } catch (err) {
      showToast('Gagal sinkronisasi data master: ' + err.message, 'danger');
    }
  }

  // --- VIEWS ---

  function renderDashboardView(viewPort) {
    viewPort.innerHTML = `
      <div class="space-y-10 fade-in">
          <!-- Bento Grid Header -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="col-span-1 md:col-span-2 gold-gradient p-10 rounded-[2.5rem] text-black shadow-2xl relative overflow-hidden group">
                  <div class="relative z-10">
                      <p class="text-black/60 text-[10px] font-black uppercase tracking-[0.3em] italic">Cumulative Ecosystem Revenue</p>
                      <h3 class="text-6xl font-black font-headline mt-3 tracking-tighter tabular-nums">Rp ${(globalRevenue/1000000).toFixed(1)}M</h3>
                      <div class="mt-8 flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-black/5 w-fit px-4 py-2 rounded-full">
                          <span class="material-symbols-outlined text-sm">trending_up</span>
                          <span>Stable Node Growth Active</span>
                      </div>
                  </div>
                  <span class="material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] opacity-10 font-thin transition-transform group-hover:scale-110 group-hover:-rotate-12 duration-700">payments</span>
              </div>

              <div class="bg-[#1C1B1B] p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group hover:border-primary/20 transition-all shadow-xl">
                  <div class="flex justify-between items-start">
                      <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/5 transition-colors group-hover:bg-primary/10">
                          <span class="material-symbols-outlined text-3xl">storefront</span>
                      </div>
                      <span class="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20 uppercase tracking-[0.2em] leading-none">Healthy</span>
                  </div>
                  <div>
                      <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Total Unit Bisnis</p>
                      <h4 class="text-4xl font-black font-headline text-white tracking-tight tabular-nums">${shopsData.length} <span class="text-xs text-gray-600 font-bold uppercase ml-1">Nodes</span></h4>
                  </div>
              </div>

              <div class="bg-[#1C1B1B] p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group hover:border-primary/20 transition-all shadow-xl">
                  <div class="flex justify-between items-start">
                      <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-rose-500 border border-white/5 transition-colors group-hover:bg-rose-500/10">
                          <span class="material-symbols-outlined text-3xl">bolt</span>
                      </div>
                  </div>
                  <div>
                      <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Menunggu Otorisasi</p>
                      <h4 class="text-4xl font-black font-headline text-rose-500 tracking-tight tabular-nums">${shopsData.filter(s => s.status === 'trial').length} <span class="text-xs text-gray-600 font-bold uppercase ml-1 italic">Trial</span></h4>
                  </div>
              </div>
          </div>

          <!-- Analysis Section -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Global Revenue Growth Chart -->
              <div class="col-span-1 lg:col-span-2 bg-[#1C1B1B] p-10 rounded-[2.5rem] border border-white/5 flex flex-col min-h-[480px] shadow-2xl relative overflow-hidden">
                  <div class="flex justify-between items-center mb-12">
                      <div>
                        <h4 class="text-xs font-black text-white uppercase tracking-widest italic border-l-2 border-primary pl-4">Metrik Pertumbuhan Arus Kas</h4>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 pl-4">Last 180 Days Ecosystem Traffic</p>
                      </div>
                      <div class="flex gap-2 text-[10px] font-black">
                          <button class="px-5 py-2.5 gold-gradient rounded-xl text-black shadow-lg shadow-primary/20 scale-105">ANALYTICS ENGINE</button>
                      </div>
                  </div>
                  
                  <div class="flex-1 flex items-end gap-4 px-2 pb-6 relative">
                      <!-- Grid Lines -->
                      <div class="absolute inset-0 flex flex-col justify-between opacity-5 py-6">
                        <div class="border-t border-white border-dashed w-full"></div>
                        <div class="border-t border-white border-dashed w-full"></div>
                        <div class="border-t border-white border-dashed w-full"></div>
                        <div class="border-t border-white border-dashed w-full"></div>
                      </div>

                      <!-- SVG Area Chart -->
                      <div class="absolute inset-0 px-2 py-6 overflow-hidden">
                        <svg class="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stop-color="#f6ca22" stop-opacity="0.3"></stop>
                              <stop offset="100%" stop-color="#f6ca22" stop-opacity="0"></stop>
                            </linearGradient>
                          </defs>
                          <path d="M0,100 L0,70 Q50,40 100,50 T200,30 T300,45 T400,10 L400,100 Z" fill="url(#areaGrad)"></path>
                          <path d="M0,70 Q50,40 100,50 T200,30 T300,45 T400,10" fill="none" stroke="#f6ca22" stroke-width="2" vector-effect="non-scaling-stroke"></path>
                        </svg>
                      </div>

                      <!-- Chart Mock Bars (Optional fallback) -->
                      <div class="flex-1 bg-white/5 rounded-t-xl h-[45%] hover:bg-primary/20 transition-all z-10"></div>
                      <div class="flex-1 bg-white/5 rounded-t-xl h-[65%] hover:bg-primary/20 transition-all z-10"></div>
                      <div class="flex-1 bg-white/5 rounded-t-xl h-[55%] hover:bg-primary/20 transition-all z-10"></div>
                      <div class="flex-1 bg-white/5 rounded-t-xl h-[85%] hover:bg-primary/20 transition-all z-10"></div>
                      <div class="flex-1 gold-gradient rounded-t-xl h-[98%] shadow-[0_0_30px_rgba(246,202,34,0.3)] z-10"></div>
                      <div class="flex-1 bg-white/5 rounded-t-xl h-[75%] hover:bg-primary/20 transition-all z-10"></div>
                  </div>
                  <div class="grid grid-cols-6 mt-6 px-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center border-t border-white/5 pt-6">
                      <span>Januari</span><span>Februari</span><span>Maret</span><span>April</span><span>Mei</span><span>Juni</span>
                  </div>
              </div>

              <!-- Tier Popularity Section -->
              <div class="bg-[#1C1B1B] p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between shadow-2xl">
                  <div>
                      <h4 class="text-xs font-black text-white uppercase tracking-widest mb-10 border-l-2 border-primary pl-4 italic">Platform Tier Matrix</h4>
                      <div class="space-y-10">
                          ${plansData.map(p => {
                            const count = shopsData.filter(s => s.plan_id === p.id).length;
                            const pct = Math.round((count / (shopsData.length || 1)) * 100);
                            return `
                              <div>
                                  <div class="flex justify-between text-[11px] font-black uppercase mb-3 px-1">
                                      <span class="text-gray-400 tracking-widest">${p.name} <span class="text-[9px] italic opacity-40 ml-2">Tier</span></span>
                                      <span class="text-white">${count} Units <span class="text-primary opacity-50 ml-1">(${pct}%)</span></span>
                                  </div>
                                  <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                      <div class="h-full ${p.name === 'Enterprise' ? 'gold-gradient' : 'bg-white/20'} transition-all duration-1000" style="width: ${pct}%"></div>
                                  </div>
                              </div>
                            `;
                          }).join('')}
                      </div>
                  </div>
                  <div class="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p class="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">info</span> insight sistem
                      </p>
                      <p class="text-[10px] text-gray-500 font-bold leading-relaxed uppercase">Paket ${plansData[1]?.name || 'Premium'} menunjukkan konversi tertinggi (65%) dalam 30 hari terakhir. Pertimbangkan penambahan kuota barber di tier ini.</p>
                  </div>
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
            <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3 italic">ECOSYSTEM MANAGEMENT</p>
            <h2 class="text-5xl font-extrabold font-headline tracking-tighter text-white uppercase italic">Node Registry</h2>
            <p class="text-gray-500 mt-2 text-xs font-bold uppercase tracking-widest">Otorisasi dan Pengendalian Unit Bisnis Global</p>
          </div>
          <button id="mgr-add-store-btn" class="px-8 py-5 gold-gradient text-black font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-xs italic">
            <span class="material-symbols-outlined font-black">add_circle</span>
            <span>Daftarkan Unit Baru</span>
          </button>
        </section>

        <!-- Node List -->
        <div class="bg-[#1C1B1B] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-black border-b border-white/5 bg-white/[0.02]">
                            <th class="px-10 py-6">Indikator Unit</th>
                            <th class="px-10 py-6">Lokasi / Relay</th>
                            <th class="px-10 py-6">Tier Aktif</th>
                            <th class="px-10 py-6">Status Arsitektur</th>
                            <th class="px-10 py-6 text-right">Otoritas</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        ${shops.map(shop => {
                            const plan = plansData.find(p => p.id === shop.plan_id);
                            const statusColor = shop.status === 'active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 
                                               (shop.status === 'trial' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20');
                            return `
                                <tr class="group hover:bg-white/[0.02] transition-colors">
                                    <td class="px-10 py-8">
                                        <div class="flex items-center gap-5">
                                            <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary font-headline text-2xl group-hover:bg-primary/10 transition-colors">
                                                ${shop.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p class="text-sm font-black text-white uppercase tracking-tight">${shop.name}</p>
                                                <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 italic">@${shop.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-10 py-8">
                                        <p class="text-[10px] text-gray-500 font-bold uppercase max-w-[200px] truncate">${shop.address || 'Relay Unknown'}</p>
                                    </td>
                                    <td class="px-10 py-8">
                                        <div class="flex items-center gap-2">
                                          <span class="w-2 h-2 rounded-full ${plan ? 'bg-primary' : 'bg-gray-700'}"></span>
                                          <span class="text-[10px] font-black text-white uppercase tracking-widest">${plan ? plan.name : 'NO TIER'}</span>
                                        </div>
                                    </td>
                                    <td class="px-10 py-8">
                                        <span class="text-[9px] font-black px-4 py-2 rounded-full border uppercase tracking-widest ${statusColor}">
                                            ${shop.status}
                                        </span>
                                    </td>
                                    <td class="px-10 py-8 text-right">
                                        <div class="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                            <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-primary transition-colors store-edit-btn" data-id="${shop.id}">
                                                <span class="material-symbols-outlined text-sm">settings_input_component</span>
                                            </button>
                                            <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors store-delete-btn" data-id="${shop.id}">
                                                <span class="material-symbols-outlined text-sm">delete_sweep</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                ${shops.length === 0 ? `<div class="py-20 text-center"><p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] italic">No Nodes Detected in Search Perimeter</p></div>` : ''}
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
            <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3 italic">COMMERCIAL ARCHITECTURE</p>
            <h2 class="text-5xl font-extrabold font-headline tracking-tighter text-white uppercase italic">Tier Management</h2>
            <p class="text-gray-500 mt-2 text-xs font-bold uppercase tracking-widest">Konfigurasi Protokol Layanan dan Skema Harga Global</p>
          </div>
          <button class="px-8 py-5 bg-white/5 text-gray-400 font-black uppercase tracking-widest rounded-2xl border border-white/10 text-[10px] hover:text-primary hover:border-primary/20 transition-all">
            <span class="material-symbols-outlined text-sm inline-block translate-y-0.5 mr-2">add</span> Buat Tier Layanan
          </button>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-10 translate-y-4">
          ${plansData.map(p => `
            <div class="bg-[#1C1B1B] p-12 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col group transition-all hover:border-primary/20 hover:-translate-y-2 duration-500">
              <div class="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-all duration-700"></div>
              
              <div class="relative z-10 flex-1">
                <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">Platform Relay v4</p>
                <h3 class="text-4xl font-black font-headline text-white uppercase tracking-tighter mb-8">${p.name}</h3>
                
                <div class="mb-10 flex items-baseline gap-2">
                  <span class="text-5xl font-black text-white font-headline tabular-nums tracking-tighter">Rp ${(p.price/1000).toLocaleString()}k</span>
                  <span class="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">/ monthly</span>
                </div>

                <div class="space-y-4 border-t border-white/5 pt-10 mb-12">
                   <div class="flex items-center gap-4 group/item">
                      <div class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <span class="material-symbols-outlined text-sm font-black">check_circle</span>
                      </div>
                      <span class="text-[11px] font-bold text-gray-300 uppercase tracking-widest group-hover/item:text-white transition-colors">Core POS Unlocked</span>
                   </div>
                   <div class="flex items-center gap-4 group/item">
                      <div class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <span class="material-symbols-outlined text-sm font-black">check_circle</span>
                      </div>
                      <span class="text-[11px] font-bold text-gray-300 uppercase tracking-widest group-hover/item:text-white transition-colors">${p.max_barbers ? p.max_barbers + ' Master Barbers' : 'Unlimited Staff Relay'}</span>
                   </div>
                   <div class="flex items-center gap-4 group/item">
                      <div class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <span class="material-symbols-outlined text-sm font-black">check_circle</span>
                      </div>
                      <span class="text-[11px] font-bold text-gray-300 uppercase tracking-widest group-hover/item:text-white transition-colors">Encrypted Data Uplink</span>
                   </div>
                </div>
              </div>

              <div class="relative z-10">
                <button class="w-full py-5 bg-white/5 rounded-[1.5rem] text-[10px] font-black text-gray-400 hover:text-black hover:gold-gradient hover:shadow-xl transition-all duration-300 uppercase tracking-[0.3em] border border-white/5 italic tier-edit-btn" data-id="${p.id}">
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
    let payload = { name: '', address: '', phone: '', category: 'Premium Barber' };

    function render() {
      if (step === 1) {
        viewPort.innerHTML = `
          <div class="max-w-2xl mx-auto space-y-12 fade-in">
             <section class="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                  <p class="text-[10px] font-black text-primary tracking-[0.5em] uppercase italic mb-3">OTORISASI LANGKAH 01 / 02</p>
                  <h2 class="text-5xl font-black text-white uppercase italic tracking-tighter">Identitas Unit</h2>
                </div>
                <div class="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: 50%"></div>
                </div>
             </section>

             <div class="space-y-8 bg-[#1C1B1B] p-12 rounded-[3rem] border border-white/5 shadow-2xl">
                <div class="space-y-3">
                   <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nama Toko / Bisnis</label>
                   <input id="in-name" class="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all" value="${payload.name}" placeholder="Contoh: Atelier Senopati Exclusive" />
                </div>
                <div class="space-y-3">
                   <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Relay / Alamat Lengkap Operasional</label>
                   <textarea id="in-address" class="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all" rows="3">${payload.address}</textarea>
                </div>
                <div class="flex justify-between items-center pt-8">
                   <button id="cancel-flow" class="text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-[0.3em] transition-colors italic">Batalkan Proses</button>
                   <button id="next-to-step2" class="px-10 py-5 gold-gradient text-black font-black uppercase text-[11px] rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Langkah Arsitektur <span class="material-symbols-outlined text-sm inline-block translate-y-0.5 ml-1">arrow_forward</span></button>
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
             <section class="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                  <p class="text-[10px] font-black text-primary tracking-[0.5em] uppercase italic mb-3">OTORISASI LANGKAH 02 / 02</p>
                  <h2 class="text-5xl font-black text-white uppercase italic tracking-tighter">Pemilihan Tier</h2>
                </div>
                <div class="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: 100%"></div>
                </div>
             </section>

             <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                ${plansData.map(p => `
                   <button class="plan-select-card p-10 bg-[#1C1B1B] rounded-[2.5rem] border-2 border-white/5 hover:border-primary/40 transition-all text-left flex flex-col justify-between group h-full shadow-xl" data-id="${p.id}">
                      <div>
                        <p class="text-[9px] font-black text-primary uppercase mb-3 tracking-[0.3em] italic">Service Level</p>
                        <h4 class="text-3xl font-black font-headline text-white uppercase tracking-tighter mb-4">${p.name}</h4>
                        <p class="text-2xl font-black text-white/50 mb-8 tabular-nums tracking-tighter">Rp ${(p.price/1000).toLocaleString()}k <span class="text-[9px] uppercase tracking-widest font-black">/ mo</span></p>
                      </div>
                      <div class="pt-8 border-t border-white/5 w-full">
                        <p class="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-primary transition-colors">Pilih Arsitektur Ini</p>
                      </div>
                   </button>
                `).join('')}
             </div>

             <div class="flex justify-between items-center pt-12 border-t border-white/5">
                <button onclick="step=1; render();" class="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em] flex items-center gap-2 italic">
                  <span class="material-symbols-outlined text-sm">arrow_back</span> Kembali Ke Identitas
                </button>
             </div>
          </div>
        `;
        
        viewPort.querySelectorAll('.plan-select-card').forEach(btn => btn.onclick = async () => {
          const pid = btn.dataset.id;
          btn.innerHTML = `<div class="flex justify-center flex-1 items-center"><span class="material-symbols-outlined animate-spin text-3xl text-primary">sync</span></div>`;
          btn.disabled = true;
          
          try {
            const { data: ud } = await supabase.auth.getUser();
            const slug = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
            
            const { data: newShop, error } = await supabase.from('shops').insert([{
              name: payload.name, slug, address: payload.address, plan_id: pid, status: 'active', category: payload.category, owner_id: ud.user?.id
            }]).select().single();
            
            if (error) throw error;
            
            const plan = plansData.find(x => x.id === pid);
            await supabase.from('subscription_history').insert([{
              shop_id: newShop.id, plan_id: pid, amount: plan?.price || 0, status: 'paid', end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString()
            }]);
            
            showToast('Ecosystem Unit Registered Successfully', 'success');
            activeTab = 'stores';
            loadMasterData();
          } catch (err) {
            showToast('Deployment Failed: ' + err.message, 'danger');
            render();
          }
        });
      }
    }
    render();
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
