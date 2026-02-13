import headerTemplate from './header.html?raw';
import './header.css';
import { isAuthenticated, onAuthChange, logoutUser, getCurrentUser } from '../../utils/auth.js';

export function renderHeader() {
  return headerTemplate;
}

export function setupHeader() {
  const openCollapse = document.querySelector('.navbar-collapse.show');

  if (openCollapse) {
    openCollapse.classList.remove('show');
  }

  setupAuthLinks();
}

/**
 * Setup authentication links in header dynamically
 */
function setupAuthLinks() {
  const navList = document.querySelector('.navbar-nav');
  if (!navList) return;

  // Listen for auth changes
  onAuthChange((user) => {
    const authLinksContainer = document.querySelector('#auth-links');
    
    if (user) {
      // User is logged in
      if (!authLinksContainer) {
        const newContainer = document.createElement('li');
        newContainer.id = 'auth-links';
        newContainer.className = 'nav-item dropdown';
        newContainer.innerHTML = `
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle me-2"></i>
            ${user.email}
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="/dashboard" data-navigo>Dashboard</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logout-btn">
              <i class="bi bi-box-arrow-right me-2"></i>Logout
            </a></li>
          </ul>
        `;
        navList.appendChild(newContainer);
        setupLogoutButton();
      }
    } else {
      // User is logged out
      const authLinksContainer = document.querySelector('#auth-links');
      if (authLinksContainer) {
        authLinksContainer.remove();
      }

      // Add login/register links
      if (!document.querySelector('#login-link')) {
        const loginContainer = document.createElement('li');
        loginContainer.className = 'nav-item ms-2';
        loginContainer.innerHTML = `
          <a id="login-link" class="btn btn-sm btn-outline-primary" href="/login" data-navigo>Login</a>
        `;
        navList.appendChild(loginContainer);
      }
    }
  });

  // Initial setup
  if (isAuthenticated()) {
    const user = getCurrentUser();
    if (user) {
      const container = document.createElement('li');
      container.id = 'auth-links';
      container.className = 'nav-item dropdown';
      container.innerHTML = `
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle me-2"></i>
          ${user.email}
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="/dashboard" data-navigo>Dashboard</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" id="logout-btn">
            <i class="bi bi-box-arrow-right me-2"></i>Logout
          </a></li>
        </ul>
      `;
      navList.appendChild(container);
      setupLogoutButton();
    }
  } else {
    const loginContainer = document.createElement('li');
    loginContainer.className = 'nav-item ms-2';
    loginContainer.innerHTML = `
      <a id="login-link" class="btn btn-sm btn-outline-primary" href="/login" data-navigo>Login</a>
    `;
    navList.appendChild(loginContainer);
  }
}

/**
 * Setup logout button click handler
 */
function setupLogoutButton() {
  const logoutBtn = document.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await logoutUser();
      window.location.href = '/';
    });
  }
}
