// ========================================
// Modal Component
// ========================================

export function openModal(title, bodyHTML, footerHTML = '', options = {}) {
    closeModal(); // close any existing

    const maxWidth = options.maxWidth || '560px';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';
    overlay.innerHTML = `
    <div class="modal" style="max-width: ${maxWidth}">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="document.getElementById('active-modal').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>
  `;

    document.getElementById('modal-root').appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Close on Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    return overlay;
}

export function closeModal() {
    const modal = document.getElementById('active-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 200);
    }
}

export function confirmDialog(message, onConfirm, title = 'Konfirmasi') {
    const body = `<p style="color: var(--text-secondary); font-size: 15px;">${message}</p>`;
    const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('active-modal').remove()">Batal</button>
    <button class="btn btn-danger" id="confirm-btn">Hapus</button>
  `;

    const modal = openModal(title, body, footer);
    modal.querySelector('#confirm-btn').addEventListener('click', () => {
        closeModal();
        onConfirm();
    });
}
