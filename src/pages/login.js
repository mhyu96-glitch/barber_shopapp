import { storage } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

// Cache-buster: 2026-05-18T21:35:00
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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

.lp-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.06), transparent 45%),
              radial-gradient(circle at bottom left, rgba(212, 175, 55, 0.03), transparent 45%),
              #090a0f;
  font-family: 'Outfit', sans-serif;
  padding: 20px;
}

.pwa-container {
  width: 100%;
  max-width: 100%;
  height: 100vh;
  background: #0b0c10;
  position: relative;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (min-width: 480px) {
  .pwa-container {
    max-width: 450px;
    height: auto;
    min-height: 680px;
    max-height: 90vh;
    border-radius: 28px;
    border: 1px solid rgba(212, 175, 55, 0.18);
    background: #0b0c10;
    box-shadow: 0 30px 60px rgba(0,0,0,0.6), 
                0 0 100px rgba(212, 175, 55, 0.03);
    overflow-y: auto;
  }
}

.pwa-top {
  padding: 60px 24px 80px;
  background: linear-gradient(150deg, #1d1b18 0%, #0d0d0c 100%);
  color: #fff;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
  border-bottom: 2px solid rgba(212, 175, 55, 0.25);
  position: relative;
  z-index: 1;
}

.pwa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: #fff; text-decoration: none; font-size: 18px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.15);
}

.member-id { text-align: right; line-height: 1.2; }
.member-id .label { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #d4af37; text-transform: uppercase; }
.member-id .val { font-size: 16px; font-weight: 800; color: #fff; }

.greeting { margin-bottom: 24px; }
.greeting-sub { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 500; margin-bottom: 4px; }
.greeting-title { 
  font-size: 34px; 
  font-weight: 900; 
  letter-spacing: -1px; 
  line-height: 1.1;
  background: linear-gradient(135deg, #ffffff 10%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.card-title {
  font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #d4af37; margin-bottom: 16px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;
}

.lp-field { margin-bottom: 12px; position: relative; }
.lp-input {
  width: 100%; height: 48px;
  background: rgba(0,0,0,0.4) !important;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 16px;
  padding: 0 16px 0 46px;
  color: #fff !important;
  font-size: 14px; font-weight: 500; font-family: inherit;
  transition: all 0.3s; outline: none;
}
.lp-input::placeholder { color: rgba(255,255,255,0.4) !important; }
.lp-input:focus { background: rgba(0,0,0,0.6) !important; border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15); }
.lp-icon { position: absolute; left: 16px; top: 16px; color: #d4af37; font-size: 15px; }

.lp-pw-toggle {
  position: absolute; right: 16px; top: 15px;
  color: rgba(255,255,255,0.6); background: none; border: none; cursor: pointer; padding: 0; font-size: 15px;
}

.stats-row {
  display: flex; gap: 12px;
  padding: 0 24px;
  margin-top: -30px;
  position: relative; z-index: 2;
  justify-content: space-between;
}
.stat-item {
  flex: 1; background: #1c1b18; border-radius: 24px;
  padding: 16px 8px; text-align: center;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 1px solid rgba(212, 175, 55, 0.15);
}
.stat-val { font-size: 22px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.stat-val.c-blue { color: #d4af37; }
.stat-val.c-green { color: #10b981; }
.stat-val.c-orange { color: #e67e22; }
.stat-label { font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; }

.pwa-bottom {
  flex: 1; background: #0c0c0c; padding: 30px 24px;
  overflow-y: auto; position: relative; z-index: 0;
}

.login-btn {
  width: 100%; height: 56px;
  background: #d4af37; color: #0d0d0c;
  border: none; border-radius: 20px;
  font-size: 16px; font-weight: 700; font-family: inherit;
  cursor: pointer; box-shadow: 0 10px 25px rgba(212, 175, 55, 0.25);
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 10px;
}
.login-btn:active { transform: scale(0.98); }

.info-card {
  background: #1c1b18; border-radius: 24px; padding: 16px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  margin-top: 24px;
  border: 1px solid rgba(212, 175, 55, 0.1);
}
.info-icon {
  width: 48px; height: 48px; border-radius: 16px;
  background: rgba(212, 175, 55, 0.15); color: #d4af37;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.info-text { flex: 1; }
.info-title { font-size: 15px; font-weight: 700; color: #fff; }
.info-sub { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }

input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px rgba(0,0,0,0.4) inset !important;
    -webkit-text-fill-color: white !important;
    transition: background-color 5000s ease-in-out 0s;
}
</style>

<div class="lp-wrap">
  <div class="pwa-container">
    
    <div class="pwa-top">
      <div class="pwa-header">
        <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i></a>
        <div class="member-id">
          <div class="label">SISTEM KASIR</div>
          <div class="val">BARBERPRO</div>
        </div>
      </div>

      <div class="greeting">
        <div class="greeting-sub">Selamat datang kembali,</div>
        <div class="greeting-title">Login Staff</div>
      </div>

      <div class="glass-card">
        <div class="card-title"><i class="fas fa-lock"></i> KREDENSIAL AKSES</div>
        
        <form id="login-form" autocomplete="off">
          <div class="lp-field">
            <i class="fas fa-store lp-icon"></i>
            <input id="shop-slug" class="lp-input" type="text" placeholder="Kode Toko (Opsional)" autocomplete="off" />
          </div>
          
          <div class="lp-field">
            <i class="fas fa-user lp-icon"></i>
            <input id="username" class="lp-input" type="text" placeholder="Username" required autocomplete="off" />
          </div>
          
          <div class="lp-field">
            <i class="fas fa-key lp-icon"></i>
            <input id="password" class="lp-input" type="password" placeholder="Password" required autocomplete="new-password" />
            <button type="button" class="lp-pw-toggle" id="pw-toggle"><i class="fas fa-eye"></i></button>
          </div>
        </form>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-val c-blue">#1</div>
        <div class="stat-label">SISTEM</div>
      </div>
      <div class="stat-item">
        <div class="stat-val c-green">24</div>
        <div class="stat-label">JAM</div>
      </div>
      <div class="stat-item">
        <div class="stat-val c-orange">✨</div>
        <div class="stat-label">MUDAH</div>
      </div>
    </div>

    <div class="pwa-bottom">
      <button type="submit" form="login-form" class="login-btn" id="login-btn">
        Masuk Sekarang <i class="fas fa-arrow-right" style="font-size:14px; margin-left: 4px;"></i>
      </button>

      <div class="info-card">
        <div class="info-icon"><i class="fas fa-headset"></i></div>
        <div class="info-text">
          <div class="info-title">Butuh Bantuan?</div>
          <div class="info-sub">Hubungi admin pusat untuk bantuan login.</div>
        </div>
        <a href="#" style="width:36px;height:36px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#64748b;text-decoration:none;"><i class="fas fa-chevron-right"></i></a>
      </div>
      
      <div style="text-align:center; margin-top: 30px; font-size: 11px; color: #cbd5e1; font-weight: 600;">
        BarberPro v2.0 &copy; ${new Date().getFullYear()}
      </div>
    </div>

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
          console.warn("Lookup failed (offline?), using local mapping fallback.");
          const allProfiles = storage.getAll('profiles');
          const localProfile = allProfiles.find(p => 
            (p.username && p.username.toLowerCase() === username.toLowerCase()) ||
            (p.email && p.email.toLowerCase() === username.toLowerCase())
          );
          if (localProfile) {
            email = localProfile.email;
          } else {
            email = shopSlug
              ? `${username}.${shopSlug}@barberpro.local`
              : username.includes('@') ? username : `${username}@barberpro.local`;
          }
        }
      }

      let data = null, error = null;
      try {
        const authRes = await supabase.auth.signInWithPassword({ email, password });
        if (authRes.error) {
          const isNetError = !window.navigator.onLine || 
                             authRes.error.message?.toLowerCase().includes('fetch') || 
                             authRes.error.message?.toLowerCase().includes('network') ||
                             authRes.error.status === 0;
          if (isNetError) {
            throw authRes.error;
          }
        }
        data = authRes.data;
        error = authRes.error;
      } catch (netErr) {
        console.warn("Supabase Auth failed (offline?), attempting offline lookup:", netErr);
        const allProfiles = storage.getAll('profiles');
        let match = allProfiles.find(p => 
          (p.username && p.username.toLowerCase() === username.toLowerCase()) || 
          (p.email && p.email.toLowerCase() === email.toLowerCase())
        );

        // AUTO-PROVISION FOR SUPERADMIN TESTING
        if (!match && username.toLowerCase().includes('superadmin')) {
          match = {
            id: `mock-sa-${Date.now()}`,
            fullName: username.charAt(0).toUpperCase() + username.slice(1),
            username: username.toLowerCase(),
            role: 'superadmin',
            isSuperAdmin: true,
            is_super_admin: true,
            email: `${username.toLowerCase()}@barberpro.local`,
            shopId: null,
            shop_id: null
          };
          allProfiles.push(match);
          storage.set('profiles', allProfiles);
        }

        // AUTO-PROVISION FOR BUDI BARBER TESTING
        if (!match && username.toLowerCase() === 'budi_barber') {
          match = {
            id: 'budi-barber-id',
            fullName: 'Budi Barber',
            username: 'budi_barber',
            role: 'barber',
            email: 'budi_barber@barberpro.local',
            shopId: 'mock-shop-id',
            shop_id: 'mock-shop-id'
          };
          allProfiles.push(match);
          storage.set('profiles', allProfiles);
        }

        if (match) {
          data = { user: { id: match.id } };
        } else {
          throw new Error("Offline login failed: User not found locally.");
        }
      }

      if (error) throw error;

      if (data && data.user) {
        let profile = null;
        try {
          const { data: profileRaw, error: pError } = await supabase
            .from('profiles').select('*').eq('id', data.user.id).single();
          if (pError) throw pError;
          profile = storage.toCamelCaseObj(profileRaw);
        } catch (dbErr) {
          console.warn("Could not fetch profile from Supabase, using local profile:", dbErr);
          const allProfiles = storage.getAll('profiles');
          const localProfile = allProfiles.find(p => p.id === data.user.id);
          if (localProfile) {
            profile = localProfile;
          } else {
            throw dbErr;
          }
        }

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




