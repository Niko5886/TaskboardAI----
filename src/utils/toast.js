/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'success', 'error', 'info', 'warning' (default: 'info')
 * @param {number} duration - How long to show the toast in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    console.error('Toast container not found');
    return;
  }

  // Determine Bootstrap class and icon
  let bgClass = 'bg-info';
  let icon = 'info-circle';
  
  switch (type) {
    case 'success':
      bgClass = 'bg-success';
      icon = 'check-circle';
      break;
    case 'error':
      bgClass = 'bg-danger';
      icon = 'exclamation-circle';
      break;
    case 'warning':
      bgClass = 'bg-warning';
      icon = 'exclamation-triangle';
      break;
  }

  // Create toast element
  const toastId = 'toast-' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center border-0 ${bgClass} text-white" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${icon} me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  // Add toast to container
  toastContainer.insertAdjacentHTML('beforeend', toastHtml);

  // Initialize and show Bootstrap toast
  const toastEl = document.getElementById(toastId);
  const bsToast = new (window.bootstrap || {}).Toast(toastEl, { autohide: true, delay: duration });
  bsToast.show();

  // Remove from DOM after hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}
