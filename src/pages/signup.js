// ========================================
// Signup Page (Admin Only)
// Tambah staf + daftar card staf
// ========================================

import { storage } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { navigateTo } from '../main.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/modal.js';

export async function renderSignup(container) {
  const user = storage.getCurrentUser();
  if (user?.role !== 'admin') {
    container.innerHTML = `<div class="p-20 text-center"><h2 class="text-danger">Akses Ditolak</h2><p>Hanya Admin yang dapat menambahkan staf baru.</p></div>`;
    return;
  }

  const currentProfilesCount = storage.getAll('profiles').length;
  const constraints = storage.get('shop_constraints', {});
  const maxBarbers = constraints.maxBarbers || 0;

  if (maxBarbers > 0 && currentProfilesCount >= maxBarbers) {
    container.innerHTML = `
      <div class="p-20 text-center fade-in">
        <i class="fas fa-lock text-warning" style="font-size: 48px; margin-bottom: 20px;"></i>
        <h2 class="text-warning">Batas Kuota Tercapai</h2>
        <p>Paket berlangganan Anda membatasi maksimal <b>${maxBarbers}</b> akun staf. Silakan upgrade paket.</p>
        <button class="btn btn-primary mt-lg" onclick="window.history.back()">Kembali</button>
      </div>`;
    return;
  }

  // Render UI langsung — jangan tunggu Supabase
  const shopId = storage.get('shopId') || user.shopId;
  const loginMap = storage.get('staff_login_map', {});
  // Gunakan data lokal dulu
  const localProfiles = storage.getAll('profiles').filter(p =>
    p.id !== user.id && (shopId ? p.shopId === shopId : true)
  );

  container.innerHTML = `
    <div class="page-header flex-between">
      <div>
        <h2>Manajemen Staf</h2>
        <p>Tambah dan kelola akun staf barbershop</p>
      </div>
      <button class="btn btn-secondary" id="back-btn">
        <i class="fas fa-arrow-left"></i> Kembali
      </button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: start;">

      <!-- Form Tambah Staf -->
      <div class="card" style="border: 1px solid var(--border-accent);">
        <h3 style="margin: 0 0 20px; font-size: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border);">
          <i class="fas fa-user-plus" style="color: var(--accent);"></i> Tambah Staf Baru
        </h3>
        <form id="signup-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Nama Lengkap</label>
            <input type="text" id="signup-fullname" class="form-control" placeholder="Contoh: Budi Santoso"
              style="height: 46px; font-size: 14px; background: var(--bg-input) !important; color: var(--text-primary) !important;"
              autocomplete="off" required>
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Username Login</label>
            <input type="text" id="signup-username" class="form-control" placeholder="Contoh: budi_barber"
              style="height: 46px; font-size: 14px; text-transform: lowercase; background: var(--bg-input) !important; color: var(--text-primary) !important;"
              autocomplete="off" required>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 5px;"><i class="fas fa-info-circle"></i> Huruf kecil tanpa spasi.</div>
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Password</label>
            <input type="password" id="signup-password" class="form-control" placeholder="Minimal 6 karakter"
              style="height: 46px; font-size: 14px; background: var(--bg-input) !important; color: var(--text-primary) !important;"
              autocomplete="new-password" required minlength="6">
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Peran</label>
            <div class="pill-selector" id="signup-role-pills">
              <button type="button" class="pill-btn active" data-value="barber">✂️ Barber</button>
              <button type="button" class="pill-btn" data-value="admin">👑 Admin</button>
            </div>
            <input type="hidden" id="signup-role" value="barber">
          </div>

          <!-- Dropdown pilih barber (muncul saat role = barber) -->
          <div class="form-group" id="barber-link-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">
              <i class="fas fa-scissors" style="color: var(--accent);"></i> Hubungkan ke Barber
            </label>
            <div class="pill-selector" id="signup-barber-id-pills">
              <button type="button" class="pill-btn active" data-value="">-- Tanpa Barber --</button>
              ${storage.getAll('barbers').map(b => `<button type="button" class="pill-btn" data-value="${b.id}">${b.name}</button>`).join('')}
            </div>
            <input type="hidden" id="signup-barber-id" value="">
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 5px;"><i class="fas fa-info-circle"></i> Pilih barber agar jadwal & janji temu terhubung ke akun ini.</div>
          </div>

          <div id="signup-message" style="display: none; padding: 12px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600;"></div>

          <button type="submit" class="btn btn-primary" style="height: 48px; font-size: 14px; font-weight: 800;" id="submit-signup">
            <i class="fas fa-user-plus"></i> Daftarkan Staf
          </button>
        </form>
      </div>

      <!-- Daftar Staf -->
      <div>
        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 14px;">
          <i class="fas fa-users" style="color: var(--accent);"></i> Staf Terdaftar
          <span class="badge badge-gold" style="margin-left: 8px;">${localProfiles.length}</span>
        </h3>
        <div id="staff-list" style="display: flex; flex-direction: column; gap: 10px;">
          ${localProfiles.length === 0 ? `
            <div class="card empty-state" style="padding: 30px;">
              <i class="fas fa-users"></i>
              <p>Belum ada staf terdaftar</p>
            </div>
          ` : localProfiles.map(p => renderStaffCard(p, loginMap)).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-btn')?.addEventListener('click', () => navigateTo('barbers'));

  // Helper for pill selector click binding
  const bindPillSelector = (pillContainerId, hiddenInputId) => {
    const pillContainer = container.querySelector(`#${pillContainerId}`);
    const hiddenInput = container.querySelector(`#${hiddenInputId}`);
    if (!pillContainer || !hiddenInput) return;

    pillContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.onclick = () => {
        pillContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        hiddenInput.value = btn.dataset.value;
        hiddenInput.dispatchEvent(new Event('change'));
      };
    });
  };

  bindPillSelector('signup-role-pills', 'signup-role');
  bindPillSelector('signup-barber-id-pills', 'signup-barber-id');

  // Background fetch dari Supabase untuk update daftar staf
  if (shopId) {
    supabase.from('profiles').select('*').eq('shop_id', shopId).neq('id', user.id).order('full_name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const freshProfiles = data.map(p => storage.toCamelCaseObj(p));
          const staffList = container.querySelector('#staff-list');
          if (staffList) {
            staffList.innerHTML = freshProfiles.map(p => renderStaffCard(p, loginMap)).join('') ||
              '<div class="card empty-state" style="padding:30px;"><i class="fas fa-users"></i><p>Belum ada staf terdaftar</p></div>';
          }
        }
      }).catch(() => {});
  }

  // Show/hide barber dropdown based on role
  const roleSelect = container.querySelector('#signup-role');
  const barberGroup = container.querySelector('#barber-link-group');
  const toggleBarberGroup = () => {
    barberGroup.style.display = roleSelect.value === 'barber' ? 'block' : 'none';
  };
  roleSelect.addEventListener('change', toggleBarberGroup);
  toggleBarberGroup(); // init

  const form = container.querySelector('#signup-form');
  const messageDiv = container.querySelector('#signup-message');
  const submitBtn = container.querySelector('#submit-signup');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('signup-fullname').value.trim();
    const username = document.getElementById('signup-username').value.toLowerCase().replace(/\s+/g, '');
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    const selectedBarberId = document.getElementById('signup-barber-id')?.value || null;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    messageDiv.style.display = 'none';

    try {
      // Pastikan username unik
      const existingProfiles = storage.getAll('profiles');
      let finalUsername = username;
      let suffix = 1;
      while (existingProfiles.some(p => p.username === finalUsername)) {
        finalUsername = `${username}${suffix}`;
        suffix++;
      }

      const email = `${finalUsername}@barberpro.local`;
      const result = await storage.signUp(email, password, fullName, role);

      if (result.success) {
        // Simpan ke staff_login_map
        const loginMap = storage.get('staff_login_map', {});
        loginMap[finalUsername] = result.loginEmail || email;
        storage.set('staff_login_map', loginMap);

        // Upsert profile dengan shop_id dan barber_id
        if (result.user?.id && shopId) {
          const profileData = {
            id: result.user.id,
            full_name: fullName,
            username: finalUsername,
            role,
            shop_id: shopId,
          };
          if (selectedBarberId) profileData.barber_id = selectedBarberId;
          
          try {
            const { error: upsertErr } = await supabase.from('profiles').upsert(profileData);
            if (upsertErr) throw upsertErr;
          } catch (netErr) {
            console.warn("Profiles upsert failed (offline?), updating local storage:", netErr);
            // Save to localStorage profiles array
            const localProfiles = storage.getAll('profiles');
            const index = localProfiles.findIndex(p => p.id === result.user.id);
            const camelProfile = storage.toCamelCaseObj(profileData);
            if (index !== -1) {
              localProfiles[index] = { ...localProfiles[index], ...camelProfile };
            } else {
              localProfiles.push(camelProfile);
            }
            storage.set('profiles', localProfiles);
          }
        }

        messageDiv.style.cssText = 'display:block; padding:12px; border-radius:8px; font-size:13px; font-weight:600; background:rgba(46,213,115,0.1); color:#2ed573;';
        messageDiv.innerHTML = `
          <i class="fas fa-check-circle"></i> Berhasil! 
          Login: <b>${finalUsername}</b> 
          ${finalUsername !== username ? `<span style="color:var(--accent)">(disesuaikan)</span>` : ''}
          <br><small style="opacity:0.8;">Password: ${password}</small>
        `;
        form.reset();

        // Refresh halaman setelah 1.5 detik
        setTimeout(() => renderSignup(container), 1500);
      } else {
        throw new Error(result.error || 'Gagal mendaftarkan staf');
      }
    } catch (err) {
      console.error('Signup error:', err);
      messageDiv.style.cssText = 'display:block; padding:12px; border-radius:8px; font-size:13px; font-weight:600; background:rgba(255,71,87,0.1); color:#ff4757;';
      messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${err.message}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftarkan Staf';
    }
  });

  // Edit & Reset password handlers
  window.__editStaff = (id) => showEditStaffModal(id, container);
  window.__resetStaffPassword = (id) => showResetPasswordModal(id, container);
  window.__deleteStaff = (id, name) => {
    confirmDialog(`Hapus staf "${name}"? Akun login akan dihapus permanen.`, async () => {
      try {
        // 1. Hapus dari Supabase profiles
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw new Error(error.message);

        // 2. Hapus dari localStorage profiles
        const localProfiles = storage.get('profiles', []);
        storage.set('profiles', localProfiles.filter(p => p.id !== id));

        // 3. Simpan daftar ID yang dihapus agar sync tidak restore
        const deletedIds = storage.get('deleted_profile_ids', []);
        if (!deletedIds.includes(id)) deletedIds.push(id);
        storage.set('deleted_profile_ids', deletedIds);

        // 4. Hapus dari login map
        const loginMap = storage.get('staff_login_map', {});
        Object.keys(loginMap).forEach(k => {
          if (loginMap[k]?.includes(id)) delete loginMap[k];
        });
        storage.set('staff_login_map', loginMap);

        showToast('Staf berhasil dihapus', 'success');
        await renderSignup(container);
      } catch (err) {
        showToast('Gagal hapus: ' + err.message, 'danger');
      }
    }, 'Hapus Staf');
  };
}

