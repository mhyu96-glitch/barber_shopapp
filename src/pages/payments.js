// ========================================
// Payments Page
// DP, payments, receipts
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { formatter } from '../utils/formatter.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { whatsapp } from '../components/whatsapp.js';

let filterMethod = 'all';
let filterPeriod = 'month';

export function renderPayments(container) {
    const payments = storage.getAll('payments');
    const todayStr = new Date().toISOString().split('T')[0];

    let filtered = [...payments];
    if (filterMethod !== 'all') filtered = filtered.filter(p => p.method === filterMethod);
    if (filterPeriod === 'today') filtered = filtered.filter(p => p.date === todayStr);
    else if (filterPeriod === 'week') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        filtered = filtered.filter(p => new Date(p.date) >= d);
    } else if (filterPeriod === 'month') {
        filtered = filtered.filter(p => p.date?.startsWith(todayStr.substring(0, 7)));
    }

    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const totalIncome = filtered.reduce((s, p) => s + (p.amount || 0), 0);
    const dpTotal = filtered.filter(p => p.type === 'dp').reduce((s, p) => s + (p.amount || 0), 0);
    const fullTotal = filtered.filter(p => p.type === 'full').reduce((s, p) => s + (p.amount || 0), 0);

    container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Pembayaran</h2>
        <p>Tracking pembayaran dan deposit pelanggan</p>
      </div>
      <button class="btn btn-primary" id="add-payment-btn">
        <i class="fas fa-plus"></i> Catat Pembayaran
      </button>
    </div>

    <div class="stats-grid stagger" style="grid-template-columns: repeat(3, 1fr);">
      <div class="card stat-card">
        <div class="stat-icon green"><i class="fas fa-money-bill-wave"></i></div>
        <div class="stat-info">
          <h3>${formatter.currency(totalIncome)}</h3>
          <p>Total Pemasukan</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon gold"><i class="fas fa-hand-holding-dollar"></i></div>
        <div class="stat-info">
          <h3>${formatter.currency(dpTotal)}</h3>
          <p>Total DP</p>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon blue"><i class="fas fa-receipt"></i></div>
        <div class="stat-info">
          <h3>${formatter.currency(fullTotal)}</h3>
          <p>Pembayaran Lunas</p>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-input">
        <i class="fas fa-search"></i>
        <input type="text" id="search-pay" placeholder="Cari pelanggan..." />
      </div>
      <select class="filter-select" id="filter-period">
        <option value="today" ${filterPeriod === 'today' ? 'selected' : ''}>Hari Ini</option>
        <option value="week" ${filterPeriod === 'week' ? 'selected' : ''}>Minggu Ini</option>
        <option value="month" ${filterPeriod === 'month' ? 'selected' : ''}>Bulan Ini</option>
        <option value="all" ${filterPeriod === 'all' ? 'selected' : ''}>Semua</option>
      </select>
      <select class="filter-select" id="filter-method">
        <option value="all">Semua Metode</option>
        <option value="cash" ${filterMethod === 'cash' ? 'selected' : ''}>Cash</option>
        <option value="transfer" ${filterMethod === 'transfer' ? 'selected' : ''}>Transfer</option>
        <option value="ewallet" ${filterMethod === 'ewallet' ? 'selected' : ''}>E-Wallet</option>
      </select>
    </div>

    ${filtered.length > 0 ? `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Tipe</th>
              <th>Metode</th>
              <th>Jumlah</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => `
              <tr>
                <td>${dateUtils.formatDate(p.date, 'short')}</td>
                <td class="fw-600">${p.customerName || '-'}</td>
                <td>
                  <span class="badge ${p.type === 'dp' ? 'badge-warning' : 'badge-success'}">
                    ${p.type === 'dp' ? 'DP' : 'Lunas'}
                  </span>
                </td>
                <td>
                  <span class="badge badge-info">
                    <i class="fas ${p.method === 'cash' ? 'fa-money-bill' : p.method === 'transfer' ? 'fa-building-columns' : 'fa-wallet'}"></i>
                    ${p.method === 'cash' ? 'Cash' : p.method === 'transfer' ? 'Transfer' : 'E-Wallet'}
                  </span>
                </td>
                <td class="fw-700" style="color: var(--success);">${formatter.currency(p.amount)}</td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    <button class="btn btn-ghost btn-sm" title="Kirim Kwitansi WA" onclick="window.__receiptWA('${p.id}')">
                      <i class="fab fa-whatsapp" style="color: #25d366;"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" title="Detail" onclick="window.__viewReceipt('${p.id}')">
                      <i class="fas fa-receipt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card empty-state">
        <i class="fas fa-wallet"></i>
        <h3>Belum Ada Pembayaran</h3>
        <p>Catat pembayaran pertama</p>
      </div>
    `}
  `;

    container.querySelector('#add-payment-btn').addEventListener('click', () => showPaymentForm());
    container.querySelector('#filter-period').addEventListener('change', (e) => { filterPeriod = e.target.value; renderPayments(container); });
    container.querySelector('#filter-method').addEventListener('change', (e) => { filterMethod = e.target.value; renderPayments(container); });
    container.querySelector('#search-pay').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        container.querySelectorAll('tbody tr').forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
    });

    window.__receiptWA = (id) => {
        const payment = storage.find('payments', id);
        const customer = storage.find('customers', payment?.customerId);
        const apt = storage.find('appointments', payment?.appointmentId);
        if (payment && customer && apt) whatsapp.sendReceipt(apt, customer, payment);
    };

    window.__viewReceipt = (id) => {
        const p = storage.find('payments', id);
        if (!p) return;
        const body = `
      <div style="text-align: center; padding: 20px; border: 2px dashed var(--border); border-radius: var(--radius-md);">
        <h3 style="color: var(--accent); margin-bottom: 4px;">KWITANSI</h3>
        <p class="text-sm text-muted">BarberPro Studio</p>
        <hr style="border: none; border-top: 1px dashed var(--border); margin: 16px 0;" />
        <div style="text-align: left; display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
          <div class="flex-between"><span>Pelanggan</span><span class="fw-600">${p.customerName}</span></div>
          <div class="flex-between"><span>Tanggal</span><span>${dateUtils.formatDate(p.date, 'short')}</span></div>
          <div class="flex-between"><span>Tipe</span><span>${p.type === 'dp' ? 'DP (Uang Muka)' : 'Pembayaran Lunas'}</span></div>
          <div class="flex-between"><span>Metode</span><span>${p.method === 'cash' ? 'Tunai' : p.method === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</span></div>
        </div>
        <hr style="border: none; border-top: 1px dashed var(--border); margin: 16px 0;" />
        <div class="flex-between" style="font-size: 18px;">
          <span class="fw-700">TOTAL</span>
          <span class="fw-700" style="color: var(--success);">${formatter.currency(p.amount)}</span>
        </div>
        <hr style="border: none; border-top: 1px dashed var(--border); margin: 16px 0;" />
        <p class="text-sm text-muted">Terima kasih!</p>
      </div>
      <div style="text-align: center; margin-top: 12px;">
        <button class="btn btn-secondary btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
      </div>
    `;
        openModal('Kwitansi', body, '', { maxWidth: '400px' });
    };
}

