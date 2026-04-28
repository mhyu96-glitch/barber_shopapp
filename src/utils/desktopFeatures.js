// ========================================
// Desktop Features Manager
// Queue Display, Shortcuts, Backup, Update
// ========================================

import { storage } from './storage.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { formatter } from './formatter.js';

const isElectron = !!window.electronAPI?.isElectron;

// ─── Queue Display ────────────────────────────────────────────────────────────
export const queueDisplay = {
  _syncInterval: null,
  _webTab: null,

  open() {
    if (isElectron) {
      window.electronAPI.openQueueDisplay();
      showToast('📺 Tampilan Antrian dibuka di jendela baru', 'success');
    } else {
      // Web: buka tab baru
      this._webTab = window.open('/queue-display.html', 'barberpro-queue', 'width=1280,height=720');
      showToast('📺 Tampilan Antrian dibuka di tab baru', 'success');
    }
    this.startSync();
  },

  close() {
    if (isElectron) {
      window.electronAPI.closeQueueDisplay();
    } else if (this._webTab && !this._webTab.closed) {
      this._webTab.close();
      this._webTab = null;
    }
    this.stopSync();
  },

  startSync() {
    this.pushData();
    if (this._syncInterval) clearInterval(this._syncInterval);
    this._syncInterval = setInterval(() => this.pushData(), 10000);
  },

  stopSync() {
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  },

  pushData() {
    const todayStr = new Date().toISOString().split('T')[0];
    const appointments = storage.getAll('appointments')
      .filter(a => a.date === todayStr && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
    const settings = storage.get('settings', {});
    const payload = {
      shopName: settings.shopName || 'BarberPro Studio',
      queue: appointments,
    };

    if (isElectron) {
      window.electronAPI.updateQueueDisplay(payload);
      const activeCount = appointments.filter(a => a.status !== 'done').length;
      window.electronAPI.updateTrayQueueCount(activeCount);
    } else {
      // Web: kirim via postMessage ke tab yang dibuka
      if (this._webTab && !this._webTab.closed) {
        this._webTab.postMessage({ type: 'QUEUE_UPDATE', payload }, '*');
      }
      // Simpan di localStorage agar tab queue bisa polling
      localStorage.setItem('barberpro_queue_display_data', JSON.stringify(payload));
    }
  },

  async isOpen() {
    if (isElectron) return window.electronAPI.isQueueDisplayOpen();
    return !!(this._webTab && !this._webTab.closed);
  },
};

// ─── Auto Backup ─────────────────────────────────────────────────────────────
export const autoBackup = {
  async getSettings() {
    if (isElectron) return window.electronAPI.getBackupSettings();
    // Web: simpan di localStorage
    try {
      return JSON.parse(localStorage.getItem('barberpro_backup_settings') || '{}');
    } catch { return {}; }
  },

  async saveSettings(settings) {
    if (isElectron) return window.electronAPI.saveBackupSettings(settings);
    localStorage.setItem('barberpro_backup_settings', JSON.stringify(settings));
  },

  async selectFolder() {
    if (!isElectron) return null;
    return window.electronAPI.selectBackupFolder();
  },

  async performBackup() {
    if (isElectron) {
      const data = this._collectData();
      const jsonStr = JSON.stringify(data, null, 2);
      const result = await window.electronAPI.triggerBackup(jsonStr);
      if (result.success) {
        showToast(`💾 Backup berhasil: ${result.filename}`, 'success');
      } else {
        showToast(`❌ Backup gagal: ${result.error}`, 'danger');
      }
      return result;
    }
    // Web fallback
    this._browserDownload();
    return { success: true };
  },

  _collectData() {
    const collections = [
      'services', 'barbers', 'customers', 'appointments', 'payments',
      'gallery', 'promos', 'holidays', 'inventory', 'expenses',
      'attendance', 'settings', 'feedbacks', 'membership_packages',
      'customer_memberships', 'loyalty_logs',
    ];
    const data = {
      version: window.electronAPI?.appVersion || '2.0.0',
      exportDate: new Date().toISOString(),
      shopId: storage.getShopId?.() || null,
    };
    collections.forEach(col => {
      data[col] = storage.get(col, []);
    });
    return data;
  },

  _browserDownload() {
    const data = this._collectData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `barberpro_backup_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 Backup diunduh ke komputer Anda', 'success');
  },

  // Show backup settings modal
  async showSettingsModal() {
    const current = await this.getSettings() || {};

    const body = `
      <div style="display: flex; flex-direction: column; gap: 18px;">
        <div class="form-group">
          <label style="font-weight: 600; margin-bottom: 8px; display: block;">
            <i class="fas fa-toggle-on" style="color: var(--accent);"></i> Auto Backup
          </label>
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="backup-enabled" ${current.enabled ? 'checked' : ''} style="width: 18px; height: 18px;" />
            <span>Aktifkan backup otomatis</span>
          </label>
        </div>

        ${isElectron ? `
        <div class="form-group">
          <label style="font-weight: 600; margin-bottom: 8px; display: block;">
            <i class="fas fa-folder" style="color: var(--accent);"></i> Folder Backup
          </label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="backup-folder" class="form-control" readonly
              value="${current.folder || ''}" placeholder="Pilih folder..." style="flex: 1;" />
            <button class="btn btn-secondary btn-sm" id="pick-folder-btn">
              <i class="fas fa-folder-open"></i> Pilih
            </button>
          </div>
        </div>
        ` : `
        <div style="padding: 10px 14px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; font-size: 13px; color: var(--text-muted);">
          <i class="fas fa-info-circle" style="color: var(--accent);"></i>
          Di versi web, backup akan diunduh sebagai file <b>.json</b> ke komputer Anda.
        </div>
        `}

        <div class="form-group">
          <label style="font-weight: 600; margin-bottom: 8px; display: block;">
            <i class="fas fa-clock" style="color: var(--accent);"></i> Interval Backup
          </label>
          <select id="backup-interval" class="form-control">
            <option value="6" ${current.intervalHours == 6 ? 'selected' : ''}>Setiap 6 jam</option>
            <option value="12" ${current.intervalHours == 12 ? 'selected' : ''}>Setiap 12 jam</option>
            <option value="24" ${!current.intervalHours || current.intervalHours == 24 ? 'selected' : ''}>Setiap 24 jam (Harian)</option>
            <option value="168" ${current.intervalHours == 168 ? 'selected' : ''}>Setiap 7 hari (Mingguan)</option>
          </select>
        </div>

        ${current.lastBackup ? `
          <div style="padding: 10px 14px; background: var(--bg-input); border-radius: 8px; font-size: 13px; color: var(--text-muted);">
            <i class="fas fa-history"></i> Backup terakhir: ${new Date(current.lastBackup).toLocaleString('id-ID')}
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid var(--border);">
          <button class="btn btn-primary" id="save-backup-btn" style="flex: 1;">
            <i class="fas fa-save"></i> Simpan
          </button>
          <button class="btn btn-secondary" id="backup-now-btn">
            <i class="fas fa-download"></i> Backup Sekarang
          </button>
        </div>
      </div>
    `;

    openModal('💾 Pengaturan Auto Backup', body);

    document.getElementById('pick-folder-btn')?.addEventListener('click', async () => {
      const folder = await this.selectFolder();
      if (folder) document.getElementById('backup-folder').value = folder;
    });

    document.getElementById('save-backup-btn')?.addEventListener('click', async () => {
      const enabled = document.getElementById('backup-enabled').checked;
      const folder = isElectron ? document.getElementById('backup-folder')?.value || '' : '';
      const intervalHours = parseInt(document.getElementById('backup-interval').value);
      if (isElectron && enabled && !folder) {
        showToast('Pilih folder backup terlebih dahulu', 'warning');
        return;
      }
      await this.saveSettings({ enabled, folder, intervalHours });
      showToast('✅ Pengaturan backup disimpan', 'success');
      closeModal();
    });

    document.getElementById('backup-now-btn')?.addEventListener('click', async () => {
      closeModal();
      await this.performBackup();
    });
  },
};

// ─── Update Checker ───────────────────────────────────────────────────────────
export const updateChecker = {
  async check() {
    if (isElectron) {
      showToast('🔍 Memeriksa update...', 'info');
      const result = await window.electronAPI.checkForUpdate();
      if (result.hasUpdate) {
        this._showUpdateModal(result);
      } else if (!result.error) {
        showToast(`✅ Versi terbaru (v${result.currentVersion})`, 'success');
      } else {
        showToast('Tidak dapat memeriksa update.', 'warning');
      }
      return;
    }

    // Web: fetch GitHub releases
    showToast('🔍 Memeriksa update...', 'info');
    try {
      const res = await fetch('https://api.github.com/repos/barberpro/barberpro-desktop/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('Not found');
      const release = await res.json();
      const latestVersion = (release.tag_name || '').replace(/^v/, '');
      const currentVersion = '2.0.0';
      if (latestVersion && latestVersion !== currentVersion) {
        this._showUpdateModal({
          currentVersion,
          latestVersion,
          downloadUrl: release.html_url || '',
          releaseNotes: release.body || '',
        });
      } else {
        showToast(`✅ Versi terbaru (v${currentVersion})`, 'success');
      }
    } catch {
      showToast('Tidak dapat memeriksa update.', 'warning');
    }
  },

  _showUpdateModal({ currentVersion, latestVersion, downloadUrl, releaseNotes }) {
    const body = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 14px; padding: 16px; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); border-radius: 12px;">
          <div style="font-size: 36px;">🆕</div>
          <div>
            <div style="font-weight: 700; font-size: 16px;">Update Tersedia!</div>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Versi saat ini: <b>v${currentVersion}</b> → Versi terbaru: <b style="color: var(--accent);">v${latestVersion}</b>
            </div>
          </div>
        </div>

        ${releaseNotes ? `
          <div>
            <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">📋 Perubahan:</div>
            <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-muted); max-height: 150px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6;">
              ${releaseNotes.slice(0, 500)}${releaseNotes.length > 500 ? '...' : ''}
            </div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" style="flex: 1;" onclick="window.open('${downloadUrl}', '_blank'); closeModal();">
            <i class="fas fa-download"></i> Download Update
          </button>
          <button class="btn btn-secondary" onclick="closeModal();">
            Nanti Saja
          </button>
        </div>
      </div>
    `;
    openModal('Update BarberPro', body);
  },
};

// ─── Keyboard Shortcut Handler (renderer side) ────────────────────────────────
export function initDesktopShortcuts(navigateFn) {
  // Listen for shortcuts from Electron main process
  if (isElectron) {
    window.electronAPI.onShortcut((action, payload) => {
      handleShortcutAction(action, navigateFn, payload);
    });
  }

  // In-app keyboard shortcuts (web + electron)
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isTyping) return;

    // Ctrl+N → New Appointment
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
      e.preventDefault();
      handleShortcutAction('new-appointment', navigateFn);
    }
    // Ctrl+P → POS
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
      e.preventDefault();
      handleShortcutAction('pos', navigateFn);
    }
    // Ctrl+D → Dashboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !e.shiftKey) {
      e.preventDefault();
      handleShortcutAction('dashboard', navigateFn);
    }
    // Ctrl+Q → Queue
    if ((e.ctrlKey || e.metaKey) && e.key === 'q' && !e.shiftKey) {
      e.preventDefault();
      handleShortcutAction('queue', navigateFn);
    }
    // Ctrl+B → Backup
    if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
      e.preventDefault();
      autoBackup.performBackup();
    }
  });

  console.log('⌨️  Shortcuts initialized');
}

