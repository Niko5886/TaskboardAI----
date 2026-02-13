import pageTemplate from './notfound.html?raw';
import './notfound.css';

export function renderNotFoundPage() {
  return `<div class="page-notfound">${pageTemplate}</div>`;
}
