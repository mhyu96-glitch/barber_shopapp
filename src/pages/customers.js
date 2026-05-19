// ========================================
// Customers Page
// CRUD, history, loyalty
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { whatsapp } from '../components/whatsapp.js';

let activeView = 'grid'; // 'grid', 'list'
let filterSearchText = '';
let filterLoyalty = 'all';
let filterSort = 'name_asc';
let currentPage = 1;
let itemsPerPage = 10;

export function renderCustomers(container) {
  const customers = storage.getAll('customers');
  const now = new Date();
  const thirtyDaysAgo = new Date(now); 
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // 1. Filter
  let filtered = [...customers];
  
  if (filterSearchText) {
    const q = filterSearchText.toLowerCase().trim();
    filtered = filtered.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.phone?.toLowerCase().includes(q) || 
      c.address?.toLowerCase().includes(q)
    );
  }

  if (filterLoyalty !== 'all') {
    filtered = filtered.filter(c => {
      const tier = formatter.loyaltyTier(c.totalVisits || 0);
      return tier.name.toLowerCase() === filterLoyalty.toLowerCase();
    });
  }

  // 2. Sort
  filtered.sort((a, b) => {
    if (filterSort === 'name_asc') return a.name.localeCompare(b.name);
    if (filterSort === 'name_desc') return b.name.localeCompare(a.name);
    if (filterSort === 'visits_desc') return (b.totalVisits || 0) - (a.totalVisits || 0);
    if (filterSort === 'spent_desc') return (b.totalSpent || 0) - (a.totalSpent || 0);
    return 0;
  });

  // 3. Paginate
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const renderGridView = () => {
    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
        ${paginatedItems.map(c => {
          const tier = formatter.loyaltyTier(c.totalVisits || 0);
          const points = formatter.loyaltyPoints(c.totalVisits || 0);
          const freeCount = formatter.freeHaircuts(c.totalVisits || 0);
          const isInactive = c.lastVisit && new Date(c.lastVisit) < thirtyDaysAgo;
          
          return `
            <div class="border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col bg-white dark:bg-zinc-950 hover:shadow-md transition-shadow relative">
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-full object-cover flex items-center justify-center font-bold text-sm text-amber-500 bg-amber-50 border border-amber-100 flex-shrink-0" style="${c.avatar ? `background: url(${c.avatar}) center/cover; border: none;` : ''}">
                    ${c.avatar ? '' : formatter.initials(c.name)}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">${c.name}</h3>
                    <p class="text-xs text-slate-500 dark:text-zinc-500">${formatter.phoneDisplay(c.phone)}</p>
                  </div>
                </div>
                
                <div style="position: relative;" class="dropdown-container">
                  <button class="text-slate-400 hover:text-slate-600 focus:outline-none" onclick="event.stopPropagation(); window.__toggleCustomerMenu('${c.id}')">
                    <i class="fa-solid fa-ellipsis"></i>
                  </button>
                  <div id="customer-menu-${c.id}" class="hidden absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg z-20 py-1">
                    <button class="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2" onclick="window.__viewCustomer('${c.id}')">
                      <i class="fas fa-eye text-slate-400"></i> Detail Profil
                    </button>
                    <button class="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2" onclick="window.__editCustomer('${c.id}')">
                      <i class="fas fa-edit text-slate-400"></i> Edit Data
                    </button>
                    ${isInactive ? `
                      <button class="w-full text-left px-4 py-2 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2" onclick="window.__waKangen('${c.id}')">
                        <i class="fas fa-history text-amber-500"></i> Tawari Promo
                      </button>
                    ` : ''}
                    <button class="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2" onclick="window.__deleteCustomer('${c.id}')">
                      <i class="fas fa-trash text-red-500"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="mb-4 flex flex-wrap gap-2 items-center">
                <span class="loyalty-badge ${tier.class} text-[10px] font-bold py-0.5 px-2 rounded-md">
                  <i class="fas ${tier.icon} mr-1"></i> ${tier.name}
                </span>
                <span class="text-xs text-slate-500 dark:text-zinc-400">
                  <span class="font-bold text-slate-700 dark:text-zinc-300">${points}</span> Poin
                </span>
                ${freeCount > 0 ? `
                  <span class="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50 rounded-md py-0.5 px-1.5 text-[10px] font-bold flex items-center gap-1" title="${freeCount} Potongan Gratis">
                    <i class="fas fa-gift"></i> Gratis
                  </span>
                ` : ''}
                ${isInactive ? `
                  <span class="bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-100 dark:border-rose-900/50 rounded-md py-0.5 px-1.5 text-[10px] font-bold">
                    Inactive
                  </span>
                ` : ''}
              </div>
              
              <div class="space-y-2 text-xs text-slate-500 dark:text-zinc-400 flex-grow">
                <div class="flex items-center justify-between">
                  <span>Member Sejak</span>
                  <span class="font-semibold text-slate-700 dark:text-zinc-300">${c.firstVisit ? dateUtils.membershipDuration(c.firstVisit) : '-'}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Total Kunjungan</span>
                  <span class="font-semibold text-slate-700 dark:text-zinc-300">${c.totalVisits || 0} kali</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Total Spent</span>
                  <span class="font-semibold text-slate-700 dark:text-zinc-300">${formatter.currency(c.totalSpent || 0)}</span>
                </div>
                ${c.birthday ? `
                  <div class="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-[11px] pt-1">
                    <i class="fas fa-cake-candles text-amber-500"></i> Ultah: ${dateUtils.formatDate(c.birthday, 'short')}
                  </div>
                ` : ''}
              </div>
              
              <div class="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-zinc-900">
                <button class="flex items-center justify-center px-3 py-2 border border-slate-200 dark:border-zinc-800 shadow-xs text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800" onclick="window.__viewCustomer('${c.id}')">
                  <i class="fa-solid fa-eye mr-1.5 text-slate-400"></i> Detail
                </button>
                ${isInactive ? `
                  <button class="flex items-center justify-center px-3 py-2 border border-amber-300 dark:border-amber-700 shadow-xs text-xs font-medium rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30" onclick="window.__waKangen('${c.id}')">
                    <i class="fab fa-whatsapp mr-1.5 text-amber-500"></i> Promo
                  </button>
                ` : `
                  <button class="flex items-center justify-center px-3 py-2 border border-slate-200 dark:border-zinc-800 shadow-xs text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800" onclick="window.__waCustomer('${c.id}')">
                    <i class="fab fa-whatsapp mr-1.5 text-emerald-500"></i> Chat
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const renderListView = () => {
    return `
      <div class="table-container shadow-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mb-6">
        <table style="width: 100%;">
          <thead>
            <tr>
              <th style="padding-left: 20px;">Pelanggan</th>
              <th>No. Handphone</th>
              <th>Volume Kunjungan</th>
              <th>Status Loyalitas</th>
              <th>Member Sejak</th>
              <th>Total Kontribusi</th>
              <th style="text-align: right; padding-right: 20px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedItems.map(c => {
              const tier = formatter.loyaltyTier(c.totalVisits || 0);
              const points = formatter.loyaltyPoints(c.totalVisits || 0);
              const freeCount = formatter.freeHaircuts(c.totalVisits || 0);
              return `
                <tr>
                  <td style="padding-left: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="w-8 h-8 rounded-full object-cover flex items-center justify-center font-bold text-xs text-amber-500 bg-amber-50 border border-amber-100" style="${c.avatar ? `background: url(${c.avatar}) center/cover; border: none;` : ''}">
                        ${c.avatar ? '' : formatter.initials(c.name)}
                      </div>
                      <div>
                        <div class="fw-700 text-slate-900 dark:text-zinc-100 text-sm" style="text-transform: capitalize;">${c.name}</div>
                        ${c.birthday ? `<div class="text-[9px] text-slate-400 dark:text-zinc-500 mt-[2px]"><i class="fas fa-cake-candles text-amber-500 mr-1"></i>${dateUtils.formatDate(c.birthday, 'short')}</div>` : ''}
                      </div>
                    </div>
                  </td>
                  <td><span class="text-xs fw-600 text-slate-700 dark:text-zinc-300">${formatter.phoneDisplay(c.phone)}</span></td>
                  <td><span class="text-xs font-bold text-slate-900 dark:text-zinc-100">${c.totalVisits || 0} kali</span></td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="loyalty-badge ${tier.class} text-[10px] font-bold py-0.5 px-2 rounded-md">
                        <i class="fas ${tier.icon} mr-1"></i> ${tier.name}
                      </span>
                      <span class="text-[10px] text-slate-400 dark:text-zinc-500">${points} Pt</span>
                      ${freeCount > 0 ? `<span class="text-emerald-500 text-xs" title="${freeCount} Gratis"><i class="fas fa-gift"></i></span>` : ''}
                    </div>
                  </td>
                  <td><span class="text-xs text-slate-500 dark:text-zinc-400">${c.firstVisit ? dateUtils.membershipDuration(c.firstVisit) : '-'}</span></td>
                  <td><span class="text-xs font-bold text-slate-900 dark:text-zinc-100">${formatter.currency(c.totalSpent || 0)}</span></td>
                  <td style="text-align: right; padding-right: 20px;">
                    <div style="display: inline-flex; gap: 4px; align-items: center;">
                      <button class="btn btn-ghost btn-sm" title="Lihat Profil" onclick="window.__viewCustomer('${c.id}')"><i class="fas fa-eye text-slate-400"></i></button>
                      <button class="btn btn-ghost btn-sm" title="Hubungi WA" onclick="window.__waCustomer('${c.id}')"><i class="fab fa-whatsapp text-emerald-500"></i></button>
                      ${(c.lastVisit && new Date(c.lastVisit) < thirtyDaysAgo) ? `
                        <button class="btn btn-ghost btn-sm" title="Tawari Promo (Sudah >30 Hari)" onclick="window.__waKangen('${c.id}')"><i class="fas fa-history text-amber-500"></i></button>
                      ` : ''}
                      <button class="btn btn-ghost btn-sm" title="Edit Data" onclick="window.__editCustomer('${c.id}')"><i class="fas fa-edit text-slate-400"></i></button>
                      <button class="btn btn-ghost btn-sm" title="Hapus Pelanggan" onclick="window.__deleteCustomer('${c.id}')"><i class="fas fa-trash text-red-500"></i></button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  container.innerHTML = `
    <!-- MAIN CONTAINER -->
    <div class="flex-grow p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 fade-in text-slate-800 dark:text-slate-200">
      
      <!-- HEADER & BREADCRUMBS -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <nav aria-label="Breadcrumb" class="text-sm text-slate-500 dark:text-zinc-400">
          <ol class="list-none p-0 inline-flex">
            <li class="flex items-center">
              <a class="hover:text-slate-900 dark:hover:text-zinc-100" href="#">Management</a>
              <span class="mx-2 text-slate-300 dark:text-zinc-700">/</span>
            </li>
            <li class="flex items-center">
              <span class="text-slate-800 dark:text-zinc-100 font-semibold">Pelanggan</span>
            </li>
          </ol>
        </nav>
        
        <!-- Top Level Actions -->
        <div class="flex items-center space-x-3">
          <button class="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none flex items-center shadow-sm" id="view-mode-toggle-btn">
            ${activeView === 'grid' ? 'Grid View' : 'List View'} <i class="fa-solid fa-chevron-down ml-2 text-xs"></i>
          </button>
          <button class="btn btn-secondary shadow-sm" id="broadcast-wa-btn">
            <i class="fab fa-whatsapp mr-1 text-emerald-500"></i> Broadcast WA
          </button>
          <button class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center transition-colors" id="add-customer-btn">
            <i class="fa-solid fa-plus mr-2"></i> Pelanggan Baru
          </button>
        </div>
      </div>

      <!-- MAIN CARD CONTAINER -->
      <div class="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 flex flex-col flex-1">
        
        <!-- Toolbar Section -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
          <h2 class="text-base font-bold text-slate-900 dark:text-zinc-100">Customer Table</h2>
          
          <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <!-- Search -->
            <div class="relative flex-1 sm:flex-initial">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i class="fa-solid fa-search text-slate-400 dark:text-zinc-500 text-sm"></i>
              </div>
              <input class="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Search" type="text" id="customer-search-input" value="${filterSearchText}"/>
            </div>
            
            <!-- Loyalty Filter -->
            <select class="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm" id="customer-loyalty-filter">
              <option value="all" ${filterLoyalty === 'all' ? 'selected' : ''}>Semua Level Loyalitas</option>
              <option value="bronze" ${filterLoyalty === 'bronze' ? 'selected' : ''}>Bronze</option>
              <option value="silver" ${filterLoyalty === 'silver' ? 'selected' : ''}>Silver</option>
              <option value="gold" ${filterLoyalty === 'gold' ? 'selected' : ''}>Gold</option>
              <option value="platinum" ${filterLoyalty === 'platinum' ? 'selected' : ''}>Platinum</option>
            </select>
            
            <!-- Sort Filter -->
            <select class="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm" id="customer-sort-filter">
              <option value="name_asc" ${filterSort === 'name_asc' ? 'selected' : ''}>Sort by: Nama (A-Z)</option>
              <option value="name_desc" ${filterSort === 'name_desc' ? 'selected' : ''}>Sort by: Nama (Z-A)</option>
              <option value="visits_desc" ${filterSort === 'visits_desc' ? 'selected' : ''}>Sort by: Kunjungan Terbanyak</option>
              <option value="spent_desc" ${filterSort === 'spent_desc' ? 'selected' : ''}>Sort by: Kontribusi Terbesar</option>
            </select>
          </div>
        </div>

        <!-- Dynamic Content Rendering -->
        <div id="customer-content-area" class="flex-grow">
          ${customers.length === 0 ? `
            <div class="card empty-state">
              <i class="fas fa-users text-4xl text-slate-300 dark:text-zinc-700 mb-2"></i>
              <h3>Belum Ada Pelanggan</h3>
              <p>Tambah pelanggan pertama Anda</p>
            </div>
          ` : (activeView === 'grid' ? renderGridView() : renderListView())}
        </div>

        <!-- Pagination Footer -->
        <div class="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4 md:space-y-0">
          <div class="text-sm text-slate-500 dark:text-zinc-400">
            Showing <span class="font-semibold text-slate-800 dark:text-zinc-200">${totalItems === 0 ? 0 : startIndex + 1}</span> to <span class="font-semibold text-slate-800 dark:text-zinc-200">${endIndex}</span> of <span class="font-semibold text-slate-800 dark:text-zinc-200">${totalItems}</span> results
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-slate-500 dark:text-zinc-400">Per page</span>
              <select class="block w-full pl-3 pr-8 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-amber-500 focus:border-amber-500" id="customer-per-page-select">
                <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20</option>
                <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
              </select>
            </div>
            
            <nav aria-label="Pagination" class="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" id="customer-pagination-nav">
              <button class="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50" id="customer-prev-page" ${currentPage === 1 ? 'disabled' : ''}>
                <span class="sr-only">Previous</span>
                <i class="fa-solid fa-chevron-left w-5 h-5 text-center flex items-center justify-center"></i>
              </button>
              
              ${Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === currentPage;
                return `
                  <button class="relative inline-flex items-center px-4 py-2 border ${isActive ? 'bg-amber-500 border-amber-500 text-white z-10' : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'} text-sm font-medium" data-page-btn="${pageNum}">
                    ${pageNum}
                  </button>
                `;
              }).join('')}
              
              <button class="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50" id="customer-next-page" ${currentPage === totalPages ? 'disabled' : ''}>
                <span class="sr-only">Next</span>
                <i class="fa-solid fa-chevron-right w-5 h-5 text-center flex items-center justify-center"></i>
              </button>
            </nav>
          </div>
        </div>

      </div>

    </div>
  `;

  // Attach event listeners
  container.querySelector('#add-customer-btn')?.addEventListener('click', () => showCustomerForm());
  container.querySelector('#broadcast-wa-btn')?.addEventListener('click', () => showBroadcastForm());
  
  // Search
  container.querySelector('#customer-search-input')?.addEventListener('input', (e) => {
    filterSearchText = e.target.value;
    currentPage = 1;
    renderCustomers(container);
    // Keep focus
    const input = document.getElementById('customer-search-input');
    if (input) {
      input.focus();
      const val = input.value;
      input.value = '';
      input.value = val;
    }
  });

  // Filters & Sorts
  container.querySelector('#customer-loyalty-filter')?.addEventListener('change', (e) => {
    filterLoyalty = e.target.value;
    currentPage = 1;
    renderCustomers(container);
  });

  container.querySelector('#customer-sort-filter')?.addEventListener('change', (e) => {
    filterSort = e.target.value;
    currentPage = 1;
    renderCustomers(container);
  });

  container.querySelector('#customer-per-page-select')?.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderCustomers(container);
  });

  // Toggle View
  container.querySelector('#view-mode-toggle-btn')?.addEventListener('click', () => {
    activeView = activeView === 'grid' ? 'list' : 'grid';
    renderCustomers(container);
  });

  // Pagination navigation
  container.querySelector('#customer-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderCustomers(container);
    }
  });

  container.querySelector('#customer-next-page')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCustomers(container);
    }
  });

  container.querySelectorAll('[data-page-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.pageBtn);
      renderCustomers(container);
    });
  });

  // Global window helpers
  window.__toggleCustomerMenu = (id) => {
    const menu = document.getElementById(`customer-menu-${id}`);
    if (!menu) return;
    
    // Close other menus first
    document.querySelectorAll('[id^="customer-menu-"]').forEach(m => {
      if (m.id !== `customer-menu-${id}`) m.classList.add('hidden');
    });

    menu.classList.toggle('hidden');
    
    // Auto-close menu when clicking outside
    const closeListener = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        menu.classList.add('hidden');
        document.removeEventListener('click', closeListener);
      }
    };
    document.addEventListener('click', closeListener);
  };

  window.__viewCustomer = (id) => showCustomerDetail(id);
  window.__editCustomer = (id) => showCustomerForm(id);
  window.__waCustomer = (id) => {
    const c = storage.find('customers', id);
    if (c) whatsapp.sendCustom(c.phone, `Halo ${c.name}! Ada yang bisa kami bantu? 😊\n- BarberPro Studio`);
  };
  window.__waKangen = (id) => {
    const c = storage.find('customers', id);
    if (c) {
      const msg = `Halo ${c.name}! Kami kangen Anda di BarberPro Studio. 👋\n\nSudah lebih dari sebulan nih sejak kunjungan terakhir Anda. Yuk, luangkan waktu sejenak untuk merapikan rambut agar tetap tampil pede! ✂️\n\nBooking sekarang untuk amankan jam favorit Anda: ${window.location.origin}/portal\n\nSampai jumpa! 💈`;
      whatsapp.sendCustom(c.phone, msg);
    }
  };
  window.__deleteCustomer = (id) => {
    confirmDialog('Yakin ingin menghapus pelanggan ini?', () => {
      storage.delete('customers', id);
      showToast('Pelanggan dihapus', 'warning');
      renderCustomers(container);
    });
  };
}

