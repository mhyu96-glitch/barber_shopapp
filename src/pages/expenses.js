// ========================================
// Expenses Page
// Track operational costs, calculate profit
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let expenseFilter = 'month';

export function renderExpenses(container) {
    const expenses = storage.getAll('expenses');
    const appointments = storage.getAll('appointments');
    const now = new Date();

    // Filter
    let filtered = expenses;
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const yearStr = `${now.getFullYear()}`;
    if (expenseFilter === 'month') filtered = expenses.filter(e => e.date?.startsWith(monthStr));
    else if (expenseFilter === 'year') filtered = expenses.filter(e => e.date?.startsWith(yearStr));

    const totalExpense = filtered.reduce((s, e) => s + (e.amount || 0), 0);
    const revenue = appointments
        .filter(a => {
            if (expenseFilter === 'month') return a.date?.startsWith(monthStr) && a.status === 'done';
            if (expenseFilter === 'year') return a.date?.startsWith(yearStr) && a.status === 'done';
            return a.status === 'done';
        })
        .reduce((s, a) => s + (a.paymentAmount || 0), 0);
    const profit = revenue - totalExpense;

    // Group by category
    const categories = {};
    filtered.forEach(e => {
        const cat = e.category || 'Lainnya';
        if (!categories[cat]) categories[cat] = 0;
        categories[cat] += e.amount || 0;
    });

    container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Pengeluaran</h2>
        <p>Catat biaya operasional & hitung profit</p>
      </div>
      <button class="btn btn-primary" id="add-expense-btn">
        <i class="fas fa-plus"></i> Tambah Pengeluaran
      </button>
    </div>

    <!-- Period Filter -->
    <div style="display: flex; gap: 6px; margin-bottom: 20px;">
      ${['month', 'year', 'all'].map(p => `
        <button class="btn ${expenseFilter === p ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="window.__setExpenseFilter('${p}')">
          ${p === 'month' ? 'Bulan Ini' : p === 'year' ? 'Tahun Ini' : 'Semua'}
        </button>
      `).join('')}
    </div>

    <!-- Summary Cards -->
    <div class="stats-grid stagger" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
      <div class="card stat-card" style="border-left: 3px solid var(--success);">
        <div class="stat-icon green"><i class="fas fa-arrow-up"></i></div>
        <div class="stat-info">
          <h3 style="color: var(--success);">${formatter.currency(revenue)}</h3>
          <p>Pendapatan</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left: 3px solid var(--danger);">
        <div class="stat-icon red"><i class="fas fa-arrow-down"></i></div>
        <div class="stat-info">
          <h3 style="color: var(--danger);">${formatter.currency(totalExpense)}</h3>
          <p>Pengeluaran</p>
        </div>
      </div>
      <div class="card stat-card" style="border-left: 3px solid ${profit >= 0 ? 'var(--accent)' : 'var(--danger)'};">
        <div class="stat-icon ${profit >= 0 ? 'gold' : 'red'}"><i class="fas fa-coins"></i></div>
        <div class="stat-info">
          <h3 style="color: ${profit >= 0 ? 'var(--accent)' : 'var(--danger)'};">${formatter.currency(profit)}</h3>
          <p>Profit</p>
        </div>
      </div>
    </div>

    <!-- Category Breakdown -->
    ${Object.keys(categories).length > 0 ? `
      <div class="card" style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; margin-bottom: 14px;">
          <i class="fas fa-chart-pie" style="color: var(--accent);"></i> Per Kategori
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
        const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        const colors = { 'Alat & Bahan': 'var(--info)', 'Sewa': 'var(--danger)', 'Gaji': 'var(--warning)', 'Listrik & Air': 'var(--success)', 'Lainnya': 'var(--text-muted)' };
        const color = colors[cat] || 'var(--accent)';
        return `
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span class="text-sm fw-600">${cat}</span>
                  <span class="text-sm" style="color: ${color};">${formatter.currency(amount)} (${pct}%)</span>
                </div>
                <div style="height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden;">
                  <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 3px;"></div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Expense List -->
    <div class="card">
      <h3 style="font-size: 15px; margin-bottom: 14px;">
        <i class="fas fa-list" style="color: var(--accent);"></i> Daftar Pengeluaran
      </h3>
      ${filtered.length > 0 ? `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Jumlah</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(e => `
                <tr>
                  <td>${dateUtils.formatDate(e.date, 'short')}</td>
                  <td class="fw-600">${e.description || '-'}</td>
                  <td><span class="badge badge-info">${e.category || 'Lainnya'}</span></td>
                  <td style="color: var(--danger); font-weight: 600;">- ${formatter.currency(e.amount)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="window.__deleteExpense('${e.id}')">
                      <i class="fas fa-trash" style="color: var(--danger);"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state" style="padding: 40px;">
          <i class="fas fa-receipt"></i>
          <p>Belum ada pengeluaran tercatat</p>
        </div>
      `}
    </div>
  `;

    container.querySelector('#add-expense-btn').addEventListener('click', () => showExpenseForm());

    window.__setExpenseFilter = (f) => { expenseFilter = f; renderExpenses(container); };
    window.__deleteExpense = (id) => {
        confirmDialog('Hapus pengeluaran ini?', () => {
            storage.delete('expenses', id);
            showToast('Pengeluaran dihapus', 'warning');
            renderExpenses(container);
        });
    };
}

function showExpenseForm() {
    const categories = ['Alat & Bahan', 'Sewa', 'Gaji', 'Listrik & Air', 'Marketing', 'Perawatan', 'Lainnya'];
    const today = new Date().toISOString().split('T')[0];

    const body = `
    <form id="expense-form">
      <div class="form-group">
        <label>Tanggal</label>
        <input type="date" class="form-control" name="date" value="${today}" required />
      </div>
      <div class="form-group">
        <label>Deskripsi</label>
        <input type="text" class="form-control" name="description" placeholder="e.g., Beli pomade, bayar listrik..." required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Kategori</label>
          <select class="form-control" name="category">
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Jumlah (Rp)</label>
          <input type="number" class="form-control" name="amount" placeholder="50000" min="0" required />
        </div>
      </div>
      <div class="form-group">
        <label>Catatan (opsional)</label>
        <input type="text" class="form-control" name="notes" placeholder="Catatan tambahan..." />
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-expense-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

    openModal('Tambah Pengeluaran', body, footer);

    document.getElementById('save-expense-btn').addEventListener('click', () => {
        const form = document.getElementById('expense-form');
        const fd = new FormData(form);
        const data = {
            date: fd.get('date'),
            description: fd.get('description'),
            category: fd.get('category'),
            amount: parseInt(fd.get('amount')) || 0,
            notes: fd.get('notes'),
        };

        if (!data.date || !data.description || data.amount <= 0) {
            showToast('Lengkapi data', 'error');
            return;
        }

        storage.add('expenses', data);
        showToast('Pengeluaran ditambahkan!', 'success');
        closeModal();
        renderExpenses(document.getElementById('page-container'));
    });
}
