import Navigo from 'navigo';
import { routes } from './routes.js';
import { initAuth } from '../utils/auth.js';

export async function initRouter({ renderApp }) {
  // Initialize authentication
  await initAuth();

  const router = new Navigo('/');

  routes.forEach((route) => {
    router.on(route.path, async (match) => {
      document.title = route.title;
      renderApp(route.render());
      setActiveNavLink(window.location.pathname);
      
      // Call setup function if provided
      if (route.setup) {
        // Pass parameters to setup function if it's a dynamic route
        if (route.isDynamic && match && match.data) {
          route.setup(match.data.id);
        } else {
          route.setup();
        }
      }
      
      router.updatePageLinks();
    });
  });

  router.notFound(() => {
    router.navigate('/');
  });

  router.resolve();
}

function setActiveNavLink(pathname) {
  const links = document.querySelectorAll('[data-nav-link]');

  links.forEach((link) => {
    const linkPath = link.getAttribute('href');
    const isActive = linkPath === pathname;

    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}
