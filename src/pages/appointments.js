// ========================================
// Appointments Page
// CRUD, booking, conflict detection
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { whatsapp } from '../components/whatsapp.js';
import { receipt } from '../utils/receipt.js';

let filterStatus = 'all';
let filterDate = 'today';
let filterBarber = 'all';
let filterSearchText = '';
let activeView = 'monthly'; // 'monthly', 'weekly', 'daily', 'list'
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentDay = new Date().getDate();

export function renderAppointments(container) {
  const user = storage.getCurrentUser();
  const isBarber = user?.role === 'barber';
  const appointments = storage.getAll('appointments');
  const barbers = storage.getAll('barbers');
  const services = storage.getAll('services');
  const todayStr = new Date().toISOString().split('T')[0];

  // Cari barberId untuk barber yang login
  let myBarberId = user?.barberId;
  if (!myBarberId && isBarber) {
    const matched = barbers.find(b => b.name?.toLowerCase() === (user?.fullName || user?.username || '').toLowerCase());
    if (matched) myBarberId = matched.id;
  }

  // Filter
  let filtered = [...appointments];
  if (isBarber && myBarberId) {
    filtered = filtered.filter(a => a.barberId === myBarberId);
  }
  
  if (filterStatus !== 'all') {
    filtered = filtered.filter(a => a.status === filterStatus);
  }
  
  if (filterBarber !== 'all') {
    filtered = filtered.filter(a => a.barberId === filterBarber);
  }

  const q = (filterSearchText || '').toLowerCase().trim();
  if (q) {
    filtered = filtered.filter(a => 
      a.customerName?.toLowerCase().includes(q) || 
      a.serviceName?.toLowerCase().includes(q) ||
      a.barberName?.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
  });

  const getHeaderTitle = () => {
    if (activeView === 'monthly') {
      return `${dateUtils.getMonthName(currentMonth)} ${currentYear}`;
    } else if (activeView === 'weekly') {
      const startOfWeek = getStartOfWeek(new Date(currentYear, currentMonth, currentDay));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${dateUtils.formatDate(startOfWeek, 'short')} - ${dateUtils.formatDate(endOfWeek, 'short')}`;
    } else if (activeView === 'daily') {
      const selectedDate = new Date(currentYear, currentMonth, currentDay);
      return dateUtils.formatDate(selectedDate, 'long');
    }
    return '';
  };

  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay(); // 0 = Sunday
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  };

  const getBarberColorClass = (name) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('budi') || lowerName.includes('1')) {
      return { 
        bg: 'bg-amber-50 dark:bg-amber-950/20', 
        text: 'text-amber-700 dark:text-amber-400', 
        border: 'border-amber-400 dark:border-amber-500/50' 
      };
    }
    if (lowerName.includes('agus') || lowerName.includes('2')) {
      return { 
        bg: 'bg-teal-50 dark:bg-teal-950/20', 
        text: 'text-teal-700 dark:text-teal-400', 
        border: 'border-teal-400 dark:border-teal-500/50' 
      };
    }
    if (lowerName.includes('dodi') || lowerName.includes('3')) {
      return { 
        bg: 'bg-indigo-50 dark:bg-indigo-950/20', 
        text: 'text-indigo-700 dark:text-indigo-400', 
        border: 'border-indigo-400 dark:border-indigo-500/50' 
      };
    }
    return { 
      bg: 'bg-purple-50 dark:bg-purple-950/20', 
      text: 'text-purple-700 dark:text-purple-400', 
      border: 'border-purple-400 dark:border-purple-500/50' 
    };
  };

  const renderMonthlyCalendar = () => {
    const firstDayOfWeek = dateUtils.getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = dateUtils.getDaysInMonth(currentYear, currentMonth);
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const startPrevDay = prevMonthDays - firstDayOfWeek + 1;
    
    let cellsHTML = '';
    
    for (let i = 0; i < totalCells; i++) {
      let dayNum, isCurrentMonth, cellDate;
      
      if (i < firstDayOfWeek) {
        dayNum = startPrevDay + i;
        isCurrentMonth = false;
        cellDate = new Date(currentYear, currentMonth - 1, dayNum);
      } else if (i < firstDayOfWeek + daysInMonth) {
        dayNum = i - firstDayOfWeek + 1;
        isCurrentMonth = true;
        cellDate = new Date(currentYear, currentMonth, dayNum);
      } else {
        dayNum = i - firstDayOfWeek - daysInMonth + 1;
        isCurrentMonth = false;
        cellDate = new Date(currentYear, currentMonth + 1, dayNum);
      }
      
      const dateStr = cellDate.getFullYear() + '-' + 
                      String(cellDate.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(cellDate.getDate()).padStart(2, '0');
      
      const dayAppts = filtered.filter(a => a.date === dateStr);
      const isToday = dateUtils.isToday(cellDate);
      const isSelected = isCurrentMonth && dayNum === currentDay;
      
      const cellClass = isCurrentMonth 
        ? 'bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300' 
        : 'bg-slate-50 dark:bg-zinc-900/40 text-slate-400 dark:text-zinc-600';
        
      const visibleAppts = dayAppts.slice(0, 2);
      const hiddenCount = dayAppts.length - visibleAppts.length;
      
      cellsHTML += `
        <div class="${cellClass} min-h-[120px] p-2 flex flex-col gap-1 border-r border-b border-slate-200 dark:border-zinc-800 transition-all select-none hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 cursor-pointer" 
          data-cell-date="${dateStr}" data-day="${dayNum}" data-month="${cellDate.getMonth()}" data-year="${cellDate.getFullYear()}">
          <div class="flex justify-between items-center mb-1">
            <div>
              ${isToday ? `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" title="Hari Ini"></span>` : ''}
            </div>
            ${isSelected ? `
              <span class="text-xs font-bold text-white bg-amber-500 rounded px-1.5 py-0.5">${dayNum}</span>
            ` : `
              <span class="text-right text-xs font-medium ${isCurrentMonth ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}">${dayNum}</span>
            `}
          </div>
          <div class="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
            ${visibleAppts.map(apt => {
              const barberColor = getBarberColorClass(apt.barberName);
              return `
                <div class="text-[10px] truncate px-1.5 py-0.5 rounded border-l-2 ${barberColor.bg} ${barberColor.text} ${barberColor.border} font-semibold" 
                  data-appt-id="${apt.id}">
                  ${apt.time} ${apt.customerName}
                </div>
              `;
            }).join('')}
            ${hiddenCount > 0 ? `
              <div class="text-[9px] font-bold text-slate-500 dark:text-zinc-400 pl-1">+${hiddenCount} more</div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    return `
      <div class="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col flex-1">
        <!-- Days Header -->
        <div class="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
          <div class="py-2.5 text-center text-xs font-medium text-slate-500 dark:text-zinc-400 border-r border-slate-200 dark:border-zinc-800 last:border-r-0">Sunday</div>
          <div class="py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-zinc-800 last:border-r-0">Monday</div>
          <div class="py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-zinc-800 last:border-r-0">Tuesday</div>
          <div class="py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-zinc-800 last:border-r-0">Wednesday</div>
          <div class="py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-zinc-800 last:border-r-0">Thursday</div>
          <div class="py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-zinc-800 last:border-r-0">Friday</div>
          <div class="py-2.5 text-center text-xs font-medium text-slate-500 dark:text-zinc-400">Saturday</div>
        </div>
        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 flex-1 bg-slate-200 dark:bg-zinc-800 gap-[1px]">
          ${cellsHTML}
        </div>
      </div>
    `;
  };

  const renderWeeklyCalendar = () => {
    const startOfWeek = getStartOfWeek(new Date(currentYear, currentMonth, currentDay));
    let daysHTML = '';
    
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(startOfWeek);
      cellDate.setDate(startOfWeek.getDate() + i);
      
      const dateStr = cellDate.getFullYear() + '-' + 
                      String(cellDate.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(cellDate.getDate()).padStart(2, '0');
                      
      const dayAppts = filtered.filter(a => a.date === dateStr);
      const isToday = dateUtils.isToday(cellDate);
      
      daysHTML += `
        <div class="flex-1 min-w-[200px] bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col p-4 shadow-sm">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <div class="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase">${dateUtils.formatDate(cellDate, 'day')}</div>
              <div class="text-sm font-bold text-slate-800 dark:text-zinc-100">${dateUtils.formatDate(cellDate, 'short').split(' ')[0]} ${dateUtils.formatDate(cellDate, 'short').split(' ')[1]}</div>
            </div>
            ${isToday ? `<span class="bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">Hari Ini</span>` : ''}
          </div>
          <div class="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px]">
            ${dayAppts.length > 0 ? dayAppts.map(apt => {
              const barberColor = getBarberColorClass(apt.barberName);
              return `
                <div class="p-2.5 rounded-lg border-l-3 ${barberColor.bg} ${barberColor.text} ${barberColor.border} cursor-pointer hover:shadow-xs transition-all flex flex-col gap-1" data-appt-id="${apt.id}">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-extrabold">${apt.time}</span>
                    <span class="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500">${apt.barberName}</span>
                  </div>
                  <div class="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">${apt.customerName}</div>
                  <div class="text-[10px] text-slate-500 dark:text-zinc-400 truncate">${apt.serviceName}</div>
                </div>
              `;
            }).join('') : `
              <div class="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 dark:text-zinc-600 text-xs italic">
                <i class="fas fa-calendar-xmark mb-2 text-base opacity-40"></i>
                Tidak ada janji
              </div>
            `}
          </div>
        </div>
      `;
    }
    
    return `
      <div class="flex gap-4 overflow-x-auto pb-4">
        ${daysHTML}
      </div>
    `;
  };

  const renderDailyCalendar = () => {
    const selectedDate = new Date(currentYear, currentMonth, currentDay);
    const dateStr = selectedDate.getFullYear() + '-' + 
                    String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(selectedDate.getDate()).padStart(2, '0');
                    
    const dayAppts = filtered.filter(a => a.date === dateStr);
    dayAppts.sort((a, b) => a.time.localeCompare(b.time));
    
    return `
      <div class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col flex-1">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-base font-bold text-slate-800 dark:text-zinc-100">Jadwal Harian</h3>
            <p class="text-xs text-slate-400 dark:text-zinc-500">${dateUtils.formatDate(selectedDate, 'long')}</p>
          </div>
          <span class="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
            ${dayAppts.length} Janji Temu
          </span>
        </div>
        
        <div class="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[500px]">
          ${dayAppts.length > 0 ? dayAppts.map(apt => {
            const barberColor = getBarberColorClass(apt.barberName);
            return `
              <div class="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/10 hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-all cursor-pointer" data-appt-id="${apt.id}">
                <div class="w-16 flex-shrink-0 text-center border-r border-slate-200 dark:border-zinc-800 pr-4">
                  <span class="text-sm font-extrabold text-amber-500">${apt.time}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">${apt.customerName}</h4>
                    <span class="badge ${getStatusBadge(apt.status)}" style="font-size: 9px; padding: 2px 6px;">
                      ${getStatusLabel(apt.status)}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500 dark:text-zinc-400 truncate">${apt.serviceName}</div>
                  <div class="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Stylist: ${apt.barberName} · ${apt.duration} menit</div>
                </div>
                <div class="flex items-center gap-2">
                  ${apt.status === 'pending' ? `
                    <button class="btn btn-ghost btn-sm" title="Terima" onclick="event.stopPropagation(); window.__approvePortalAppt('${apt.id}')" style="color: var(--success);"><i class="fas fa-check"></i></button>
                    <button class="btn btn-ghost btn-sm" title="Tolak" onclick="event.stopPropagation(); window.__rejectPortalAppt('${apt.id}')" style="color: var(--danger);"><i class="fas fa-times"></i></button>
                  ` : ''}
                  ${apt.status !== 'done' && apt.status !== 'cancelled' && apt.status !== 'rejected' && apt.status !== 'pending' ? `
                    <button class="btn btn-ghost btn-sm" title="WhatsApp" onclick="event.stopPropagation(); window.__waAppt('${apt.id}')" style="color: #25d366;"><i class="fab fa-whatsapp"></i></button>
                    <button class="btn btn-ghost btn-sm" title="Tandai Selesai" onclick="event.stopPropagation(); window.__doneAppt('${apt.id}')" style="color: var(--info);"><i class="fas fa-check-double"></i></button>
                  ` : ''}
                  <button class="btn btn-ghost btn-sm" title="Detail" onclick="event.stopPropagation(); window.__editAppt('${apt.id}')" style="color: var(--accent);"><i class="fas fa-eye"></i></button>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 dark:text-zinc-600">
              <i class="fas fa-calendar-xmark text-4xl mb-4 opacity-30"></i>
              <h4 class="font-bold">Tidak Ada Janji Temu</h4>
              <p class="text-xs mt-1">Tidak ada jadwal terdaftar untuk hari ini.</p>
            </div>
          `}
        </div>
      </div>
    `;
  };

  const renderListView = () => {
    let listFiltered = [...filtered];
    
    if (filterDate === 'today') {
      listFiltered = listFiltered.filter(a => a.date === todayStr);
    } else if (filterDate === 'upcoming') {
      listFiltered = listFiltered.filter(a => a.date >= todayStr && a.status !== 'done' && a.status !== 'cancelled');
    } else if (filterDate === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      listFiltered = listFiltered.filter(a => new Date(a.date) >= weekAgo);
    } else if (filterDate === 'month') {
      listFiltered = listFiltered.filter(a => a.date.startsWith(todayStr.substring(0, 7)));
    }
    
    return `
      <div id="appointments-list">
        ${listFiltered.length > 0 ? `
          <div class="table-container shadow-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <table style="width: 100%;">
              <thead>
                <tr>
                  <th style="padding-left: 20px;">Tanggal</th>
                  <th>Jam</th>
                  <th>Pelanggan</th>
                  <th>Layanan & Harga</th>
                  <th>Stylist</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${listFiltered.map(apt => `
                  <tr>
                    <td style="padding-left: 20px; width: 80px;">
                      <div class="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-center padding-sm" style="padding: 6px 4px; display: inline-block; min-width: 56px;">
                        <div class="text-[9px] uppercase tracking-widest fw-800 text-muted" style="border-bottom: 1px solid var(--border-light); padding-bottom: 2px; margin-bottom: 4px;">${dateUtils.formatDate(apt.date, 'dayshort')}</div>
                        <div class="fw-900 text-primary" style="font-size: 16px; line-height: 1;">${apt.date.split('-')[2]}</div>
                        <div class="text-[9px] uppercase fw-800 text-accent mt-[2px]">${dateUtils.formatDate(apt.date, 'short').split(' ')[1]}</div>
                      </div>
                    </td>
                    <td><span class="fw-800 text-primary" style="font-size: 15px; letter-spacing: -0.5px;">${apt.time}</span></td>
                    <td>
                      <div class="fw-700 text-primary" style="text-transform: capitalize; font-size: 14px;">${apt.customerName}</div>
                    </td>
                    <td>
                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="fw-600 text-primary" style="text-transform: capitalize; font-size: 13px;">${apt.serviceName}</span>
                          ${apt.recurringType ? `<i class="fas fa-redo text-accent" style="font-size: 10px;" title="${apt.recurringType}"></i>` : ''}
                        </div>
                        <div class="text-[11px] fw-800 text-accent">${formatter.currency(apt.price)}</div>
                      </div>
                    </td>
                    <td>
                      <div class="fw-600 text-muted" style="text-transform: capitalize; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                        <div style="width: 20px; height: 20px; border-radius: 50%; background: var(--accent-subtle); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 9px;"><i class="fas fa-cut"></i></div>
                        ${apt.barberName}
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                        <span class="badge ${getStatusBadge(apt.status)}" style="font-size: 10px; padding: 4px 8px;">
                          ${getStatusLabel(apt.status)}
                        </span>
                        <span class="badge ${getPayBadge(apt.paymentStatus)}" style="font-size: 9px; padding: 2px 6px; opacity: 0.9;">
                          ${apt.paymentStatus === 'paid' ? 'LUNAS' : apt.paymentStatus === 'dp' ? 'DP' : 'BELUM BAYAR'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        ${apt.status === 'pending' ? `
                          <button class="btn btn-ghost btn-sm" title="Terima" onclick="window.__approvePortalAppt('${apt.id}')" style="background: var(--success-bg); color: var(--success); padding: 6px 10px; border-radius: 6px;">
                            <i class="fas fa-check"></i>
                          </button>
                          <button class="btn btn-ghost btn-sm" title="Tolak" onclick="window.__rejectPortalAppt('${apt.id}')" style="background: var(--danger-bg); color: var(--danger); padding: 6px 10px; border-radius: 6px;">
                            <i class="fas fa-times"></i>
                          </button>
                        ` : ''}
                        ${apt.status !== 'done' && apt.status !== 'cancelled' && apt.status !== 'rejected' && apt.status !== 'pending' ? `
                          <button class="btn btn-ghost btn-sm" title="WhatsApp Pelanggan" onclick="window.__waAppt('${apt.id}')" style="color: #25d366; background: rgba(37, 211, 102, 0.1); padding: 6px 10px; border-radius: 6px;">
                            <i class="fab fa-whatsapp"></i>
                          </button>
                          ${apt.status === 'scheduled' ? `
                            <button class="btn btn-ghost btn-sm" title="Konfirmasi Kedatangan" onclick="window.__confirmAppt('${apt.id}')" style="color: var(--success); padding: 6px 10px; border-radius: 6px;">
                              <i class="fas fa-calendar-check"></i>
                            </button>
                          ` : ''}
                          <button class="btn btn-ghost btn-sm" title="Tandai Selesai" onclick="window.__doneAppt('${apt.id}')" style="color: var(--info); padding: 6px 10px; border-radius: 6px;">
                            <i class="fas fa-check-double"></i>
                          </button>
                          <button class="btn btn-ghost btn-sm" title="Batalkan Pesanan" onclick="window.__cancelAppt('${apt.id}')" style="color: var(--text-muted); padding: 6px 10px; border-radius: 6px;">
                            <i class="fas fa-ban"></i>
                          </button>
                        ` : ''}
                        <button class="btn btn-ghost btn-sm" title="Lihat Detail" onclick="window.__editAppt('${apt.id}')" style="background: var(--accent-subtle); color: var(--accent); padding: 6px 10px; border-radius: 6px;">
                          <i class="fas fa-eye"></i>
                        </button>
                        ${apt.status === 'done' ? `
                          <button class="btn btn-ghost btn-sm" title="Cetak Struk" onclick="window.__invoiceAppt('${apt.id}')" style="background: var(--bg-input); color: var(--text-primary); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border);">
                            <i class="fas fa-print"></i>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="card empty-state">
            <i class="fas fa-calendar-xmark"></i>
            <h3>Belum Ada Janji</h3>
            <p>Tambah janji baru untuk pelanggan</p>
          </div>
        `}
      </div>
    `;
  };

  const renderActiveView = () => {
    if (activeView === 'monthly') return renderMonthlyCalendar();
    if (activeView === 'weekly') return renderWeeklyCalendar();
    if (activeView === 'daily') return renderDailyCalendar();
    return renderListView();
  };

  container.innerHTML = `
    <!-- MAIN CONTAINER -->
    <div class="flex-grow p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 fade-in text-slate-800 dark:text-slate-200">
      
      <!-- CONTROLS AREA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Breadcrumbs -->
        <div class="text-sm font-medium text-slate-500 dark:text-zinc-400">
          Manajemen <span class="mx-2 text-slate-300 dark:text-zinc-700">/</span> <span class="text-slate-800 dark:text-zinc-100 font-semibold">Janji Temu</span>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-3">
          <!-- View Dropdown -->
          <div class="relative">
            <select id="calendar-view-select" class="appearance-none bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-sm">
              <option value="monthly" ${activeView === 'monthly' ? 'selected' : ''}>Monthly</option>
              <option value="weekly" ${activeView === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="daily" ${activeView === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="list" ${activeView === 'list' ? 'selected' : ''}>List View</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-zinc-400">
              <svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>
          </div>
          
          <!-- Add Appointment Button -->
          <button id="add-appointment-btn" class="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-sm">
            <svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            Janji Baru
          </button>
        </div>
      </div>

      <!-- FILTER & NAVIGATION BAR -->
      <div class="bg-white dark:bg-zinc-900/50 rounded-xl p-4 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        
        <!-- Navigation Controls for Calendar Views -->
        ${activeView !== 'list' ? `
          <div class="flex items-center gap-3">
            <button id="prev-btn" class="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors">
              <i class="fas fa-chevron-left"></i>
            </button>
            <h2 id="calendar-header-title" class="text-base font-bold text-slate-800 dark:text-zinc-100 min-w-[150px] text-center">
              ${getHeaderTitle()}
            </h2>
            <button id="next-btn" class="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        ` : `
          <!-- Search input for List View -->
          <div class="relative flex-1 max-w-sm">
            <input type="text" id="search-appt" placeholder="Cari pelanggan..." value="${filterSearchText}" class="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 py-2 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-sm"></i>
          </div>
        `}

        <!-- Unified Filter Options -->
        <div class="flex flex-wrap items-center gap-3">
          ${activeView === 'list' ? `
            <select class="bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" id="filter-date">
              <option value="today" ${filterDate === 'today' ? 'selected' : ''}>Hari Ini</option>
              <option value="upcoming" ${filterDate === 'upcoming' ? 'selected' : ''}>Akan Datang</option>
              <option value="week" ${filterDate === 'week' ? 'selected' : ''}>Minggu Ini</option>
              <option value="month" ${filterDate === 'month' ? 'selected' : ''}>Bulan Ini</option>
              <option value="all" ${filterDate === 'all' ? 'selected' : ''}>Semua Tanggal</option>
            </select>
          ` : ''}
          
          <!-- Stylist Filter -->
          <select class="bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" id="filter-barber">
            <option value="all" ${filterBarber === 'all' ? 'selected' : ''}>Semua Barber</option>
            ${barbers.map(b => `<option value="${b.id}" ${filterBarber === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
          
          <!-- Status Filter -->
          <select class="bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-100 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" id="filter-status">
            <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Semua Status</option>
            <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Pending Portal</option>
            <option value="confirmed" ${filterStatus === 'confirmed' ? 'selected' : ''}>Dikonfirmasi</option>
            <option value="done" ${filterStatus === 'done' ? 'selected' : ''}>Selesai</option>
            <option value="cancelled" ${filterStatus === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
            <option value="rejected" ${filterStatus === 'rejected' ? 'selected' : ''}>Ditolak</option>
          </select>
        </div>
      </div>

      <!-- MAIN CONTENT VIEW -->
      <div id="appointments-content-view" class="flex-grow flex flex-col">
        ${renderActiveView()}
      </div>
    </div>
  `;

  // Events
  container.querySelector('#add-appointment-btn')?.addEventListener('click', () => showAppointmentForm());
  
  if (activeView === 'list') {
    container.querySelector('#filter-date')?.addEventListener('change', (e) => {
      filterDate = e.target.value;
      renderAppointments(container);
    });
    container.querySelector('#search-appt')?.addEventListener('input', (e) => {
      filterSearchText = e.target.value;
      const q = filterSearchText.toLowerCase();
      container.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  container.querySelector('#filter-status')?.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderAppointments(container);
  });
  
  container.querySelector('#filter-barber')?.addEventListener('change', (e) => {
    filterBarber = e.target.value;
    renderAppointments(container);
  });

  container.querySelector('#calendar-view-select')?.addEventListener('change', (e) => {
    activeView = e.target.value;
    renderAppointments(container);
  });

  const handlePrev = () => {
    if (activeView === 'monthly') {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    } else if (activeView === 'weekly') {
      const d = new Date(currentYear, currentMonth, currentDay);
      d.setDate(d.getDate() - 7);
      currentDay = d.getDate();
      currentMonth = d.getMonth();
      currentYear = d.getFullYear();
    } else if (activeView === 'daily') {
      const d = new Date(currentYear, currentMonth, currentDay);
      d.setDate(d.getDate() - 1);
      currentDay = d.getDate();
      currentMonth = d.getMonth();
      currentYear = d.getFullYear();
    }
  };

  const handleNext = () => {
    if (activeView === 'monthly') {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    } else if (activeView === 'weekly') {
      const d = new Date(currentYear, currentMonth, currentDay);
      d.setDate(d.getDate() + 7);
      currentDay = d.getDate();
      currentMonth = d.getMonth();
      currentYear = d.getFullYear();
    } else if (activeView === 'daily') {
      const d = new Date(currentYear, currentMonth, currentDay);
      d.setDate(d.getDate() + 1);
      currentDay = d.getDate();
      currentMonth = d.getMonth();
      currentYear = d.getFullYear();
    }
  };

  if (activeView !== 'list') {
    container.querySelector('#prev-btn')?.addEventListener('click', () => {
      handlePrev();
      renderAppointments(container);
    });
    
    container.querySelector('#next-btn')?.addEventListener('click', () => {
      handleNext();
      renderAppointments(container);
    });
    
    if (activeView === 'monthly') {
      container.querySelectorAll('[data-cell-date]').forEach(cell => {
        cell.addEventListener('click', (e) => {
          if (e.target.closest('[data-appt-id]')) return;
          
          const clickedDate = cell.dataset.cellDate;
          const parts = clickedDate.split('-');
          currentYear = parseInt(parts[0]);
          currentMonth = parseInt(parts[1]) - 1;
          currentDay = parseInt(parts[2]);
          
          activeView = 'daily';
          renderAppointments(container);
        });
      });
    }
  }

  container.querySelectorAll('[data-appt-id]').forEach(badge => {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const apptId = badge.dataset.apptId;
      showAppointmentDetail(apptId);
    });
  });

  // Global window functions
  window.__waAppt = (id) => {
    window.openCRMTemplateModal(id);
  };

  window.openCRMTemplateModal = (id) => {
    const apt = storage.find('appointments', id);
    if (!apt) return;
    const customer = storage.find('customers', apt.customerId);
    if (!customer) return;

    const settings = storage.get('settings', {});
    const shopName = settings.shopName || 'BarberPro Studio';
    const address = settings.address || '';
    const bookingUrl = window.location.origin + `/portal/portal.html?shop=${settings.slug || 'barber'}`;

    const templates = [
      {
        id: 'confirm',
        title: '✅ Konfirmasi',
        icon: 'fa-calendar-check',
        body: `Halo [NAMA_PELANGGAN]! 👋\n\nBooking Anda telah DITERIMA!\n\n📅 Hari/Tgl: [TANGGAL]\n⏰ Jam: [WAKTU] WITA\n💇 Layanan: [LAYANAN]\n💈 Barber: [NAMA_BARBER]\n\n📍 [NAMA_TOKO]\n${address ? `[ALAMAT_TOKO]` : ''}\n\nSampai jumpa! 😊`
      },
      {
        id: 'reminder',
        title: '🔔 Pengingat',
        icon: 'fa-bell',
        body: `Halo [NAMA_PELANGGAN]! 🔔\n\nReminder janji temu Anda di [NAMA_TOKO]:\n📅 Tanggal: [TANGGAL]\n⏰ Jam: [WAKTU] WITA\n💇 Layanan: [LAYANAN]\n💈 Barber: [NAMA_BARBER]\n\nJangan lupa ya! 😊\nBalas pesan ini jika ada perubahan.`
      },
      {
        id: 'feedback',
        title: '⭐ Ulasan',
        icon: 'fa-star',
        body: `Halo [NAMA_PELANGGAN]! 🙏\n\nTerima kasih telah mencukur di [NAMA_TOKO] bersama Stylist [NAMA_BARBER].\n\nBagaimana pengalaman mencukur Anda hari ini? Bantu kami meningkatkan layanan dengan memberikan ulasan di sini:\n👉 [PORTAL_URL]\n\nSemoga hari Anda menyenangkan! 💇‍♂️✨`
      },
      {
        id: 'reengage',
        title: '🎁 Re-engagement',
        icon: 'fa-gift',
        body: `Halo [NAMA_PELANGGAN]! 👋\n\nSudah lama tidak melihat Anda di [NAMA_TOKO]. Kami sangat merindukan kehadiran Anda!\n\nKhusus untuk Anda, gunakan kode promo *MISSYOU15* untuk mendapatkan diskon 15% pada kunjungan berikutnya!\n\nBooking di sini:\n👉 [PORTAL_URL]\n\nSampai jumpa lagi! ✂️`
      }
    ];

    const parseText = (tpl) => {
      return tpl
        .replace(/\[NAMA_PELANGGAN\]/g, customer.name || '')
        .replace(/\[TANGGAL\]/g, dateUtils.formatDate(apt.date, 'long') || '')
        .replace(/\[WAKTU\]/g, apt.time || '')
        .replace(/\[LAYANAN\]/g, apt.serviceName || '')
        .replace(/\[NAMA_BARBER\]/g, apt.barberName || '')
        .replace(/\[NAMA_TOKO\]/g, shopName)
        .replace(/\[ALAMAT_TOKO\]/g, address)
        .replace(/\[PORTAL_URL\]/g, bookingUrl);
    };

    const modalBody = `
      <div style="display:flex; flex-direction:column; gap:16px; text-align:left;">
        <p style="font-size:13px; color:var(--text-muted);">Pilih salah satu template WhatsApp CRM premium di bawah untuk mengirim pesan otomatis ke <b>${customer.name}</b>:</p>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px;" class="pill-selector" id="crm-template-selector">
          ${templates.map((t, idx) => `
            <button type="button" class="pill-btn ${idx === 0 ? 'active' : ''}" data-tpl-id="${t.id}" style="width:100%; text-align:left; display:flex; align-items:center; gap:8px;">
              <i class="fas ${t.icon}"></i> ${t.title}
            </button>
          `).join('')}
        </div>

        <div class="form-group" style="margin-top:12px;">
          <label>Edit Pesan (Real-time Preview)</label>
          <textarea class="form-control" id="crm-message-text" rows="8" style="font-family:inherit; font-size:13px; line-height:1.5; background:var(--bg-input); border:1px solid var(--border); border-radius:12px; padding:12px; width:100%; color:var(--text-primary); outline:none; resize:none;"></textarea>
        </div>

        <div style="display:flex; align-items:center; gap:8px; background:rgba(37, 211, 102, 0.08); border:1px solid rgba(37, 211, 102, 0.15); border-radius:10px; padding:10px;">
          <div style="font-size:18px; color:#25d366;"><i class="fab fa-whatsapp"></i></div>
          <div style="font-size:11px; color:var(--text-muted); line-height:1.4;">
            Nomor Tujuan: <b>${customer.phone}</b>. Pesan akan secara otomatis dibuka di aplikasi WhatsApp Web atau Mobile.
          </div>
        </div>
      </div>
    `;

    const modalFooter = `
      <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
      <button class="btn btn-success" id="send-crm-wa-btn" style="background:#25d366; border:none; color:#fff; font-weight:700;">
        <i class="fab fa-whatsapp"></i> Kirim WhatsApp
      </button>
    `;

    openModal('WhatsApp CRM Assistant 🤖', modalBody, modalFooter);

    const textEditor = document.getElementById('crm-message-text');
    const sendBtn = document.getElementById('send-crm-wa-btn');

    let activeTpl = templates[0];
    textEditor.value = parseText(activeTpl.body);

    const buttons = document.querySelectorAll('#crm-template-selector button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tId = btn.dataset.tplId;
        activeTpl = templates.find(t => t.id === tId);
        textEditor.value = parseText(activeTpl.body);
      });
    });

    sendBtn.addEventListener('click', () => {
      const finalMsg = textEditor.value;
      const phoneNum = customer.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(finalMsg)}`, '_blank');
      closeModal();
      showToast('Membuka WhatsApp...', 'success');
    });
  };

  window.__confirmAppt = (id) => {
    storage.update('appointments', id, { status: 'confirmed' });
    showToast('Janji dikonfirmasi!', 'success');
    renderAppointments(container);
  };

  window.__doneAppt = (id) => {
    showRatingModal(id, container);
  };

  window.__cancelAppt = (id) => {
    confirmDialog('Yakin ingin membatalkan janji ini?', () => {
      const apt = storage.find('appointments', id);
      if (!apt) return;

      storage.update('appointments', id, { status: 'cancelled' });
      showToast('Janji dibatalkan', 'warning');
      renderAppointments(container);

      const waitlist = storage.getAll('waitlist');
      const waiting = waitlist.filter(w => w.date === apt.date && w.time === apt.time && w.barberId === apt.barberId && w.status === 'waiting');

      if (waiting.length > 0) {
        confirmDialog(`Ada ${waiting.length} orang di waitlist untuk jam ini. Kirim notifikasi WhatsApp?`, () => {
          waiting.forEach(w => {
            const msg = `Halo ${w.name}! 👋\n\nKabar baik! Slot jam *${w.time}* pada tanggal *${dateUtils.formatDate(w.date, 'short')}* yang Anda tunggu kini tersedia kembali.\n\nSegera booking melalui portal kami sebelum diambil orang lain! ✂️`;
            window.open(`https://wa.me/${w.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
            storage.update('waitlist', w.id, { status: 'notified' });
          });
          showToast('Waitlist telah dinotifikasi!', 'success');
        }, 'Notifikasi Waitlist');
      }
    }, 'Batalkan Janji');
  };

  window.__editAppt = (id) => {
    showAppointmentDetail(id);
  };

  window.__invoiceAppt = (id) => {
    generateInvoice(id);
  };

  window.__approvePortalAppt = (id) => {
    const apt = storage.find('appointments', id);
    if (!apt) return;
    storage.update('appointments', id, { status: 'confirmed' });

    if (apt.customerPhone) {
      const phone = apt.customerPhone.replace(/\D/g, '');
      const msg = `Halo ${apt.customerName}! ✅\n\nBooking Anda telah DITERIMA!\n\n📅 ${dateUtils.formatDate(apt.date, 'short')}\n⏰ ${apt.time}\n💇 ${apt.serviceName}\n💈 ${apt.barberName}\n${apt.bookingCode ? `🔖 Kode: ${apt.bookingCode}` : ''}\n\nSampai jumpa! 😊`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    showToast('Booking diterima! ✅', 'success');
    renderAppointments(container);
  };

  window.__rejectPortalAppt = (id) => {
    const apt = storage.find('appointments', id);
    if (!apt) return;
    storage.update('appointments', id, { status: 'rejected' });

    if (apt.customerPhone) {
      const phone = apt.customerPhone.replace(/\D/g, '');
      const msg = `Halo ${apt.customerName},\n\nMohon maaf, booking Anda untuk tanggal ${dateUtils.formatDate(apt.date, 'short')} jam ${apt.time} tidak dapat kami terima saat ini.\n\nSilakan pilih jadwal lain melalui portal kami. Terima kasih 🙏`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    showToast('Booking ditolak', 'warning');
    renderAppointments(container);
  };
}

function showAppointmentForm(editId = null) {
  const customers = storage.getAll('customers');
  const barbers = storage.getAll('barbers');
  const services = storage.getAll('services');
  const existing = editId ? storage.find('appointments', editId) : null;
  const todayStr = new Date().toISOString().split('T')[0];

  const body = `
    <form id="appt-form">
      <div class="form-group">
        <label>Pelanggan</label>
        <div style="position: relative;">
          <input type="text" id="customer-search" class="form-control" placeholder="Cari nama pelanggan..." autocomplete="off"
            style="padding-right: 36px;"
            value="${existing ? (customers.find(c=>c.id===existing.customerId)?.name || '') : ''}" />
          <i class="fas fa-search" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none;"></i>
          <input type="hidden" name="customerId" id="customer-id-hidden" value="${existing?.customerId || ''}" required />
        </div>
        <div id="customer-dropdown" style="display:none; position:absolute; z-index:9999; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; max-height:200px; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.3); margin-top:4px; width:calc(100% - 48px);"></div>
        <div id="customer-selected-pill" style="margin-top:8px; display:${existing?.customerId ? 'flex' : 'none'}; align-items:center; gap:8px; padding:8px 12px; background:var(--accent-subtle); border:1px solid var(--accent-glow); border-radius:30px; width:fit-content;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--accent);color:#0f1117;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;" id="pill-avatar">
            ${existing ? (customers.find(c=>c.id===existing.customerId)?.name?.[0]?.toUpperCase() || '?') : '?'}
          </div>
          <span style="font-size:13px;font-weight:600;color:var(--accent);" id="pill-name">
            ${existing ? (customers.find(c=>c.id===existing.customerId)?.name || '') : ''}
          </span>
          <button type="button" onclick="window.__clearCustomer()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0;font-size:14px;line-height:1;">×</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tanggal</label>
          <input type="date" class="form-control" name="date" value="${existing?.date || todayStr}" required />
        </div>
        <div class="form-group">
          <label>Jam</label>
          <select class="form-control" name="time" required>
            ${dateUtils.getTimeSlots().map(t => `<option value="${t}" ${existing?.time === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Layanan (Bisa pilih lebih dari satu)</label>
        <div class="service-selection-grid" style="display: grid; grid-template-columns: 1fr; gap: 6px; max-height: 160px; overflow-y: auto; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius);">
          ${services.map(s => {
            const isChecked = existing?.serviceId === s.id || (existing?.serviceName || '').includes(s.name);
            return `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 4px 0;">
              <input type="checkbox" name="serviceIds" value="${s.id}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; flex-shrink: 0;" data-name="${s.name}" data-price="${s.price}" data-duration="${s.duration}" />
              <span style="flex: 1;">${s.name}</span>
              <span style="font-size: 11px; color: var(--accent); flex-shrink: 0;">Rp ${(s.price||0).toLocaleString('id')}</span>
            </label>
          `}).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Barber</label>
        <select class="form-control" name="barberId" required>
          <option value="">Pilih barber...</option>
          ${barbers.map(b => `<option value="${b.id}" ${existing?.barberId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Pembayaran</label>
        <select class="form-control" name="paymentStatus" id="payment-status-select">
          <option value="unpaid" ${existing?.paymentStatus === 'unpaid' ? 'selected' : ''}>Belum Bayar</option>
          <option value="dp" ${existing?.paymentStatus === 'dp' ? 'selected' : ''}>DP (Uang Muka)</option>
          <option value="paid" ${existing?.paymentStatus === 'paid' ? 'selected' : ''}>Lunas</option>
          <option value="package" ${existing?.paymentStatus === 'package' ? 'selected' : ''}>Paket Membership</option>
        </select>
      </div>
      <div class="form-group" id="package-selector-group" style="display: none;">
        <label>Pilih Paket</label>
        <select class="form-control" name="usedPackageId" id="package-select">
          <option value="">Pilih paket aktif...</option>
        </select>
      </div>
      <div class="form-group" id="dp-amount-group" style="display: none;">
        <label>Jumlah DP</label>
        <input type="number" class="form-control" name="dpAmount" placeholder="0" value="${existing?.dpAmount || ''}" />
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <textarea class="form-control" name="notes" rows="2" placeholder="Catatan tambahan...">${existing?.notes || ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-appt-btn">
      <i class="fas fa-save"></i> ${editId ? 'Update' : 'Simpan'}
    </button>
  `;

  openModal(editId ? 'Edit Janji' : 'Janji Temu Baru', body, footer);

  // Customer search pill
  const searchInput = document.getElementById('customer-search');
  const dropdown = document.getElementById('customer-dropdown');
  const hiddenInput = document.getElementById('customer-id-hidden');
  const pill = document.getElementById('customer-selected-pill');
  const pillName = document.getElementById('pill-name');
  const pillAvatar = document.getElementById('pill-avatar');

  window.__clearCustomer = () => {
    hiddenInput.value = '';
    searchInput.value = '';
    pill.style.display = 'none';
    searchInput.style.display = '';
    searchInput.focus();
  };

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = customers.filter(c =>
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).slice(0, 8);

    if (!q || filtered.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.style.display = 'block';
    dropdown.innerHTML = filtered.map(c => `
      <div data-id="${c.id}" data-name="${c.name}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.15s;"
        onmouseover="this.style.background='var(--bg-input)'" onmouseout="this.style.background='transparent'">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--accent);color:#0f1117;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">
          ${c.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;">${c.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">${formatter.phoneDisplay(c.phone) || '-'}</div>
        </div>
      </div>
    `).join('');

    dropdown.querySelectorAll('[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        hiddenInput.value = item.dataset.id;
        pillName.textContent = item.dataset.name;
        pillAvatar.textContent = item.dataset.name?.[0]?.toUpperCase() || '?';
        pill.style.display = 'flex';
        searchInput.style.display = 'none';
        dropdown.style.display = 'none';
      });
    });
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value) searchInput.dispatchEvent(new Event('input'));
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.style.display = 'none';
    }
  }, { once: false });

  // Jika sudah ada pelanggan terpilih, sembunyikan input
  if (existing?.customerId) {
    searchInput.style.display = 'none';
  }

  // Toggle payment groups
  const paySelect = document.getElementById('payment-status-select');
  const dpGroup = document.getElementById('dp-amount-group');
  const pkgGroup = document.getElementById('package-selector-group');
  const custHidden = document.getElementById('customer-id-hidden');
  const pkgSelect = document.getElementById('package-select');

  const updatePkgOptions = (custId) => {
    const cust = storage.find('customers', custId);
    const activePkgs = (cust?.packages || []).filter(p => p.remainingSessions > 0);
    pkgSelect.innerHTML = '<option value="">Pilih paket aktif...</option>' +
      activePkgs.map(p => `<option value="${p.id}">${p.name} (${p.remainingSessions} sesi)</option>`).join('');

    if (activePkgs.length === 0 && paySelect.value === 'package') {
      showToast('Pelanggan tidak punya paket aktif', 'warning');
      paySelect.value = 'unpaid';
      pkgGroup.style.display = 'none';
    }
  };

  paySelect.addEventListener('change', () => {
    dpGroup.style.display = paySelect.value === 'dp' ? '' : 'none';
    pkgGroup.style.display = paySelect.value === 'package' ? '' : 'none';
    if (paySelect.value === 'package') updatePkgOptions(custHidden.value);
  });

  if (paySelect.value === 'dp') dpGroup.style.display = '';
  if (paySelect.value === 'package') {
    pkgGroup.style.display = '';
    updatePkgOptions(custHidden.value);
  }

  // Save
  document.getElementById('save-appt-btn').addEventListener('click', () => {
    const form = document.getElementById('appt-form');
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    
    // Get all checked services
    const serviceCheckboxes = Array.from(form.querySelectorAll('input[name="serviceIds"]:checked'));
    if (!data.customerId || !data.date || !data.time || serviceCheckboxes.length === 0 || !data.barberId) {
      showToast('Lengkapi semua field (termasuk minimal 1 layanan)', 'error');
      return;
    }

    // Conflict detection
    const allAppts = storage.getAll('appointments');
    const conflict = allAppts.find(a =>
      a.id !== editId &&
      a.date === data.date &&
      a.time === data.time &&
      a.barberId === data.barberId &&
      a.status !== 'cancelled'
    );
    if (conflict) {
      showToast(`Barber sudah punya janji jam ${data.time}!`, 'error');
      return;
    }

    const customer = storage.find('customers', data.customerId);
    const barber = storage.find('barbers', data.barberId);
    
    let totalDuration = 0;
    let totalPrice = 0;
    const serviceNames = [];
    serviceCheckboxes.forEach(cb => {
      totalDuration += Number(cb.dataset.duration || 30);
      totalPrice += Number(cb.dataset.price || 0);
      serviceNames.push(cb.dataset.name);
    });

    const aptData = {
      customerId: data.customerId,
      customerName: customer.name,
      barberId: data.barberId,
      barberName: barber.name,
      serviceId: serviceCheckboxes[0].value, // Primary ID
      serviceName: serviceNames.join(' + '),
      date: data.date,
      time: data.time,
      duration: totalDuration,
      price: totalPrice,
      status: 'scheduled',
      paymentStatus: data.paymentStatus || 'unpaid',
      paymentAmount: data.paymentStatus === 'paid' ? totalPrice : (data.paymentStatus === 'dp' ? Number(data.dpAmount || 0) : 0),
      dpAmount: data.paymentStatus === 'dp' ? Number(data.dpAmount || 0) : 0,
      notes: data.notes || '',
      rating: 0,
    };

    if (editId) {
      storage.update('appointments', editId, aptData);
      showToast('Janji berhasil diupdate!', 'success');
    } else {
      // Deduct package session if applicable
      if (data.paymentStatus === 'package' && data.usedPackageId) {
        const cust = storage.find('customers', data.customerId);
        if (cust && cust.packages) {
          const pkgIdx = cust.packages.findIndex(p => p.id === data.usedPackageId);
          if (pkgIdx !== -1 && cust.packages[pkgIdx].remainingSessions > 0) {
            cust.packages[pkgIdx].remainingSessions--;
            storage.update('customers', data.customerId, { packages: cust.packages });
            aptData.usedPackageId = data.usedPackageId;
            aptData.paymentAmount = 0; // Value is prepaid
          }
        }
      }
      storage.add('appointments', aptData);
      showToast('Janji berhasil ditambahkan!', 'success');
    }

    // Record payment
    if (aptData.paymentStatus !== 'unpaid') {
      storage.add('payments', {
        appointmentId: editId || aptData.id,
        customerId: data.customerId,
        customerName: customer.name,
        amount: aptData.paymentAmount,
        type: aptData.paymentStatus === 'dp' ? 'dp' : 'full',
        method: 'cash',
        date: data.date,
        notes: ''
      });
    }

    closeModal();
    const pageContainer = document.getElementById('page-container');
    renderAppointments(pageContainer);
  });
}

function showAppointmentDetail(id) {
  const apt = storage.find('appointments', id);
  if (!apt) return;

  const body = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Main Status Card -->
      <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 16px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 16px;">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div>
            <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); text-transform: uppercase;">${apt.customerName}</h4>
            <div class="text-[11px] fw-600 text-muted">${dateUtils.formatDate(apt.date, 'long')}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge ${getStatusBadge(apt.status)}" style="font-size: 10px; padding: 4px 8px;">${getStatusLabel(apt.status)}</span>
        </div>
      </div>

      <!-- Detail Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px 14px; border: 1px solid var(--border);">
          <div class="text-[10px] uppercase text-muted tracking-widest fw-700 mb-[4px]"><i class="fas fa-clock text-accent"></i> Jam Shift</div>
          <div class="fw-800 text-primary text-md">${apt.time}</div>
        </div>
        <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px 14px; border: 1px solid var(--border);">
          <div class="text-[10px] uppercase text-muted tracking-widest fw-700 mb-[4px]"><i class="fas fa-user-tie text-accent"></i> Barber</div>
          <div class="fw-700 text-primary text-sm" style="text-transform: capitalize;">${apt.barberName}</div>
        </div>
      </div>

      <!-- Service Detail -->
      <div style="background: var(--bg-input); border-radius: var(--radius-sm); padding: 16px; border: 1px solid var(--border);">
        <div class="text-[10px] uppercase text-muted tracking-widest fw-700 mb-[8px]"><i class="fas fa-cut text-accent"></i> Detail Layanan</div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px dashed var(--border-light); padding-bottom: 12px;">
          <div class="fw-600" style="color: var(--text-primary); font-size: 13px; text-transform: capitalize;">${apt.serviceName}</div>
          <div class="fw-800 text-primary text-md" style="letter-spacing: -0.5px;">${formatter.currency(apt.price)}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="text-muted text-[11px] fw-600">Status Pembayaran:</span>
          <span class="badge ${getPayBadge(apt.paymentStatus)}">${apt.paymentStatus === 'paid' ? `LUNAS` : apt.paymentStatus === 'dp' ? `DP (${formatter.currency(apt.dpAmount)})` : 'BELUM BAYAR'}</span>
        </div>
      </div>

      ${apt.notes ? `
        <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid var(--warning); padding: 10px 14px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 12px;">
          <div class="fw-800 text-warning mb-[2px] text-[10px] uppercase tracking-widest"><i class="fas fa-sticky-note"></i> Catatan Khusus</div>
          <div class="text-primary fw-600">${apt.notes}</div>
        </div>
      ` : ''}

      ${apt.rating > 0 ? `
        <div style="text-align: center; padding-top: 8px;">
          <div class="text-[10px] text-muted mb-[4px] uppercase fw-700 tracking-widest">Rating Kepuasan</div>
          <div style="color: #fbbf24; font-size: 18px; letter-spacing: 2px;">${'⭐'.repeat(apt.rating)}${'<i class="far fa-star"></i>'.repeat(5 - apt.rating)}</div>
        </div>
      ` : ''}
    </div>
  `;

  openModal('Detail Janji', body);
}

function showRatingModal(aptId, pageContainer) {
  const body = `
    <p class="text-muted mb-md">Berikan rating pelayanan:</p>
    <div class="rating-stars" id="rating-input" style="font-size: 28px; justify-content: center; margin-bottom: 16px;">
      ${[1, 2, 3, 4, 5].map(i => `<i class="far fa-star" data-rating="${i}"></i>`).join('')}
    </div>
    <p class="text-sm text-muted text-right" id="rating-label">Belum dinilai</p>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-success" id="done-rate-btn"><i class="fas fa-check"></i> Selesai</button>
  `;

  openModal('Selesaikan Janji', body, footer);

  let selectedRating = 0;
  const stars = document.querySelectorAll('#rating-input i');
  const label = document.getElementById('rating-label');
  const labels = ['', 'Kurang', 'Cukup', 'Baik', 'Bagus', 'Sempurna!'];

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = Number(star.dataset.rating);
      stars.forEach((s, i) => {
        s.className = i < selectedRating ? 'fas fa-star active' : 'far fa-star';
      });
      label.textContent = labels[selectedRating];
    });
    star.addEventListener('mouseenter', () => {
      const r = Number(star.dataset.rating);
      stars.forEach((s, i) => {
        s.className = i < r ? 'fas fa-star active' : 'far fa-star';
      });
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        s.className = i < selectedRating ? 'fas fa-star active' : 'far fa-star';
      });
    });
  });

  document.getElementById('done-rate-btn').addEventListener('click', () => {
    const apt = storage.find('appointments', aptId);
    if (!apt) return;

    storage.update('appointments', aptId, { status: 'done', rating: selectedRating });

    // Resource Tracking: Deduct consumables if service has them
    const service = storage.find('services', apt.serviceId);
    if (service && service.consumables) {
      service.consumables.forEach(c => {
        const product = storage.find('inventory', c.id);
        if (product) {
          const newStock = (product.stock || 0) - c.qty;
          storage.update('inventory', c.id, { stock: Math.max(0, newStock) });

          if (newStock <= (product.minStock || 5)) {
            showToast(`Stok ${product.name} rendah!`, 'warning');
          }
        }
      });
    }

    // Update barber rating
    if (selectedRating > 0) {
      const barber = storage.find('barbers', apt.barberId);
      if (barber) {
        const newTotal = (barber.totalRatings || 0) + 1;
        const newRating = (((barber.rating || 0) * (barber.totalRatings || 0)) + selectedRating) / newTotal;
        storage.update('barbers', apt.barberId, { rating: Math.round(newRating * 10) / 10, totalRatings: newTotal });
      }
      // Update customer visits
      const customer = storage.find('customers', apt.customerId);
      if (customer) {
        storage.update('customers', apt.customerId, {
          totalVisits: (customer.totalVisits || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + (apt.paymentAmount || 0)
        });

        // Referral Reward: If this was a referred booking, give points to the referrer
        if (apt.refId) {
          const customers = storage.getAll('customers');
          const referrer = customers.find(c => c.id.slice(-6) === apt.refId || c.id === apt.refId);
          if (referrer) {
            storage.update('customers', referrer.id, {
              loyaltyPoints: (referrer.loyaltyPoints || 0) + 50, // Reward 50 points
              notes: (referrer.notes || '') + `\n[Reward] Referral dari ${apt.customerName}`
            });
          }
        }
      }
    }

    closeModal();
    showToast('Janji selesai! ✂️', 'success');
    renderAppointments(pageContainer);
  });
}

function getStatusBadge(status) {
  const map = { pending: 'badge-warning', scheduled: 'badge-warning', confirmed: 'badge-info', done: 'badge-success', cancelled: 'badge-danger', rejected: 'badge-danger' };
  return map[status] || 'badge-info';
}

function getStatusLabel(status) {
  const map = { pending: 'Pending Portal', scheduled: 'Terjadwal', confirmed: 'Dikonfirmasi', done: 'Selesai', cancelled: 'Dibatalkan', rejected: 'Ditolak' };
  return map[status] || status;
}

function getPayBadge(status) {
  const map = { paid: 'badge-success', dp: 'badge-warning', unpaid: 'badge-danger' };
  return map[status] || 'badge-danger';
}

// === Digital Invoice / Struk ===
function generateInvoice(aptId) {
  const apt = storage.find('appointments', aptId);
  if (!apt) return;
  const settings = storage.get('settings', {});
  const shopName = settings.shopName || 'BarberPro Studio';
  const shopPhone = settings.phone || '';
  const shopAddress = settings.address || '';

  const dateObj = new Date(apt.date);
  const dateStr = dateUtils.formatDate(apt.date, 'long');

  const body = `
    <div id="invoice-content" style="background: #fff; color: #111; padding: 30px; border-radius: 12px; font-family: 'Inter', sans-serif; max-width: 400px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px dashed #ddd; padding-bottom: 16px; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 20px; color: #b8912e;">✂️ ${shopName}</h2>
        ${shopAddress ? `<p style="margin: 4px 0 0; font-size: 11px; color: #888;">${shopAddress}</p>` : ''}
        ${shopPhone ? `<p style="margin: 2px 0 0; font-size: 11px; color: #888;">📱 ${shopPhone}</p>` : ''}
      </div>
      <!-- Invoice Info -->
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 16px;">
        <span>No: ${apt.bookingCode || apt.id?.slice(-6).toUpperCase() || '-'}</span>
        <span>${dateStr}</span>
      </div>
      <!-- Items -->
      <div style="border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-weight: 600;">${apt.serviceName}</span>
          <span style="font-weight: 600;">${formatter.currency(apt.paymentAmount || 0)}</span>
        </div>
        <div style="font-size: 12px; color: #888;">Barber: ${apt.barberName} · Jam ${apt.time} · ${apt.duration || 30} menit</div>
      </div>
      <!-- Total -->
      <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #b8912e; margin-bottom: 16px;">
        <span>TOTAL</span>
        <span>${formatter.currency(apt.paymentAmount || 0)}</span>
      </div>
      <div style="text-align: center; font-size: 12px; color: #888; border-top: 2px dashed #ddd; padding-top: 12px;">
        <p style="margin: 0;">Status: ${apt.paymentStatus === 'paid' ? '✅ LUNAS' : '⏳ Belum Bayar'}</p>
        <p style="margin: 4px 0 0;">Pelanggan: ${apt.customerName}</p>
        <p style="margin: 8px 0 0; font-style: italic;">Terima kasih telah berkunjung! 🙏</p>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Tutup</button>
    <button class="btn btn-primary" id="print-invoice-thermal">
      <i class="fas fa-print"></i> Cetak Struk
    </button>
    <button class="btn btn-wa" id="share-invoice-wa">
      <i class="fab fa-whatsapp"></i> Kirim via WA
    </button>
  `;

  openModal('Struk Digital', body, footer);

  document.getElementById('print-invoice-thermal')?.addEventListener('click', () => {
    receipt.print(apt, [{ name: apt.serviceName, price: apt.price }], 'Tunai');
  });

  document.getElementById('share-invoice-wa')?.addEventListener('click', () => {
    const phone = (apt.customerPhone || '').replace(/\D/g, '');
    const msg = `*STRUK - ${shopName}*\n\n` +
      `No: ${apt.bookingCode || '-'}\n` +
      `Tanggal: ${dateStr}\n` +
      `Pelanggan: ${apt.customerName}\n\n` +
      `Layanan: ${apt.serviceName}\n` +
      `Barber: ${apt.barberName}\n` +
      `Jam: ${apt.time}\n\n` +
      `*TOTAL: ${formatter.currency(apt.paymentAmount || 0)}*\n` +
      `Status: ${apt.paymentStatus === 'paid' ? 'LUNAS ✅' : 'Belum Bayar'}\n\n` +
      `Terima kasih! 🙏✂️`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}


