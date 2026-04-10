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
    <div class="pos-container" style="display: grid; grid-template-columns: 1fr 380px; gap: 20px; height: calc(100vh - 80px); overflow: hidden;">
        
        <!-- Left: Service Selection -->
        <div class="pos-main card" style="display: flex; flex-direction: column; overflow: hidden;">
            <div class="pos-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <h2 style="margin: 0; white-space: nowrap;"><i class="fas fa-cash-register text-accent"></i> Kasir / POS</h2>
                <div style="display: flex; gap: 10px; align-items: center; flex: 1; justify-content: flex-end;">
                    <select id="pos-customer-select" class="form-control" style="width: 220px;">
                        <option value="walk-in">Walk-In (Tamu)</option>
                        ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- Search Bar -->
            <div style="padding: 12px 20px; border-bottom: 1px solid var(--border); background: rgba(var(--accent-rgb), 0.03);">
                <div style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 14px;"></i>
                    <input type="text" id="pos-search-input" class="form-control" placeholder="Ketik nama layanan... (contoh: potong, cukur, creambath)" 
                        style="padding-left: 40px; height: 44px; font-size: 15px; background: var(--bg-primary); border: 2px solid var(--border); border-radius: var(--radius-md);" />
                </div>
            </div>

            <!-- Active Appointments to Settle -->
            ${appointments.length > 0 ? `
            <div class="pos-appointments" style="padding: 12px 20px; background: rgba(var(--accent-rgb), 0.05); border-bottom: 1px solid var(--border);">
                <p class="text-xs fw-700 text-muted" style="margin-bottom: 8px; letter-spacing: 1px;">JANJI TEMU AKTIF</p>
                <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;">
                    ${appointments.map(a => `
                        <div class="card-glass pos-appt-card" data-id="${a.id}" style="min-width: 180px; padding: 10px 14px; cursor: pointer; border: 1px solid var(--border); border-radius: var(--radius-md); transition: 0.2s;">
                            <div class="fw-700 text-sm">${a.customerName}</div>
                            <div class="text-xs text-muted">${a.serviceName} - ${a.time}</div>
                            <div class="text-xs text-accent fw-600">${formatter.currency(a.price || 0)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Service Catalog -->
            <div class="pos-catalog" id="pos-catalog" style="flex: 1; overflow-y: auto; padding: 20px;">
                <div id="pos-service-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;">
                    ${services.map(s => `
                        <div class="card service-item-card clickable" data-id="${s.id}" data-name="${(s.name || '').toLowerCase()}" 
                            style="text-align: center; padding: 18px 12px; transition: 0.2s; border: 1px solid var(--border); cursor: pointer;">
                            <div style="font-size: 28px; color: var(--accent); margin-bottom: 8px;"><i class="fas fa-cut"></i></div>
                            <div class="fw-700" style="font-size: 14px;">${s.name}</div>
                            <div class="text-sm text-success fw-600" style="margin-top: 4px;">${formatter.currency(s.price)}</div>
                        </div>
                    `).join('')}
                    <button class="pos-category btn btn-ghost" data-category="paket"><i class="fas fa-ticket"></i> Paket</button>
                </div>
                <div id="pos-items" class="pos-grid"></div>
                <div id="pos-no-results" style="display: none; text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-search" style="font-size: 32px; display: block; margin-bottom: 12px; opacity: 0.3;"></i>
                    Layanan tidak ditemukan
                </div>
            </div>
        </div>

        <!-- Right: Cart & Checkout -->
        <div class="pos-sidebar card" style="display: flex; flex-direction: column; overflow: hidden; background: var(--bg-secondary);">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border);">
                <h3 style="margin: 0;">Ringkasan Order</h3>
            </div>
            
            <div id="pos-cart-list" style="flex: 1; overflow-y: auto; padding: 12px;">
                <div class="text-center text-muted py-40" id="empty-cart-msg">Keranjang kosong</div>
            </div>

            <div class="pos-totals" style="padding: 16px 20px; border-top: 2px solid var(--border); background: var(--bg-primary);">
                <div class="pos-summary-row mt-md" style="font-size: 1.4rem; padding-top: 10px; border-top: 1px dashed var(--border);">
                    <span class="fw-700">SUBTOTAL</span>
                    <span class="fw-800 text-muted" id="pos-subtotal" style="font-size: 1rem;">${formatter.currency(0)}</span>
                </div>
                <div class="pos-summary-row" id="row-tier-discount" style="display: none; color: var(--success); font-size: 0.9rem;">
                    <span class="fw-600" id="label-tier-discount">Diskon Tier</span>
                    <span class="fw-700" id="val-tier-discount">-${formatter.currency(0)}</span>
                </div>
                <div class="pos-summary-row">
                    <span class="fw-700">TOTAL</span>
                    <span class="fw-800 text-accent" id="pos-total" style="font-size: 1.6rem;">${formatter.currency(0)}</span>
                </div>
                
                <!-- Membership Balance Check -->
                <div id="pos-membership-alert" class="mt-md" style="display: none;"></div>

                <!-- Barber Selection -->
                <div class="form-group mb-md">
                    <label class="text-xs fw-600" style="margin-bottom: 8px; display: block;">Barber / Stylist</label>
                    <select id="pos-barber-select" class="form-control">
                        <option value="">Pilih Barber...</option>
                        ${storage.getAll('barbers').map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                    </select>
                </div>

                <!-- Payment Methods -->
                <div class="form-group mb-md">
                    <label class="text-xs fw-600" style="margin-bottom: 8px; display: block;">Metode Pembayaran</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;" id="pos-methods-container">
                        <button class="btn pos-method active" data-method="cash" 
                            style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border: 2px solid var(--accent); background: rgba(var(--accent-rgb), 0.15); border-radius: var(--radius-md); cursor: pointer; transition: 0.2s;">
                            <i class="fas fa-money-bill-wave" style="font-size: 18px; color: #4ade80;"></i>
                            <span style="font-size: 11px; font-weight: 700;">Tunai</span>
                        </button>
                        <button class="btn pos-method" data-method="transfer" 
                            style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border: 2px solid var(--border); background: transparent; border-radius: var(--radius-md); cursor: pointer; transition: 0.2s;">
                            <i class="fas fa-building-columns" style="font-size: 18px; color: #60a5fa;"></i>
                            <span style="font-size: 11px; font-weight: 700;">Transfer</span>
                        </button>
                        <button class="btn pos-method" data-method="membership" id="btn-method-membership"
                            style="display: none; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border: 2px solid var(--border); background: transparent; border-radius: var(--radius-md); cursor: pointer; transition: 0.2s;">
                            <i class="fas fa-ticket" style="font-size: 18px; color: var(--accent);"></i>
                            <span style="font-size: 11px; font-weight: 700;">Paket</span>
                        </button>
                        <button class="btn pos-method" data-method="qris" 
                            style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border: 2px solid var(--border); background: transparent; border-radius: var(--radius-md); cursor: pointer; transition: 0.2s;">
                            <i class="fas fa-qrcode" style="font-size: 18px; color: #c084fc;"></i>
                            <span style="font-size: 11px; font-weight: 700;">QRIS</span>
                        </button>
                    </div>
                </div>

                <button class="btn btn-primary btn-block py-16" id="pos-checkout-btn" disabled style="height: 56px; font-size: 16px; font-weight: 800;">
                    BAYAR & CETAK NOTA <i class="fas fa-print ml-sm"></i>
                </button>
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
    container.querySelectorAll('.pos-method').forEach(btn => {
        btn.onclick = () => {
            const method = btn.dataset.method;

            // Visual toggle
            container.querySelectorAll('.pos-method').forEach(b => {
                b.style.borderColor = 'var(--border)';
                b.style.background = 'transparent';
            });
            btn.style.borderColor = 'var(--accent)';
            btn.style.background = 'rgba(var(--accent-rgb), 0.15)';

            selectedPaymentMethod = method;
            selectedPaymentDetail = '';
            
            if (method === 'transfer') {
                showTransferModal(paymentDetailEl);
            } else if (method === 'qris') {
                showQRISModal(paymentDetailEl);
            }
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

        const total = subtotal - discount;
        
        container.querySelector('#pos-subtotal').textContent = formatter.currency(subtotal);
        const discRow = container.querySelector('#row-tier-discount');
        if (discount > 0) {
            discRow.style.display = 'flex';
            container.querySelector('#label-tier-discount').textContent = tierLabel;
            container.querySelector('#val-tier-discount').textContent = `-${formatter.currency(discount)}`;
        } else {
            discRow.style.display = 'none';
        }

        container.querySelector('#pos-total').textContent = formatter.currency(total);
        container.querySelector('#pos-checkout-btn').disabled = cart.length === 0;

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
    const banks = [
        { name: 'BCA', number: '123-456-7890', holder: 'BarberPro Studio', icon: 'fa-building-columns', color: '#005baa' },
        { name: 'BRI', number: '098-765-4321', holder: 'BarberPro Studio', icon: 'fa-building-columns', color: '#003d79' },
        { name: 'Mandiri', number: '111-222-3333', holder: 'BarberPro Studio', icon: 'fa-building-columns', color: '#003868' },
        { name: 'BNI', number: '444-555-6666', holder: 'BarberPro Studio', icon: 'fa-building-columns', color: '#f26522' },
    ];

    const body = `
        <div style="display: grid; gap: 12px;">
            <p class="text-sm text-muted" style="margin: 0;">Pilih rekening tujuan transfer:</p>
            ${banks.map(b => `
                <div class="bank-option card-glass" data-bank="${b.name}" 
                    style="padding: 16px; border: 2px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 14px;"
                    onmouseover="this.style.borderColor='var(--accent)'" 
                    onmouseout="if(!this.classList.contains('selected'))this.style.borderColor='var(--border)'">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: ${b.color}; display: flex; align-items: center; justify-content: center;">
                        <i class="fas ${b.icon}" style="color: white; font-size: 18px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div class="fw-700">${b.name}</div>
                        <div class="text-sm text-muted" style="font-family: monospace; letter-spacing: 1px;">${b.number}</div>
                        <div class="text-xs text-muted">a.n. ${b.holder}</div>
                    </div>
                    <i class="fas fa-copy" title="Salin" style="color: var(--text-muted); font-size: 14px;"></i>
                </div>
            `).join('')}
        </div>
    `;

    openModal('Transfer Bank', body, '', { maxWidth: '480px' });

    setTimeout(() => {
        document.querySelectorAll('.bank-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const bankName = opt.dataset.bank;
                const bank = banks.find(b => b.name === bankName);
                selectedPaymentDetail = `${bank.name} - ${bank.number}`;
                detailEl.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${selectedPaymentDetail}`;
                
                // Copy to clipboard
                navigator.clipboard?.writeText(bank.number.replace(/-/g, ''));
                showToast(`No. Rek ${bank.name} disalin!`, 'success');
                closeModal();
            });
        });
    }, 100);
}

// --- QRIS Modal ---
function showQRISModal(detailEl) {
    const body = `
        <div style="text-align: center; padding: 10px;">
            <div style="background: white; border-radius: 16px; padding: 20px; display: inline-block; margin-bottom: 16px;">
                <img src="/qris-barberpro.png" alt="QRIS BarberPro" 
                    style="width: 260px; height: 260px; object-fit: contain; border-radius: 8px;" 
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width:260px;height:260px;display:flex;align-items:center;justify-content:center;background:#f0f0f0;border-radius:8px;color:#666;font-size:14px;\\'>QR Code akan muncul di sini</div>'" />
            </div>
            <h3 style="margin: 8px 0 4px; color: var(--text-primary);">Scan untuk Bayar</h3>
            <p class="text-sm text-muted" style="margin: 0;">BarberPro Studio</p>
            <p class="text-xs text-muted" style="margin-top: 4px;">NMID: ID1022334455667</p>
            <div style="margin-top: 16px; padding: 12px; background: rgba(var(--accent-rgb), 0.1); border-radius: var(--radius-md);">
                <p class="text-xs fw-600" style="margin: 0; color: var(--accent);">
                    <i class="fas fa-info-circle"></i> Arahkan kamera e-wallet (GoPay, OVO, DANA, ShopeePay, dll) ke QR code di atas
                </p>
            </div>
        </div>
    `;

    openModal('Pembayaran QRIS', body, `
        <button class="btn btn-primary" onclick="document.getElementById('active-modal')?.remove()">
            <i class="fas fa-check"></i> Sudah Dibayar
        </button>
    `, { maxWidth: '400px' });

    selectedPaymentDetail = 'QRIS';
    detailEl.innerHTML = `<i class="fas fa-qrcode" style="color: #c084fc;"></i> Pembayaran via QRIS`;
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
    const commissionRate = barber ? (barber.commissionRate || 0) : 0;
    const commissionAmount = Math.round(total * (commissionRate / 100));

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