function showBroadcastForm() {
  const customers = storage.getAll('customers');
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

  const inactiveCount = customers.filter(c => {
    const lastV = c.lastVisit || c.firstVisit;
    return lastV && new Date(lastV) < thirtyDaysAgo;
  }).length;

  const body = `
    <div class="form-group">
      <label>Pilih Segmen Pelanggan</label>
      <select class="form-control" id="broadcast-segment">
        <option value="all">Semua Pelanggan (${customers.length})</option>
        <option value="inactive">Tidak Datang > 30 Hari (${inactiveCount})</option>
        <option value="loyalty">Loyalitas (Gold & Platinum)</option>
        <option value="birthday">Ulang Tahun Bulan Ini</option>
      </select>
    </div>
    <div class="form-group">
      <label>Template Pesan</label>
      <textarea class="form-control" id="broadcast-message" rows="5" placeholder="Tulis pesan Anda di sini..."></textarea>
      <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('broadcast-message').value += 'Halo [name]! '">Tag [name]</button>
        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('broadcast-message').value = 'Halo [name]! Kami kangen Anda di BarberPro. Yuk booking lagi sekarang dan dapatkan diskon 10%! ✂️'">Promo Kangen</button>
        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('broadcast-message').value = 'Halo [name]! Ada gaya rambut baru nih di BarberPro. Cek galeri kami ya! 💈'">Info Gaya</button>
      </div>
    </div>
    <p class="text-sm text-muted"> <i class="fas fa-info-circle"></i> Pesan akan dibuka satu per satu di tab WhatsApp baru.</p>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" id="send-broadcast-btn"><i class="fab fa-whatsapp"></i> Kirim Broadcast</button>
  `;

  openModal('WhatsApp Broadcast', body, footer);

  document.getElementById('send-broadcast-btn').addEventListener('click', () => {
    const segment = document.getElementById('broadcast-segment').value;
    const rawMsg = document.getElementById('broadcast-message').value;

    if (!rawMsg) {
      import('../components/toast.js').then(m => m.showToast('Pesan tidak boleh kosong', 'error'));
      return;
    }

    let targets = [];
    if (segment === 'all') targets = customers;
    else if (segment === 'inactive') targets = customers.filter(c => {
      const lastV = c.lastVisit || c.firstVisit;
      return lastV && new Date(lastV) < thirtyDaysAgo;
    });
    else if (segment === 'loyalty') targets = customers.filter(c => (c.totalVisits || 0) >= 20);
    else if (segment === 'birthday') {
      const currentMonth = now.getMonth() + 1;
      targets = customers.filter(c => c.birthday && parseInt(c.birthday.split('-')[1]) === currentMonth);
    }

    if (targets.length === 0) {
      import('../components/toast.js').then(m => m.showToast('Tidak ada target di segmen ini', 'warning'));
      return;
    }

    confirmDialog(`Kirim pesan ke ${targets.length} pelanggan?`, () => {
      targets.forEach((c, i) => {
        setTimeout(() => {
          const msg = rawMsg.replace(/\[name\]/g, c.name);
          whatsapp.sendCustom(c.phone, msg);
        }, i * 2000); // 2 second delay to avoid browser blocking multiple popups
      });
      import('../components/toast.js').then(m => m.showToast('Broadcast dimulai...', 'success'));
      closeModal();
    });
  });
}

