import { storage } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export function renderLogin(container) {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (sidebar) sidebar.style.display = 'none';
  if (mainContent) { mainContent.style.marginLeft = '0'; mainContent.style.width = '100%'; mainContent.style.padding = '0'; }
  document.body.className = '';

  // Sembunyikan burger button dan overlay saat login
  const burgerBtn = document.querySelector('.sidebar-toggle');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');
  if (burgerBtn) burgerBtn.style.display = 'none';
  if (sidebarOverlay) sidebarOverlay.style.display = 'none';

  container.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

.lp-wrap {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  background: #080808;
  font-family: 'Manrope', 'Inter', sans-serif;
  overflow: hidden;
}

/* ── LEFT PANEL ─────────────────────────────── */
.lp-left {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 36px 44px;
  overflow: hidden;
  min-height: 100vh;
}

.lp-left-bg {
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80');
  background-size: cover;
  background-position: center 30%;
  filter: brightness(0.35) saturate(0.8);
}
.lp-left-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(8,8,8,0.2) 0%,
    rgba(8,8,8,0.1) 40%,
    rgba(8,8,8,0.85) 75%,
    rgba(8,8,8,1) 100%
  );
}
.lp-left-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #D4AF37, #f0d060, #D4AF37, transparent);
}
.lp-logo {
  position: absolute;
  top: 28px; left: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2;
}
.lp-logo-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #D4AF37, #b8922a);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  box-shadow: 0 4px 16px rgba(212,175,55,0.4);
}
.lp-logo-name {
  font-size: 17px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.5px;
  font-family: 'Epilogue', sans-serif;
}
.lp-logo-name span { color: #D4AF37; }
.lp-left-content { position: relative; z-index: 2; }
.lp-tagline {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #D4AF37;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.lp-tagline::before { content: ''; width: 24px; height: 2px; background: #D4AF37; }
.lp-headline {
  font-size: 38px;
  font-weight: 900;
  color: #fff;
  line-height: 1.05;
  letter-spacing: -1.5px;
  margin-bottom: 12px;
  font-family: 'Playfair Display', 'Epilogue', serif;
}
.lp-headline span { color: #D4AF37; }
.lp-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  line-height: 1.6;
  max-width: 380px;
  margin-bottom: 24px;
}
.lp-stats { display: flex; gap: 24px; }
.lp-stat-num {
  font-size: 22px;
  font-weight: 900;
  color: #D4AF37;
  line-height: 1;
  font-family: 'Epilogue', sans-serif;
}
.lp-stat-label {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 3px;
}

/* ── RIGHT PANEL — GLASS ─────────────────────── */
.lp-right {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 44px;
  background: rgba(15, 12, 8, 0.55);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-left: 1px solid rgba(212,175,55,0.15);
  position: relative;
  overflow: hidden;
  height: 100vh;
}

/* Gold glow */
.lp-right::before {
  content: '';
  position: absolute;
  top: -80px; right: -80px;
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%);
  pointer-events: none;
}
.lp-right::after {
  content: '';
  position: absolute;
  bottom: -60px; left: -60px;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%);
  pointer-events: none;
}

.lp-form-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #D4AF37;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.lp-form-eyebrow::before { content: ''; width: 16px; height: 2px; background: #D4AF37; }
.lp-form-title {
  font-size: 26px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.8px;
  margin-bottom: 6px;
  font-family: 'Epilogue', sans-serif;
}
.lp-form-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.3);
  margin-bottom: 28px;
  line-height: 1.5;
}

/* Fields */
.lp-field { margin-bottom: 16px; }
.lp-field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(255,255,255,0.35);
  margin-bottom: 8px;
}
.lp-field-label.gold { color: #D4AF37; }
.lp-input-wrap { position: relative; }
.lp-input-wrap .lp-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.2);
  font-size: 12px;
  pointer-events: none;
  transition: color 0.2s;
}
.lp-input-wrap:focus-within .lp-icon { color: #D4AF37; }
.lp-input {
  width: 100%;
  height: 46px;
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 0 16px 0 42px;
  color: #fff !important;
  font-size: 13px;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.2s;
  outline: none;
  -webkit-text-fill-color: #fff !important;
}
.lp-input:focus {
  border-color: rgba(212,175,55,0.5);
  background: rgba(212,175,55,0.04) !important;
  box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
}
.lp-input::placeholder { color: rgba(255,255,255,0.15) !important; -webkit-text-fill-color: rgba(255,255,255,0.15) !important; }
.lp-input:-webkit-autofill,
.lp-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px rgba(20,16,10,0.95) inset !important;
  -webkit-text-fill-color: #fff !important;
}
.lp-input-hint {
  font-size: 10px;
  color: rgba(255,255,255,0.18);
  margin-top: 5px;
  padding-left: 2px;
  font-style: italic;
}
.lp-pw-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255,255,255,0.2);
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  transition: color 0.2s;
}
.lp-pw-toggle:hover { color: rgba(255,255,255,0.5); }

