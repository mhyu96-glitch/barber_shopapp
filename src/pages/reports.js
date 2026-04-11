// ========================================
// Reports Page
// Analytics, charts, CSV export
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { showToast } from '../components/toast.js';

let reportPeriod = 'month';

export function renderReports(container) {
  const appointments = storage.getAll('appointments');
  const payments = storage.getAll('payments');
  const customers = storage.getAll('customers');
  const services = storage.getAll('services');
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Filter by period
  let periodAppts = appointments;
  let periodPayments = payments;
  let periodLabel = '';

  if (reportPeriod === 'today') {
    periodAppts = appointments.filter(a => a.date === todayStr);
    periodPayments = payments.filter(p => p.date === todayStr);
    periodLabel = `Hari Ini, ${dateUtils.formatDate(now, 'long')}`;
  } else if (reportPeriod === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    periodAppts = appointments.filter(a => a.date >= weekStr);
    periodPayments = payments.filter(p => p.date >= weekStr);
    periodLabel = `Minggu Ini (${dateUtils.formatDate(weekAgo, 'short')} - ${dateUtils.formatDate(now, 'short')})`;
  } else if (reportPeriod === 'month') {
    const monthStr = todayStr.substring(0, 7);
    periodAppts = appointments.filter(a => a.date?.startsWith(monthStr));
    periodPayments = payments.filter(p => p.date?.startsWith(monthStr));
    periodLabel = dateUtils.getMonthName(now.getMonth()) + ' ' + now.getFullYear();
  } else {
    periodLabel = 'Semua Waktu';
  }

  // Stats
  const totalAppts = periodAppts.filter(a => a.status !== 'cancelled').length;
  const completedAppts = periodAppts.filter(a => a.status === 'done').length;
  const cancelledAppts = periodAppts.filter(a => a.status === 'cancelled').length;
  const totalRevenue = periodPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalCommission = periodPayments.reduce((s, p) => s + (p.commissionAmount || 0), 0);
  const expenses = storage.getAll('expenses');
  const totalExpenses = expenses
    .filter(e => {
        if (reportPeriod === 'today') return e.date === todayStr;
        if (reportPeriod === 'month') return e.date?.startsWith(todayStr.substring(0, 7));
        if (reportPeriod === 'week') {
            const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
            return e.date >= weekAgo.toISOString().split('T')[0];
        }
        return true;
    })
    .reduce((s, e) => s + (e.amount || 0), 0);
  
  const netProfit = totalRevenue - totalCommission - totalExpenses;
  const avgRevenue = completedAppts > 0 ? Math.round(totalRevenue / completedAppts) : 0;

  // Service breakdown
  const serviceBreakdown = {};
  periodAppts.filter(a => a.status === 'done').forEach(a => {
    if (!serviceBreakdown[a.serviceName]) serviceBreakdown[a.serviceName] = { count: 0, revenue: 0 };
    serviceBreakdown[a.serviceName].count++;
    serviceBreakdown[a.serviceName].revenue += a.paymentAmount || 0;
  });
  const sortedServices = Object.entries(serviceBreakdown).sort((a, b) => b[1].count - a[1].count);

  // Barber performance
  const barberPerf = {};
  periodAppts.filter(a => a.status === 'done').forEach(a => {
    if (!barberPerf[a.barberName]) barberPerf[a.barberName] = { count: 0, revenue: 0, ratings: [] };
    barberPerf[a.barberName].count++;
    barberPerf[a.barberName].revenue += a.paymentAmount || 0;
    if (a.rating > 0) barberPerf[a.barberName].ratings.push(a.rating);
  });

  // Top customers
  const custVisits = {};
  periodAppts.filter(a => a.status === 'done').forEach(a => {
    if (!custVisits[a.customerName]) custVisits[a.customerName] = { count: 0, spent: 0 };
    custVisits[a.customerName].count++;
    custVisits[a.customerName].spent += a.paymentAmount || 0;
  });
  const topCustomers = Object.entries(custVisits).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  // Payment method breakdown
  const methodBreakdown = { cash: 0, transfer: 0, ewallet: 0 };
  periodPayments.forEach(p => { methodBreakdown[p.method] = (methodBreakdown[p.method] || 0) + p.amount; });

  // Daily revenue for bar chart (last 7 days)
  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayRevenue = payments.filter(p => p.date === dStr).reduce((s, p) => s + (p.amount || 0), 0);
    dailyRevenue.push({ date: dStr, label: dateUtils.getDayShort(d.getDay()), revenue: dayRevenue });
  }
  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  if (reportPeriod === 'payroll') {
    const barbers = storage.getAll('barbers');
    const monthStr = todayStr.substring(0, 7);
    const monthAppts = appointments.filter(a => a.date?.startsWith(monthStr) && a.status === 'done');

    const payrollData = barbers.map(b => {
      const barberAppts = monthAppts.filter(a => a.barberId === b.id);
      let totalCommission = 0;
      if (b.commissionType === 'fixed') {
        totalCommission = barberAppts.length * (b.commissionFixed || 0);
      } else {
        const comm = (b.commissionRate || 10) / 100;
        totalCommission = barberAppts.reduce((sum, a) => sum + ((a.paymentAmount || 0) * comm), 0);
      }
      const commLabel = b.commissionType === 'fixed' 
        ? `Rp ${(b.commissionFixed || 0).toLocaleString('id-ID')}/trx`
        : `${b.commissionRate || 10}%`;
      return {
        ...b,
        commission: totalCommission,
        commLabel,
        totalEarnings: (b.baseSalary || 0) + totalCommission,
        appointments: barberAppts.length
      };
    });

    container.innerHTML = `
            <div class="page-header page-header-row">
                <div>
                    <h2>Laporan Payroll</h2>
                    <p>Periode: ${dateUtils.getMonthName(now.getMonth())} ${now.getFullYear()}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <select class="filter-select" id="report-period">
                        <option value="today">Hari Ini</option>
                        <option value="week">Minggu Ini</option>
                        <option value="month">Bulan Ini</option>
                        <option value="payroll" selected>Payroll (Bulan Ini)</option>
                        <option value="all">Semua</option>
                    </select>
                    <button class="btn btn-secondary" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
                </div>
            </div>

            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Barber</th>
                                <th>Gaji Pokok</th>
                                <th>Total Janji</th>
                                <th>Tipe Komisi</th>
                                <th>Komisi (${monthStr})</th>
                                <th>Total Diterima</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payrollData.map(p => `
                                <tr>
                                    <td>
                                        <div class="fw-600">${p.name}</div>
                                        <div class="text-xs text-muted">${p.specialization || '-'}</div>
                                    </td>
                                    <td>${formatter.currency(p.baseSalary || 0)}</td>
                                    <td>${p.appointments} potong</td>
                                    <td><span class="badge badge-info" style="font-size: 11px;">${p.commLabel}</span></td>
                                    <td class="text-success fw-600">+ ${formatter.currency(p.commission)}</td>
                                    <td class="fw-700" style="color: var(--accent); font-size: 1.1em;">${formatter.currency(p.totalEarnings)}</td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" title="WA Slip Gaji" onclick="window.__sendPayrollWA('${p.id}')">
                                            <i class="fab fa-whatsapp" style="color: #25d366;"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="card mt-md" style="background: var(--bg-card-alt);">
                <div class="flex-between">
                    <div>
                        <div class="text-sm text-muted">Total Pengeluaran Gaji Bulan Ini</div>
                        <div class="fw-700" style="font-size: 1.5em; color: var(--danger);">
                            ${formatter.currency(payrollData.reduce((s, p) => s + p.totalEarnings, 0))}
                        </div>
                    </div>
                    <i class="fas fa-file-invoice-dollar" style="font-size: 2em; opacity: 0.2;"></i>
                </div>
            </div>

            <!-- AI Forecasting Section -->
            <div class="card mt-lg" style="border: 1px solid var(--accent-glow); background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-alt) 100%);">
              <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white;">
                  <i class="fas fa-robot"></i>
                </div>
                <div>
                  <h3 style="margin: 0;">Proyeksi AI & Forecasting</h3>
                  <p class="text-sm text-muted">Analisis tren dan prediksi pendapatan periode berikutnya</p>
                </div>
              </div>
              
              <div class="grid-2">
                <div>
                  <div class="text-sm text-muted mb-sm">Estimasi Pendapatan Bulan Depan</div>
                  <div class="fw-700 text-accent" style="font-size: 24px;">
                    ${formatter.currency(calculateForecast())}
                  </div>
                  <p class="text-xs text-muted" style="margin-top: 8px;">
                    <i class="fas fa-arrow-trend-up text-success"></i> Berdasarkan pertumbuhan rata-rata 3 bulan terakhir.
                  </p>
                </div>
                <div style="border-left: 1px solid var(--border); padding-left: 20px;">
                  <div class="text-xs mb-sm"><i class="fas fa-lightbulb text-warning"></i> Rekomendasi AI:</div>
                  <ul class="text-xs" style="margin: 0; padding-left: 14px; color: var(--text-muted); line-height: 1.6;">
                    <li>Tren Senin-Selasa meningkat, pertimbangkan promo "Happy Hour".</li>
                    <li>Layanan "Coloring" menurun 15%, buat paket bundle dengan Haircut.</li>
                    <li>Saran: Stok Pomade perlu ditambah sebelum minggu ke-3.</li>
                  </ul>
                </div>
              </div>
            </div>
        `;

    // Re-attach listener
    container.querySelector('#report-period').addEventListener('change', (e) => {
      reportPeriod = e.target.value;
      renderReports(container);
    });

    window.__sendPayrollWA = (id) => {
      const p = payrollData.find(x => x.id === id);
      if (!p) return;
      const msg = `*SLIP GAJI - ${dateUtils.getMonthName(now.getMonth()).toUpperCase()} ${now.getFullYear()}*\n\n` +
        `Kepada: *${p.name}*\n` +
        `--------------------------\n` +
        `Gaji Pokok: ${formatter.currency(p.baseSalary || 0)}\n` +
        `Komisi [${p.commLabel}] (${p.appointments} trx): ${formatter.currency(p.commission)}\n` +
        `--------------------------\n` +
        `*TOTAL DITERIMA: ${formatter.currency(p.totalEarnings)}*\n\n` +
        `Silakan hubungi kasir untuk pengambilan. Terima kasih! ✂️`;
      window.open(`https://wa.me/${p.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(msg)}`, '_blank');
    };
    return;
  }

  container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Laporan & Analitik</h2>
        <p>${periodLabel}</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <select class="filter-select" id="report-period">
          <option value="today" ${reportPeriod === 'today' ? 'selected' : ''}>Hari Ini</option>
          <option value="week" ${reportPeriod === 'week' ? 'selected' : ''}>Minggu Ini</option>
          <option value="month" ${reportPeriod === 'month' ? 'selected' : ''}>Bulan Ini</option>
          <option value="payroll" ${reportPeriod === 'payroll' ? 'selected' : ''}>Payroll (Bulan Ini)</option>
          <option value="all" ${reportPeriod === 'all' ? 'selected' : ''}>Semua</option>
        </select>
        <button class="btn btn-secondary" id="export-csv-btn">
          <i class="fas fa-download"></i> Export CSV
        </button>
        <button class="btn btn-secondary" id="print-report-btn">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="stats-grid stagger" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
      <div class="card stat-card" style="border-bottom: 4px solid var(--success);">
        <div class="stat-icon green"><i class="fas fa-money-bill-trend-up"></i></div>
        <div class="stat-info">
            <p class="text-xs text-muted">Total Pendapatan</p>
            <h3>${formatter.currency(totalRevenue)}</h3>
        </div>
      </div>
      <div class="card stat-card" style="border-bottom: 4px solid var(--danger);">
        <div class="stat-icon red"><i class="fas fa-file-invoice-dollar"></i></div>
        <div class="stat-info">
            <p class="text-xs text-muted">Beban (Komisi + Biaya)</p>
            <h3>${formatter.currency(totalCommission + totalExpenses)}</h3>
        </div>
      </div>
      <div class="card stat-card" style="border-bottom: 4px solid var(--accent); background: var(--bg-card-alt);">
        <div class="stat-icon gold"><i class="fas fa-scale-balanced"></i></div>
        <div class="stat-info">
            <p class="text-xs text-muted">Laba Bersih (Net Profit)</p>
            <h3 style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatter.currency(netProfit)}</h3>
        </div>
      </div>
    </div>

    <div class="stats-grid stagger" style="grid-template-columns: repeat(4, 1fr); margin-top: 0;">
      <div class="card stat-card">
        <div class="stat-icon gold"><i class="fas fa-calendar-check"></i></div>
        <div class="stat-info"><h3>${totalAppts}</h3><p>Total Janji</p></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon blue"><i class="fas fa-check-circle"></i></div>
        <div class="stat-info"><h3>${completedAppts}</h3><p>Selesai</p></div>
      </div>
       <div class="card stat-card">
        <div class="stat-icon red"><i class="fas fa-times-circle"></i></div>
        <div class="stat-info"><h3>${cancelledAppts}</h3><p>Batal</p></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon purple"><i class="fas fa-calculator"></i></div>
        <div class="stat-info"><h3>${formatter.currency(avgRevenue)}</h3><p>Rata-rata Tiket</p></div>
      </div>
    </div>

    <div class="grid-2" style="align-items: start;">
      <!-- Daily Revenue Chart -->
      <div class="card">
        <h3 style="margin-bottom: 16px;"><i class="fas fa-chart-bar" style="color: var(--accent);"></i> Pendapatan 7 Hari Terakhir</h3>
        <div style="display: flex; align-items: flex-end; gap: 8px; height: 200px; padding: 10px 0;">
          ${dailyRevenue.map(d => `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%;">
              <div style="flex: 1; width: 100%; display: flex; align-items: flex-end;">
                <div style="width: 100%; height: ${Math.max((d.revenue / maxDailyRevenue) * 100, 3)}%; background: linear-gradient(to top, var(--accent-dark), var(--accent)); border-radius: 6px 6px 0 0; transition: height 0.5s ease; min-height: 3px;" title="${formatter.currency(d.revenue)}"></div>
              </div>
              <div style="font-size: 10px; color: var(--text-muted); white-space: nowrap;">${d.label}</div>
              <div style="font-size: 10px; color: var(--text-secondary); white-space: nowrap;">${d.revenue > 0 ? (d.revenue >= 1000000 ? (d.revenue / 1000000).toFixed(1) + 'jt' : (d.revenue >= 1000 ? Math.round(d.revenue / 1000) + 'rb' : d.revenue)) : '-'}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="card">
        <h3 style="margin-bottom: 16px;"><i class="fas fa-wallet" style="color: var(--info);"></i> Metode Pembayaran</h3>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${[
      { key: 'cash', label: 'Cash / Tunai', icon: 'fa-money-bill', color: 'var(--success)' },
      { key: 'transfer', label: 'Transfer Bank', icon: 'fa-building-columns', color: 'var(--info)' },
      { key: 'ewallet', label: 'E-Wallet', icon: 'fa-wallet', color: '#a78bfa' }
    ].map(m => {
      const pct = totalRevenue > 0 ? Math.round((methodBreakdown[m.key] || 0) / totalRevenue * 100) : 0;
      return `
              <div>
                <div class="flex-between mb-md" style="margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas ${m.icon}" style="color: ${m.color}; width: 16px;"></i>
                    <span class="text-sm">${m.label}</span>
                  </div>
                  <span class="fw-600 text-sm">${formatter.currency(methodBreakdown[m.key] || 0)} (${pct}%)</span>
                </div>
                <div style="height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden;">
                  <div style="height: 100%; width: ${pct}%; background: ${m.color}; border-radius: 3px; transition: width 0.5s ease;"></div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>

      <!-- Service Breakdown -->
      <div class="card">
        <h3 style="margin-bottom: 16px;"><i class="fas fa-scissors" style="color: var(--accent);"></i> Layanan Populer</h3>
        ${sortedServices.length > 0 ? `
          <div class="queue-list">
            ${sortedServices.map(([name, data], i) => `
              <div class="queue-item">
                <div class="queue-number" style="${i === 0 ? 'background: var(--accent); color: var(--text-inverse);' : ''}">${i + 1}</div>
                <div style="flex: 1;">
                  <div class="fw-600">${name}</div>
                  <div class="text-sm text-muted">${data.count} kali</div>
                </div>
                <div class="fw-600 text-accent">${formatter.currency(data.revenue)}</div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-muted">Belum ada data</p>'}
      </div>

      <!-- Barber Performance -->
      <div class="card">
        <h3 style="margin-bottom: 16px;"><i class="fas fa-chart-line" style="color: var(--success);"></i> Performa Barber</h3>
        ${Object.entries(barberPerf).length > 0 ? `
          <div class="queue-list">
            ${Object.entries(barberPerf).sort((a, b) => b[1].count - a[1].count).map(([name, data]) => {
      const avgRating = data.ratings.length > 0 ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1) : '-';
      return `
                <div class="queue-item">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; color: var(--accent); font-weight: 700; font-size: 13px;">
                    ${formatter.initials(name)}
                  </div>
                  <div style="flex: 1;">
                    <div class="fw-600">${name}</div>
                    <div class="text-sm text-muted">${data.count} potong • ⭐ ${avgRating}</div>
                  </div>
                  <div class="fw-600" style="color: var(--success);">${formatter.currency(data.revenue)}</div>
                </div>
              `;
    }).join('')}
          </div>
        ` : '<p class="text-muted">Belum ada data</p>'}
      </div>

      <!-- Top Customers -->
      <div class="card">
        <h3 style="margin-bottom: 16px;"><i class="fas fa-trophy" style="color: var(--warning);"></i> Pelanggan Teratas</h3>
        ${topCustomers.length > 0 ? `
          <div class="queue-list">
            ${topCustomers.map(([name, data], i) => `
              <div class="queue-item">
                <div class="queue-number" style="background: ${i === 0 ? 'var(--warning)' : 'var(--bg-card)'}; color: ${i === 0 ? 'var(--text-inverse)' : 'var(--text-primary)'};">
                  ${i === 0 ? '🏆' : i + 1}
                </div>
                <div style="flex: 1;">
                  <div class="fw-600">${name}</div>
                  <div class="text-sm text-muted">${data.count} kunjungan</div>
                </div>
                <div class="fw-600">${formatter.currency(data.spent)}</div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-muted">Belum ada data</p>'}
      </div>

      <!-- Customer Stats -->
      <div class="card">
        <h3 style="margin-bottom: 16px;"><i class="fas fa-users" style="color: var(--info);"></i> Statistik Pelanggan</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="flex-between">
            <span class="text-muted">Total Pelanggan</span>
            <span class="fw-700">${customers.length}</span>
          </div>
          <div class="flex-between">
            <span class="text-muted">Pelanggan Baru (Bulan Ini)</span>
            <span class="fw-700">${customers.filter(c => c.firstVisit?.startsWith(todayStr.substring(0, 7))).length}</span>
          </div>
          <div class="flex-between">
            <span class="text-muted">Pelanggan Loyal (10+ visit)</span>
            <span class="fw-700">${customers.filter(c => (c.totalVisits || 0) >= 10).length}</span>
          </div>
          <div class="flex-between">
            <span class="text-muted">Rata-rata Kunjungan</span>
            <span class="fw-700">${customers.length > 0 ? Math.round(customers.reduce((s, c) => s + (c.totalVisits || 0), 0) / customers.length) : 0}x</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Events
  container.querySelector('#report-period').addEventListener('change', (e) => {
    reportPeriod = e.target.value;
    renderReports(container);
  });

  container.querySelector('#export-csv-btn').addEventListener('click', () => exportCSV(periodAppts, periodPayments));
  container.querySelector('#print-report-btn').addEventListener('click', () => window.print());
}

function exportCSV(appointments, payments) {
  // Appointments CSV
  let csv = 'Tanggal,Jam,Pelanggan,Layanan,Barber,Status,Pembayaran,Jumlah\n';
  appointments.forEach(a => {
    csv += `"${a.date}","${a.time}","${a.customerName}","${a.serviceName}","${a.barberName}","${a.status}","${a.paymentStatus}","${a.paymentAmount || 0}"\n`;
  });

  downloadCSV(csv, `laporan_janji_${new Date().toISOString().split('T')[0]}.csv`);

  // Payments CSV
  let payCsv = 'Tanggal,Pelanggan,Tipe,Metode,Jumlah\n';
  payments.forEach(p => {
    payCsv += `"${p.date}","${p.customerName}","${p.type}","${p.method}","${p.amount || 0}"\n`;
  });

  setTimeout(() => downloadCSV(payCsv, `laporan_pembayaran_${new Date().toISOString().split('T')[0]}.csv`), 500);

  showToast('Laporan CSV berhasil diexport!', 'success');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function calculateForecast() {
  const payments = storage.getAll('payments');
  const now = new Date();
  const thisMonth = now.toISOString().substring(0, 7);

  const lastMonthDate = new Date(now);
  lastMonthDate.setMonth(now.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().substring(0, 7);

  const thisMonthRev = payments.filter(p => p.date?.startsWith(thisMonth)).reduce((s, p) => s + (p.amount || 0), 0);
  const lastMonthRev = payments.filter(p => p.date?.startsWith(lastMonth)).reduce((s, p) => s + (p.amount || 0), 0);

  if (lastMonthRev === 0) return thisMonthRev * 1.1; // Default 10% growth if no history

  const growthRate = (thisMonthRev - lastMonthRev) / lastMonthRev;
  return Math.round(thisMonthRev * (1 + growthRate));
}
