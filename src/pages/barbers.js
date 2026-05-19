// ========================================
// Barbers Page
// Staff management, schedule, ratings
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let activeView = 'grid'; // 'grid', 'list'
let filterSearchText = '';
let filterDay = 'all';
let filterSort = 'name_asc';
let currentPage = 1;
let itemsPerPage = 10;

export function renderBarbers(container) {
  const barbers = storage.getAll('barbers');
  const appointments = storage.getAll('appointments');
  const holidays = storage.getAll('holidays');
  const today = new Date();
  const todayDayIdx = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayDateStr = today.toISOString().split('T')[0];

  // 1. Filter
  let filtered = [...barbers];
  
  if (filterSearchText) {
    const q = filterSearchText.toLowerCase().trim();
    filtered = filtered.filter(b => 
      b.name?.toLowerCase().includes(q) || 
      b.specialization?.toLowerCase().includes(q) || 
      b.phone?.toLowerCase().includes(q)
    );
  }

  if (filterDay !== 'all') {
    const dayIdx = parseInt(filterDay);
    filtered = filtered.filter(b => (b.workDays || []).includes(dayIdx));
  }

  // 2. Sort
  filtered.sort((a, b) => {
    if (filterSort === 'name_asc') return a.name.localeCompare(b.name);
    if (filterSort === 'name_desc') return b.name.localeCompare(a.name);
    if (filterSort === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
    if (filterSort === 'haircuts_desc') {
      const aCuts = appointments.filter(apt => apt.barberId === a.id && apt.status === 'done').length;
      const bCuts = appointments.filter(apt => apt.barberId === b.id && apt.status === 'done').length;
      return bCuts - aCuts;
    }
    return 0;
  });

  // 3. Paginate
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getBarberStatus = (b) => {
    const isHoliday = holidays.some(h => h.date === todayDateStr);
    if (isHoliday) {
      return { label: 'Holiday', class: 'bg-amber-50 text-amber-700 border-amber-100', icon: 'fa-calendar-xmark' };
    }
    const isWorkingToday = (b.workDays || []).includes(todayDayIdx);
    if (isWorkingToday) {
      return { label: 'Available', class: 'bg-green-50 text-green-700 border-green-100', icon: 'fa-bolt' };
    }
    return { label: 'Off-Duty', class: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'fa-moon' };
  };

  const renderGridView = () => {
    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
        ${paginatedItems.map(b => {
          const barberAppts = appointments.filter(a => a.barberId === b.id && a.status === 'done');
          const thisMonth = barberAppts.filter(a => a.date.startsWith(today.toISOString().substring(0, 7)));
          const dayNames = (b.workDays || []).map(d => dateUtils.getDayShort(d)).join(', ');
          const status = getBarberStatus(b);
          
          return `
            <div class="border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col bg-white dark:bg-zinc-950 hover:shadow-md transition-shadow relative overflow-hidden">
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-full object-cover flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style="background: ${b.avatar ? `url(${b.avatar}) center/cover` : 'linear-gradient(135deg, var(--accent), var(--accent-dark))'};">
                    ${b.avatar ? '' : formatter.initials(b.name)}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">${b.name}</h3>
                    <p class="text-xs text-slate-500 dark:text-zinc-500">${b.specialization || '-'}</p>
                  </div>
                </div>
                <div style="position: relative;" class="dropdown-container">
                  <button class="text-slate-400 hover:text-slate-600 focus:outline-none" onclick="event.stopPropagation(); window.__toggleBarberMenu('${b.id}')">
                    <i class="fa-solid fa-ellipsis"></i>
                  </button>
                  <div id="barber-menu-${b.id}" class="hidden absolute right-0 mt-1 w-32 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg z-20 py-1">
                    <button class="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2" onclick="window.__editBarber('${b.id}')">
                      <i class="fas fa-edit text-slate-400"></i> Edit Staff
                    </button>
                    <button class="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2" onclick="window.__shareBarberProfile('${b.id}')">
                      <i class="fas fa-qrcode text-slate-400"></i> Share QR
                    </button>
                    <button class="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2" onclick="window.__deleteBarber('${b.id}')">
                      <i class="fas fa-trash text-red-500"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="mb-4 flex flex-wrap gap-2 items-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${status.class}">
                  <i class="fa-solid ${status.icon} mr-1"></i> ${status.label}
                </span>
                <span class="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <i class="fas fa-star text-[10px]"></i> ${b.rating || 0} (${b.totalRatings || 0})
                </span>
              </div>
              
              <div class="space-y-2 text-xs text-slate-500 dark:text-zinc-400 flex-grow">
                <div class="flex items-center">
                  <i class="fa-regular fa-envelope w-5 text-center mr-2 text-slate-400"></i>
                  <span class="truncate">${b.email || `${b.name.toLowerCase().replace(/\s+/g, '')}@mail.com`}</span>
                </div>
                <div class="flex items-center">
                  <i class="fa-solid fa-phone w-5 text-center mr-2 text-slate-400"></i>
                  <span>${b.phone || '-'}</span>
                </div>
                <div class="flex items-center">
                  <i class="fa-solid fa-clock w-5 text-center mr-2 text-slate-400"></i>
                  <span>${b.workStart || '08:00'} - ${b.workEnd || '20:00'}</span>
                </div>
                <div class="flex items-start">
                  <i class="fa-solid fa-calendar-days w-5 text-center mr-2 mt-0.5 text-slate-400"></i>
                  <span class="leading-tight">${dayNames || '-'}</span>
                </div>
                <div class="flex items-center justify-between border-t border-slate-100 dark:border-zinc-900 pt-2 mt-2">
                  <span class="text-slate-400">Bulan Ini / Total:</span>
                  <span class="font-bold text-slate-700 dark:text-zinc-300">${thisMonth.length} / ${barberAppts.length} cuts</span>
                </div>
              </div>
              
              <div class="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-zinc-900">
                <button class="flex items-center justify-center px-3 py-2 border border-slate-200 dark:border-zinc-800 shadow-sm text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800" onclick="window.open('tel:${b.phone || ''}')">
                  <i class="fa-solid fa-phone mr-1.5 text-slate-400"></i> Phone
                </button>
                <button class="flex items-center justify-center px-3 py-2 border border-slate-200 dark:border-zinc-800 shadow-sm text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800" onclick="window.open('mailto:${b.email || `${b.name.toLowerCase().replace(/\s+/g, '')}@mail.com`}')">
                  <i class="fa-regular fa-envelope mr-1.5 text-slate-400"></i> Email
                </button>
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
              <th style="padding-left: 20px;">Staff</th>
              <th>No. Handphone</th>
              <th>Jam Kerja</th>
              <th>Hari Kerja</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Total Cuts</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedItems.map(b => {
              const barberAppts = appointments.filter(a => a.barberId === b.id && a.status === 'done');
              const dayNames = (b.workDays || []).map(d => dateUtils.getDayShort(d)).join(', ');
              const status = getBarberStatus(b);
              
              return `
                <tr>
                  <td style="padding-left: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="w-8 h-8 rounded-full object-cover flex items-center justify-center font-bold text-xs text-white" style="background: ${b.avatar ? `url(${b.avatar}) center/cover` : 'linear-gradient(135deg, var(--accent), var(--accent-dark))'};">
                        ${b.avatar ? '' : formatter.initials(b.name)}
                      </div>
                      <div>
                        <div class="fw-700 text-slate-900 dark:text-zinc-100">${b.name}</div>
                        <div class="text-[10px] text-slate-400 dark:text-zinc-500">${b.specialization || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="text-xs fw-600 text-slate-700 dark:text-zinc-300">${b.phone || '-'}</span></td>
                  <td><span class="text-xs fw-600 text-slate-700 dark:text-zinc-300">${b.workStart || '08:00'} - ${b.workEnd || '20:00'}</span></td>
                  <td><span class="text-xs text-slate-500 dark:text-zinc-400">${dayNames || '-'}</span></td>
                  <td>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${status.class}">
                      ${status.label}
                    </span>
                  </td>
                  <td><span class="text-xs font-bold text-amber-500"><i class="fas fa-star mr-1"></i>${b.rating || 0}</span></td>
                  <td><span class="text-xs font-bold text-slate-700 dark:text-zinc-300">${barberAppts.length} cuts</span></td>
                  <td>
                    <div style="display: flex; gap: 4px; align-items: center;">
                      <button class="btn btn-ghost btn-sm" onclick="window.__editBarber('${b.id}')" title="Edit"><i class="fas fa-edit text-slate-400"></i></button>
                      <button class="btn btn-ghost btn-sm" onclick="window.__shareBarberProfile('${b.id}')" title="QR"><i class="fas fa-qrcode text-slate-400"></i></button>
                      <button class="btn btn-ghost btn-sm" onclick="window.__deleteBarber('${b.id}')" title="Delete"><i class="fas fa-trash text-red-500"></i></button>
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
              <span class="text-slate-800 dark:text-zinc-100 font-semibold">Staff</span>
            </li>
          </ol>
        </nav>
        
        <!-- Top Level Actions -->
        <div class="flex items-center space-x-3">
          <button class="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none flex items-center shadow-sm" id="view-mode-toggle-btn">
            ${activeView === 'grid' ? 'Grid View' : 'List View'} <i class="fa-solid fa-chevron-down ml-2 text-xs"></i>
          </button>
          <button class="btn btn-secondary shadow-sm" id="manage-holidays-btn">
            <i class="fas fa-calendar-xmark mr-1"></i> Hari Libur
          </button>
          <button class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center transition-colors" id="add-barber-btn">
            <i class="fa-solid fa-plus mr-2"></i> Add Staff
          </button>
        </div>
      </div>

      <!-- MAIN CARD CONTAINER -->
      <div class="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 flex flex-col flex-1">
        
        <!-- Toolbar Section -->
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
          <h2 class="text-base font-bold text-slate-900 dark:text-zinc-100">Staff Table</h2>
          
          <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <!-- Search -->
            <div class="relative flex-1 sm:flex-initial">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i class="fa-solid fa-search text-slate-400 dark:text-zinc-500 text-sm"></i>
              </div>
              <input class="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Search" type="text" id="barber-search-input" value="${filterSearchText}"/>
            </div>
            
            <!-- Day Filter -->
            <select class="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm" id="barber-day-filter">
              <option value="all" ${filterDay === 'all' ? 'selected' : ''}>Semua Hari Kerja</option>
              <option value="0" ${filterDay === '0' ? 'selected' : ''}>Minggu</option>
              <option value="1" ${filterDay === '1' ? 'selected' : ''}>Senin</option>
              <option value="2" ${filterDay === '2' ? 'selected' : ''}>Selasa</option>
              <option value="3" ${filterDay === '3' ? 'selected' : ''}>Rabu</option>
              <option value="4" ${filterDay === '4' ? 'selected' : ''}>Kamis</option>
              <option value="5" ${filterDay === '5' ? 'selected' : ''}>Jumat</option>
              <option value="6" ${filterDay === '6' ? 'selected' : ''}>Sabtu</option>
            </select>
            
            <!-- Sort Filter -->
            <select class="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm" id="barber-sort-filter">
              <option value="name_asc" ${filterSort === 'name_asc' ? 'selected' : ''}>Sort by: Nama (A-Z)</option>
              <option value="name_desc" ${filterSort === 'name_desc' ? 'selected' : ''}>Sort by: Nama (Z-A)</option>
              <option value="rating_desc" ${filterSort === 'rating_desc' ? 'selected' : ''}>Sort by: Rating Tertinggi</option>
              <option value="haircuts_desc" ${filterSort === 'haircuts_desc' ? 'selected' : ''}>Sort by: Potongan Terbanyak</option>
            </select>
          </div>
        </div>

        <!-- Dynamic Content Rendering -->
        <div id="barber-content-area">
          ${activeView === 'grid' ? renderGridView() : renderListView()}
        </div>

        <!-- Pagination Footer -->
        <div class="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4 md:space-y-0">
          <div class="text-sm text-slate-500 dark:text-zinc-400">
            Showing <span class="font-semibold text-slate-800 dark:text-zinc-200">${totalItems === 0 ? 0 : startIndex + 1}</span> to <span class="font-semibold text-slate-800 dark:text-zinc-200">${endIndex}</span> of <span class="font-semibold text-slate-800 dark:text-zinc-200">${totalItems}</span> results
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-slate-500 dark:text-zinc-400">Per page</span>
              <select class="block w-full pl-3 pr-8 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-amber-500 focus:border-amber-500" id="barber-per-page-select">
                <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20</option>
                <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
              </select>
            </div>
            
            <nav aria-label="Pagination" class="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" id="barber-pagination-nav">
              <button class="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50" id="barber-prev-page" ${currentPage === 1 ? 'disabled' : ''}>
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
              
              <button class="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50" id="barber-next-page" ${currentPage === totalPages ? 'disabled' : ''}>
                <span class="sr-only">Next</span>
                <i class="fa-solid fa-chevron-right w-5 h-5 text-center flex items-center justify-center"></i>
              </button>
            </nav>
          </div>
        </div>

      </div>

      <!-- HARILIBUR / HOLIDAYS SECTION -->
      ${holidays.length > 0 ? `
        <div class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 class="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
            <i class="fas fa-calendar-xmark text-red-500"></i> Hari Libur Operasional
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${holidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => `
              <div class="flex items-center justify-between p-3.5 border border-slate-100 dark:border-zinc-900 rounded-xl bg-slate-50/50 dark:bg-zinc-900/10 hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-all">
                <div>
                  <div class="text-sm font-bold text-slate-800 dark:text-zinc-100">${h.name}</div>
                  <div class="text-xs text-slate-400 dark:text-zinc-500 mt-1">${dateUtils.formatDate(h.date, 'long')} ${h.notes ? '• ' + h.notes : ''}</div>
                </div>
                <button class="p-1.5 text-slate-400 hover:text-red-500 transition-colors" onclick="window.__deleteHoliday('${h.id}')" title="Hapus Hari Libur">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Attach event listeners
  container.querySelector('#add-barber-btn')?.addEventListener('click', () => showBarberForm());
  container.querySelector('#manage-holidays-btn')?.addEventListener('click', () => showHolidayForm());
  
  // Search
  container.querySelector('#barber-search-input')?.addEventListener('input', (e) => {
    filterSearchText = e.target.value;
    currentPage = 1;
    renderBarbers(container);
    // Keep focus on input
    const input = document.getElementById('barber-search-input');
    if (input) {
      input.focus();
      const val = input.value;
      input.value = '';
      input.value = val;
    }
  });

  // Filters & Sorts
  container.querySelector('#barber-day-filter')?.addEventListener('change', (e) => {
    filterDay = e.target.value;
    currentPage = 1;
    renderBarbers(container);
  });

  container.querySelector('#barber-sort-filter')?.addEventListener('change', (e) => {
    filterSort = e.target.value;
    currentPage = 1;
    renderBarbers(container);
  });

  container.querySelector('#barber-per-page-select')?.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderBarbers(container);
  });

  // Toggle View
  container.querySelector('#view-mode-toggle-btn')?.addEventListener('click', () => {
    activeView = activeView === 'grid' ? 'list' : 'grid';
    renderBarbers(container);
  });

  // Pagination navigation
  container.querySelector('#barber-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderBarbers(container);
    }
  });

  container.querySelector('#barber-next-page')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderBarbers(container);
    }
  });

  container.querySelectorAll('[data-page-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.pageBtn);
      renderBarbers(container);
    });
  });

  // Global window helpers
  window.__toggleBarberMenu = (id) => {
    const menu = document.getElementById(`barber-menu-${id}`);
    if (!menu) return;
    
    // Close other menus first
    document.querySelectorAll('[id^="barber-menu-"]').forEach(m => {
      if (m.id !== `barber-menu-${id}`) m.classList.add('hidden');
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

  window.__editBarber = (id) => {
    showBarberForm(id);
  };
  
  window.__deleteBarber = (id) => {
    confirmDialog('Yakin ingin menghapus barber ini?', () => {
      storage.delete('barbers', id);
      showToast('Barber dihapus', 'warning');
      renderBarbers(container);
    });
  };
  
  window.__deleteHoliday = (id) => {
    storage.delete('holidays', id);
    renderBarbers(container);
  };
}

function showBarberForm(editId = null) {
  if (!editId) {
    const currentBarbersCount = storage.getAll('barbers').length;
    const constraints = storage.get('shop_constraints', {});
    const maxBarbers = constraints.maxBarbers || 0; 
    
    if (maxBarbers > 0 && currentBarbersCount >= maxBarbers) {
      showToast(`Batas maksimal Barber (${maxBarbers}) telah tercapai untuk paket berlangganan Anda.`, 'warning');
      return;
    }
  }

  const existing = editId ? storage.find('barbers', editId) : null;
  const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const body = `
    <form id="barber-form">
      <div class="form-group">
        <label>Nama</label>
        <input type="text" class="form-control" name="name" value="${existing?.name || ''}" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>No. HP</label>
          <input type="text" class="form-control" name="phone" value="${existing?.phone || ''}" />
        </div>
        <div class="form-group">
          <label>Spesialisasi</label>
          <input type="text" class="form-control" name="specialization" value="${existing?.specialization || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Jam Mulai</label>
          <input type="time" class="form-control" name="workStart" value="${existing?.workStart || '08:00'}" />
        </div>
        <div class="form-group">
          <label>Jam Selesai</label>
          <input type="time" class="form-control" name="workEnd" value="${existing?.workEnd || '20:00'}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Mulai Istirahat</label>
          <input type="time" class="form-control" name="breakStart" value="${existing?.breakStart || '12:00'}" />
        </div>
        <div class="form-group">
          <label>Selesai Istirahat</label>
          <input type="time" class="form-control" name="breakEnd" value="${existing?.breakEnd || '13:00'}" />
        </div>
      </div>
      <div class="form-group">
        <label>Hari Kerja</label>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${daysOfWeek.map((d, i) => `
            <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-input); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px;">
              <input type="checkbox" name="workDays" value="${i}" ${(existing?.workDays || [1, 2, 3, 4, 5, 6]).includes(i) ? 'checked' : ''} />
              ${d.substring(0, 3)}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Gaji Pokok (Rp)</label>
          <input type="number" class="form-control" name="baseSalary" value="${existing?.baseSalary || 0}" min="0" />
        </div>
        <div class="form-group">
          <label>Tipe Komisi</label>
          <select class="form-control" name="commissionType" id="commission-type-select">
            <option value="percent" ${(existing?.commissionType || 'percent') === 'percent' ? 'selected' : ''}>Persen (%)</option>
            <option value="fixed" ${existing?.commissionType === 'fixed' ? 'selected' : ''}>Rupiah Tetap (Rp)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" id="commission-percent-group" style="display: ${existing?.commissionType === 'fixed' ? 'none' : 'block'};">
          <label>Komisi per Transaksi (%)</label>
          <input type="number" class="form-control" name="commissionRate" value="${existing?.commissionRate || 10}" min="0" max="100" />
        </div>
        <div class="form-group" id="commission-fixed-group" style="display: ${existing?.commissionType === 'fixed' ? 'block' : 'none'};">
          <label>Komisi per Transaksi (Rp)</label>
          <input type="number" class="form-control" name="commissionFixed" value="${existing?.commissionFixed || 5000}" min="0" step="1000" />
        </div>
      </div>
      <div class="form-group">
        <label>Bio</label>
        <textarea class="form-control" name="bio" rows="2">${existing?.bio || ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-barber-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal(editId ? 'Edit Barber' : 'Tambah Barber', body, footer);

  // Dynamic toggle for commission type
  const typeSelect = document.getElementById('commission-type-select');
  const percentGroup = document.getElementById('commission-percent-group');
  const fixedGroup = document.getElementById('commission-fixed-group');
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      const isFixed = typeSelect.value === 'fixed';
      percentGroup.style.display = isFixed ? 'none' : 'block';
      fixedGroup.style.display = isFixed ? 'block' : 'none';
    });
  }

  document.getElementById('save-barber-btn').addEventListener('click', () => {
    const form = document.getElementById('barber-form');
    const fd = new FormData(form);
    const workDays = fd.getAll('workDays').map(Number);
    const commissionType = fd.get('commissionType') || 'percent';
    const data = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      specialization: fd.get('specialization'),
      workStart: fd.get('workStart'),
      workEnd: fd.get('workEnd'),
      breakStart: fd.get('breakStart'),
      breakEnd: fd.get('breakEnd'),
      workDays,
      baseSalary: parseInt(fd.get('baseSalary')) || 0,
      commissionType,
      commissionRate: commissionType === 'percent' ? (parseInt(fd.get('commissionRate')) || 0) : 0,
      commissionFixed: commissionType === 'fixed' ? (parseInt(fd.get('commissionFixed')) || 0) : 0,
      bio: fd.get('bio'),
    };

    if (!data.name) { showToast('Nama wajib diisi', 'error'); return; }

    if (editId) {
      storage.update('barbers', editId, data);
      showToast('Data barber diupdate!', 'success');
    } else {
      data.rating = 0;
      data.totalRatings = 0;
      storage.add('barbers', data);
      showToast('Barber ditambahkan!', 'success');
    }

    closeModal();
    renderBarbers(document.getElementById('page-container'));
  });
}