function showPaymentForm() {
    const customers = storage.getAll('customers');
    const appointments = storage.getAll('appointments').filter(a => a.paymentStatus !== 'paid' && a.status !== 'cancelled');

    const body = `
    <form id="payment-form">
      <div class="form-group">
        <label>Pelanggan</label>
        <select class="form-control" name="customerId" required>
          <option value="">Pilih pelanggan...</option>
          ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Janji Temu (Opsional)</label>
        <select class="form-control" name="appointmentId" id="appt-select">
          <option value="">Pilih janji temu...</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Jumlah (Rp)</label>
          <input type="number" class="form-control" name="amount" placeholder="0" required />
        </div>
        <div class="form-group">
          <label>Tipe</label>
          <select class="form-control" name="type">
            <option value="full">Pembayaran Lunas</option>
            <option value="dp">DP (Uang Muka)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Metode Pembayaran</label>
        <select class="form-control" name="method">
          <option value="cash">Cash / Tunai</option>
          <option value="transfer">Transfer Bank</option>
          <option value="ewallet">E-Wallet</option>
        </select>
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <input type="text" class="form-control" name="notes" placeholder="Catatan..." />
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-payment-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

    openModal('Catat Pembayaran', body, footer);

    // Update appointment list when customer changes
    const custSelect = document.querySelector('[name="customerId"]');
    custSelect.addEventListener('change', () => {
        const apptSelect = document.getElementById('appt-select');
        const custAppts = appointments.filter(a => a.customerId === custSelect.value);
        apptSelect.innerHTML = '<option value="">Pilih janji temu...</option>' +
            custAppts.map(a => `<option value="${a.id}">${dateUtils.formatDate(a.date, 'short')} ${a.time} - ${a.serviceName}</option>`).join('');
    });

    document.getElementById('save-payment-btn').addEventListener('click', () => {
        const form = document.getElementById('payment-form');
        const fd = new FormData(form);
        const data = Object.fromEntries(fd);

        if (!data.customerId || !data.amount) {
            showToast('Lengkapi data pembayaran', 'error');
            return;
        }

        const customer = storage.find('customers', data.customerId);
        data.customerName = customer?.name || '';
        data.amount = Number(data.amount);
        data.date = new Date().toISOString().split('T')[0];

        storage.add('payments', data);

        // Update appointment payment status
        if (data.appointmentId) {
            const apt = storage.find('appointments', data.appointmentId);
            if (apt) {
                const newPayStatus = data.type === 'full' ? 'paid' : 'dp';
                storage.update('appointments', data.appointmentId, {
                    paymentStatus: newPayStatus,
                    paymentAmount: (apt.paymentAmount || 0) + data.amount,
                    dpAmount: data.type === 'dp' ? data.amount : apt.dpAmount
                });
            }
        }

        closeModal();
        showToast('Pembayaran dicatat!', 'success');
        renderPayments(document.getElementById('page-container'));
    });
}
