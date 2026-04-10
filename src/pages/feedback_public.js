import { storage } from '../utils/storage.js';
import { showToast } from '../components/toast.js';

export function renderFeedbackPublic(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const apptId = params.get('appt');
    const shopId = params.get('shop');

    // Fetch settings to get shop name and Google Maps link
    // Note: In a real public page, we'd fetch this from Supabase by shopId
    // For this prototype, we'll try to find it in the current session settings
    const settings = storage.get('settings', {});
    const shopName = settings.shopName || 'BarberPro Studio';

    container.innerHTML = `
        <div class="feedback-public-container" style="max-width: 500px; margin: 0 auto; padding: 40px 20px; text-align: center;">
            <div class="card fade-in" style="padding: 30px; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);">
                <div style="font-size: 50px; margin-bottom: 20px;">💈</div>
                <h1 style="font-size: 24px; margin-bottom: 10px;">Gimana hasil cukuran Anda, Kak?</h1>
                <p class="text-muted mb-lg" style="font-size: 15px;">Rating Anda sangat membantu ${shopName} untuk terus memberikan yang terbaik.</p>
                
                <div id="rating-stars" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 30px; font-size: 36px;">
                    ${[1, 2, 3, 4, 5].map(i => `<i class="far fa-star star-btn" data-value="${i}" style="cursor: pointer; color: var(--warning); transition: 0.2s;"></i>`).join('')}
                </div>

                <div id="feedback-form" style="display: none;">
                    <div id="negative-feedback" style="display: none;">
                        <p class="text-sm text-muted mb-md">Maaf kalau ada yang kurang memuaskan. Apa yang bisa kami perbaiki?</p>
                        <textarea id="feedback-comment" class="form-control" rows="4" placeholder="Komentar atau saran..."></textarea>
                        <button class="btn btn-primary btn-block mt-lg" id="submit-internal-feedback">Kirim Masukan</button>
                    </div>

                    <div id="positive-feedback" style="display: none;">
                        <div style="background: rgba(var(--success-rgb), 0.1); padding: 20px; border-radius: 12px; border: 1px solid var(--success); margin-bottom: 24px;">
                            <p class="fw-700 text-success" style="font-size: 18px; margin-bottom: 8px;">Mantap!</p>
                            <p class="text-sm">Senang mendengarnya! Bantu kami makin dikenal ya dengan post ulasan di Google Maps?</p>
                        </div>
                        <button class="btn btn-wa btn-block py-16" id="btn-post-google-maps" style="font-size: 16px; font-weight: 700;">
                            <i class="fab fa-google"></i> POST DI GOOGLE MAPS
                        </button>
                        <p class="text-xs text-muted mt-md" style="cursor: pointer;" onclick="document.getElementById('feedback-success-msg').style.display='block'; document.getElementById('positive-feedback').style.display='none';">Lain kali saja</p>
                    </div>
                </div>

                <div id="feedback-success-msg" style="display: none; padding: 20px;">
                    <i class="fas fa-heart text-danger" style="font-size: 40px; margin-bottom: 16px;"></i>
                    <h3>Terima Kasih!</h3>
                    <p class="text-muted">Masukan Anda sudah kami terima. 🙏</p>
                </div>
            </div>
        </div>
    `;

    const stars = container.querySelectorAll('.star-btn');
    const form = container.querySelector('#feedback-form');
    const negView = container.querySelector('#negative-feedback');
    const posView = container.querySelector('#positive-feedback');
    const submitBtn = container.querySelector('#submit-internal-feedback');
    const commentBox = container.querySelector('#feedback-comment');
    const gMapsBtn = container.querySelector('#btn-post-google-maps');
    const successMsg = container.querySelector('#feedback-success-msg');

    let selectedRating = 0;

    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            
            // Highlight stars
            stars.forEach(s => {
                const val = parseInt(s.dataset.value);
                if (val <= selectedRating) {
                    s.classList.replace('far', 'fas');
                } else {
                    s.classList.replace('fas', 'far');
                }
            });

            // Show appropriate section
            form.style.display = 'block';
            if (selectedRating >= 4) {
                posView.style.display = 'block';
                negView.style.display = 'none';
            } else {
                negView.style.display = 'block';
                posView.style.display = 'none';
            }
        });
    });

    submitBtn.addEventListener('click', async () => {
        const comment = commentBox.value;
        const feedbackData = {
            id: 'FDB-' + Date.now(),
            appointmentId: apptId,
            shopId: shopId,
            rating: selectedRating,
            comment: comment,
            date: new Date().toISOString().split('T')[0]
        };

        // Save internal
        storage.add('feedbacks', feedbackData);
        
        negView.style.display = 'none';
        successMsg.style.display = 'block';
        showToast('Terima kasih atas masukannya!', 'success');
    });

    gMapsBtn.addEventListener('click', () => {
        // Save positive internally too for stats
        storage.add('feedbacks', {
            id: 'FDB-' + Date.now(),
            appointmentId: apptId,
            shopId: shopId,
            rating: selectedRating,
            comment: 'Positive rating - Redirected to Google Maps',
            date: new Date().toISOString().split('T')[0]
        });

        const mapsLink = settings.googleReviewLink || 'https://maps.google.com';
        window.open(mapsLink, '_blank');
        
        posView.style.display = 'none';
        successMsg.style.display = 'block';
    });
}