function showHolidayForm() {
  const body = `
    <form id="holiday-form">
      <div class="form-group">
        <label>Tanggal Libur</label>
        <input type="date" class="form-control" name="date" required />
      </div>
      <div class="form-group">
        <label>Nama Hari Libur</label>
        <input type="text" class="form-control" name="name" placeholder="e.g., Idul Fitri" required />
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <input type="text" class="form-control" name="notes" placeholder="e.g., Tutup 3 hari" />
      </div>
    </form>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-holiday-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal('Tambah Hari Libur', body, footer);

  document.getElementById('save-holiday-btn').addEventListener('click', () => {
    const form = document.getElementById('holiday-form');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    if (!data.date || !data.name) { showToast('Lengkapi data', 'error'); return; }
    storage.add('holidays', data);
    showToast('Hari libur ditambahkan', 'success');
    closeModal();
    renderBarbers(document.getElementById('page-container'));
  });
}

window.__shareBarberProfile = function (id) {
  const barber = storage.find('barbers', id);
  if (!barber) return;

  const url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}portal/index.html?barber=${id}`;

  const body = `
    <div style="text-align: center; padding: 10px;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: 700; color: var(--accent);">
        ${barber.name.split(' ').map(n => n[0]).join('')}
      </div>
      <h3 style="margin-bottom: 4px;">${barber.name}</h3>
      <p class="text-sm text-muted mb-lg">${barber.specialization || 'Professional Barber'}</p>
      
      <div style="background: white; padding: 15px; border-radius: 12px; display: inline-block; margin-bottom: 15px; border: 1px solid var(--border);">
        <canvas id="barber-qr-canvas" width="180" height="180"></canvas>
      </div>
      
      <div style="background: var(--bg-input); padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-bottom: 15px; word-break: break-all;">
        ${url}
      </div>
      
      <button class="btn btn-primary btn-block" onclick="window.__copyBarberLink('${url}')">
        <i class="fas fa-copy"></i> Salin Link Booking
      </button>
    </div>
  `;

  openModal('Profil Digital Barber', body, '', { maxWidth: '400px' });

  // Draw QR
  setTimeout(() => {
    const canvas = document.getElementById('barber-qr-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      // Just a mock QR pattern
      for (let i = 0; i < 36; i++) {
        for (let j = 0; j < 36; j++) {
          if (Math.random() > 0.7) ctx.fillRect(i * 5, j * 5, 5, 5);
        }
      }
      ctx.fillRect(0, 0, 35, 35); ctx.clearRect(5, 5, 25, 25); ctx.fillRect(10, 10, 15, 15);
      ctx.fillRect(145, 0, 35, 35); ctx.clearRect(150, 5, 25, 25); ctx.fillRect(155, 10, 15, 15);
      ctx.fillRect(0, 145, 35, 35); ctx.clearRect(5, 150, 25, 25); ctx.fillRect(10, 155, 15, 15);
    }
  }, 100);
};

window.__copyBarberLink = function (url) {
  navigator.clipboard.writeText(url).then(() => {
    import('../components/toast.js').then(m => m.showToast('Link profil disalin! 🔗', 'success'));
  });
};