.lp-sep {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 2px 0 16px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.12);
}
.lp-sep::before, .lp-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.06);
}

.lp-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 12px;
  color: rgba(255,255,255,0.25);
  cursor: pointer;
  user-select: none;
}
.lp-remember input { accent-color: #D4AF37; width: 14px; height: 14px; cursor: pointer; }

.lp-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #D4AF37 0%, #c49b28 50%, #b8922a 100%);
  border: none;
  border-radius: 12px;
  color: #0a0a0a;
  font-size: 14px;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.25s;
  box-shadow: 0 6px 24px rgba(212,175,55,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}
.lp-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}
.lp-btn:hover::before { left: 100%; }
.lp-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 36px rgba(212,175,55,0.4); }
.lp-btn:active { transform: scale(0.98); }
.lp-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.lp-form-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.18);
}
.lp-form-footer a { color: #D4AF37; text-decoration: none; font-weight: 600; }
.lp-form-footer a:hover { text-decoration: underline; }

.lp-version {
  position: absolute;
  bottom: 16px;
  right: 44px;
  font-size: 9px;
  color: rgba(255,255,255,0.08);
  letter-spacing: 1px;
}

@media (max-width: 900px) {
  .lp-wrap {
    position: relative;
    height: 100vh;
    overflow: hidden;
  }
  /* Tampilkan foto background di mobile */
  .lp-left {
    display: flex !important;
    position: absolute;
    inset: 0;
    padding: 0;
    z-index: 0;
  }
  .lp-left-content,
  .lp-tagline,
  .lp-headline,
  .lp-desc,
  .lp-stats { display: none !important; }
  .lp-logo {
    top: 20px; left: 20px;
    z-index: 10;
  }
  .lp-logo-icon { width: 32px; height: 32px; font-size: 14px; border-radius: 8px; }
  .lp-logo-name { font-size: 15px; }

  /* Form panel naik dari bawah */
  .lp-right {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    width: 100%;
    height: auto;
    max-height: 78vh;
    padding: 28px 24px 32px;
    border-left: none;
    border-top: 1px solid rgba(212,175,55,0.2);
    border-radius: 28px 28px 0 0;
    background: rgba(10, 8, 5, 0.88);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    overflow: hidden;
    z-index: 5;
  }
  /* Handle bar */
  .lp-right::before {
    content: '';
    position: absolute;
    top: 10px; left: 50%;
    transform: translateX(-50%);
    width: 36px; height: 4px;
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
  }
  .lp-right::after { display: none; }

  .lp-form-eyebrow { margin-bottom: 4px; font-size: 9px; }
  .lp-form-title { font-size: 22px; margin-bottom: 4px; }
  .lp-form-sub { font-size: 12px; margin-bottom: 18px; line-height: 1.4; }
  .lp-field { margin-bottom: 11px; }
  .lp-field-label { margin-bottom: 5px; font-size: 9px; }
  .lp-input { height: 44px; font-size: 13px; border-radius: 12px; }
  .lp-sep { margin: 0 0 11px; font-size: 8px; }
  .lp-remember { margin-bottom: 14px; font-size: 11px; }
  .lp-btn { height: 48px; font-size: 13px; border-radius: 12px; }
  .lp-form-footer { margin-top: 14px; font-size: 11px; }
  .lp-input-hint { display: none; }
  .lp-version { display: none; }
}
</style>

<div class="lp-wrap">

  <!-- LEFT: Visual Panel — full background -->
  <div class="lp-left">
    <div class="lp-left-bg"></div>
    <div class="lp-left-overlay"></div>
    <div class="lp-left-accent"></div>

    <div class="lp-logo">
      <div class="lp-logo-icon">✂️</div>
      <div class="lp-logo-name">Barber<span>Pro</span></div>
    </div>

    <div class="lp-left-content">
      <div class="lp-tagline">Platform Manajemen</div>
      <div class="lp-headline">Kelola Bisnis<br>Barbershop<br><span>Lebih Cerdas.</span></div>
      <div class="lp-desc">Satu platform lengkap untuk booking, kasir, laporan, inventori, dan portal pelanggan online.</div>
      <div class="lp-stats">
        <div><div class="lp-stat-num">500+</div><div class="lp-stat-label">Barbershop</div></div>
        <div><div class="lp-stat-num">50K+</div><div class="lp-stat-label">Booking/Bulan</div></div>
        <div><div class="lp-stat-num">4.9★</div><div class="lp-stat-label">Rating</div></div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Glass Form Panel -->
  <div class="lp-right">
    <div class="lp-form-eyebrow">Masuk ke Akun</div>
    <div class="lp-form-title">Selamat Datang</div>
    <div class="lp-form-sub">Masukkan kredensial Anda untuk mengakses dashboard barbershop.</div>

    <form id="login-form" autocomplete="off">

      <!-- Shop Slug -->
      <div class="lp-field">
        <div class="lp-field-label gold">
          <i class="fas fa-store"></i> Kode Toko
        </div>
        <div class="lp-input-wrap">
          <i class="fas fa-hashtag lp-icon"></i>
          <input id="shop-slug" class="lp-input" type="text" placeholder="contoh: garuda-studio" autocomplete="off" />
        </div>
        <div class="lp-input-hint">Kosongkan jika Anda adalah Super Admin.</div>
      </div>

      <div class="lp-sep">Kredensial</div>

      <!-- Username -->
      <div class="lp-field">
        <div class="lp-field-label"><i class="fas fa-user"></i> Username</div>
        <div class="lp-input-wrap">
          <i class="fas fa-at lp-icon"></i>
          <input id="username" class="lp-input" type="text" placeholder="Masukkan username Anda" autocomplete="username" required />
        </div>
      </div>

      <!-- Password -->
      <div class="lp-field">
        <div class="lp-field-label"><i class="fas fa-lock"></i> Password</div>
        <div class="lp-input-wrap">
          <i class="fas fa-key lp-icon"></i>
          <input id="password" class="lp-input" type="password" placeholder="••••••••" autocomplete="current-password" required />
          <button type="button" class="lp-pw-toggle" id="pw-toggle">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>

      <label class="lp-remember">
        <input type="checkbox" id="remember" />
        Ingat saya di perangkat ini
      </label>

      <button type="submit" class="lp-btn" id="login-btn">
        <i class="fas fa-sign-in-alt"></i>
        <span>Masuk Sekarang</span>
      </button>

    </form>

    <div class="lp-form-footer">
      Belum punya akun? <a href="#" onclick="window.location.hash='signup'">Hubungi Admin</a>
    </div>

    <div class="lp-version">BarberPro v2.0 • ${new Date().getFullYear()}</div>
  </div>

</div>
  `;

  // Toggle password visibility
  container.querySelector('#pw-toggle')?.addEventListener('click', function() {
    const p = container.querySelector('#password');
    const isHidden = p.type === 'password';
    p.type = isHidden ? 'text' : 'password';
    this.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
  });

  const form = container.querySelector('#login-form');
  const btn = container.querySelector('#login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = container.querySelector('#username').value.trim();
    const password = container.querySelector('#password').value;
    if (!username || !password) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Memproses...</span>';

    try {
      const shopSlug = container.querySelector('#shop-slug').value.trim().toLowerCase();

      let email;
      const loginMap = storage.get('staff_login_map', {});
      const mapKey = shopSlug ? `${username}.${shopSlug}` : username;

      if (loginMap[mapKey]) {
        email = loginMap[mapKey];
      } else if (loginMap[username]) {
        email = loginMap[username];
      } else {
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .ilike('username', username)
            .limit(5);

          if (profiles && profiles.length > 0) {
            const possibleEmails = [
              `${username}@barberpro.local`,
              shopSlug ? `${username}.${shopSlug}@barberpro.local` : null,
            ].filter(Boolean);

            let found = false;
            for (const tryEmail of possibleEmails) {
              const { data: tryData, error: tryErr } = await supabase.auth.signInWithPassword({ email: tryEmail, password });
              if (!tryErr && tryData.user) {
                loginMap[mapKey] = tryEmail;
                storage.set('staff_login_map', loginMap);
                email = tryEmail;
                found = true;
                break;
              }
            }
            if (!found) throw new Error('Username atau password salah.');
          } else {
            email = shopSlug
              ? `${username}.${shopSlug}@barberpro.local`
              : username.includes('@') ? username : `${username}@barberpro.local`;
          }
        } catch (lookupErr) {
          if (lookupErr.message === 'Username atau password salah.') throw lookupErr;
          email = shopSlug
            ? `${username}.${shopSlug}@barberpro.local`
            : username.includes('@') ? username : `${username}@barberpro.local`;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const { data: profileRaw, error: pError } = await supabase
          .from('profiles').select('*').eq('id', data.user.id).single();
        if (pError) throw pError;

        const profile = storage.toCamelCaseObj(profileRaw);
        storage.setCurrentUser(profile);
        if (profile.shopId) storage.set('shopId', profile.shopId);

        let shopName = 'BarberPro';
        if (profile.shopId) {
          const { data: shop } = await supabase.from('shops').select('name').eq('id', profile.shopId).single();
          if (shop) shopName = shop.name;
        }

        showToast(`Selamat datang, ${profile.fullName || profile.username}! ✂️`, 'success');

        try { await storage.syncFromSupabase(); } catch {}

        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('main-content').style.marginLeft = '';
        document.getElementById('main-content').style.width = '';

        // Tampilkan kembali burger button
        const burgerBtn = document.querySelector('.sidebar-toggle');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');
        if (burgerBtn) burgerBtn.style.display = '';
        if (sidebarOverlay) sidebarOverlay.style.display = '';

        if (profile.isSuperAdmin) {
          storage.remove('shopId');
          window.location.hash = 'super-admin';
        } else {
          window.location.hash = 'dashboard';
        }

        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Login gagal: Username atau password salah.', 'danger');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Masuk Sekarang</span>';
    }
  });
}




