import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';

import { renderHeader, setupHeader } from './components/header/header.js';
import { renderFooter } from './components/footer/footer.js';
import { initRouter } from './router/router.js';
import './styles/app.css';

const appRoot = document.getElementById('app');

function renderApp(pageHtml) {
  appRoot.innerHTML = `
    <div class="app-shell d-flex flex-column min-vh-100">
      ${renderHeader()}
      <main id="page-container" class="flex-grow-1 py-4">
        ${pageHtml}
      </main>
      ${renderFooter()}
    </div>
  `;

  setupHeader();
}

initRouter({
  renderApp
});
