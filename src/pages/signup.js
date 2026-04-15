// ========================================
// Signup Page (Admin Only)
// ========================================

import { storage } from '../utils/storage.js';
import { navigateTo } from '../main.js';

export async function renderSignup(container) {
  const user = storage.getCurrentUser();
  if (user?.role !== 'admin') {
    container.innerHTML = `<div class="p-20 text-center"><h2 class="text-danger">Akses Ditolak</h2><p>Hanya Admin yang dapat menambahkan staf baru.</p></div>`;
    return;
  }

  const currentProfilesCount = storage.getAll('profiles').length;
  const constraints = storage.get('shop_constraints', {});
  const maxBarbers = constraints.maxBarbers || 0;
  
  // Note: maxBarbers dictates total allowed staff (including the initial admin/owner).
  if (maxBarbers > 0 && currentProfilesCount >= maxBarbers) {
    container.innerHTML = `
      <div class="p-20 text-center fade-in">
        <i class="fas fa-lock text-warning" style="font-size: 48px; margin-bottom: 20px;"></i>
        <h2 class="text-warning">Batas Kuota Tercapai</h2>
        <p>Paket berlangganan Anda membatasi maksimal <b>${maxBarbers}</b> akun staf (termasuk Anda). Silakan upgrade paket untuk merekrut lebih banyak staf.</p>
        <button class="btn btn-primary mt-lg" onclick="window.history.back()">Kembali</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="content-header">
      <div class="header-title">
        <div class="header-icon" style="background: var(--warning-light);">
          <i class="fas fa-user-plus" style="color: var(--warning);"></i>
        </div>
        <div>
          <h2 style="margin: 0;">Tambah Staf Baru</h2>
          <p style="margin: 0; color: var(--text-muted); font-size: 13px;">Daftarkan barber atau admin baru ke sistem</p>
        </div>
      </div>
      <button class="btn btn-secondary" id="back-to-barbers">
        <i class="fas fa-arrow-left"></i> Kembali
      </button>
    </div>

    <div class="card" style="max-width: 500px; margin: 30px auto; border: 1px solid var(--border-accent); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
      <div style="padding: 16px 20px;">
        <h3 style="margin-top: 0; margin-bottom: 24px; font-size: 18px; color: var(--text-primary); border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
          <i class="fas fa-id-card text-accent mr-[8px]"></i> Profil & Akses Staf
        </h3>
        <form id="signup-form" style="display: flex; flex-direction: column; gap: 18px;">
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Nama Lengkap</label>
            <input type="text" id="signup-fullname" class="form-control" placeholder="Contoh: Budi Santoso" style="height: 48px; font-size: 15px; font-weight: 600;" required>
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Username Login</label>
            <input type="text" id="signup-username" class="form-control" placeholder="Contoh: budi_barber" style="height: 48px; font-size: 15px; font-weight: 600; text-transform: lowercase;" required>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;"><i class="fas fa-info-circle"></i> Gunakan huruf kecil tanpa spasi untuk login.</div>
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Password Akun</label>
            <input type="password" id="signup-password" class="form-control" placeholder="Minimal 6 karakter" style="height: 48px; font-size: 15px; font-weight: 600; letter-spacing: 2px;" required minlength="6">
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Peran Akses (Role)</label>
            <select id="signup-role" class="form-control" style="height: 48px; font-size: 15px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-accent); background: var(--bg-primary);" required>
              <option value="barber">✂️ Barber (Fokus Booking & Jadwal)</option>
              <option value="admin">👑 Administrator (Akses Penuh)</option>
            </select>
          </div>
          
          <div id="signup-message" style="margin: 4px 0; padding: 12px; border-radius: var(--radius-sm); display: none; font-size: 13px; font-weight: 600;"></div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; height: 50px; border-radius: var(--radius-sm); font-size: 15px; margin-top: 8px; box-shadow: var(--shadow-accent); font-weight: 800;" id="submit-signup">
            <i class="fas fa-save"></i> DAFTARKAN STAF SEKARANG
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('back-to-barbers')?.addEventListener('click', () => navigateTo('barbers'));

  const form = document.getElementById('signup-form');
  const messageDiv = document.getElementById('signup-message');
  const submitBtn = document.getElementById('submit-signup');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('signup-fullname').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    messageDiv.style.display = 'none';

    try {
      // Use the email mockup format username@barberpro.local
      const email = `${username}@barberpro.local`;
      const result = await storage.signUp(email, password, fullName, role);
      
      if (result.success) {
        messageDiv.className = 'alert-success';
        messageDiv.style.backgroundColor = 'rgba(46, 213, 115, 0.1)';
        messageDiv.style.color = '#2ed573';
        messageDiv.style.display = 'block';
        messageDiv.innerHTML = `<i class="fas fa-check-circle"></i> User berhasil didaftarkan! Staf sekarang bisa login dengan username <b>${username}</b>.`;
        form.reset();
      } else {
        throw new Error(result.error || 'Gagal mendaftarkan user');
      }
    } catch (err) {
      console.error('Signup error:', err);
      messageDiv.className = 'alert-danger';
      messageDiv.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
      messageDiv.style.color = '#ff4757';
      messageDiv.style.display = 'block';
      messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${err.message}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Daftarkan Staf Sekarang';
    }
  });
}
