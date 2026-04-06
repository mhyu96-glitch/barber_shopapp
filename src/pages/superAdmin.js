import { createClient } from '@supabase/supabase-js';
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

  let isSidebarOpen = true;
  let isReportMenuOpen = false;

  // Theme Initializer - SuperCore v1 (Global Reset)
  function initTheme() {
    // Aggressively kill legacy sidebars and navigations at the root level
    const legacyElements = ['sidebar', 'sidebar-mobile', 'nav-mobile', 'header-mobile'];
    legacyElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute('aria-hidden', 'true');
      }
    });
    
    // Reset main content container if it exists at the root
    const rootMain = document.getElementById('main-content');
    if (rootMain) {
      rootMain.style.marginLeft = '0';
      rootMain.style.padding = '0';
      rootMain.style.width = '100vw';
      rootMain.classList.remove('main-content'); // Remove potential layout-breaking classes
    }

    const saved = localStorage.getItem('master-admin-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.className = 'bg-slate-50 font-sans text-slate-900 min-h-screen overflow-x-hidden p-0 m-0';
    document.body.style.overflow = 'hidden'; 
  }

  // Layout Engine
  function renderLayout() {
    container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        :root {
          --primary: #d4a843;
          --primary-hover: #b8912e;
          --bg-sidebar: #0a0c10;
        }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0a0c10; color: #f8fafc; }
        .sidebar-transition { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .glass-header { background: rgba(10, 12, 16, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .nav-item-active { background: #d4a843; color: black; box-shadow: 0 10px 25px -5px rgba(212, 168, 67, 0.3); }
        .nav-item-hover:hover { background: rgba(255, 255, 255, 0.03); color: #d4a843; padding-left: 20px; }
        .fade-in { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      </style>

      <div class="flex h-screen bg-[#0a0c10] overflow-hidden text-slate-100">
        <!-- Sidebar: Fixed on Mobile, Part of Flex on Desktop -->
        <aside id="master-sidebar" class="sidebar-transition bg-[#0a0c10] text-white flex flex-col z-50 ${isSidebarOpen ? 'w-72' : 'w-0 lg:w-0'} border-r border-white/5" 
               style="overflow: hidden; min-width: ${isSidebarOpen ? '288px' : '0px'};">
          
          <div class="flex items-center justify-between px-7 py-6 shrink-0">
            <div class="flex items-center gap-3.5">
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                <i data-lucide="shield-check" class="text-black" size="20"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-lg font-black tracking-tight uppercase italic whitespace-nowrap leading-none">SuperCore</span>
                <span class="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] mt-1 opacity-60">Atelier 3.0</span>
              </div>
            </div>
            <button id="close-sidebar-btn" class="rounded-lg p-1.5 hover:bg-slate-800 lg:hidden text-slate-400"><i data-lucide="x" size="18"></i></button>
          </div>

          <nav class="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
            ${renderNavItem('dashboard', 'activity', 'Dashboard')}
            ${renderNavItem('stores', 'store', 'Manajemen Unit')}

            <div class="pt-1.5">
              <button id="reports-menu-toggle" class="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 group ${activeTab.startsWith('report') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}">
                <i data-lucide="file-text" size="18"></i>
                <span class="font-bold tracking-wide text-sm">Laporan</span>
                <i data-lucide="chevron-down" class="ml-auto transition-transform ${isReportMenuOpen ? 'rotate-180' : ''}" size="14"></i>
              </button>
              
              <div id="reports-submenu" class="mt-2 ml-4 space-y-1 border-l border-slate-700 pl-4 ${isReportMenuOpen ? 'block' : 'hidden'}">
                <button data-tab="status-monitor" class="report-sub-link flex w-full py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'status-monitor' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-200'}">Status Monitor</button>
              </div>
            </div>

            <div class="pt-2">
              ${renderNavItem('settings', 'settings', 'Konfigurasi')}
            </div>
          </nav>

          <div class="border-t border-slate-800 p-5 shrink-0 bg-slate-900/50 backdrop-blur-md">
            <button id="master-logout-btn" class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-xs uppercase tracking-widest">
              <i data-lucide="log-out" size="18"></i>
              <span>Keluar Sistem</span>
            </button>
          </div>
        </aside>

        <main class="flex-1 flex flex-col min-w-0 bg-[#0a0c10] relative overflow-hidden">
          <header class="flex h-20 items-center justify-between glass-header px-10 sticky top-0 z-40">
            <div class="flex items-center gap-6">
              <button id="toggle-sidebar-btn" class="rounded-2xl p-2.5 text-slate-300 hover:text-amber-500 transition-all shadow-xl bg-white/5 border border-white/5 active:scale-95">
                <i data-lucide="${isSidebarOpen ? 'panel-left-close' : 'panel-left-open'}" size="20"></i>
              </button>
              <div class="flex flex-col">
                <span class="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 leading-none">Navigator Node</span>
                <span class="text-xs font-black text-white uppercase italic tracking-tighter mt-1">${activeTab.replace('-', ' ')}</span>
              </div>
            </div>

            <div class="flex items-center gap-8">
              <div class="relative hidden xl:block">
                <i data-lucide="search" class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size="16"></i>
                <input id="master-search-input" type="text" placeholder="Access Command Registry..." class="h-10 w-80 rounded-2xl border border-white/5 bg-white/5 pl-14 pr-6 text-[10px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all focus:w-96 placeholder:opacity-30" value="${searchTerm}">
              </div>
              <div class="flex items-center gap-4">
                 <button id="master-notif-btn" class="relative rounded-2xl p-3 bg-white/5 border border-white/5 text-slate-400 hover:text-amber-500 hover:bg-white/10 transition-all active:scale-95">
                  <i data-lucide="bell" size="18"></i>
                  <span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black ring-4 ring-[#0a0c10] ${notificationCount > 0 ? '' : 'hidden'}">${notificationCount}</span>
                </button>
                <div class="h-10 w-10 overflow-hidden rounded-2xl border-2 border-white/10 bg-slate-800 shadow-2xl ring-1 ring-white/5 p-0.5">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Avatar" class="rounded-xl" />
                </div>
              </div>
            </div>
          </header>

          <div id="master-view-container" class="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_rgba(212,168,67,0.03),_transparent_40%)]">
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
    };

    container.querySelector('#toggle-sidebar-btn').onclick = () => {
      isSidebarOpen = !isSidebarOpen;
      renderLayout();
    };

    if (container.querySelector('#close-sidebar-btn')) {
      container.querySelector('#close-sidebar-btn').onclick = () => {
        isSidebarOpen = false;
        renderLayout();
      };
    }

    container.querySelector('#master-search-input').oninput = (e) => {
      searchTerm = e.target.value;
      loadMasterData();
    };

    container.querySelector('#master-notif-btn').onclick = () => {
      notificationCount = 0;
      renderLayout();
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

      // Calculate Metrics - Fix 'Rp 0' bug by broadening status check and parsing amounts
      globalRevenue = historyData
        .filter(h => {
          const s = (h.status || '').toLowerCase();
          return s === 'paid' || s === 'selesai' || s === 'success' || s === 'berhasil' || s === 'active';
        })
        .reduce((sum, h) => {
          let val = h.amount;
          if (typeof val === 'string') {
            val = val.replace(/[^0-9]/g, ''); 
          }
          return sum + (parseInt(val) || 0);
        }, 0);
        
      activeShopsCount = shopsData.filter(s => s.status === 'active').length;

      // Filter shops based on search
      const filteredShops = shopsData.filter(s => 
        (s.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
        (s.slug || '').toLowerCase().includes((searchTerm || '').toLowerCase())
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
    const performance = activeShops > 0 ? '+12.4%' : '0%';
    
    const chartData = [
      { month: 'JAN', value: 45 },
      { month: 'FEB', value: 52 },
      { month: 'MAR', value: 38 },
      { month: 'APR', value: 65 },
      { month: 'MAY', value: 48 },
      { month: 'JUN', value: 82 },
    ];

    viewPort.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-12 fade-in">
        <!-- Header & Action Terminal -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div class="space-y-1.5">
            <h1 class="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">System <span class="text-amber-500">Core</span></h1>
            <p class="text-slate-500 font-bold ml-0.5 text-[10px] uppercase tracking-[0.4em] opacity-80 pl-0.5">Global Architectural Command Terminal</p>
          </div>
          <button id="add-store-quick-btn" class="bg-amber-500 text-black px-7 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2.5 shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all active:scale-95 group">
            <i data-lucide="plus" size="16"></i> Provision New Node
          </button>
        </div>

        <!-- Stats Grid: Atelier Edition -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          ${renderStatCard('Total Registry', shopsData.length, 'store', performance, 'text-amber-500', 'bg-amber-500/10')}
          ${renderStatCard('Global Revenue', `Rp ${globalRevenue.toLocaleString('id-ID')}`, 'credit-card', 'LIVE', 'text-emerald-500', 'bg-emerald-500/10')}
          ${renderStatCard('Active Nodes', activeShops, 'shield-check', 'STABLE', 'text-blue-500', 'bg-blue-500/10')}
          ${renderStatCard('Anomalies', '0', 'alert-triangle', 'CLEAR', 'text-slate-500', 'bg-slate-500/10')}
        </div>

        <!-- System Intelligence & Metrics -->
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white/5 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-5">
              <i data-lucide="bar-chart-3" size="90"></i>
            </div>
            <div class="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 class="text-xl font-black text-white uppercase tracking-tighter">Architecture Growth</h3>
                <p class="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">6-Month Scalability Simulation</p>
              </div>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-3"><div class="h-1.5 w-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(212,168,67,0.6)]"></div><span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</span></div>
              </div>
            </div>
            
            <div class="flex items-end justify-between h-44 gap-5 px-1 relative z-10">
              ${chartData.map(d => `
                <div class="flex-1 flex flex-col items-center gap-4 group h-full">
                  <div class="w-full bg-white/5 rounded-2xl relative overflow-hidden h-full flex items-end border border-white/[0.02]">
                     <div class="w-full bg-gradient-to-t from-amber-600 to-amber-400 group-hover:brightness-125 transition-all duration-700 rounded-t-xl shadow-[0_0_20px_rgba(212,168,67,0.15)]" style="height: ${d.value}%"></div>
                  </div>
                  <span class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-amber-500 transition-colors">${d.month}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="space-y-6">
            <!-- System Health Console -->
            <div class="bg-amber-500 rounded-[2.5rem] p-6 text-black shadow-2xl shadow-amber-500/20 relative overflow-hidden">
               <div class="absolute -right-4 -bottom-4 opacity-10">
                 <i data-lucide="zap" size="100"></i>
               </div>
               <h3 class="text-lg font-black mb-6 flex items-center gap-3 uppercase tracking-tighter">
                  <i data-lucide="activity" size="18"></i> Node Status
               </h3>
               <div class="space-y-4 relative z-10">
                ${renderHealthRow('Matrix Relay', 'Online', 'bg-black')}
                ${renderHealthRow('Global Uplink', 'Stable', 'bg-black')}
                ${renderHealthRow('DB Load', '7%', 'bg-black/20')}
               </div>
            </div>

            <!-- Dominant Protocol -->
            <div class="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 shadow-2xl backdrop-blur-sm">
              <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5">Dominant Protocol</h3>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 bg-gradient-to-br from-amber-400 to-amber-600 text-black rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/10">
                  <i data-lucide="crown" size="22"></i>
                </div>
                <div>
                  <p class="font-black text-white text-base uppercase tracking-tight">Premium Arcs</p>
                  <p class="text-[9px] text-amber-500 font-black uppercase tracking-widest mt-0.5">${activeShops} Nodes Connected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Registry Console -->
        <div class="bg-white/5 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
          <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
             <div class="flex items-center gap-4">
               <i data-lucide="history" class="text-amber-500" size="20"></i>
               <h3 class="text-xl font-black text-white uppercase tracking-tighter">Command Registry</h3>
             </div>
             <button id="view-all-stores-btn" class="text-[10px] font-black text-amber-500 flex items-center gap-2 hover:brightness-125 uppercase tracking-widest transition-all">
              Full Directory <i data-lucide="arrow-up-right" size="14"></i>
             </button>
          </div>
          <div class="overflow-x-auto">
             <table class="w-full text-left text-sm">
              <thead class="bg-white/[0.02] text-slate-500 uppercase text-[9px] font-black tracking-[0.3em]">
                <tr>
                  <th class="px-10 py-6">Node Instance</th>
                  <th class="px-10 py-6">Relay Status</th>
                  <th class="px-10 py-6">Registry Date</th>
                  <th class="px-10 py-6 text-right">Access</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${shopsData.slice(0, 5).map(s => `
                  <tr class="hover:bg-white/[0.03] transition-all group">
                    <td class="px-10 py-6">
                       <div class="flex flex-col">
                         <span class="font-black text-white uppercase tracking-tight text-base">${s.name}</span>
                         <span class="text-[10px] font-bold text-slate-500 tracking-widest italic mt-0.5">ID: ARC-${s.id.slice(0,6).toUpperCase()}</span>
                       </div>
                    </td>
                    <td class="px-10 py-6">
                      <span class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'} border border-current/10">
                        <div class="h-1.5 w-1.5 ${s.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full animate-pulse"></div> ${s.status.toUpperCase()}
                      </span>
                    </td>
                    <td class="px-10 py-6 text-slate-400 font-bold tracking-tighter italic text-xs">${new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td class="px-10 py-6 text-right">
                       <button class="w-10 h-10 rounded-xl bg-white/5 text-slate-500 hover:text-amber-500 hover:bg-white/10 transition-all flex items-center justify-center mx-auto mr-0 quick-edit-shop" data-id="${s.id}">
                         <i data-lucide="chevron-right" size="18"></i>
                       </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
             </table>
          </div>
        </div>
      </div>
    `;

    function renderStatCard(label, val, icon, trend, colorClass, bgClass) {
      return `
        <div class="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl hover:bg-white/[0.08] transition-all duration-500 group relative overflow-hidden backdrop-blur-sm">
          <div class="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <i data-lucide="${icon}" size="60"></i>
          </div>
          <div class="flex justify-between items-start mb-6 relative z-10">
            <div class="p-3.5 ${bgClass} ${colorClass} rounded-2xl shadow-inner border border-white/5"><i data-lucide="${icon}" size="18"></i></div>
            <div class="flex items-center gap-1 ${colorClass} text-[8px] font-black ${bgClass} px-2.5 py-1 rounded-full uppercase italic tracking-tighter border border-current/10 whitespace-nowrap">${trend}</div>
          </div>
          <p class="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] relative z-10">${label}</p>
          <p class="text-2xl font-black mt-2 tabular-nums tracking-tighter text-white relative z-10">${val}</p>
        </div>
      `;
    }

    function renderHealthRow(label, status, badgeBg) {
      return `
        <div class="flex items-center justify-between bg-white/10 p-2.5 rounded-xl border border-white/10">
          <div class="flex items-center gap-2.5 text-black/70 font-bold text-[10px] uppercase tracking-tight">${label}</div>
          <span class="text-[8px] font-black uppercase text-white ${badgeBg} px-2 py-0.5 rounded-full tracking-widest">${status}</span>
        </div>
      `;
    }

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
      <div class="max-w-7xl mx-auto space-y-10 fade-in">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div class="space-y-2">
            <h1 class="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Node <span class="text-amber-500">Registry</span></h1>
            <p class="text-slate-500 font-bold ml-1 text-xs uppercase tracking-[0.4em] opacity-80">Global Unit Authorization & Control</p>
          </div>
          <button id="mgr-add-store-btn" class="bg-amber-500 text-black px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl shadow-amber-500/20 hover:brightness-110 transition-all active:scale-95 group">
            <i data-lucide="plus" size="18"></i> Provision New Instance
          </button>
        </div>

        <div class="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
           <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full text-left text-sm">
                <thead class="bg-white/[0.02] text-slate-500 font-black uppercase text-[9px] tracking-[0.3em]">
                  <tr>
                    <th class="px-8 py-7">Instance Identity</th>
                    <th class="px-8 py-7">Admin Gateway</th>
                    <th class="px-8 py-7">Access Level</th>
                    <th class="px-8 py-7">Status</th>
                    <th class="px-8 py-7 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  ${shops.map(shop => {
                      const plan = plansData.find(p => p.id === shop.plan_id);
                      const statusColor = shop.status === 'active' ? 'text-emerald-500 bg-emerald-500/10' : 
                                         (shop.status === 'trial' ? 'text-amber-500 bg-amber-500/10' : 'text-rose-500 bg-rose-500/10');
                      const dotColor = shop.status === 'active' ? 'bg-emerald-500' : 
                                      (shop.status === 'trial' ? 'bg-amber-500' : 'bg-rose-500');
                      return `
                        <tr class="hover:bg-white/[0.03] transition-all group">
                          <td class="px-8 py-7">
                            <div class="font-black text-white uppercase tracking-tight text-base mb-1">${shop.name}</div>
                            <div class="flex items-center gap-2 text-[10px] text-slate-500 font-bold italic line-clamp-1">
                              <i data-lucide="map-pin" size="12" class="text-amber-500/50"></i> ${shop.address || 'Uplink Unknown'}
                            </div>
                          </td>
                          <td class="px-8 py-7">
                             <div class="flex items-center gap-2.5 text-slate-300 font-bold text-xs">
                               <i data-lucide="phone" size="14" class="text-slate-500"></i> ${shop.phone || '-'}
                             </div>
                             <div class="flex items-center gap-2.5 text-[11px] text-amber-500 font-black uppercase tracking-widest mt-2">
                               <i data-lucide="user" size="14"></i> @${shop.slug}
                             </div>
                          </td>
                          <td class="px-8 py-7">
                             <span class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                               <i data-lucide="shield-check" size="12"></i> PREMIUM ACCESS
                             </span>
                          </td>
                          <td class="px-8 py-7">
                            <div class="flex items-center gap-3 px-4 py-2 rounded-full w-fit border border-current/10 ${statusColor}">
                              <span class="h-1.5 w-1.5 rounded-full ${dotColor} animate-pulse"></span>
                               <span class="font-black text-[9px] uppercase tracking-[0.2em]">${shop.status}</span>
                            </div>
                          </td>
                          <td class="px-8 py-7 text-right">
                            <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                               <button class="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-amber-500 hover:bg-white/10 transition-all flex items-center justify-center store-edit-btn" data-id="${shop.id}"><i data-lucide="edit-3" size="18"></i></button>
                               <button class="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center store-delete-btn" data-id="${shop.id}"><i data-lucide="trash-2" size="18"></i></button>
                            </div>
                          </td>
                        </tr>
                      `;
                  }).join('')}
                </tbody>
              </table>
              ${shops.length === 0 ? `<div class="py-32 text-center flex flex-col items-center gap-4">
                <div class="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-700">
                   <i data-lucide="inbox" size="40"></i>
                </div>
                <p class="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">Command Result: Zero Nodes Found</p>
              </div>` : ''}
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
    viewPort.innerHTML = `
      <div class="max-w-2xl mx-auto py-32 text-center space-y-6 fade-in">
        <div class="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-500/20">
          <i data-lucide="unlocked" size="32"></i>
        </div>
        <h2 class="text-3xl font-black text-white uppercase tracking-tighter italic">Open Access Protocol</h2>
        <p class="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">Tier selection has been deprecated. All units now operate under the <span class="text-amber-500">Premium Architecture</span> by default to ensure maximum reliability and feature availability.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  function renderSettingsView(viewPort) {
    const isMaintenance = localStorage.getItem('master_maintenance') === 'true';
    viewPort.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-16 fade-in py-10">
        <section class="space-y-4">
          <div class="inline-flex items-center gap-3 px-5 py-2 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-amber-500/20 shadow-[0_0_20px_rgba(212,168,67,0.1)]">
            <i data-lucide="cpu" size="14"></i> Platform Core V3.0.4
          </div>
          <h2 class="text-6xl font-black text-white uppercase italic tracking-tighter leading-tight">System <span class="text-amber-500">Parameters</span></h2>
          <p class="text-slate-500 text-sm font-bold uppercase tracking-[0.3em] opacity-80 pl-1">Global Matrix, Uplink Security, & Module Authorization</p>
        </section>

        <section class="grid gap-12">
          <!-- Identity Registry -->
          <div class="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-12 backdrop-blur-sm relative overflow-hidden">
             <div class="absolute -right-8 -top-8 p-10 opacity-[0.03]">
               <i data-lucide="settings" size="160"></i>
             </div>
             <div class="flex items-center gap-8 relative z-10">
                <div class="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-2xl">
                   <i data-lucide="globe" size="40"></i>
                </div>
                <div>
                   <h4 class="text-3xl font-black text-white uppercase tracking-tighter">Matrix Metadata</h4>
                   <p class="text-[10px] text-amber-500/60 font-black uppercase tracking-widest italic mt-1">Core Naming & Architecture Support</p>
                </div>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div class="space-y-4">
                   <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Broadcast Identity</label>
                   <input class="w-full bg-white/5 border border-white/5 rounded-[2rem] py-6 px-10 text-xs font-black text-white tracking-widest focus:ring-1 focus:ring-amber-500/40 transition-all outline-none placeholder:opacity-20" type="text" value="BarberPro Enterprise Master" />
                </div>
                <div class="space-y-4">
                   <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Uplink Gateway</label>
                   <input class="w-full bg-white/5 border border-white/5 rounded-[2rem] py-6 px-10 text-xs font-black text-white tracking-widest focus:ring-1 focus:ring-amber-500/40 transition-all outline-none placeholder:opacity-20" type="email" value="architect@barberpro.io" />
                </div>
             </div>
          </div>

          <!-- Master Killswitches -->
          <div class="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-12 backdrop-blur-sm relative overflow-hidden">
             <div class="absolute -right-8 -top-8 p-10 opacity-[0.03]">
               <i data-lucide="shield-alert" size="160"></i>
             </div>
             <div class="flex items-center gap-8 relative z-10">
                <div class="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl">
                   <i data-lucide="zap-off" size="40"></i>
                </div>
                <div>
                   <h4 class="text-3xl font-black text-white uppercase tracking-tighter">Emergency Protocol</h4>
                   <p class="text-[10px] text-rose-500/60 font-black uppercase tracking-widest italic mt-1">Matrix Killswitches & AI Suppression</p>
                </div>
             </div>

             <div class="space-y-6 relative z-10">
                <div class="flex items-center justify-between p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 hover:bg-white/[0.05] transition-all group">
                   <div class="flex gap-6">
                      <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors">
                        <i data-lucide="pause-circle" size="24"></i>
                      </div>
                      <div>
                        <p class="font-black text-white text-base tracking-tight uppercase">Maintenance Lock</p>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Restrict all non-master uplink access</p>
                      </div>
                   </div>
                   <button onclick="toggleMaintenance()" class="px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isMaintenance ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-white/5 text-slate-400 hover:text-white'}">
                      ${isMaintenance ? 'ACTIVE' : 'READY'}
                   </button>
                </div>
             </div>
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
      'CORE ENGINE': ['dashboard', 'appointments', 'customers', 'services', 'portal'],
      'OPERATIONAL': ['queue', 'barbers', 'attendance', 'pos', 'payments', 'promos', 'reports', 'expenses'],
      'ECOSYSTEM': ['inventory', 'memberships', 'gallery', 'logbook']
    };

    const body = `
      <div class="space-y-6 py-2">
         <!-- Preset Control Group -->
         <div class="flex items-center justify-between bg-black/20 p-2 rounded-xl mb-4">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Preset Matrix:</span>
            <div class="flex gap-1">
               ${['LITE', 'PRO', 'ULTIMATE'].map(p => `
                 <button class="preset-btn px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700 transition-all" data-preset="${p}">${p}</button>
               `).join('')}
            </div>
         </div>

         <div class="grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar max-h-[60vh] overflow-y-auto px-1">
            ${Object.entries(featureTaxonomy).map(([cat, fids]) => `
               <div class="space-y-3">
                  <h5 class="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span class="w-1 h-1 bg-amber-500 rounded-full"></span> ${cat}
                  </h5>
                  <div class="space-y-2">
                     ${fids.map(fid => {
                       const isChecked = (Array.isArray(plan.features) ? plan.features : []).includes(fid);
                       return `
                        <label class="feature-card group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isChecked ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900/50 border-white/5 hover:border-slate-700'}">
                           <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-lg flex items-center justify-center ${isChecked ? 'bg-amber-500 text-black shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'} transition-all">
                                <i data-lucide="zap" size="14"></i>
                              </div>
                              <span class="text-[11px] font-bold uppercase tracking-widest ${isChecked ? 'text-white' : 'text-slate-500'} group-hover:text-slate-300 transition-colors">${fid.replace(/-/g, ' ')}</span>
                           </div>
                           <input type="checkbox" name="features" value="${fid}" ${isChecked ? 'checked' : ''} class="feature-cb w-5 h-5 rounded border-white/10 text-amber-500 focus:ring-amber-500/20 bg-slate-900 pointer-events-none appearance-none ${isChecked ? 'bg-[url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C/polyline%3E%3C/svg%3E\')] bg-amber-500' : 'bg-slate-800'}" />
                        </label>
                       `;
                     }).join('')}
                  </div>
               </div>
            `).join('')}
         </div>
      </div>
    `;

    const footer = `
      <div class="w-full flex gap-3">
        <button class="btn border border-white/5 bg-white/5 text-slate-400 hover:text-white px-6 w-1/3" onclick="closeModal()">Batal</button>
        <button id="save-plan-btn" class="flex-1 py-4 bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black uppercase tracking-[0.3em] rounded-xl shadow-xl shadow-amber-600/20 hover:brightness-110 active:scale-95 transition-all text-[11px] flex items-center justify-center gap-3">
            <i data-lucide="save" size="16"></i> SIMPAN KONFIGURASI TIER
        </button>
      </div>
    `;

    openModal(`Matriks Arsitektur: ${plan.name}`, body, footer, { maxWidth: '720px' });
    if (window.lucide) window.lucide.createIcons();

    // Visual helper for card toggle
    const updateCardVisual = (card, isChecked) => {
      if (isChecked) {
        card.classList.add('bg-amber-500/10', 'border-amber-500/40');
        card.classList.remove('bg-slate-900/50', 'border-white/5');
        const iconDiv = card.querySelector('.w-8');
        iconDiv.classList.add('bg-amber-500', 'text-black', 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]');
        iconDiv.classList.remove('bg-slate-800', 'text-slate-500');
        card.querySelector('span').classList.add('text-white');
        card.querySelector('span').classList.remove('text-slate-500');
        const cb = card.querySelector('.feature-cb');
        cb.classList.add('bg-amber-500');
        cb.classList.add('bg-[url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C/polyline%3E%3C/svg%3E\')]');
        cb.classList.remove('bg-slate-800');
      } else {
        card.classList.remove('bg-amber-500/10', 'border-amber-500/40');
        card.classList.add('bg-slate-900/50', 'border-white/5');
        const iconDiv = card.querySelector('.w-8');
        iconDiv.classList.remove('bg-amber-500', 'text-black', 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]');
        iconDiv.classList.add('bg-slate-800', 'text-slate-500');
        card.querySelector('span').classList.remove('text-white');
        card.querySelector('span').classList.add('text-slate-500');
        const cb = card.querySelector('.feature-cb');
        cb.classList.remove('bg-amber-500', 'bg-[url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C/polyline%3E%3C/svg%3E\')]');
        cb.classList.add('bg-slate-800');
      }
    };

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = () => {
        const preset = btn.dataset.preset;
        const toCheck = [];
        toCheck.push(...featureTaxonomy['CORE ENGINE']);
        if (preset === 'PRO' || preset === 'ULTIMATE') toCheck.push(...featureTaxonomy['OPERATIONAL']);
        if (preset === 'ULTIMATE') toCheck.push(...featureTaxonomy['ECOSYSTEM']);

        document.querySelectorAll('input[name="features"]').forEach(cb => {
          cb.checked = toCheck.includes(cb.value);
          updateCardVisual(cb.closest('.feature-card'), cb.checked);
        });
        showToast(`Preset ${preset} diterapkan`, 'info');
        
        // Visual indicator for preset buttons
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('border-amber-500', 'text-amber-500', 'bg-amber-500/10'));
        btn.classList.add('border-amber-500', 'text-amber-500', 'bg-amber-500/10');
      };
    });

    document.querySelectorAll('.feature-card').forEach(card => {
      card.onclick = () => {
        const cb = card.querySelector('input[name="features"]');
        cb.checked = !cb.checked;
        updateCardVisual(card, cb.checked);
        // Clear preset buttons highlight if manually tweaked
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('border-amber-500', 'text-amber-500', 'bg-amber-500/10'));
      };
    });

    document.querySelector('#save-plan-btn').onclick = async () => {
      const selected = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(i => i.value);
      const { error } = await supabase.from('subscription_plans').update({ features: selected }).eq('id', id);
      if (!error) {
        showToast('Konfigurasi Berhasil Disinkronkan', 'success');
        closeModal();
        loadMasterData();
      }
    };
  }

  async function handleManageShop(shopId) {
    const shop = shopsData.find(s => s.id === shopId);
    if (!shop) return;

    const body = `
      <style>
        /* Scoped override for modal inside SuperAdmin */
        #active-modal .modal {
          background: #0c0e12 !important;
          border: 1px solid rgba(245, 158, 11, 0.4) !important;
          box-shadow: 0 0 50px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.1) !important;
          color: #ffffff !important;
        }
        #active-modal .modal-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 24px 30px !important;
        }
        #active-modal .modal-header h3 {
          color: #f5ae12 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 2px !important;
        }
        #active-modal .modal-close {
          color: #94a3b8 !important;
          background: rgba(255,255,255,0.05) !important;
        }
        #active-modal .modal-body {
          padding: 30px !important;
          background: radial-gradient(circle at top right, rgba(245, 158, 11, 0.05), transparent) !important;
        }
      </style>

      <div style="color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;">
         <!-- Header -->
         <div style="display:flex;align-items:center;gap:18px;margin-bottom:30px;">
            <div style="width:64px;height:64px;border-radius:20px;background:rgba(245,158,11,0.15);border:2px solid rgba(245,158,11,0.3);display:flex;align-items:center;justify-content:center;font-weight:900;color:#f5ae12;font-size:28px;box-shadow:0 12px 30px -10px rgba(245,158,11,0.4);">
                ${shop.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h4 style="font-size:24px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-1px;margin:0;line-height:1.1;">${shop.name}</h4>
                <p style="font-size:10px;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:4px;font-style:italic;margin:8px 0 0;opacity:0.8;">Operational Protocol Node</p>
            </div>
         </div>

         <!-- Admin Account Section -->
         <div id="shop-admin-account-section" style="background:rgba(255,255,255,0.04);padding:24px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);margin-bottom:24px;box-shadow: inset 0 0 40px rgba(255,255,255,0.02);">
            <h5 style="font-size:10px;font-weight:900;color:#f59e0b;text-transform:uppercase;letter-spacing:3px;margin:0 0 16px;display:flex;align-items:center;gap:10px;">
              <i data-lucide="user-shield" size="14"></i> Otoritas Admin Unit
            </h5>
            <div id="admin-info-container">
               <div style="display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(255,255,255,0.02);border-radius:16px;border:1px dashed rgba(255,255,255,0.15);">
                  <i data-lucide="loader-2" class="animate-spin" style="color:#f5ae12;" size="24"></i>
               </div>
            </div>
         </div>

         <div style="display:flex;flex-direction:column;gap:24px;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <label style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;padding-left:6px;">Status Operasional Unit</label>
              <select id="edit-shop-status" style="width:100%;background:#1e293b;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:16px 20px;font-size:13px;font-weight:900;color:#ffffff;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;transition:all 0.3s;box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                <option value="trial" style="background:#1e293b;color:#fff;" ${shop.status === 'trial' ? 'selected' : ''}>TRIAL MODE (UNPAID)</option>
                <option value="active" style="background:#1e293b;color:#fff;" ${shop.status === 'active' ? 'selected' : ''}>ACTIVE PROTOCOL (SINKRON)</option>
                <option value="expired" style="background:#1e293b;color:#fff;" ${shop.status === 'expired' ? 'selected' : ''}>EXPIRED / TERMINATED</option>
                <option value="deactivated" style="background:#1e293b;color:#fff;" ${shop.status === 'deactivated' ? 'selected' : ''}>UNIT SUSPENDED</option>
              </select>
            </div>
         </div>

         <div style="padding-top:30px;margin-top:30px;border-top:1px solid rgba(255,255,255,0.08);">
            <button id="update-node-btn" style="width:100%;padding:18px;background:linear-gradient(135deg, #d97706, #f5b012);color:#000;font-weight:900;text-transform:uppercase;letter-spacing:5px;border-radius:18px;border:none;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 15px 35px -10px rgba(245,158,11,0.5);transition:all 0.3s transform active:scale-95;">
                <i data-lucide="save" size="18"></i> Otorisasi Perubahan
            </button>
         </div>
      </div>
    `;

    openModal(`Kontrol Node: ${shop.name}`, body, '', { maxWidth: '480px' });
    if (window.lucide) window.lucide.createIcons();

    // Fetch Admin Account
    const { data: adminProfiles } = await supabase.from('profiles').select('*').eq('shop_id', shopId).eq('role', 'admin');
    const adminInfoContainer = document.getElementById('admin-info-container');
    
    if (adminProfiles && adminProfiles.length > 0) {
      const admin = adminProfiles[0];
      adminInfoContainer.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
          <div style="flex:1;">
            <p style="font-size:16px;font-weight:900;color:#ffffff;margin:0;letter-spacing:-0.5px;">${admin.full_name}</p>
            <p style="font-size:11px;font-weight:700;color:#f5ae12;margin:4px 0 0;opacity:0.9;">@${admin.username}</p>
          </div>
          <span style="padding:8px 16px;background:rgba(16,185,129,0.15);color:#34d399;border-radius:99px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;border:1px solid rgba(16,185,129,0.3);box-shadow:0 4px 12px rgba(16,185,129,0.1);">CONNECTED</span>
        </div>
      `;
    } else {
      adminInfoContainer.innerHTML = `
        <div style="text-align:center;padding:16px 0;">
          <p style="font-size:10px;font-weight:700;color:#94a3b8;margin-bottom:16px;text-transform:uppercase;letter-spacing:3px;">Tidak Ada Protokol Admin Terdeteksi</p>
          <button id="create-admin-account-btn" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);font-size:11px;font-weight:900;color:#f5ae12;text-transform:uppercase;letter-spacing:2px;cursor:pointer;display:flex;align-items:center;gap:10px;margin:0 auto;padding:10px 20px;border-radius:12px;transition:all 0.2s;">
            <i data-lucide="plus-circle" size="16"></i> TERBITKAN AKSES SEKARANG
          </button>
        </div>
      `;
      const btn = document.getElementById('create-admin-account-btn');
      if (btn) btn.onclick = () => renderAdminProvisioning(shopId, shop.name);
    }

    document.querySelector('#update-node-btn').onclick = async () => {
      const status = document.getElementById('edit-shop-status').value;
      
      // 🚀 UNIFIED SYNC: All shops are now Premium/Full by default
      const { error } = await supabase.from('shops')
        .update({ 
          status, 
          plan: 'Premium Access' 
        })
        .eq('id', shopId);
      
      if (!error) {
        showToast('Node Berhasil Diperbarui & Arsitektur Terbuka', 'success');
        closeModal();
        loadMasterData();
      }
    };
  }

  function renderAddStoreFlow(viewPort) {
    let step = 1;
    let selectedTier = '';
    let payload = { 
      name: '', address: '', phone: '', slug: '',
      adminFullName: '', adminUsername: '', adminPassword: ''
    };

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
          
          // 🚀 DIRECT DEPLOY: Skip Tier Selection (Step 2)
          deployNewUnit();
        };

        viewPort.querySelector('#cancel-flow').onclick = () => loadMasterData();

        async function deployNewUnit() {
          const viewPort = container.querySelector('#master-view-container');
          viewPort.innerHTML = `
            <div class="max-w-2xl mx-auto py-20 text-center space-y-8 fade-in">
               <div class="inline-flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-blue-600/10 text-blue-600 border border-blue-600/20 shadow-2xl mb-4">
                  <i data-lucide="loader-2" class="animate-spin" size="40"></i>
               </div>
               <h2 class="text-4xl font-black text-slate-900 uppercase tracking-tighter">Initializing Hub...</h2>
               <p class="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Provisioning Open-Access Architecture</p>
            </div>
          `;
          if (window.lucide) window.lucide.createIcons();

          const { data: newShop, error: shopError } = await supabase.from('shops').insert([{
            name: payload.name, 
            slug: payload.slug,
            address: payload.address,
            phone: payload.phone,
            status: 'active',
            plan: 'Premium Access'
          }]).select().single();

          if (shopError) {
            showToast(shopError.message, 'error');
            step = 1; render();
            return;
          }

          showToast('Unit Berhasil Dideploy ke Network', 'success');
          step = 3; render();
        }
      } else if (step === 3) {
        viewPort.innerHTML = `
          <div class="max-w-2xl mx-auto space-y-10 fade-in py-10">
             <div class="text-center space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                  <i data-lucide="user-shield" size="12"></i> Penugasan Otoritas
                </div>
                <h2 class="text-4xl font-black text-slate-900 uppercase tracking-tighter">Akun Admin Unit</h2>
                <div class="flex justify-center gap-2 mt-4">
                  <div class="h-1.5 w-12 bg-blue-600/30 rounded-full"></div>
                  <div class="h-1.5 w-12 bg-blue-600/30 rounded-full"></div>
                  <div class="h-1.5 w-12 bg-blue-600 rounded-full"></div>
                </div>
             </div>

             <div class="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div class="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <i data-lucide="info" class="text-blue-600 shrink-0 mt-1" size="20"></i>
                  <p class="text-xs font-bold text-blue-900 leading-relaxed">
                    Toko berhasil didaftarkan. Sekarang buat akun Admin (Owner) agar toko bisa mulai mengelola unit mereka.
                  </p>
                </div>

                <div class="space-y-2">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Owner</label>
                   <input id="in-admin-name" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all" value="${payload.adminFullName}" placeholder="Contoh: Andi Herlambang" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                   <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username Login</label>
                      <input id="in-admin-user" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all" value="${payload.adminUsername}" placeholder="andi_barber" />
                   </div>
                   <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                      <input id="in-admin-pass" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all" value="${payload.adminPassword}" placeholder="••••••" />
                   </div>
                </div>
                
                <div class="flex justify-between items-center pt-6">
                   <button id="skip-admin-btn" class="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors font-black">LEWATI (BUAT NANTI)</button>
                   <button id="final-account-btn" class="px-8 py-4 bg-blue-600 text-white font-black uppercase text-[11px] rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                     Sinkronisasi Akun Admin <i data-lucide="check" size="14"></i>
                   </button>
                </div>
             </div>
          </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        viewPort.querySelector('#skip-admin-btn').onclick = () => loadMasterData();
        
        viewPort.querySelector('#final-account-btn').onclick = async () => {
          const name = document.getElementById('in-admin-name').value;
          const user = document.getElementById('in-admin-user').value;
          const pass = document.getElementById('in-admin-pass').value;

          if (!name || !user || !pass) return showToast('Harap isi data akun admin', 'warning');
          
          const btn = viewPort.querySelector('#final-account-btn');
          btn.disabled = true;
          btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" size="18"></i> <span>PROVISIONING...</span>`;
          if (window.lucide) window.lucide.createIcons();

          // Get latest shop (the one we just created)
          const { data: shops } = await supabase.from('shops').select('id').eq('slug', payload.slug).maybeSingle();
          if (!shops) return showToast('Shop ID Not Found', 'danger');

          const success = await createAdminAccount(shops.id, name, user, pass);
          if (success) {
            showToast('Akun Admin Berhasil Diterbitkan', 'success');
            loadMasterData();
          } else {
            btn.disabled = false;
            btn.innerHTML = `Sinkronisasi Akun Admin <i data-lucide="check" size="14"></i>`;
            if (window.lucide) window.lucide.createIcons();
          }
        };
      }
    }
    render();
  }

  // --- HELPER: ADVANCED PROVISIONING ---
  
  async function createAdminAccount(shopId, fullName, username, password) {
    // 🚀 USE SECONDARY CLIENT to create user without session side-effects
    const supabaseUrl = 'https://lottgkrtjwbyhxtjjkge.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdHRna3J0andieWh4dGpqa2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTQ2MTUsImV4cCI6MjA5MDA5MDYxNX0._675IGU-TOakpqrX0P3OCB68Ef0xY4jVdl_bRIaRuzw';
    
    // Client configured to NOT persist session - prevents SuperAdmin from being logged out
    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    try {
      const email = `${username.toLowerCase()}@barberpro.local`;
      const { data: authData, error: authErr } = await tempSupabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role: 'admin', username } }
      });

      if (authErr) {
        if (authErr.message.toLowerCase().includes('already registered')) {
            alert(`GAGAL: Username '${username}' sudah digunakan oleh pengguna di unit lain. Karena 1 sistem BarberPro terpusat, setiap unit harus memiliki username admin yang unik (contoh: admin_${username}). Silakan ganti username Anda.`);
            showToast(`Username '${username}' tidak tersedia.`, 'danger');
        } else {
            alert(`GAGAL AUTENTIKASI: ${authErr.message}`);
            showToast(`Auth Error: ${authErr.message}`, 'danger');
        }
        return false;
      }

      const userId = authData.user?.id;
      if (!userId) {
        showToast('Auth Failure: No User ID returned', 'danger');
        return false;
      }

      // 🔑 Profile is AUTO-CREATED by Supabase trigger on signUp.
      // We just need to UPDATE it with shop_id and role.
      const { error: profErr } = await tempSupabase.from('profiles').update({
        full_name: fullName,
        username: username,
        role: 'admin',
        shop_id: shopId
      }).eq('id', userId);

      if (profErr) {
        console.error('Profile update error:', profErr);
        // Fallback: try upsert with main supabase client
        const { error: profErr2 } = await supabase.from('profiles').upsert([{
          id: userId,
          full_name: fullName,
          username: username,
          role: 'admin',
          shop_id: shopId
        }], { onConflict: 'id' });
        if (profErr2) {
          console.error('Profile upsert fallback error:', profErr2);
          showToast(`Profile Error: ${profErr2.message}`, 'danger');
          return false;
        }
      }

      // 🎁 Create Default Settings for the Shop to ensure sidebar shows correct name
      // Fetch shop details first
      const { data: shop } = await supabase.from('shops').select('name, address, phone').eq('id', shopId).single();
      
      const { error: settErr } = await tempSupabase.from('settings').insert([{
        shop_id: shopId,
        shop_name: shop?.name || 'BarberPro',
        address: shop?.address || '',
        phone: shop?.phone || '',
        currency: 'Rp',
        opening_hours: '{"mon": "09:00 - 21:00", "tue": "09:00 - 21:00", "wed": "09:00 - 21:00", "thu": "09:00 - 21:00", "fri": "09:00 - 21:00", "sat": "09:00 - 22:00", "sun": "09:00 - 22:00"}'
      }]);

      if (settErr) {
        console.warn('Settings insert via tempSupabase failed, trying main client:', settErr.message);
        await supabase.from('settings').insert([{
          shop_id: shopId,
          shop_name: shop?.name || 'BarberPro',
          address: shop?.address || '',
          phone: shop?.phone || '',
          currency: 'Rp',
          opening_hours: '{"mon": "09:00 - 21:00", "tue": "09:00 - 21:00", "wed": "09:00 - 21:00", "thu": "09:00 - 21:00", "fri": "09:00 - 21:00", "sat": "09:00 - 22:00", "sun": "09:00 - 22:00"}'
        }]);
      }

      return true;
    } catch (err) {
      console.error('Provisioning exception:', err);
      showToast('EXCEPTION: ' + err.message, 'danger');
      return false;
    }
  }

  function renderAdminProvisioning(shopId, shopName) {
    const body = `
      <div style="padding:10px; color: #fff;">
         <div style="text-align:center;margin-bottom:30px;">
            <div style="width:64px;height:64px;background:rgba(245,158,11,0.15);color:#f5ae12;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:2px solid rgba(245,158,11,0.3);box-shadow:0 12px 25px -10px rgba(245,158,11,0.4);">
              <i data-lucide="user-plus" size="28"></i>
            </div>
            <h4 style="font-size:24px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-1px;margin:0;">Otoritas Baru</h4>
            <p style="font-size:10px;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin:8px 0 0;opacity:0.8;">Menerbitkan Akun Admin untuk ${shopName}</p>
         </div>

         <div style="display:flex;flex-direction:column;gap:20px;">
            <div style="display:flex;flex-direction:column;gap:10px;">
               <label style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;padding-left:6px;">Nama Lengkap Admin</label>
               <input id="prov-admin-name" style="width:100%;background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px 20px;font-size:14px;font-weight:700;color:#ffffff;outline:none;transition:all 0.3s;" placeholder="Andi Herlambang" />
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
               <label style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;padding-left:6px;">Username Login</label>
               <input id="prov-admin-user" style="width:100%;background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px 20px;font-size:14px;font-weight:700;color:#ffffff;outline:none;transition:all 0.3s;" placeholder="andi_barber" />
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
               <label style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;padding-left:6px;">Password</label>
               <input id="prov-admin-pass" type="password" style="width:100%;background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px 20px;font-size:14px;font-weight:700;color:#ffffff;outline:none;transition:all 0.3s;" placeholder="••••••" />
            </div>
         </div>

         <div style="padding-top:30px;margin-top:30px;border-top:1px solid rgba(255,255,255,0.08);">
            <button id="execute-provision-btn" style="width:100%;padding:18px;background:linear-gradient(135deg, #d97706, #f5b012);color:#000;font-weight:900;text-transform:uppercase;letter-spacing:4px;border-radius:18px;border:none;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 15px 35px -10px rgba(245,158,11,0.5);transition:all 0.3s;">
                <i data-lucide="shield-check" size="18"></i> Terbitkan Sertifikat Akun
            </button>
         </div>
      </div>
    `;

    openModal(`Provisioning Admin Account`, body, '', { maxWidth: '400px' });
    
    document.getElementById('execute-provision-btn').onclick = async () => {
      const name = document.getElementById('prov-admin-name').value;
      const user = document.getElementById('prov-admin-user').value;
      const pass = document.getElementById('prov-admin-pass').value;

      if (!name || !user || !pass) return showToast('Lengkapi data akun', 'warning');

      const btn = document.getElementById('execute-provision-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROVISIONING...';

      const success = await createAdminAccount(shopId, name, user, pass);
      if (success) {
        showToast('Akun Admin Berhasil Ditambahkan', 'success');
        closeModal();
        loadMasterData();
      } else {
        btn.disabled = false;
        btn.innerHTML = 'Terbitkan Sertifikat Akun';
      }
    };
  }

  function setupNotifications() {
      notificationCount = historyData.filter(h => h.status === 'pending').length;
  }


  async function handleDeleteShop(id) {
    if (!confirm('PERINGATAN: Otorisasi penghapusan unit secara permanen? Data arsitektur unit akan hilang dari registry.')) return;
    const { error } = await supabase.from('shops').delete().eq('id', id);
    if (!error) {
      showToast('Node Registry Purged Successfully', 'success');
      loadMasterData();
    }
  }

  setupNotifications();
  initTheme();
  renderLayout();
  loadMasterData();
}
