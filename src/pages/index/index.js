import pageTemplate from './index.html?raw';
import './index.css';

export function renderIndexPage() {
  return `<div class="page-home">${pageTemplate}</div>`;
}
