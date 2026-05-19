import { storage } from '../utils/storage.js';
import { supabase } from '../utils/supabaseClient.js';
import { showToast } from '../components/toast.js';

// Cache-buster: 2026-05-19T21:40:00
export function renderLogin(container) {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (sidebar) sidebar.style.display = 'none';
  if (mainContent) { mainContent.style.marginLeft = '0'; mainContent.style.width = '100%'; mainContent.style.padding = '0'; }
  document.body.className = '';
  document.body.classList.add('bg-[#0a0a0a]', 'text-[#e5e2e1]', 'selection:bg-[#b8860b]/30');

  // Sembunyikan burger button dan overlay saat login
  const burgerBtn = document.querySelector('.sidebar-toggle');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');
  if (burgerBtn) burgerBtn.style.display = 'none';
  if (sidebarOverlay) sidebarOverlay.style.display = 'none';

  // Load Google Fonts
  if (!document.getElementById('login-google-fonts')) {
    const link = document.createElement('link');
    link.id = 'login-google-fonts';
    link.rel = 'stylesheet';
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Hanken+Grotesk:wght@400;500&family=JetBrains+Mono:wght@500&display=swap";
    document.head.appendChild(link);
  }

  // Load Material Symbols
  if (!document.getElementById('login-material-symbols')) {
    const link = document.createElement('link');
    link.id = 'login-material-symbols';
    link.rel = 'stylesheet';
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
    document.head.appendChild(link);
  }

  // Apply custom Tailwind config dynamically
  if (window.tailwind) {
    window.tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          "colors": {
              "on-secondary-fixed": "#221b00",
              "surface-container-lowest": "#0e0e0e",
              "on-primary-fixed-variant": "#574500",
              "on-secondary-fixed-variant": "#544600",
              "on-surface-variant": "#d0c5af",
              "surface-container-low": "#1c1b1b",
              "inverse-primary": "#735c00",
              "on-primary": "#3c2f00",
              "on-tertiary-container": "#454544",
              "outline-variant": "#4d4635",
              "outline": "#99907c",
              "surface-container-high": "#2a2a2a",
              "background": "#0a0a0a",
              "secondary-fixed-dim": "#e9c400",
              "on-secondary": "#3a3000",
              "secondary-fixed": "#ffe16d",
              "primary-fixed-dim": "#e9c349",
              "error": "#ffb4ab",
              "surface": "#131313",
              "surface-variant": "#353534",
              "inverse-surface": "#e5e2e1",
              "secondary-container": "#ffdb3c",
              "on-surface": "#e5e2e1",
              "error-container": "#93000a",
              "on-error": "#690005",
              "surface-dim": "#131313",
              "inverse-on-surface": "#313030",
              "tertiary-container": "#b4b2b2",
              "tertiary-fixed": "#e5e2e1",
              "surface-container-highest": "#353534",
              "on-background": "#e5e2e1",
              "on-primary-fixed": "#241a00",
              "primary": "#d4af37",
              "primary-fixed": "#ffe088",
              "tertiary": "#d0cdcd",
              "on-tertiary-fixed": "#1c1b1b",
              "on-tertiary-fixed-variant": "#474746",
              "on-secondary-container": "#725f00",
              "tertiary-fixed-dim": "#c8c6c5",
              "surface-bright": "#3a3939",
              "secondary": "#fff9ef",
              "primary-container": "#b8860b",
              "on-tertiary": "#313030",
              "on-error-container": "#ffdad6",
              "surface-container": "#201f1f",
              "on-primary-container": "#554300",
              "surface-tint": "#e9c349"
          },
          "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
          },
          "spacing": {
              "sm": "12px",
              "md": "24px",
              "gutter": "24px",
              "margin-desktop": "48px",
              "xs": "4px",
              "margin-mobile": "16px",
              "lg": "40px",
              "base": "8px",
              "xl": "64px"
          },
          "fontFamily": {
              "body-md": ["Hanken Grotesk"],
              "label-sm": ["JetBrains Mono"],
              "headline-md": ["Playfair Display"],
              "body-lg": ["Hanken Grotesk"],
              "headline-lg-mobile": ["Playfair Display"],
              "display-lg": ["Playfair Display"],
              "headline-lg": ["Playfair Display"]
          },
          "fontSize": {
              "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
              "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}],
              "headline-md": ["28px", {"lineHeight": "36px", "fontWeight": "600"}],
              "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
              "headline-lg-mobile": ["36px", {"lineHeight": "44px", "fontWeight": "700"}],
              "display-lg": ["64px", {"lineHeight": "72px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "headline-lg": ["40px", {"lineHeight": "48px", "fontWeight": "700"}]
          }
        },
      },
    };
  }

  container.innerHTML = `
<style>
      body {
        background-color: #0a0a0a;
        color: #e5e2e1;
        position: relative;
      }
      
      /* Subtle Grain Texture overlay */
      body::before {
        content: "";
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        pointer-events: none;
        z-index: 9999;
        opacity: 0.4;
      }

      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      
      .gold-gradient {
        background: linear-gradient(135deg, #f2ca50 0%, #d4af37 50%, #b8860b 100%);
      }
      
      .glass-card {
        background: rgba(20, 20, 20, 0.4);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(212, 175, 55, 0.15);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      }
      
      .ai-glow {
        box-shadow: 0 0 30px rgba(212, 175, 55, 0.1);
      }
      
      .hero-bg {
        background-image: radial-gradient(circle at 70% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 60%),
                          radial-gradient(circle at 10% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 40%);
      }
      
      /* Liquid Hover Effect for Buttons */
      .btn-liquid {
        position: relative;
        overflow: hidden;
        z-index: 1;
      }
      .btn-liquid::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: inherit;
        z-index: -2;
      }
      .btn-liquid::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.2);
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        border-radius: inherit;
        z-index: -1;
      }
      .btn-liquid:hover::before {
        width: 100%;
      }

      /* Animations */
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }

      .animate-entrance {
        animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        opacity: 0;
      }
      
      .floating {
        animation: float 6s ease-in-out infinite;
      }
      
      .stagger-1 { animation-delay: 0.1s; }
      .stagger-2 { animation-delay: 0.2s; }
      .stagger-3 { animation-delay: 0.3s; }
      
      .nav-link {
        position: relative;
        transition: color 0.3s ease-out;
      }
      .nav-link::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        width: 0;
        height: 1px;
        background-color: #d4af37;
        transition: width 0.3s ease-out;
      }
      .nav-link:hover::after {
        width: 100%;
      }
      .nav-link-active::after {
        width: 100%;
      }

      .cta-button:hover span.material-symbols-outlined {
        transform: translateX(4px);
      }
      
      /* Scroll Reveal */
      .reveal {
        opacity: 0;
        transform: translateY(40px);
        transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .reveal.active {
        opacity: 1;
        transform: translateY(0);
      }

      /* Parallax Elements */
      .parallax-layer {
        position: absolute;
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .animate-entrance, .cta-button:hover span.material-symbols-outlined, .btn-liquid::before, .floating, .reveal {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    </style>

<!-- Top Navigation -->
<header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-desktop py-md max-w-[1440px] left-1/2 -translate-x-1/2 bg-background/70 backdrop-blur-xl border-b border-outline-variant/30 transition-all duration-300" id="header">
<div class="flex items-center gap-xs">
<span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">content_cut</span>
<span class="text-headline-md font-headline-md font-bold tracking-tight text-white italic">BarberPro.</span>
</div>
<nav class="hidden md:flex items-center gap-lg">
<a class="nav-link nav-link-active text-primary font-bold font-body-md tracking-wide uppercase text-sm" href="#features-section">Features</a>
<a class="nav-link text-on-surface-variant font-medium hover:text-white font-body-md tracking-wide uppercase text-sm" href="#ai-section">AI Stylist</a>
<a class="nav-link text-on-surface-variant font-medium hover:text-white font-body-md tracking-wide uppercase text-sm" href="#analytics-section">Pricing</a>
<a class="nav-link text-on-surface-variant font-medium hover:text-white font-body-md tracking-wide uppercase text-sm" id="support-nav" href="#">Support</a>
</nav>
<button class="px-md py-sm bg-transparent border border-outline-variant/50 rounded-full hover:border-primary hover:text-primary transition-all duration-300 text-label-sm font-label-sm uppercase tracking-widest active:scale-95">
            Staff Login
        </button>
</header>
<main class="min-h-screen pt-[120px] hero-bg overflow-hidden relative">
<!-- Parallax background elements -->
<div class="parallax-layer w-96 h-96 rounded-full bg-primary/5 blur-[100px] top-20 right-[10%]" data-speed="2"></div>
<div class="parallax-layer w-64 h-64 rounded-full bg-primary/5 blur-[80px] bottom-40 left-[5%]" data-speed="-1"></div>
<!-- Hero & Login Container -->
<div class="max-w-[1440px] mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-xl py-xl min-h-[85vh] items-center relative z-10">
<!-- Content Section (Left) -->
<div class="lg:col-span-7 flex flex-col justify-center space-y-xl animate-entrance pr-lg">
<div class="space-y-lg">
<div class="inline-flex items-center gap-xs px-4 py-2 bg-transparent border border-primary/30 rounded-full">
<span class="material-symbols-outlined text-[14px] text-primary" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-sm font-label-sm text-primary uppercase tracking-[0.2em]">Enterprise Edition v2.0</span>
</div>
<h1 class="font-display-lg text-display-lg text-white leading-[1.1]">
                        Sistem Kasir &amp; <br/>
<span class="text-primary italic font-light">Manajemen Barbershop</span> <br/>
                        Cerdas.
                    </h1>
<p class="font-body-lg text-body-lg text-on-surface-variant/80 max-w-xl font-light leading-relaxed">
                        Kelola bagi hasil komisi barber secara akurat, kirim slip gaji otomatis lewat WhatsApp, kelola antrean antarmuka kasir, dan berikan konsultasi gaya rambut digital dengan AI Stylist Wizard.
                    </p>
</div>
<!-- Features Bento (Reveal on scroll) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-md pt-lg reveal" id="features-section">
<div class="glass-card p-lg rounded-2xl group hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 ease-out">
<div class="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center mb-md group-hover:bg-primary/10 transition-colors">
<span class="material-symbols-outlined text-primary font-light">payments</span>
</div>
<h3 class="font-headline-md text-xl text-white mb-sm">Payroll &amp; Bagi Hasil</h3>
<p class="text-on-surface-variant/70 text-body-md font-light leading-relaxed">Skema komisi persentase atau nominal flat untuk barber yang langsung terintegrasi dengan slip gaji WhatsApp otomatis.</p>
</div>
<div class="glass-card p-lg rounded-2xl ai-glow border-primary/20 group hover:border-primary/50 hover:-translate-y-1 transition-all duration-500 ease-out relative overflow-hidden" id="ai-section">
<div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
<div class="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center mb-md bg-primary/5">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">face_retouching_natural</span>
</div>
<h3 class="font-headline-md text-xl text-white mb-sm">AI Stylist Consultant</h3>
<p class="text-on-surface-variant/70 text-body-md font-light leading-relaxed">Bantu pelanggan menentukan model potongan rambut terbaik mereka dengan wizard rekomendasi kecerdasan buatan.</p>
</div>
<div class="glass-card p-lg rounded-2xl group hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 ease-out md:col-span-2" id="analytics-section">
<div class="flex flex-col md:flex-row gap-lg items-start">
<div class="w-12 h-12 shrink-0 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
<span class="material-symbols-outlined text-primary font-light">query_stats</span>
</div>
<div>
<h3 class="font-headline-md text-xl text-white mb-sm">Analitik &amp; Keuangan Real-Time</h3>
<p class="text-on-surface-variant/70 text-body-md font-light leading-relaxed max-w-2xl">Laporan pengeluaran, omzet harian, dan grafik performa barber untuk optimasi profit bisnis barbershop Anda.</p>
</div>
</div>
</div>
</div>
</div>
<!-- Login Section (Right - Floating Glass Card) -->
<div class="lg:col-span-5 animate-entrance stagger-1 flex items-center justify-end">
<div class="glass-card p-xl rounded-3xl relative overflow-hidden w-full max-w-md floating shadow-2xl shadow-black/50 border-t border-l border-white/5">
<div class="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
<div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-[100px]"></div>
<div class="relative z-10 space-y-xl">
<header>
<p class="text-label-sm font-label-sm text-primary uppercase tracking-widest mb-2">Selamat datang kembali</p>
<h2 class="font-headline-lg text-headline-lg text-white font-light italic">Login Staff</h2>
</header>
<form id="login-form" autocomplete="off" class="space-y-lg">
<div class="space-y-md">
<div class="relative group">
<div class="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
<span class="material-symbols-outlined text-on-surface-variant/50 group-focus-within:text-primary transition-colors font-light">store</span>
</div>
<input id="shop-slug" class="block w-full pl-[56px] pr-md py-4 bg-black/40 border-0 border-b border-outline-variant/50 focus:border-primary focus:ring-0 text-white placeholder:text-on-surface-variant/30 transition-all font-light rounded-t-lg" placeholder="Kode Toko (Opsional)" type="text" autocomplete="off"/>
</div>
<div class="relative group">
<div class="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
<span class="material-symbols-outlined text-on-surface-variant/50 group-focus-within:text-primary transition-colors font-light">person</span>
</div>
<input id="username" class="block w-full pl-[56px] pr-md py-4 bg-black/40 border-0 border-b border-outline-variant/50 focus:border-primary focus:ring-0 text-white placeholder:text-on-surface-variant/30 transition-all font-light rounded-t-lg" placeholder="Username" type="text" required autocomplete="username"/>
</div>
<div class="relative group">
<div class="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
<span class="material-symbols-outlined text-on-surface-variant/50 group-focus-within:text-primary transition-colors font-light">key</span>
</div>
<input id="password" class="block w-full pl-[56px] pr-[56px] py-4 bg-black/40 border-0 border-b border-outline-variant/50 focus:border-primary focus:ring-0 text-white placeholder:text-on-surface-variant/30 transition-all font-light rounded-t-lg" placeholder="Password" type="password" required autocomplete="current-password"/>
<div class="absolute inset-y-0 right-0 pr-md flex items-center">
<button id="pw-toggle" type="button" class="text-on-surface-variant/50 hover:text-primary transition-colors">
<span class="material-symbols-outlined font-light">visibility</span>
</button>
</div>
</div>
</div>

<!-- Quick Stats Section -->
<div class="grid grid-cols-3 gap-sm py-sm border-t border-white/5">
<div class="text-center py-sm">
<span class="block font-headline-md text-primary font-light text-2xl">#1</span>
<span class="text-label-sm font-label-sm text-on-surface-variant/50 text-[10px] uppercase tracking-widest">Sistem</span>
</div>
<div class="text-center py-sm">
<span class="block font-headline-md text-primary font-light text-2xl">24</span>
<span class="text-label-sm font-label-sm text-on-surface-variant/50 text-[10px] uppercase tracking-widest">Jam</span>
</div>
<div class="text-center py-sm">
<div class="flex justify-center mb-1">
<span class="material-symbols-outlined text-primary text-[24px] font-light">auto_awesome</span>
</div>
<span class="text-label-sm font-label-sm text-on-surface-variant/50 text-[10px] uppercase tracking-widest">Mudah</span>
</div>
</div>

<button id="login-btn" type="submit" class="cta-button btn-liquid w-full py-4 gold-gradient text-black font-bold text-sm tracking-widest uppercase rounded-full flex items-center justify-center gap-sm shadow-lg shadow-primary/20">
                            Masuk Sekarang
                            <span class="material-symbols-outlined transition-transform duration-300">arrow_forward</span>
</button>
</form>

<div class="flex items-center gap-md pt-md border-t border-white/5 cursor-pointer group" id="support-link">
<div class="w-10 h-10 rounded-full bg-black/40 border border-white/5 flex items-center justify-center group-hover:border-primary/30 transition-colors">
<span class="material-symbols-outlined text-on-surface-variant/70 font-light text-sm">headset_mic</span>
</div>
<div class="flex-1">
<h4 class="text-xs font-bold text-white uppercase tracking-wider">Butuh Bantuan?</h4>
<p class="text-[11px] font-label-sm text-on-surface-variant/50 mt-1">Hubungi admin pusat.</p>
</div>
<span class="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-colors font-light">east</span>
</div>
</div>
</div>
</div>
</div>
</main>

<!-- Footer -->
<footer class="w-full px-margin-desktop py-16 flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto border-t border-white/10 reveal">
<div class="flex flex-col items-center md:items-start mb-md md:mb-0">
<span class="text-headline-md font-headline-md font-bold text-white mb-2 italic">BarberPro.</span>
<p class="text-label-sm font-label-sm text-on-surface-variant/50 tracking-widest uppercase text-[10px]">BarberPro Enterprise v2.0 • © ${new Date().getFullYear()}</p>
</div>
<div class="flex gap-lg">
<a class="nav-link text-on-surface-variant/70 hover:text-primary text-xs uppercase tracking-widest font-light" href="#">Privacy Policy</a>
<a class="nav-link text-on-surface-variant/70 hover:text-primary text-xs uppercase tracking-widest font-light" href="#">Terms of Service</a>
<a class="nav-link text-on-surface-variant/70 hover:text-primary text-xs uppercase tracking-widest font-light" href="#">Contact Support</a>
</div>
</footer>
  `;

  // Toggle password visibility
  container.querySelector('#pw-toggle')?.addEventListener('click', function() {
    const p = container.querySelector('#password');
    const isHidden = p.type === 'password';
    p.type = isHidden ? 'text' : 'password';
    this.innerHTML = isHidden 
      ? '<span class="material-symbols-outlined font-light">visibility_off</span>' 
      : '<span class="material-symbols-outlined font-light">visibility</span>';
  });

  // Scroll to focus login form on Staff Login button click
  container.querySelector('#header button')?.addEventListener('click', () => {
    container.querySelector('#username')?.focus();
  });

  // Support links click handler
  const openSupportWA = (e) => {
    e.preventDefault();
    window.open('https://wa.me/6281234567890?text=Halo%20Admin%20BarberPro,%20saya%20butuh%20bantuan%20untuk%20login.', '_blank');
  };
  container.querySelector('#support-link')?.addEventListener('click', openSupportWA);
  container.querySelector('#support-nav')?.addEventListener('click', openSupportWA);

  // Parallax, Header background, and scroll reveal setup
  const reveal = () => {
    const el = document.getElementById('login-form');
    if (!el) {
      window.removeEventListener('scroll', reveal);
      return;
    }
    const reveals = container.querySelectorAll(".reveal");
    reveals.forEach(item => {
      const windowHeight = window.innerHeight;
      const elementTop = item.getBoundingClientRect().top;
      const elementVisible = 100;
      if (elementTop < windowHeight - elementVisible) {
        item.classList.add("active");
      }
    });
  };

  const parallax = (e) => {
    const el = document.getElementById('login-form');
    if (!el) {
      document.removeEventListener('mousemove', parallax);
      return;
    }
    const layers = container.querySelectorAll(".parallax-layer");
    layers.forEach(move => {
      const moving_value = move.getAttribute("data-speed");
      const x = (e.clientX * moving_value) / 250;
      const y = (e.clientY * moving_value) / 250;
      move.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });
  };

  const headerScroll = () => {
    const el = document.getElementById('login-form');
    if (!el) {
      window.removeEventListener('scroll', headerScroll);
      return;
    }
    const header = container.querySelector('#header');
    if (!header) return;
    if (window.scrollY > 50) {
      header.classList.add('bg-black/90', 'shadow-lg');
      header.classList.remove('bg-background/70');
    } else {
      header.classList.remove('bg-black/90', 'shadow-lg');
      header.classList.add('bg-background/70');
    }
  };

  window.addEventListener('scroll', reveal);
  window.addEventListener('scroll', headerScroll);
  document.addEventListener('mousemove', parallax);

  // Trigger initial checks
  setTimeout(() => {
    reveal();
    headerScroll();
  }, 100);

  const form = container.querySelector('#login-form');
  const btn = container.querySelector('#login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = container.querySelector('#username').value.trim();
    const password = container.querySelector('#password').value;
    if (!username || !password) return;

    btn.disabled = true;
    btn.innerHTML = '<span>Memproses...</span> <span class="material-symbols-outlined animate-spin">autorenew</span>';

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
      btn.innerHTML = 'Masuk Sekarang <span class="material-symbols-outlined transition-transform duration-300">arrow_forward</span>';
    }
  });
}
