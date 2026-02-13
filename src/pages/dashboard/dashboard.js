import pageTemplate from './dashboard.html?raw';
import './dashboard.css';

export function renderDashboardPage() {
  return `<div class="page-dashboard">${pageTemplate}</div>`;
}
