/**
 * Login Page Component
 */

import loginTemplate from './login.html?raw';
import './login.css';
import { loginUser } from '../../utils/auth.js';

export function renderLoginPage() {
  return `<div class="page-login">${loginTemplate}</div>`;
}

export async function setupLoginPage() {
  const form = document.querySelector('#login-form');
  const emailInput = document.querySelector('#login-email');
  const passwordInput = document.querySelector('#login-password');
  const errorDiv = document.querySelector('#login-error');
  const loadingSpinner = document.querySelector('#login-loading');
  const submitBtn = document.querySelector('#login-submit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please fill in all fields', errorDiv);
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    loadingSpinner.style.display = 'inline-block';
    errorDiv.style.display = 'none';

    const result = await loginUser(email, password);

    if (result.success) {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      showError(result.error, errorDiv);
      submitBtn.disabled = false;
      loadingSpinner.style.display = 'none';
    }
  });
}

function showError(message, errorDiv) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}
