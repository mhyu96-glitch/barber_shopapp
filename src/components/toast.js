// ========================================
// Toast Notification Component
// ========================================

const ICONS = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
};

export function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <i class="fas ${ICONS[type] || ICONS.info} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close-btn" onclick="this.closest('.toast').remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