function renderStaffCard(p, loginMap) {
  const roleLabel = p.role === 'admin' ? '👑 Admin' : '✂️ Barber';
  const roleColor = p.role === 'admin' ? 'var(--warning)' : 'var(--accent)';
  const initials = (p.fullName || p.username || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return `
    <div class="card" style="padding: 16px; border: 1px solid var(--border);">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--accent-dark), var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: #0f1117; flex-shrink: 0;">
          ${initials}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 14px;">${p.fullName || p.username}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            <span style="color: ${roleColor}; font-weight: 600;">${roleLabel}</span>
            <span style="margin: 0 6px; opacity: 0.4;">•</span>
            <span style="font-family: monospace;">@${p.username}</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="btn btn-secondary btn-sm" onclick="window.__editStaff('${p.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.__resetStaffPassword('${p.id}')" title="Reset Password" style="color: var(--warning);">
            <i class="fas fa-key"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.__deleteStaff('${p.id}', '${p.fullName || p.username}')" title="Hapus Staf" style="color: var(--danger);">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function showEditStaffModal(id, container) {
  const profiles = storage.getAll('profiles');
  const p = profiles.find(x => x.id === id);
  if (!p) return;

  const { openModal, closeModal } = require_modal();

  const body = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="form-group">
        <label>Nama Lengkap</label>
        <input type="text" class="form-control" id="edit-fullname" value="${p.fullName || ''}"
          style="background: var(--bg-input) !important; color: var(--text-primary) !important;">
      </div>
      <div class="form-group">
        <label>Username</label>
        <input type="text" class="form-control" id="edit-username" value="${p.username || ''}"
          style="background: var(--bg-input) !important; color: var(--text-primary) !important;">
      </div>
      <div class="form-group">
        <label>Peran</label>
        <select class="form-control" id="edit-role"
          style="background: var(--bg-input) !important; color: var(--text-primary) !important;">
          <option value="barber" ${p.role === 'barber' ? 'selected' : ''}>✂️ Barber</option>
          <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>👑 Administrator</option>
        </select>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-primary" id="save-edit-staff"><i class="fas fa-save"></i> Simpan</button>
  `;

  openModal('Edit Staf', body, footer);

  document.getElementById('save-edit-staff')?.addEventListener('click', async () => {
    const fullName = document.getElementById('edit-fullname').value.trim();
    const username = document.getElementById('edit-username').value.trim().toLowerCase();
    const role = document.getElementById('edit-role').value;

    if (!fullName || !username) return showToast('Lengkapi data', 'warning');

    // Update di localStorage
    storage.update('profiles', id, { fullName, username, role });

    // Update di Supabase
    try {
      await supabase.from('profiles').update({ full_name: fullName, username, role }).eq('id', id);
    } catch (e) { console.warn('Supabase update failed:', e); }

    showToast('Data staf diperbarui!', 'success');
    closeModal();
    renderSignup(container);
  });
}

function showResetPasswordModal(id, container) {
  const { openModal, closeModal } = require_modal();

  const body = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <p style="color: var(--text-muted); font-size: 14px;">Masukkan password baru untuk staf ini.</p>
      <div class="form-group">
        <label>Password Baru</label>
        <input type="password" class="form-control" id="new-password" placeholder="Minimal 6 karakter" minlength="6"
          style="background: var(--bg-input) !important; color: var(--text-primary) !important;">
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-warning" id="save-reset-pw"><i class="fas fa-key"></i> Reset Password</button>
  `;

  openModal('Reset Password Staf', body, footer);

  document.getElementById('save-reset-pw')?.addEventListener('click', async () => {
    const newPw = document.getElementById('new-password').value;
    if (!newPw || newPw.length < 6) return showToast('Password minimal 6 karakter', 'warning');

    try {
      const { error } = await supabase.auth.admin.updateUserById(id, { password: newPw });
      if (error) throw error;
      showToast('Password berhasil direset!', 'success');
    } catch (e) {
      // Fallback: tampilkan info manual
      showToast('Reset via Supabase Dashboard atau minta staf login ulang.', 'info');
    }
    closeModal();
  });
}

function require_modal() {
  return {
    openModal: (title, body, footer) => {
      import('../components/modal.js').then(m => m.openModal(title, body, footer));
    },
    closeModal: () => {
      import('../components/modal.js').then(m => m.closeModal());
    }
  };
}





