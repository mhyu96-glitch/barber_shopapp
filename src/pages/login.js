import { storage } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

export function renderLogin(container) {
  // Clear sidebar and main layout classes for login
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main-content').style.marginLeft = '0';
  document.getElementById('main-content').style.width = '100%';

  container.innerHTML = `
    <div class="login-page">
      <div class="login-card fade-in">
        <div class="login-header">
          <div class="login-logo">
            <i class="fas fa-scissors"></i>
          </div>
          <h2>BarberPro Studio</h2>
          <p>Portal Manajemen & Staff</p>
        </div>
        
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label><i class="fas fa-user"></i> Username</label>
            <input type="text" id="username" class="form-control" placeholder="Masukkan username" required autocomplete="username">
          </div>
          
          <div class="form-group">
            <label><i class="fas fa-lock"></i> Password</label>
            <input type="password" id="password" class="form-control" placeholder="••••••••" required autocomplete="current-password">
          </div>
          
          <button type="submit" id="login-btn" class="btn btn-primary btn-block" style="margin-top: 24px; padding: 12px;">
            <span>Masuk Sekarang</span>
            <i class="fas fa-sign-in-alt" style="margin-left: 8px;"></i>
          </button>
        </form>
        
        <div class="login-footer" style="margin-top: 40px; text-align: center; opacity: 0.5; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} BarberPro • Executive Edition</p>
        </div>
      </div>
    </div>
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
        
        // Restore layout and redirect
        document.getElementById('sidebar').style.display = 'block';
        document.getElementById('main-content').style.marginLeft = '';
        document.getElementById('main-content').style.width = '';
        
        // Redirect to Super Admin Master Dashboard if applicable
        if (profile.isSuperAdmin) {
          // Clear any previous branch/shop context for Global Master
          storage.remove('shopId');
          window.location.hash = 'super-admin';
        } else {
          window.location.hash = 'dashboard';
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Login gagal: Username atau password salah.', 'danger');
      btn.disabled = false;
      btn.innerHTML = '<span>Masuk Sekarang</span> <i class="fas fa-sign-in-alt" style="margin-left: 8px;"></i>';
    }
  });
}
