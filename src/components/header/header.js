import headerTemplate from './header.html?raw';
import './header.css';

export function renderHeader() {
  return headerTemplate;
}

export function setupHeader() {
  const openCollapse = document.querySelector('.navbar-collapse.show');

  if (openCollapse) {
    openCollapse.classList.remove('show');
  }
}
