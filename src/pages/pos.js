// ========================================
// POS (Kasir) Page
// Quick Checkout & Receipt Printing
// ========================================

import { storage } from '../utils/storage.js';
import { formatter } from '../utils/formatter.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { receipt } from '../utils/receipt.js';

let cart = [];
let selectedCustomer = null;
let selectedPaymentMethod = 'cash';
let selectedPaymentDetail = '';

export function renderPOS(container) {
    const services = storage.getAll('services');
    const customers = storage.getAll('customers');
    const appointments = storage.getAll('appointments').filter(a => a.status === 'confirmed' && a.paymentStatus !== 'paid');

    // Auto-collapse sidebar when entering POS mode
    document.body.classList.add('sidebar-collapsed');

    // Add collapse toggle button if not present
    if (!document.querySelector('.sidebar-collapse-btn')) {
        const btn = document.createElement('button');
        btn.className = 'sidebar-collapse-btn';
        btn.innerHTML = '<i class="fas fa-bars"></i>';
        btn.title = 'Toggle Sidebar';
        btn.onclick = () => {
            document.body.classList.toggle('sidebar-collapsed');
            btn.innerHTML = document.body.classList.contains('sidebar-collapsed')
                ? '<i class="fas fa-bars"></i>'
                : '<i class="fas fa-angles-left"></i>';
        };
        document.body.appendChild(btn);
    }

    // Reset payment state
    selectedPaymentMethod = 'cash';
    selectedPaymentDetail = '';

    container.innerHTML = `
    <div class="pos-container" style="display: grid; grid-template-columns: 1fr 380px; gap: 16px; height: calc(100vh - 80px); overflow: hidden;">
        
        <!-- Left: Service Selection ... -->
        <div class="pos-main card" style="display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-xl);">
            <div class="pos-header" style="padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(var(--accent-rgb), 0.02);">
                <h2 style="margin: 0; font-size: 16px; display: flex; align-items: center; gap: 10px;"><i class="fas fa-cash-register text-accent"></i> Kasir / POS</h2>
                <select id="pos-customer-select" class="form-control" style="width: 180px; height: 36px; font-size: 13px;">
                    <option value="walk-in">Walk-In (Tamu)</option>
                    ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>

            <!-- Search Bar -->
            <div style="padding: 10px 16px; border-bottom: 1px solid var(--border);">
                <div style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 13px;"></i>
                    <input type="text" id="pos-search-input" class="form-control" placeholder="Cari layanan..." 
                        style="padding-left: 36px; height: 40px; font-size: 14px; border-radius: var(--radius-md);" />
                </div>
            </div>

            <div class="pos-catalog" id="pos-catalog" style="flex: 1; overflow-y: auto; padding: 16px;">
                <div id="pos-service-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
                    ${services.map(s => `
                        <div class="card service-item-card clickable" data-id="${s.id}" data-name="${(s.name || '').toLowerCase()}" 
                            style="text-align: center; padding: 14px 10px; border: 1px solid var(--border); cursor: pointer; transition: 0.2s;">
                            <div style="font-size: 24px; color: var(--accent); margin-bottom: 6px;"><i class="fas fa-cut"></i></div>
                            <div class="fw-700" style="font-size: 13px;">${s.name}</div>
                            <div class="text-xs text-success fw-700" style="margin-top: 2px;">${formatter.currency(s.price)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Right: Cart & Checkout -->
        <div class="pos-luxury-sidebar shadow-premium" style="border-radius: var(--radius-xl); overflow: hidden; height: 100%;">
            <!-- Header -->
            <div style="padding: 16px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 28px; height: 28px; border-radius: 6px; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-accent);">
                        <i class="fas fa-receipt text-accent" style="font-size: 12px;"></i>
                    </div>
                    <h3 style="margin: 0; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-primary);">Rekap Order</h3>
                </div>
                <div style="text-align: right;">
                    <div class="text-[8px] fw-800 text-muted uppercase tracking-widest">Order ID</div>
                    <div class="text-[10px] fw-900 text-accent">#POS-${Date.now().toString().slice(-5)}</div>
                </div>
            </div>
            
            <div id="pos-cart-list" style="flex: 1; overflow-y: auto; padding: 12px; scrollbar-width: none;">
                <div class="text-center py-20" id="empty-cart-msg" style="opacity: 0.2;">
                    <i class="fas fa-shopping-basket" style="display: block; font-size: 32px; margin-bottom: 12px;"></i>
                    <span class="text-[9px] fw-800 uppercase tracking-widest">Kosong</span>
                </div>
            </div>
            
            <div style="padding: 0 12px 14px;">
                <!-- Barber Selection -->
                <div class="form-group mb-sm">
                    <label class="text-[8px] uppercase tracking-widest fw-900 text-muted mb-[4px] block">Barber / Stylist</label>
                    <div class="luxury-select-wrapper" style="padding: 8px 12px; gap: 8px;">
                        <i class="fas fa-user-circle" style="font-size: 14px;"></i>
                        <select id="pos-barber-select" class="form-control" style="background: transparent; border: none; padding: 0; height: auto; font-weight: 700; font-size: 12px;">
                            <option value="">Pilih Barber...</option>
                            ${storage.getAll('barbers').map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Payment Summary Card -->
                <div class="pos-luxury-card mb-sm shadow-sm">
                    <div class="pos-summary-row mb-xs">
                        <span class="text-[11px] text-muted fw-600">Subtotal</span>
                        <span class="fw-700 text-xs" id="pos-subtotal">${formatter.currency(0)}</span>
                    </div>
                    <div class="pos-summary-row mb-xs" id="row-tier-discount" style="display: none; color: #f87171;">
                        <span class="text-[11px] fw-600">Diskon</span>
                        <span class="fw-700 text-xs" id="val-tier-discount">-${formatter.currency(0)}</span>
                    </div>
                    <div class="pos-summary-row mb-xs">
                        <span class="text-[11px] text-muted fw-600">Pajak (11%)</span>
                        <span class="fw-700 text-xs" id="pos-tax">${formatter.currency(0)}</span>
                    </div>

                    <div style="height: 1px; background: var(--border-light); margin: 10px 0; border: none; opacity: 0.3;"></div>

                    <div class="pos-summary-row align-center">
                        <div>
                            <div class="text-[9px] fw-900 text-accent uppercase tracking-widest">Total Akhir</div>
                        </div>
                        <span class="fw-900 text-accent text-2xl" id="pos-total" style="letter-spacing: -0.5px;">${formatter.currency(0)}</span>
                    </div>
                </div>

                <!-- Metode Pembayaran -->
                <div class="form-group mb-md">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;" id="pos-methods-container">
                        <button class="pos-payment-tile active" data-method="cash" style="padding: 10px 4px; border-radius: 12px;">
                            <div class="pos-circle-icon" style="width: 32px; height: 32px; font-size: 14px;"><i class="fas fa-money-bill-wave"></i></div>
                            <span class="text-[9px] fw-900 uppercase">Tunai</span>
                        </button>
                        <button class="pos-payment-tile" data-method="transfer" style="padding: 10px 4px; border-radius: 12px;">
                            <div class="pos-circle-icon" style="width: 32px; height: 32px; font-size: 14px;"><i class="fas fa-university"></i></div>
                            <span class="text-[9px] fw-900 uppercase">Bank</span>
                        </button>
                        <button class="pos-payment-tile" data-method="qris" style="padding: 10px 4px; border-radius: 12px;">
                            <div class="pos-circle-icon" style="width: 32px; height: 32px; font-size: 14px;"><i class="fas fa-qrcode"></i></div>
                            <span class="text-[9px] fw-900 uppercase">QRIS</span>
                        </button>
                    </div>
                </div>

                <button class="btn btn-primary btn-block shadow-accent brass-gradient" id="pos-checkout-btn" disabled 
                    style="height: 48px; border-radius: 12px; font-size: 14px; font-weight: 900; border: none; letter-spacing: 1px;">
                    <i class="fas fa-print mr-xs"></i> BAYAR & CETAK
                </button>

                <div class="luxury-footer-text mt-sm" style="font-size: 8px; opacity: 0.4;">
                    PROCESSED AT ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • REF: POS-X1
                </div>
            </div>
        </div>
    </div>
    `;

    // Reset State
    cart = [];
    selectedCustomer = 'walk-in';

    // UI Refs
    const cartList = container.querySelector('#pos-cart-list');
    const checkoutBtn = container.querySelector('#pos-checkout-btn');
    const customerSelect = container.querySelector('#pos-customer-select');
    const searchInput = container.querySelector('#pos-search-input');
    const paymentDetailEl = container.querySelector('#pos-payment-detail');
    const paymentDetailCard = container.querySelector('#pos-payment-detail-card');

    // --- Search / Filter Services ---
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const cards = container.querySelectorAll('.service-item-card');
        const noResults = container.querySelector('#pos-no-results');
        let visibleCount = 0;
        cards.forEach(card => {
            const name = card.dataset.name || '';
            const match = !query || name.includes(query);
            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });
        noResults.style.display = visibleCount === 0 ? '' : 'none';
    });
    setTimeout(() => searchInput.focus(), 200);

    // --- Add Service to Cart ---
    container.querySelectorAll('.service-item-card').forEach(card => {
        card.onclick = () => {
            const service = services.find(s => s.id === card.dataset.id);
            addToCart(service);
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        };
    });

    // --- Handle Appointment Selection ---
    container.querySelectorAll('.pos-appt-card').forEach(card => {
        card.onclick = () => {
            const id = card.dataset.id;
            const appt = appointments.find(a => a.id === id);
            customerSelect.value = appt.customerId;
            selectedCustomer = appt.customerId;
            container.querySelector('#pos-barber-select').value = appt.barberId || '';
            cart = [];
            const service = services.find(s => s.id === appt.serviceId);
            addToCart(service, appt.id);
            showToast(`Memuat: ${appt.customerName}`, 'info');
        };
    });

    // --- Payment Method Selection ---
    container.querySelectorAll('.pos-payment-tile').forEach(btn => {
        btn.onclick = () => {
            const method = btn.dataset.method;
            selectedPaymentMethod = method;
            selectedPaymentDetail = '';
            
            if (method === 'transfer') {
                showTransferModal(paymentDetailEl);
            } else if (method === 'qris') {
                showQRISModal(paymentDetailEl);
            }
            
            updatePaymentView(container);
        };
    });

    // Checkout
    checkoutBtn.onclick = () => handleCheckout(container);

    function addToCart(service, appointmentId = null) {
        cart.push({ ...service, cartId: Date.now(), appointmentId });
        updateCartUI();
    }

    function updateCartUI() {
        if (cart.length === 0) {
            cartList.innerHTML = '<div class="text-center text-muted py-40">Keranjang kosong</div>';
            checkoutBtn.disabled = true;
        } else {
            cartList.innerHTML = cart.map((item, idx) => `
                <div class="cart-item card-glass mb-sm" style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
                    <div>
                        <div class="fw-700 text-sm">${item.name}</div>
                        <div class="text-xs text-accent">${formatter.currency(item.price)}</div>
                    </div>
                    <button class="btn btn-ghost btn-sm text-danger" onclick="window.__removeFromPOSCart(${idx})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            checkoutBtn.disabled = false;
        }
        updateCartView();
    }

    function updateCartView() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
        
        let discount = 0;
        let tierLabel = '';
        if (selectedCustomer && selectedCustomer !== 'walk-in') {
            const customer = storage.find('customers', selectedCustomer);
            const tier = customer?.loyalty_tier || 'Bronze';
            const rates = { 'Silver': 0.02, 'Gold': 0.05, 'Platinum': 0.10 };
            if (rates[tier]) {
                discount = Math.round(subtotal * rates[tier]);
                tierLabel = `Diskon ${tier} (${rates[tier] * 100}%)`;
            }
        }

        const tax = Math.round((subtotal - discount) * 0.11);
        const total = subtotal - discount + tax;
        
        container.querySelector('#pos-subtotal').textContent = formatter.currency(subtotal);
        const discRow = container.querySelector('#row-tier-discount');
        if (discount > 0) {
            discRow.style.display = 'flex';
            container.querySelector('#label-tier-discount').textContent = tierLabel;
            container.querySelector('#val-tier-discount').textContent = `-${formatter.currency(discount)}`;
        } else {
            discRow.style.display = 'none';
        }

        container.querySelector('#pos-tax').textContent = formatter.currency(tax);
        container.querySelector('#pos-total').textContent = formatter.currency(total);
        container.querySelector('#pos-checkout-btn').disabled = cart.length === 0;

        // Reset detail card if empty cart
        if (cart.length === 0) {
            const detailCard = container.querySelector('#pos-payment-detail-card');
            if (detailCard) detailCard.style.display = 'none';
        }

        // Check for membership balance
        const alertBox = container.querySelector('#pos-membership-alert');
        const membBtn = container.querySelector('#btn-method-membership');
        
        if (selectedCustomer && selectedCustomer !== 'walk-in') {
            const activeMembs = storage.getAll('customerMemberships')
                .filter(m => m.customer_id === selectedCustomer && m.status === 'active' && m.remaining_sessions > 0);
            
            if (activeMembs.length > 0) {
                alertBox.style.display = 'block';
                alertBox.innerHTML = `
                    <div style="background: rgba(var(--accent-rgb), 0.1); border: 1px solid var(--accent); padding: 10px; border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-star text-accent"></i>
                        <div>
                            <div class="fw-700">Membership Aktif!</div>
                            <div class="text-xs">Sisa ${activeMembs[0].remaining_sessions} sesi tersedia.</div>
                        </div>
                        <button class="btn btn-primary btn-xs ml-auto" id="pos-use-membership-btn">Gunakan</button>
                    </div>
                `;
                membBtn.style.display = 'flex';
                
                container.querySelector('#pos-use-membership-btn').onclick = () => {
                    selectedPaymentMethod = 'membership';
                    updatePaymentView(container);
                };
            } else {
                alertBox.style.display = 'none';
                membBtn.style.display = 'none';
                if (selectedPaymentMethod === 'membership') selectedPaymentMethod = 'cash';
            }
        } else {
            alertBox.style.display = 'none';
            membBtn.style.display = 'none';
        }
        
        updatePaymentView(container);
    }

    window.__removeFromPOSCart = (idx) => {
        cart.splice(idx, 1);
        updateCartUI();
    };

    // Restore sidebar when navigating away
    window.__posCleanup = () => {
        document.body.classList.remove('sidebar-collapsed');
        const toggleBtn = document.querySelector('.sidebar-collapse-btn');
        if (toggleBtn) toggleBtn.remove();
    };
}