function showCustomerForm(editId = null) {
  const existing = editId ? storage.find('customers', editId) : null;
  const barbers = storage.getAll('barbers');

  const body = `
    <form id="customer-form">
      <div class="form-group">
        <label>Nama Lengkap</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" placeholder="Nama pelanggan" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>No. HP / WhatsApp</label>
          <input type="text" class="form-control" name="phone" value="${existing?.phone || ''}" placeholder="08xxxxxxxxxx" required />
        </div>
        <div class="form-group">
          <label>Tanggal Lahir</label>
          <input type="date" class="form-control" name="birthday" value="${existing?.birthday || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label>Alamat (Opsional)</label>
        <input type="text" class="form-control" name="address" value="${existing?.address || ''}" placeholder="Alamat" />
      </div>
      <div class="form-group">
        <label>Barber Favorit</label>
        <select class="form-control" name="preferredBarber">
          <option value="">Tidak ada preferensi</option>
          ${barbers.map(b => `<option value="${b.id}" ${existing?.preferredBarber === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <textarea class="form-control" name="notes" rows="2" placeholder="Preferensi gaya rambut, alergi, dll...">${existing?.notes || ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-customer-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal(editId ? 'Edit Pelanggan' : 'Pelanggan Baru', body, footer);

  document.getElementById('save-customer-btn').addEventListener('click', () => {
    const form = document.getElementById('customer-form');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);

    if (!data.name || !data.phone) {
      showToast('Nama dan No. HP wajib diisi', 'error');
      return;
    }

    if (editId) {
      storage.update('customers', editId, data);
      showToast('Data pelanggan diupdate!', 'success');
    } else {
      data.firstVisit = new Date().toISOString().split('T')[0];
      data.totalVisits = 0;
      data.totalSpent = 0;
      storage.add('customers', data);
      showToast('Pelanggan ditambahkan!', 'success');
    }

    closeModal();
    renderCustomers(document.getElementById('page-container'));
  });
}

function showCustomerDetail(id) {
  const customer = storage.find('customers', id);
  if (!customer) return;

  const appointments = storage.getAll('appointments').filter(a => a.customerId === id).sort((a, b) => b.date.localeCompare(a.date));
  const points = customer.loyalty_points || 0;
  const tier = formatter.loyaltyTier(points);
  
  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: ${customer.avatar ? `url(${customer.avatar}) center/cover` : 'var(--accent-subtle)'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: ${customer.avatar ? '0' : '22px'}; font-weight: 700; color: var(--accent); border: 2px solid var(--accent);">
        ${customer.avatar ? '' : formatter.initials(customer.name)}
      </div>
      <h3 style="margin-bottom: 4px;">${customer.name}</h3>
      <p class="text-sm text-muted">${formatter.phoneDisplay(customer.phone)}</p>
      
      <div style="display: inline-flex; flex-direction: column; align-items: center; margin-top: 10px; width: 100%; max-width: 240px;">
         <span class="loyalty-badge ${tier.class}" style="margin-bottom: 8px; font-weight: 800; padding: 4px 12px; border-radius: 20px;">
            <i class="fas ${tier.icon}"></i> ${tier.name.toUpperCase()} • ${points} Poin
         </span>
         
         ${tier.next ? `
            <div style="width: 100%; background: var(--bg-input); height: 6px; border-radius: 3px; position: relative; margin-top: 4px;">
               <div style="position: absolute; left: 0; top: 0; height: 100%; background: var(--accent); border-radius: 3px; width: ${Math.round((points / tier.next) * 100)}%;"></div>
            </div>
            <div class="text-xs text-muted mt-xs">Hanya butuh ${tier.next - points} poin lagi ke level berikutnya!</div>
         ` : '<div class="text-xs fw-700 text-accent">Luar biasa! Anda berada di level tertinggi! 💎</div>'}
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 18px;">
      <div style="text-align: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
        <div class="fw-700" style="font-size: 20px;">${customer.totalVisits || 0}</div>
        <div class="text-sm text-muted">Kunjungan</div>
      </div>
      <div style="text-align: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
        <div class="fw-700" style="font-size: 20px;">${customer.firstVisit ? dateUtils.membershipDuration(customer.firstVisit) : '-'}</div>
        <div class="text-sm text-muted">Member</div>
      </div>
      <div style="text-align: center; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md);">
        <div class="fw-700 text-accent" style="font-size: 20px;">${freeCount}</div>
        <div class="text-sm text-muted">Gratis</div>
      </div>
    </div>

    ${customer.birthday ? `<p class="text-sm text-muted mb-md">🎂 Ulang tahun: ${dateUtils.formatDate(customer.birthday, 'long')}</p>` : ''}
    ${customer.notes ? `<p class="text-sm text-muted mb-md">📝 ${customer.notes}</p>` : ''}

    <div style="padding: 15px; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 18px;">
      <h4 style="margin-top: 0; font-size: 14px;"><i class="fas fa-box" style="color: var(--accent);"></i> Saldo Paket Membership</h4>
      ${(customer.packages || []).length > 0 ? customer.packages.map(p => `
        <div class="flex-between mb-sm">
          <span class="text-sm">${p.name}</span>
          <span class="badge badge-info">${p.remainingSessions} Sesi Tersisa</span>
        </div>
      `).join('') : '<p class="text-muted text-xs">Belum memiliki paket aktif</p>'}
      <button class="btn btn-ghost btn-sm btn-block" style="margin-top: 8px; border: 1px dashed var(--border);" onclick="window.__buyPackage('${id}')">
        <i class="fas fa-plus-circle"></i> Tambah Paket
      </button>
    </div>

    <div style="padding: 15px; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 18px;">
      <h4 style="margin-top: 0; font-size: 14px;"><i class="fas fa-share-nodes" style="color: var(--info);"></i> Referral Program</h4>
      <p class="text-xs text-muted mb-sm">Bagikan link ini. Teman yang booking via link ini dapat diskon, dan Anda dapat poin!</p>
      <div class="flex-between" style="background: var(--bg-card); padding: 8px; border-radius: 4px; border: 1px solid var(--border);">
        <code style="font-size: 11px;">.../?ref=${id.slice(-6)}</code>
        <button class="btn btn-ghost btn-xs" onclick="window.__copyReferral('${id}')">Salin</button>
      </div>
    </div>

    <div style="margin-top: 20px; border-top: 1px solid var(--border); pt-16;">
      <div class="flex-between mb-sm">
        <h4 style="margin: 0;">Galeri Gaya Rambut</h4>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('gallery-upload').click()">
          <i class="fas fa-camera"></i> Tambah Foto
        </button>
        <input type="file" id="gallery-upload" accept="image/*" style="display: none;" onchange="window.__uploadCustomerPhoto(event, '${id}')" />
      </div>
      
      <div id="customer-gallery" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px;">
        ${(customer.gallery || []).length > 0 ? customer.gallery.map((img, idx) => `
          <div style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" onclick="window.__previewImage('${img}')" />
            <button style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; cursor: pointer;" onclick="window.__deleteCustomerPhoto('${id}', ${idx})">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `).join('') : `
          <div style="grid-column: span 3; padding: 20px; text-align: center; background: var(--bg-input); border-radius: 8px; color: var(--text-muted); font-size: 13px;">
            Belum ada foto gaya rambut
          </div>
        `}
      </div>
    </div>

    ${(() => {
        const membership = storage.getAll('customer_memberships')
            .find(m => m.customer_id === id && m.status === 'active' && m.remaining_sessions > 0);
        
        if (!membership) return '';
        const pack = storage.find('membership_packages', membership.package_id);
        
        return `
            <div class="card" style="background: rgba(var(--accent-rgb), 0.1); border: 1px solid var(--accent); margin-bottom: 20px;">
                <div class="flex-between mb-sm">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-star text-accent"></i>
                        <h4 style="margin: 0;">Membership Aktif</h4>
                    </div>
                </div>
                <div class="fw-700" style="font-size: 16px;">${pack?.name || 'Paket Aktif'}</div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px;">
                    <div>
                        <div class="text-xs text-muted">Sisa Sesi</div>
                        <div class="fw-800" style="font-size: 20px; color: var(--accent);">${membership.remaining_sessions}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-muted">Berlaku Hingga</div>
                        <div class="fw-600">${membership.expiry_date || 'Selamanya'}</div>
                    </div>
                </div>
            </div>
        `;
    })()}

    <h4 style="margin-bottom: 10px;">Riwayat Kunjungan</h4>
    ${appointments.length > 0 ? `
      <div class="queue-list" style="max-height: 250px; overflow-y: auto;">
        ${appointments.slice(0, 15).map(apt => `
          <div class="queue-item" style="border-left-color: ${apt.status === 'done' ? 'var(--success)' : apt.status === 'cancelled' ? 'var(--danger)' : 'var(--accent)'};">
            <div style="flex: 1;">
              <div class="fw-600">${dateUtils.formatDate(apt.date, 'short')} - ${apt.time}</div>
              <div class="text-sm text-muted">${apt.serviceName} • ${apt.barberName}</div>
            </div>
            <div class="text-right">
              <div class="fw-600">${formatter.currency(apt.price)}</div>
              ${apt.rating > 0 ? `<div class="text-sm">${'⭐'.repeat(apt.rating)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<p class="text-muted text-sm">Belum ada riwayat</p>'}
  `;

  openModal('Detail Pelanggan', body, '', { maxWidth: '500px' });
}

// Global Gallery Handlers
window.__uploadCustomerPhoto = function (event, id) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 1024 * 1024) { // 1MB limit for localStorage
    import('../components/toast.js').then(m => m.showToast('Foto terlalu besar (max 1MB untuk demo)', 'error'));
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const customer = storage.find('customers', id);
    if (!customer) return;

    const gallery = customer.gallery || [];
    gallery.push(e.target.result);
    storage.update('customers', id, { gallery });

    import('../components/toast.js').then(m => m.showToast('Foto ditambahkan! 📸', 'success'));
    showCustomerDetail(id); // Re-render modal content
  };
  reader.readAsDataURL(file);
};

window.__deleteCustomerPhoto = function (id, idx) {
  confirmDialog('Hapus foto ini?', () => {
    const customer = storage.find('customers', id);
    if (!customer) return;

    const gallery = customer.gallery || [];
    gallery.splice(idx, 1);
    storage.update('customers', id, { gallery });

    import('../components/toast.js').then(m => m.showToast('Foto dihapus', 'warning'));
    showCustomerDetail(id);
  });
};

window.__previewImage = function (src) {
  const body = `<img src="${src}" style="width: 100%; border-radius: 8px;" />`;
  openModal('Preview', body, '', { maxWidth: '600px' });
};

window.__buyPackage = function (customerId) {
  const packages = storage.getAll('membership_packages');
  if (packages.length === 0) {
    showToast('Belum ada master paket. Buat di menu Membership.', 'error');
    return;
  }

  const body = `
    <div style="padding: 10px;">
      <p class="text-sm mb-md">Pilih paket untuk pelanggan ini:</p>
      <div class="service-grid">
        ${packages.map(p => `
          <div class="p-card" style="padding: 12px; cursor: pointer; border: 1px solid var(--border);" onclick="window.__confirmBuyPackage('${customerId}', '${p.id}')">
            <div class="fw-600">${p.name}</div>
            <div class="text-xs text-muted">${p.sessions} Sesi • ${p.serviceName}</div>
            <div class="fw-700 text-accent" style="margin-top: 4px;">${formatter.currency(p.price)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  openModal('Tambah Paket Pelanggan', body);
};

window.__confirmBuyPackage = function (customerId, packageId) {
  const pkg = storage.find('membership_packages', packageId);
  const customer = storage.find('customers', customerId);
  if (!pkg || !customer) return;

  confirmDialog(`Beli paket ${pkg.name} untuk ${customer.name}?`, () => {
    const activePackages = customer.packages || [];
    activePackages.push({
      ...pkg,
      purchaseDate: new Date().toISOString().split('T')[0],
      remainingSessions: pkg.sessions,
      status: 'active'
    });

    storage.update('customers', customerId, { packages: activePackages });

    // Record payment
    storage.add('payments', {
      customerId: customerId,
      customerName: customer.name,
      amount: pkg.price,
      type: 'package_purchase',
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: `Pembelian paket: ${pkg.name}`
    });

    showToast('Paket berhasil dibeli! ✅', 'success');
    closeModal();
    showCustomerDetail(customerId);
  });
};

window.__copyReferral = function (id) {
  const url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}portal/index.html?ref=${id.slice(-6)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link referral disalin! 🔗', 'success');
  });
};
