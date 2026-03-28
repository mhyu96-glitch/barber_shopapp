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
    container.innerHTML = `
      <style>
        .gold-gradient { background: linear-gradient(135deg, #f2ca50 0%, #d4af37 100%); }
        .glass-header { background: rgba(17, 19, 28, 0.6); backdrop-filter: blur(20px); }
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
            <a href="#" class="sidebar-link ${activeTab === 'overview' ? 'active' : ''} text-[#d0c5af] flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-all" data-tab="overview">
              <span class="material-symbols-outlined" data-fill="1">dashboard</span>
              <span>Overview</span>
            </a>
            <a href="#" class="sidebar-link ${activeTab === 'tenants' ? 'active' : ''} text-[#d0c5af] flex items-center gap-3 px-4 py-3 hover:bg-[#282933] hover:text-[#f2ca50] rounded-sm transition-all" data-tab="tenants">
              <span class="material-symbols-outlined" data-fill="${activeTab === 'tenants' ? 1 : 0}">storefront</span>
              <span>Tenants</span>
            </a>
            <a href="#" class="sidebar-link ${activeTab === 'revenue' ? 'active' : ''} text-[#d0c5af] flex items-center gap-3 px-4 py-3 hover:bg-[#282933] hover:text-[#f2ca50] rounded-sm transition-all" data-tab="revenue">
              <span class="material-symbols-outlined" data-fill="${activeTab === 'revenue' ? 1 : 0}">payments</span>
              <span>Revenue</span>
            </a>
            <a href="#" class="sidebar-link ${activeTab === 'plans' ? 'active' : ''} text-[#d0c5af] flex items-center gap-3 px-4 py-3 hover:bg-[#282933] hover:text-[#f2ca50] rounded-sm transition-all" data-tab="plans">
              <span class="material-symbols-outlined" data-fill="${activeTab === 'plans' ? 1 : 0}">hourglass_empty</span>
              <span>Plans & Features</span>
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
    container.querySelector('#master-refresh-btn')?.addEventListener('click', loadMasterData);
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

      if (activeTab === 'overview' || activeTab === 'tenants') {
        renderShopsTab(contentArea, shops, plans, globalPayments, globalAppts, activeTab === 'overview');
      } else if (activeTab === 'revenue') {
        renderRevenueTab(contentArea, shops, plans);
      } else if (activeTab === 'plans') {
        renderPlansTab(contentArea, plans);
      } else if (activeTab === 'analytics') {
        renderAnalyticsTab(contentArea, shops, globalPayments, globalAppts);
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

  function renderShopsTab(contentArea, shops, plans, payments, appointments, isOverview = false) {
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

    contentArea.innerHTML = `
      <!-- Hero Header Section -->
      ${isOverview ? `
      <section class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 fade-in">
        <div>
          <h2 class="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Master Control Center</h2>
          <p class="text-on-surface-variant max-w-xl font-medium">Welcome back, Director. You are currently overseeing ${shops.length} active global nodes and monitoring revenue streams.</p>
        </div>
        <div class="flex items-center gap-3">
          <button id="add-shop-btn-hero" class="px-6 py-2.5 rounded-lg gold-gradient text-on-primary font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">add_circle</span>
            <span>New Tenant</span>
          </button>
        </div>
      </section>
      ` : ''}

      ${criticalShops.length > 0 ? `
        <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 flex items-center justify-between text-primary fade-in">
          <div class="flex items-center gap-3 font-medium">
            <span class="material-symbols-outlined">warning</span>
            <span><strong>Urgent Warning:</strong> ${criticalShops.length} tenants have critical active periods (< 3 days).</span>
          </div>
          <button class="hover:bg-primary/10 p-1 rounded-lg transition-colors" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ` : ''}

      <!-- Metrics Grid -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 fade-in">
        <div class="bg-surface-container p-8 rounded-lg relative overflow-hidden group border border-white/5">
          <div class="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-3xl">payments</span>
            </div>
            <span class="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded uppercase tracking-wider">Estimated MRR</span>
          </div>
          <h3 class="text-3xl font-black font-headline text-on-surface tracking-tighter">Rp ${mrr.toLocaleString('id-ID')}</h3>
          <div class="mt-4 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span class="text-primary flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">trending_up</span> 100%
            </span>
            <span>Health Status</span>
          </div>
        </div>
        <div class="bg-surface-container p-8 rounded-lg relative overflow-hidden group border border-white/5">
          <div class="absolute top-0 left-0 w-1 h-full bg-emerald-500/40"></div>
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <span class="material-symbols-outlined text-3xl">group</span>
            </div>
            <span class="text-[10px] font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded uppercase tracking-wider">Active Tenants</span>
          </div>
          <h3 class="text-3xl font-black font-headline text-on-surface tracking-tighter">${activeShops.length}</h3>
          <div class="mt-4 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span>Operational Nodes</span>
          </div>
        </div>
        <div class="bg-surface-container p-8 rounded-lg relative overflow-hidden group border border-white/5">
          <div class="absolute top-0 left-0 w-1 h-full bg-blue-400/40"></div>
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400">
              <span class="material-symbols-outlined text-3xl">hourglass_bottom</span>
            </div>
            <span class="text-[10px] font-bold text-blue-400 px-2 py-1 bg-blue-400/10 rounded uppercase tracking-wider">Trials</span>
          </div>
          <h3 class="text-3xl font-black font-headline text-on-surface tracking-tighter">${trialShops.length}</h3>
          <div class="mt-4 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span>In-funnel Prospects</span>
          </div>
        </div>
      </section>

      <!-- Tenant Management Section -->
      <section class="bg-surface-container rounded-xl p-1 fade-in border border-white/5 shadow-2xl">
        <div class="p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h4 class="text-xl font-bold font-headline text-on-surface">Tenant Management</h4>
              <p class="text-sm text-on-surface-variant font-medium">Managing your global network of barber shop franchises.</p>
            </div>
            <p class="text-[10px] uppercase tracking-widest text-outline font-bold bg-white/5 px-3 py-1.5 rounded text-on-surface-variant">
              Total: ${shops.length} registered
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr class="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  <th class="px-6 py-3">Tenant Identity</th>
                  <th class="px-6 py-3">Identifier (Slug)</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody class="text-sm">
                ${shops.map((shop, index) => {
                  const plan = plans?.find(p => p.id === shop.plan_id);
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
                          <p class="text-[10px] text-on-surface-variant font-medium">Registered: ${getTimeAgo(shop.created_at)}</p>
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

    // Re-bind listeners
    contentArea.querySelectorAll('.manage-btn').forEach(btn => btn.onclick = () => handleManageShop(btn.dataset.id, currentPlans));
    contentArea.querySelectorAll('.delete-shop-btn').forEach(btn => btn.onclick = () => handleDeleteShop(btn.dataset.id));
    contentArea.querySelector('#add-shop-btn-hero')?.addEventListener('click', () => renderAddShopModal(container));
  }
  function renderRevenueTab(contentArea, shops, plans) {
    const activeShops = shops.filter(s => s.status === 'active');
    const mrrHistory = activeShops.map(s => {
      const p = plans?.find(pl => pl.id === s.plan_id);
      return { name: s.name, plan: p?.name || '?', amount: p?.price || 0 };
    });
    const totalMRR = mrrHistory.reduce((sum, h) => sum + h.amount, 0);

    contentArea.innerHTML = `
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 fade-in">
        <!-- Revenue Trajectory Chart Mockup -->
        <div class="bg-surface-container p-8 rounded-xl border border-white/5 min-h-[400px] flex flex-col shadow-2xl">
          <div class="flex justify-between items-start mb-10">
            <div>
              <h5 class="text-lg font-bold font-headline text-on-surface">Revenue Trajectory</h5>
              <p class="text-sm text-on-surface-variant font-medium">Monthly growth across all global nodes</p>
            </div>
            <div class="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-widest">
              +24% Growth
            </div>
          </div>
          <div class="flex-grow flex items-end gap-3 px-4">
            <div class="w-full bg-primary/10 h-[40%] rounded-t-lg group relative transition-all hover:bg-primary/20"></div>
            <div class="w-full bg-primary/20 h-[55%] rounded-t-lg group relative transition-all hover:bg-primary/30"></div>
            <div class="w-full bg-primary/30 h-[45%] rounded-t-lg group relative transition-all hover:bg-primary/40"></div>
            <div class="w-full bg-primary/40 h-[70%] rounded-t-lg group relative transition-all hover:bg-primary/50"></div>
            <div class="w-full bg-primary/50 h-[65%] rounded-t-lg group relative transition-all hover:bg-primary/60"></div>
            <div class="w-full gold-gradient h-[100%] rounded-t-lg group relative shadow-[0_0_30px_rgba(242,202,80,0.15)] hover:brightness-110 transition-all">
              <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-high border border-primary/30 px-3 py-1.5 rounded-lg text-[10px] font-black text-primary shadow-xl whitespace-nowrap">Rp ${ (totalMRR/1000000).toFixed(1) }M Total</div>
            </div>
          </div>
          <div class="flex justify-between mt-6 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest px-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>

        <!-- Node Composition & MRR List -->
        <div class="flex flex-col gap-6">
          <div class="bg-surface-container p-8 rounded-xl border border-white/5 shadow-xl flex-grow">
            <h5 class="text-lg font-bold font-headline mb-6">Tenant Subscription Split</h5>
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

          <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Global MRR Score</p>
                <p class="text-3xl font-black font-headline text-primary mt-1">Rp ${totalMRR.toLocaleString('id-ID')}</p>
              </div>
              <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPlansTab(contentArea, plans) {
    contentArea.innerHTML = `
      <section class="mb-12 text-center fade-in">
        <h2 class="text-4xl font-black font-headline tracking-tighter text-on-surface mb-3 uppercase italic">SaaS Node Constraints</h2>
        <p class="text-on-surface-variant max-w-2xl mx-auto font-medium">Configuring feature permissions and operational limits for multi-tenant isolation.</p>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in">
        ${plans.map(p => `
          <div class="bg-surface-container rounded-2xl border border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl flex flex-col">
            <div class="p-8 pb-0 text-center relative pointer-events-none">
              <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all"></div>
              <p class="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4">${p.name}</p>
              <h3 class="text-4xl font-black font-headline text-white mb-2 tracking-tighter">
                Rp ${(p.price / 1000).toLocaleString()}k <span class="text-sm text-on-surface-variant font-medium tracking-normal">/ mo</span>
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
                  <span>Max <strong>${p.max_branches || '∞'}</strong> Linked Nodes</span>
                </div>
                <div class="h-[1px] bg-white/5 my-6"></div>
                ${(p.features || []).slice(0, 6).map(f => `
                  <div class="flex items-center gap-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                    <span class="material-symbols-outlined text-primary/40 text-sm">add</span>
                    <span>${f.replace(/_/g, ' ')}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="p-8 bg-black/20 border-t border-white/5 mt-auto">
              <button onclick="window.handleEditPlan('${p.id}')" class="w-full py-4 bg-surface-container-high hover:bg-primary/10 hover:text-primary text-white font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center justify-center gap-3 text-xs">
                <span class="material-symbols-outlined text-lg">settings_suggest</span>
                <span>Configure Logic</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderAnalyticsTab(contentArea, shops, payments, appointments) {
    const activeCount = shops.filter(s => s.status === 'active').length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    contentArea.innerHTML = `
      <section class="fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 text-primary">Platform Reach</p>
              <h4 class="text-3xl font-black font-headline">${activeCount} Nodes</h4>
           </div>
           <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 text-emerald-400">Total Capture</p>
              <h4 class="text-3xl font-black font-headline">Rp ${(totalRevenue/1000000).toFixed(1)}M</h4>
           </div>
           <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 text-blue-400">Global Traffic</p>
              <h4 class="text-3xl font-black font-headline">${appointments.length} Sess</h4>
           </div>
           <div class="bg-surface-container p-6 rounded-xl border border-white/5 shadow-xl">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 text-primary">System Uptime</p>
              <h4 class="text-3xl font-black font-headline">99.9%</h4>
           </div>
        </div>

        <!-- System Map Mockup -->
        <div class="bg-surface-container p-12 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center">
          <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#f2ca50 1px, transparent 1px); background-size: 40px 40px;"></div>
          <div class="relative z-10">
            <div class="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-8 animate-pulse mx-auto">
              <span class="material-symbols-outlined text-6xl">language</span>
            </div>
            <h3 class="text-4xl font-black font-headline text-white mb-4 tracking-tighter">Global Operation Map</h3>
            <p class="text-on-surface-variant max-w-xl font-medium mx-auto mb-10">Initializing real-time spatial analytics for all linked barbershop nodes. Monitoring active connections and regional saturation.</p>
            <div class="flex items-center justify-center gap-4">
               <div class="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> ${activeCount} Online</div>
               <div class="w-1 h-1 rounded-full bg-white/20"></div>
               <div class="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest"><span class="w-2 h-2 rounded-full bg-white/20"></span> Latency 42ms</div>
            </div>
          </div>
        </div>
      </section>
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
      const selected = Array.from(document.querySelectorAll('input[name="features"]:checked')).map(i => i.value);

      try {
        await supabase.from('subscription_plans').update({ price: parseInt(price), features: selected }).eq('id', id);
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