// --- Transfer Modal ---
function showTransferModal(detailEl) {
    const settings = storage.get('settings', {});
    const banks = settings.bankAccounts || [];

    if (banks.length === 0) {
        showToast('Rekening belum diatur di Pengaturan!', 'warning');
        return;
    }

    const body = `
        <div style="display: grid; gap: 12px;">
            <p class="text-sm text-muted" style="margin: 0;">Pilih rekening tujuan transfer:</p>
            ${banks.map((b, idx) => `
                <div class="bank-option card-glass" data-idx="${idx}" 
                    style="padding: 16px; border: 2px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 14px;"
                    onmouseover="this.style.borderColor='var(--accent)'" 
                    onmouseout="if(!this.classList.contains('selected'))this.style.borderColor='var(--border)'">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), var(--accent-dark)); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-landmark" style="color: white; font-size: 18px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div class="fw-700">${b.name}</div>
                        <div class="text-sm text-accent" style="font-family: monospace; letter-spacing: 1px;">${b.number}</div>
                        <div class="text-[10px] text-muted uppercase fw-600">a.n. ${b.holder}</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--text-muted); font-size: 12px;"></i>
                </div>
            `).join('')}
        </div>
    `;

    openModal('Pilih Rekening Transfer', body, '', { maxWidth: '480px' });

    setTimeout(() => {
        document.querySelectorAll('.bank-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const idx = opt.dataset.idx;
                const bank = banks[idx];
                selectedPaymentDetail = `${bank.name} - ${bank.number}`;
                
                const detailCard = document.getElementById('pos-payment-detail-card');
                detailCard.style.display = 'block';
                detailEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${selectedPaymentDetail}`;
                
                navigator.clipboard?.writeText(bank.number.replace(/\D/g, ''));
                showToast(`No. Rek ${bank.name} disalin!`, 'success');
                closeModal();
            });
        });
    }, 100);
}

// --- QRIS Modal ---
function showQRISModal(detailEl) {
    const settings = storage.get('settings', {});
    const qrisImage = settings.qrisImage;

    if (!qrisImage) {
        showToast('QRIS belum diatur di Pengaturan!', 'warning');
        return;
    }

    const body = `
        <div style="text-align: center; padding: 10px;">
            <div style="position: relative; background: #fff; border-radius: 20px; padding: 30px; border: 10px solid #f8f9fa; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: inline-block;">
                <!-- Scan To Pay Label -->
                <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #ee3124; color: #fff; padding: 4px 16px; border-radius: 20px; font-weight: 800; font-size: 12px; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(238,49,36,0.3);">
                    SCAN TO PAY
                </div>

                <img src="${qrisImage}" alt="QRIS" 
                    style="width: 240px; height: 240px; object-fit: contain; margin-bottom: 15px;" />
                
                <div style="display: flex; justify-content: center; gap: 10px; opacity: 0.8; height: 24px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" style="height: 100%;" />
                    <div style="width: 1px; height: 100%; background: #ddd;"></div>
                    <img src="https://logos-world.net/wp-content/uploads/2022/07/GPN-Logo.png" style="height: 80%; align-self: center;" />
                </div>
            </div>
            
            <h3 style="margin: 20px 0 4px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px;">${settings.shopName || 'BarberPro'}</h3>
            <p class="text-xs text-muted" style="margin: 0; opacity: 0.7;">Terima pembayaran via gopay, ovo, dana, shopeepay, & bank apapun.</p>
            
            <div style="margin-top: 24px; padding: 16px; background: rgba(var(--accent-rgb), 0.1); border-radius: 12px; border: 1px solid var(--accent-subtle);">
                 <p class="text-[11px] fw-700" style="margin: 0; color: var(--accent); line-height: 1.5;">
                    <i class="fas fa-shield-halved"></i> Merchant Terverifikasi oleh GPN & BI
                </p>
            </div>
        </div>
    `;

    openModal('Pembayaran QRIS', body, `
        <button class="btn btn-primary" onclick="closeModal();">
            <i class="fas fa-check"></i> Sudah Saya Scan
        </button>
    `, { maxWidth: '420px' });

    selectedPaymentDetail = 'QRIS';
    const detailCard = document.getElementById('pos-payment-detail-card');
    detailCard.style.display = 'block';
    detailEl.innerHTML = `<i class="fas fa-qrcode" style="color: #c084fc;"></i> Digital Payment: QRIS`;
}

// Cleanup on page change  
window.addEventListener('hashchange', () => {
    if (!location.hash.includes('pos') && window.__posCleanup) {
        window.__posCleanup();
    }
});

async function handleCheckout(container) {
    if (cart.length === 0) return;

    const customerId = container.querySelector('#pos-customer-select').value;
    const customerName = container.querySelector('#pos-customer-select option:checked').text;
    const now = new Date();
    const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

    const barberId = container.querySelector('#pos-barber-select').value;
    const barber = barberId ? storage.find('barbers', barberId) : null;
    
    // Dual commission: percent or fixed
    let commissionAmount = 0;
    if (barber) {
        if (barber.commissionType === 'fixed') {
            commissionAmount = barber.commissionFixed || 0;
        } else {
            const commissionRate = barber.commissionRate || 0;
            commissionAmount = Math.round(total * (commissionRate / 100));
        }
    }

    const methodLabel = selectedPaymentMethod === 'cash' ? 'Tunai' :
                        selectedPaymentMethod === 'transfer' ? 'Transfer' : 
                        selectedPaymentMethod === 'membership' ? 'Membership/ Paket' : 'QRIS';

    try {
        const paymentData = {
            id: 'PMT-' + Date.now(),
            date: now.toISOString().split('T')[0],
            customerId: customerId === 'walk-in' ? null : customerId,
            customerName: customerName,
            barberId: barberId || null,
            commissionAmount: commissionAmount,
            amount: total,
            method: selectedPaymentMethod,
            type: 'full',
            notes: selectedPaymentDetail ? `POS - ${methodLabel} (${selectedPaymentDetail})` : `POS - ${methodLabel}`
        };
        storage.add('payments', paymentData);

        // Execute deduction and status updates
        cart.forEach(item => {
            // Update appointment status
            if (item.appointmentId) {
                storage.update('appointments', item.appointmentId, {
                    paymentStatus: 'paid', status: 'done'
                });
            }

            // Automasi Inventori (BOM)
            const service = storage.find('services', item.id);
            if (service && service.consumables && service.consumables.length > 0) {
                service.consumables.forEach(c => {
                    const product = storage.find('inventory', c.id);
                    if (product) {
                        const newStock = (product.stock || 0) - (c.qty || 0);
                        storage.update('inventory', c.id, { stock: newStock });
                    }
                });
            }

            // Automasi Membership (Deduct Session)
            if (selectedPaymentMethod === 'membership') {
                const activeMembs = storage.getAll('customerMemberships')
                    .filter(m => m.customer_id === customerId && m.status === 'active' && m.remaining_sessions > 0);
                if (activeMembs.length > 0) {
                    storage.update('customerMemberships', activeMembs[0].id, {
                        remaining_sessions: activeMembs[0].remaining_sessions - 1
                    });
                }
            }
            
            // Check if cart item was a package sale
            const isPackage = storage.find('membershipPackages', item.id);
            if (isPackage) {
                const expiryDate = new Date();
                if (isPackage.validDays) expiryDate.setDate(expiryDate.getDate() + isPackage.validDays);
                
                storage.add('customerMemberships', {
                    id: 'MEM-' + Date.now(),
                    customer_id: customerId,
                    package_id: isPackage.id,
                    remaining_sessions: isPackage.sessions,
                    purchase_date: now.toISOString().split('T')[0],
                    expiry_date: isPackage.validDays ? expiryDate.toISOString().split('T')[0] : null,
                    status: 'active'
                });
            }
        });

        // Award Loyalty Points
        if (customerId && customerId !== 'walk-in') {
            const pointsEarned = Math.floor(paymentData.amount / 1000);
            const customer = storage.find('customers', customerId);
            if (customer) {
                const newPoints = (customer.loyalty_points || 0) + pointsEarned;
                
                // Tier Logic
                let newTier = 'Bronze';
                if (newPoints >= 3000) newTier = 'Platinum';
                else if (newPoints >= 1500) newTier = 'Gold';
                else if (newPoints >= 500) newTier = 'Silver';

                storage.update('customers', customerId, {
                    loyalty_points: newPoints,
                    loyalty_tier: newTier
                });

                storage.add('loyalty_logs', {
                    id: 'LOG-' + Date.now(),
                    customer_id: customerId,
                    points: pointsEarned,
                    type: 'earn',
                    description: `POS Payment ${paymentData.id}`,
                    date: now.toISOString().split('T')[0]
                });

                if (newTier !== (customer.loyalty_tier || 'Bronze')) {
                    showToast(`SELAMAT! Level pelanggan naik ke ${newTier}! 🎉`, 'success');
                }
            }
        }

        receipt.print(paymentData, cart, methodLabel);

        showToast('Transaksi Berhasil!', 'success');
        
        // Show Success Modal with Digital Receipt Option
        const successBody = `
            <div style="text-align: center; padding: 20px;">
                <div style="width: 60px; height: 60px; background: var(--success); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 30px;">
                    <i class="fas fa-check"></i>
                </div>
                <h2 style="margin-bottom: 8px;">Pembayaran Sukses!</h2>
                <p class="text-muted mb-lg">Transaksi ${paymentData.id} telah berhasil dicatat.</p>
                
                <div style="display: grid; gap: 10px;">
                    <button class="btn btn-wa btn-block py-12" id="btn-share-digital-receipt">
                        <i class="fab fa-whatsapp"></i> Bagikan Struk Digital
                    </button>
                    <button class="btn btn-secondary btn-block py-12" onclick="closeModal()">
                        Selesai
                    </button>
                </div>
            </div>
        `;
        openModal('Berhasil', successBody, '', { maxWidth: '400px' });

        document.getElementById('btn-share-digital-receipt').onclick = () => {
            const shopId = storage.get('shopId', '');
            const itemsList = cart.map(item => `- ${item.name}: ${formatter.currency(item.price)}`).join('\n');
            const feedbackUrl = `${window.location.origin}${window.location.pathname}#/feedback?appt=${paymentData.id}&shop=${shopId}`;
            
            const msg = `*STRUK DIGITAL - ${storage.get('settings', {}).shopName || 'BarberPro'}*\n\n` +
                `ID: *${paymentData.id}*\n` +
                `Tanggal: ${paymentData.date}\n` +
                `Pelanggan: ${paymentData.customerName}\n` +
                `--------------------------\n` +
                `${itemsList}\n` +
                `--------------------------\n` +
                `*TOTAL: ${formatter.currency(paymentData.amount)}*\n\n` +
                `Beri kami feedback: ${feedbackUrl}\n\n` +
                `Terima kasih telah berkunjung! 🙏✂️`;
            
            const customerPhone = storage.find('customers', customerId)?.phone || '';
            window.open(`https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
        };

        renderPOS(container);

    } catch (err) {
        console.error('Checkout error:', err);
        showToast('Gagal memproses transaksi: ' + err.message, 'danger');
    }
}
