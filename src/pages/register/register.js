/**
 * Register Page Component
 */

import registerTemplate from './register.html?raw';
import './register.css';
import { registerUser } from '../../utils/auth.js';

export function renderRegisterPage() {
  return `<div class="page-register">${registerTemplate}</div>`;
}

export async function setupRegisterPage() {
  const form = document.querySelector('#register-form');
  const emailInput = document.querySelector('#register-email');
  const passwordInput = document.querySelector('#register-password');
  const confirmPasswordInput = document.querySelector('#register-confirm-password');
  const errorDiv = document.querySelector('#register-error');
  const loadingSpinner = document.querySelector('#register-loading');
  const submitBtn = document.querySelector('#register-submit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!email || !password || !confirmPassword) {
      showError('Please fill in all fields', errorDiv);
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters', errorDiv);
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match', errorDiv);
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    loadingSpinner.style.display = 'inline-block';
    errorDiv.style.display = 'none';

    const result = await registerUser(email, password);

    if (result.success) {
      // Show success message
      errorDiv.innerHTML = '<strong>Success!</strong> Check your email to confirm your account, then <a href="/login" data-navigo>login here</a>.';
      errorDiv.classList.remove('alert-danger');
      errorDiv.classList.add('alert-success');
      errorDiv.style.display = 'block';
      form.reset();
      submitBtn.disabled = false;
      loadingSpinner.style.display = 'none';
    } else {
      showError(result.error, errorDiv);
      submitBtn.disabled = false;
      loadingSpinner.style.display = 'none';
    }
  });
}

function showError(message, errorDiv) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('alert-success');
  errorDiv.classList.add('alert-danger');
  errorDiv.style.display = 'block';
}