function handleShortcutAction(action, navigateFn, payload) {
  switch (action) {
    case 'new-appointment':
      navigateFn('appointments');
      // Trigger add modal after navigation
      setTimeout(() => {
        document.getElementById('add-appointment-btn')?.click();
      }, 300);
      break;
    case 'pos':
      navigateFn('pos');
      break;
    case 'dashboard':
      navigateFn('dashboard');
      break;
    case 'appointments':
      navigateFn('appointments');
      break;
    case 'queue':
      navigateFn('queue');
      break;
    case 'backup-now':
      autoBackup.performBackup();
      break;
    case 'update-available':
      if (payload) updateChecker._showUpdateModal(payload);
      break;
    default:
      break;
  }
}

// ─── Tray Queue Sync ──────────────────────────────────────────────────────────
export function syncTrayQueueCount() {
  if (!isElectron) return;
  const todayStr = new Date().toISOString().split('T')[0];
  const active = storage.getAll('appointments')
    .filter(a => a.date === todayStr && a.status !== 'done' && a.status !== 'cancelled')
    .length;
  window.electronAPI.updateTrayQueueCount(active);
}

// ─── Init All Desktop Features ────────────────────────────────────────────────
export function initDesktopFeatures(navigateFn) {
  // Shortcuts aktif di web & electron
  initDesktopShortcuts(navigateFn);

  if (isElectron) {
    syncTrayQueueCount();
    setInterval(syncTrayQueueCount, 60000);
    window.addEventListener('queue-display-closed', () => queueDisplay.stopSync());
  }

  // Web: auto backup scheduler via localStorage settings
  if (!isElectron) {
    _scheduleWebBackup();
  }

  console.log('🖥️  Desktop features initialized');
}

function _scheduleWebBackup() {
  try {
    const bs = JSON.parse(localStorage.getItem('barberpro_backup_settings') || '{}');
    if (!bs.enabled) return;
    const intervalMs = (bs.intervalHours || 24) * 60 * 60 * 1000;
    const last = bs.lastBackup ? new Date(bs.lastBackup) : null;
    const now = new Date();
    if (!last || (now - last) >= intervalMs) {
      // Due now
      setTimeout(() => autoBackup.performBackup(), 3000);
    }
    // Schedule next
    setInterval(() => autoBackup.performBackup(), intervalMs);
  } catch { }
}
