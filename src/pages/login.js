import { storage } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export function renderLogin(container) {
  // Clear sidebar and main layout classes for login
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main-content').style.marginLeft = '0';
  document.getElementById('main-content').style.width = '100%';

  // Dynamically load Tailwind CSS if not present
  if (!document.getElementById('tailwind-cdn')) {
    const twScript = document.createElement('script');
    twScript.id = 'tailwind-cdn';
    twScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(twScript);
  }

  // Dynamically load Google Fonts if not present
  if (!document.getElementById('atelier-fonts')) {
    const fontLink = document.createElement('link');
    fontLink.id = 'atelier-fonts';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    document.head.appendChild(fontLink);
  }

  // Clean up existing global styles that might conflict
  document.body.className = '';
  document.body.classList.add('bg-[#131313]', 'text-[#e5e2e1]', 'selection:bg-[#D4AF37]/30');
  
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
  <div class="mb-12 text-center">
    <h1 class="text-4xl font-extrabold tracking-tighter text-[#D4AF37]" style="font-family: 'Epilogue', sans-serif;">
        BarberPro Studio
    </h1>
    <p class="text-[10px] uppercase tracking-[0.2em] text-[#d0c5af] mt-2" style="font-family: 'Inter', sans-serif;">
        The Private Atelier Experience
    </p>
  </div>

  <!-- Login Card -->
  <div class="w-full max-w-md bg-[#1c1b1b] rounded-xl shadow-[0px_24px_48px_rgba(0,0,0,0.4)] overflow-hidden">
    <!-- Hero Image Section of Card -->
    <div class="h-32 w-full overflow-hidden relative grayscale contrast-125 opacity-40">
      <img class="w-full h-full object-cover" data-alt="close-up of antique barber shears and a leather strop in a dark moody vintage barbershop setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEGX40XkCtazrNZ9Mx5YeBA7BB64tt8WqUi42O3x45Fdt3HxsGfdsEFBbEAq79FRGm1eyQ9oZVdna3o627PR1IcoydRAbh8vwO2iSFHmQimcXcwrAaIJkRbSmyugWFV9xR4rMtkbMBkDtcMjh77JIuPSa9ZusDDLqkL6o3i4z24eqaMQp9XHM8a27w9VAFIBSWytbhnZbdLWECoOKD2yMDEEuV9ZiGR0_-tmLCQXexTkPM35m6qPhe_Z2kIec3wOy1xKiEv1cWQ_M"/>
      <div class="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent"></div>
    </div>

    <div class="px-10 pb-12 pt-4">
      <header class="mb-10">
        <h2 class="text-2xl font-bold tracking-tight text-[#e5e2e1]" style="font-family: 'Epilogue', sans-serif;">Welcome Back</h2>
        <p class="text-[#d0c5af] text-sm mt-1">Sign in to your professional workspace.</p>
      </header>

      <form id="login-form" class="space-y-6">
        <!-- Username Field -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase tracking-[0.05em] text-[#d0c5af] px-1" for="username" style="font-family: 'Inter', sans-serif;">Username</label>
          <div class="relative group">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d0c5af] text-lg transition-colors group-focus-within:text-[#D4AF37]">person</span>
            <input id="username" class="w-full bg-[#0e0e0e] border-0 border-b border-[#4d4635]/50 py-4 pl-12 pr-4 text-[#e5e2e1] placeholder:text-[#d0c5af]/40 focus:ring-0 focus:border-[#D4AF37] transition-all rounded-t-lg" placeholder="Enter your username" type="text" autocomplete="username" required/>
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
            <button class="absolute right-4 top-1/2 -translate-y-1/2 text-[#d0c5af] hover:text-[#e5e2e1]" type="button" onclick="const p = document.getElementById('password'); p.type = p.type === 'password' ? 'text' : 'password';">
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
      <div class="mt-10 pt-8 border-t border-[#4d4635]/30 text-center">
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

  const form = container.querySelector('#login-form');
  const btn = container.querySelector('#login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = container.querySelector('#username').value.trim();
    const password = container.querySelector('#password').value;

    if (!username || !password) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Memproses...';

    try {
      // Support both username and real email
      const email = username.includes('@') ? username : `${username}@barberpro.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      if (data.user) {
        // Fetch profile to get role and shop_id
        const { data: profileRaw, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (pError) throw pError;

        // Convert snake_case from DB to camelCase for the internal app
        const profile = storage.toCamelCaseObj(profileRaw);
        storage.setCurrentUser(profile);

        // Save shop_id for multi-tenant scoping
        if (profile.shopId) {
          storage.set('shopId', profile.shopId);
        }

        // Fetch shop name for greeting
        let shopName = 'BarberPro';
        if (profile.shopId) {
          const { data: shop } = await supabase
            .from('shops')
            .select('name')
            .eq('id', profile.shopId)
            .single();
          if (shop) shopName = shop.name;
        }

        showToast(`Selamat datang di ${shopName}, ${profile.fullName || profile.username}!`, 'success');
        
        // 🚀 CRITICAL: Sync all shop details (Tier, Status, Features) BEFORE reload
        // This prevents blank screen on boot by ensuring data is ready in localStorage
        try {
          await storage.syncFromSupabase();
        } catch (sErr) {
          console.warn('Pre-reload sync warning:', sErr);
        }

        // Restore layout and redirect
        document.getElementById('sidebar').style.display = 'block';
        document.getElementById('main-content').style.marginLeft = '';
        document.getElementById('main-content').style.width = '';
        
        // Redirect to Super Admin Master Dashboard if applicable
        if (profile.isSuperAdmin) {
          storage.remove('shopId');
          window.location.hash = 'super-admin';
        } else {
          window.location.hash = 'dashboard';
        }

        // Small delay to ensure toast is visible and storage is persisted
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Login gagal: Username atau password salah.', 'danger');
      btn.disabled = false;
      btn.innerHTML = '<span>Masuk Sekarang</span> <i class="fas fa-sign-in-alt" style="margin-left: 8px;"></i>';
    }
  });
}
