import { storage } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export function renderLogin(container) {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (sidebar) sidebar.style.display = 'none';
  if (mainContent) { mainContent.style.marginLeft = '0'; mainContent.style.width = '100%'; mainContent.style.padding = '0'; }
  document.body.className = '';
  document.body.classList.add('bg-[#131313]', 'text-[#e5e2e1]', 'selection:bg-[#D4AF37]/30');

  // Sembunyikan burger button dan overlay saat login
  const burgerBtn = document.querySelector('.sidebar-toggle');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');
  if (burgerBtn) burgerBtn.style.display = 'none';
  if (sidebarOverlay) sidebarOverlay.style.display = 'none';

  container.innerHTML = `
<style>
  .brass-gradient {
    background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%);
  }
  .noise-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
  }
</style>

<!-- Subtle Background Texture -->
<div class="fixed inset-0 noise-overlay pointer-events-none z-0"></div>
<div class="fixed inset-0 bg-gradient-to-tr from-[#0e0e0e] via-transparent to-[#0e0e0e]/50 pointer-events-none z-0"></div>

<!-- Login Container -->
<main class="relative z-10 min-h-screen flex flex-col items-center justify-center p-6" style="font-family: 'Manrope', sans-serif;">
  <!-- Brand Header (Above Card) -->
  <div class="mb-8 text-center">
    <h1 class="text-4xl font-extrabold tracking-tighter text-[#D4AF37]" style="font-family: 'Epilogue', sans-serif;">
        BarberPro Studio
    </h1>
    <p class="text-[10px] uppercase tracking-[0.2em] text-[#d0c5af] mt-2" style="font-family: 'Inter', sans-serif;">
        The Private Atelier Experience
    </p>
  </div>

  <!-- Login Card -->
  <div class="w-full max-w-md bg-[#1c1b1b] rounded-xl shadow-[0px_24px_48px_rgba(0,0,0,0.4)] overflow-hidden border border-[#4d4635]/20">
    <!-- Hero Image Section of Card -->
    <div class="h-32 w-full overflow-hidden relative grayscale contrast-125 opacity-40">
      <img class="w-full h-full object-cover" data-alt="close-up of antique barber shears and a leather strop in a dark moody vintage barbershop setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEGX40XkCtazrNZ9Mx5YeBA7BB64tt8WqUi42O3x45Fdt3HxsGfdsEFBbEAq79FRGm1eyQ9oZVdna3o627PR1IcoydRAbh8vwO2iSFHmQimcXcwrAaIJkRbSmyugWFV9xR4rMtkbMBkDtcMjh77JIuPSa9ZusDDLqkL6o3i4z24eqaMQp9XHM8a27w9VAFIBSWytbhnZbdLWECoOKD2yMDEEuV9ZiGR0_-tmLCQXexTkPM35m6qPhe_Z2kIec3wOy1xKiEv1cWQ_M"/>
      <div class="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent"></div>
    </div>

    <div class="px-10 pb-12 pt-4">
      <header class="mb-8">
        <h2 class="text-2xl font-bold tracking-tight text-[#e5e2e1]" style="font-family: 'Epilogue', sans-serif;">Welcome Back</h2>
        <p class="text-[#d0c5af] text-sm mt-1">Sign in to your professional workspace.</p>
      </header>

      <form id="login-form" class="space-y-5" autocomplete="off">
        <!-- Shop Slug Field -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase tracking-[0.05em] text-[#d0c5af] px-1" for="shop-slug" style="font-family: 'Inter', sans-serif;">Kode Toko (Opsional)</label>
          <div class="relative group">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d0c5af] text-lg transition-colors group-focus-within:text-[#D4AF37]">store</span>
            <input id="shop-slug" class="w-full bg-[#0e0e0e] border-0 border-b border-[#4d4635]/50 py-4 pl-12 pr-4 text-[#e5e2e1] placeholder:text-[#d0c5af]/40 focus:ring-0 focus:border-[#D4AF37] transition-all rounded-t-lg" placeholder="contoh: garuda-studio" type="text" autocomplete="off"/>
          </div>
        </div>

        <!-- Username Field -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase tracking-[0.05em] text-[#d0c5af] px-1" for="username" style="font-family: 'Inter', sans-serif;">Username</label>
          <div class="relative group">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d0c5af] text-lg transition-colors group-focus-within:text-[#D4AF37]">person</span>
            <input id="username" class="w-full bg-[#0e0e0e] border-0 border-b border-[#4d4635]/50 py-4 pl-12 pr-4 text-[#e5e2e1] placeholder:text-[#d0c5af]/40 focus:ring-0 focus:border-[#D4AF37] transition-all rounded-t-lg" placeholder="Masukkan username Anda" type="text" autocomplete="username" required/>
          </div>
        </div>

        <!-- Password Field -->
        <div class="space-y-2">
          <div class="flex justify-between items-end px-1">
            <label class="text-[10px] uppercase tracking-[0.05em] text-[#d0c5af]" for="password" style="font-family: 'Inter', sans-serif;">Password</label>
            <a class="text-[10px] uppercase tracking-wider text-[#99907c] hover:text-[#D4AF37] transition-colors" href="#" style="font-family: 'Inter', sans-serif;">Forgot Password?</a>
          </div>
          <div class="relative group">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d0c5af] text-lg transition-colors group-focus-within:text-[#D4AF37]">lock</span>
            <input id="password" class="w-full bg-[#0e0e0e] border-0 border-b border-[#4d4635]/50 py-4 pl-12 pr-12 text-[#e5e2e1] placeholder:text-[#d0c5af]/40 focus:ring-0 focus:border-[#D4AF37] transition-all rounded-t-lg" placeholder="••••••••" type="password" autocomplete="current-password" required/>
            <button class="absolute right-4 top-1/2 -translate-y-1/2 text-[#d0c5af] hover:text-[#e5e2e1]" type="button" id="pw-toggle">
              <span class="material-symbols-outlined text-lg">visibility_off</span>
            </button>
          </div>
        </div>

        <!-- Remember Me -->
        <div class="flex items-center space-x-3 px-1 pt-2">
          <div class="relative flex items-center">
            <input class="h-4 w-4 rounded-sm border-[#4d4635] bg-[#0e0e0e] text-[#D4AF37] focus:ring-[#D4AF37]/20 focus:ring-offset-0" id="remember" type="checkbox"/>
          </div>
          <label class="text-sm text-[#d0c5af]" for="remember">Keep me signed in</label>
        </div>

        <!-- Login Button -->
        <div class="pt-4">
          <button id="login-btn" class="w-full brass-gradient py-4 rounded-lg font-bold text-[#412d00] shadow-lg shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200" type="submit" style="font-family: 'Epilogue', sans-serif;">
              SIGN IN TO ATELIER
          </button>
        </div>
      </form>

      <!-- Support/Footer Info -->
      <div class="mt-8 pt-6 border-t border-[#4d4635]/30 text-center">
        <p class="text-[#d0c5af] text-xs">
          New to the studio? <a class="text-[#D4AF37] font-bold hover:underline" href="#" onclick="window.location.hash='signup'">Contact Administration</a>
        </p>
      </div>
    </div>
  </div>

  <!-- System Footer -->
  <footer class="mt-12 flex flex-col items-center gap-4">
    <div class="flex gap-8">
      <a class="text-[10px] uppercase tracking-[0.05em] text-[#d0c5af] hover:text-[#D4AF37] transition-colors" href="#" style="font-family: 'Inter', sans-serif;">Privacy Policy</a>
      <a class="text-[10px] uppercase tracking-[0.05em] text-[#d0c5af] hover:text-[#D4AF37] transition-colors" href="#" style="font-family: 'Inter', sans-serif;">Terms of Service</a>
      <a class="text-[10px] uppercase tracking-[0.05em] text-[#d0c5af] hover:text-[#D4AF37] transition-colors" href="#" style="font-family: 'Inter', sans-serif;">Support</a>
    </div>
    <p class="text-[10px] uppercase tracking-[0.05em] text-[#99907c] opacity-60" style="font-family: 'Inter', sans-serif;">
        &copy; ${new Date().getFullYear()} BarberPro Studio. The Private Atelier Experience.
    </p>
  </footer>
</main>
  `;

  // Toggle password visibility
  container.querySelector('#pw-toggle')?.addEventListener('click', function() {
    const p = container.querySelector('#password');
    const iconSpan = this.querySelector('span');
    const isHidden = p.type === 'password';
    p.type = isHidden ? 'text' : 'password';
    if (iconSpan) {
      iconSpan.textContent = isHidden ? 'visibility' : 'visibility_off';
    }
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
      btn.innerHTML = '<span>SIGN IN TO ATELIER</span>';
    }
  });
}
