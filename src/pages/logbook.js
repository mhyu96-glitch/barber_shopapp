// ========================================
// Logbook Page
// Daily notes, stock reminders
// ========================================

import { storage } from '../utils/storage.js';
import { dateUtils } from '../utils/dateUtils.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderLogbook(container) {
    const entries = storage.getAll('logbook').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === todayStr);

    container.innerHTML = `
    <div class="page-header page-header-row">
      <div>
        <h2>Catatan Harian</h2>
        <p>Log aktivitas dan reminder harian</p>
      </div>
      <button class="btn btn-primary" id="add-log-btn">
        <i class="fas fa-plus"></i> Catatan Baru
      </button>
    </div>

    <!-- Today's Note -->
    ${todayEntry ? `
      <div class="card" style="border-left: 3px solid var(--accent); margin-bottom: 20px;">
        <div class="flex-between" style="margin-bottom: 10px;">
          <div>
            <span class="badge badge-gold"><i class="fas fa-calendar-day"></i> Hari Ini</span>
            <span class="text-sm text-muted" style="margin-left: 8px;">${dateUtils.formatDate(todayStr, 'long')}</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="window.__editLog('${todayEntry.id}')">
            <i class="fas fa-edit"></i>
          </button>
        </div>
        ${todayEntry.notes ? `<p style="margin-bottom: 10px; white-space: pre-line;">${todayEntry.notes}</p>` : ''}
        ${todayEntry.stockAlerts && todayEntry.stockAlerts.length > 0 ? `
          <div style="margin-top: 10px;">
            <span class="text-sm fw-600 text-muted">⚠️ Stok Perlu Diperhatikan:</span>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;">
              ${todayEntry.stockAlerts.map(s => `<span class="badge badge-warning">${s}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        ${todayEntry.tasks && todayEntry.tasks.length > 0 ? `
          <div style="margin-top: 10px;">
            <span class="text-sm fw-600 text-muted">📋 To-Do:</span>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              ${todayEntry.tasks.map((t, i) => `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                  <input type="checkbox" ${t.done ? 'checked' : ''} onchange="window.__toggleTask('${todayEntry.id}', ${i})" />
                  <span style="${t.done ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${t.text}</span>
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    ` : `
      <div class="card" style="border-left: 3px solid var(--warning); margin-bottom: 20px; padding: 16px 20px;">
        <div class="flex gap-sm" style="align-items: center;">
          <span style="font-size: 20px;">📝</span>
          <div style="flex: 1;">
            <strong>Belum ada catatan hari ini</strong>
            <p class="text-sm text-muted">Catat aktivitas harian Anda</p>
          </div>
          <button class="btn btn-primary btn-sm" id="add-today-log">
            <i class="fas fa-plus"></i> Tulis
          </button>
        </div>
      </div>
    `}

    <!-- Past Entries -->
    <h3 style="margin-bottom: 14px;">Riwayat Catatan</h3>
    ${entries.length > 0 ? `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${entries.filter(e => e.date !== todayStr).slice(0, 30).map(entry => `
          <div class="card" style="padding: 16px 20px;">
            <div class="flex-between" style="margin-bottom: 8px;">
              <div>
                <span class="fw-600">${dateUtils.formatDate(entry.date, 'long')}</span>
                <span class="text-sm text-muted" style="margin-left: 6px;">${dateUtils.formatDate(entry.date, 'dayshort')}</span>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-ghost btn-sm" onclick="window.__editLog('${entry.id}')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="window.__deleteLog('${entry.id}')">
                  <i class="fas fa-trash" style="color: var(--danger);"></i>
                </button>
              </div>
            </div>
            ${entry.notes ? `<p class="text-sm" style="white-space: pre-line; margin-bottom: 6px;">${entry.notes.length > 200 ? entry.notes.substring(0, 200) + '...' : entry.notes}</p>` : ''}
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${(entry.stockAlerts || []).map(s => `<span class="badge badge-warning" style="font-size: 11px;">${s}</span>`).join('')}
              ${(entry.tasks || []).length > 0 ? `<span class="badge badge-info" style="font-size: 11px;">${entry.tasks.filter(t => t.done).length}/${entry.tasks.length} task</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="card empty-state">
        <i class="fas fa-book"></i>
        <h3>Belum Ada Catatan</h3>
        <p>Mulai catat aktivitas harian</p>
      </div>
    `}
  `;

    container.querySelector('#add-log-btn')?.addEventListener('click', () => showLogForm(container));
    container.querySelector('#add-today-log')?.addEventListener('click', () => showLogForm(container));

    window.__editLog = (id) => showLogForm(container, id);
    window.__deleteLog = (id) => {
        confirmDialog('Hapus catatan ini?', () => {
            storage.delete('logbook', id);
            showToast('Catatan dihapus', 'warning');
            renderLogbook(container);
        });
    };
    window.__toggleTask = (logId, taskIdx) => {
        const entry = storage.find('logbook', logId);
        if (entry && entry.tasks && entry.tasks[taskIdx]) {
            entry.tasks[taskIdx].done = !entry.tasks[taskIdx].done;
            storage.update('logbook', logId, { tasks: entry.tasks });
        }
    };
}

function showLogForm(pageContainer, editId = null) {
    const existing = editId ? storage.find('logbook', editId) : null;
    const todayStr = new Date().toISOString().split('T')[0];

    const body = `
    <form id="log-form">
      <div class="form-group">
        <label>Tanggal</label>
        <input type="date" class="form-control" name="date" value="${existing?.date || todayStr}" required />
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <textarea class="form-control" name="notes" rows="4" placeholder="Kegiatan hari ini, catatan penting...">${existing?.notes || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Stock Alert (pisahkan dengan koma)</label>
        <input type="text" class="form-control" name="stockAlerts" placeholder="Pomade habis, Pisau cukur perlu diganti" value="${(existing?.stockAlerts || []).join(', ')}" />
      </div>
      <div class="form-group">
        <label>To-Do List (satu per baris)</label>
        <textarea class="form-control" name="tasksText" rows="3" placeholder="Bersihkan alat&#10;Restock pomade&#10;Service AC">${(existing?.tasks || []).map(t => t.text).join('\n')}</textarea>
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-log-btn"><i class="fas fa-save"></i> Simpan</button>
  `;

    openModal(editId ? 'Edit Catatan' : 'Catatan Baru', body, footer);

    document.getElementById('save-log-btn').addEventListener('click', () => {
        const fd = new FormData(document.getElementById('log-form'));
        const stockText = fd.get('stockAlerts') || '';
        const tasksText = fd.get('tasksText') || '';

        const data = {
            date: fd.get('date'),
            notes: fd.get('notes') || '',
            stockAlerts: stockText ? stockText.split(',').map(s => s.trim()).filter(Boolean) : [],
            tasks: tasksText ? tasksText.split('\n').map(t => t.trim()).filter(Boolean).map(text => ({
                text,
                done: existing?.tasks?.find(et => et.text === text)?.done || false
            })) : [],
        };

        if (!data.date) { showToast('Tanggal wajib diisi', 'error'); return; }

        if (editId) {
            storage.update('logbook', editId, data);
            showToast('Catatan diupdate!', 'success');
        } else {
            storage.add('logbook', data);
            showToast('Catatan tersimpan!', 'success');
        }
        closeModal();
        renderLogbook(pageContainer);
    });
}
