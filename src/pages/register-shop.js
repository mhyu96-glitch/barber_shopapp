// ========================================
// Shop Registration - Multi-Tenant
// ========================================

import { supabase } from '../utils/supabaseClient.js';

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('portal-main');

  main.innerHTML = `
    <div class="portal-main fade-in" style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 12px;">✂️</div>
        <h2 style="margin-bottom: 6px;">Daftarkan Barbershop Anda</h2>
        <p style="color: var(--p-muted); font-size: 14px;">
          Buat akun gratis dan mulai kelola barbershop Anda secara profesional
        </p>
      </div>

      <form id="register-form">
        <div class="p-card" style="padding: 24px;">
          <h3 style="font-size: 14px; color: var(--p-accent); margin-bottom: 16px;">
            <i class="fas fa-store"></i> Data Toko
          </h3>
          
          <div class="p-form-group">
            <label>Nama Barbershop *</label>
            <input type="text" class="p-form-control" id="shop-name" placeholder="Contoh: Tokas Barbershop" required />
          </div>

          <div class="p-form-group">
            <label>URL Toko (slug) *</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--p-muted); font-size: 12px; white-space: nowrap;">barberpro.com/portal?shop=</span>
              <input type="text" class="p-form-control" id="shop-slug" placeholder="tokas-barbershop" required style="flex: 1;" />
            </div>
            <small style="color: var(--p-muted); font-size: 11px;">Hanya huruf kecil, angka, dan tanda hubung (-)</small>
          </div>

          <div class="p-form-group">
            <label>Alamat</label>
            <input type="text" class="p-form-control" id="shop-address" placeholder="Jl. Contoh No. 123, Kota" />
          </div>

          <div class="p-form-group">
            <label>No. WhatsApp Toko</label>
            <input type="tel" class="p-form-control" id="shop-phone" placeholder="08xxxxxxxxxx" />
          </div>
        </div>

        <div class="p-card" style="padding: 24px; margin-top: 16px;">
          <h3 style="font-size: 14px; color: var(--p-accent); margin-bottom: 16px;">
            <i class="fas fa-user-shield"></i> Akun Admin (Pemilik)
          </h3>

          <div class="p-form-group">
            <label>Nama Lengkap *</label>
            <input type="text" class="p-form-control" id="owner-name" placeholder="Nama Anda" required />
          </div>

          <div class="p-form-group">
            <label>Username *</label>
            <input type="text" class="p-form-control" id="owner-username" placeholder="username" required />
          </div>

          <div class="p-form-group">
            <label>Password *</label>
            <input type="password" class="p-form-control" id="owner-password" placeholder="Min. 6 karakter" required minlength="6" />
          </div>
        </div>

        <button type="submit" id="register-btn" class="p-btn p-btn-primary p-btn-block" style="margin-top: 20px; padding: 14px; font-size: 16px;">
          <i class="fas fa-rocket"></i> Daftarkan Toko Saya
        </button>

        <p style="text-align: center; margin-top: 16px; font-size: 13px; color: var(--p-muted);">
          Sudah punya akun? <a href="/index.html" style="color: var(--p-accent);">Login di sini</a>
        </p>
      </form>

      <div id="success-section" style="display: none; text-align: center;">
        <div class="success-icon" style="width: 60px; height: 60px; border-radius: 50%; background: var(--p-success); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px;">
          <i class="fas fa-check"></i>
        </div>
        <h2 style="margin-bottom: 6px;">Toko Berhasil Didaftarkan! 🎉</h2>
        <p style="color: var(--p-muted); margin-bottom: 20px;">Selamat! Barbershop Anda sudah terdaftar di BarberPro.</p>
        <div class="p-card" style="padding: 20px; margin-bottom: 20px; text-align: left;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: var(--p-muted);">Portal URL</span>
            <span id="result-portal-url" style="font-weight: 700; color: var(--p-accent);"></span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--p-muted);">Admin Login</span>
            <span id="result-login" style="font-weight: 700;"></span>
          </div>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <a id="link-portal" href="#" class="p-btn p-btn-primary" style="flex: 1;">
            <i class="fas fa-external-link-alt"></i> Buka Portal
          </a>
          <a href="/index.html" class="p-btn p-btn-secondary" style="flex: 1;">
            <i class="fas fa-sign-in-alt"></i> Login Admin
          </a>
        </div>
      </div>
    </div>
  `;

  // Auto-generate slug from shop name
  const nameInput = document.getElementById('shop-name');
  const slugInput = document.getElementById('shop-slug');
  nameInput?.addEventListener('input', () => {
    slugInput.value = slugify(nameInput.value);
  });

  // Form submit
  const form = document.getElementById('register-form');
  const btn = document.getElementById('register-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const shopName = document.getElementById('shop-name').value.trim();
    const shopSlug = slugify(document.getElementById('shop-slug').value.trim());
    const shopAddress = document.getElementById('shop-address').value.trim();
    const shopPhone = document.getElementById('shop-phone').value.trim();
    const ownerName = document.getElementById('owner-name').value.trim();
    const username = document.getElementById('owner-username').value.trim();
    const password = document.getElementById('owner-password').value;

    if (!shopName || !shopSlug || !ownerName || !username || !password) {
      alert('Harap isi semua field yang wajib (*) !');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mendaftarkan...';

    try {
      // 1. Check if slug is available
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', shopSlug)
        .maybeSingle();

      if (existingShop) {
        alert('URL toko sudah digunakan. Silakan pilih yang lain.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-rocket"></i> Daftarkan Toko Saya';
        return;
      }

      // 2. Create auth user
      const email = `${username.toLowerCase()}@barberpro.local`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: ownerName, role: 'admin', username },
        },
      });

      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error('User creation failed');

      // 3. Create shop
      const { data: newShop, error: shopErr } = await supabase
        .from('shops')
        .insert([{
          slug: shopSlug,
          name: shopName,
          owner_id: userId,
          address: shopAddress,
          phone: shopPhone,
          plan: 'free',
        }])
        .select()
        .single();

      if (shopErr) throw shopErr;

      // 4. Update profile with shop_id
      await supabase
        .from('profiles')
        .update({ shop_id: newShop.id })
        .eq('id', userId);

      // 5. Create default settings for the shop
      await supabase.from('settings').insert([{
        shop_id: newShop.id,
        shop_name: shopName,
        address: shopAddress,
        phone: shopPhone,
      }]);

      // Show success
      form.style.display = 'none';
      const successSection = document.getElementById('success-section');
      successSection.style.display = 'block';

      const portalUrl = `portal.html?shop=${shopSlug}`;
      document.getElementById('result-portal-url').textContent = portalUrl;
      document.getElementById('result-login').textContent = username;
      document.getElementById('link-portal').href = `/${portalUrl}`;

    } catch (err) {
      console.error('Registration error:', err);
      alert(`Registrasi gagal: ${err.message}`);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-rocket"></i> Daftarkan Toko Saya';
    }
  });
});
