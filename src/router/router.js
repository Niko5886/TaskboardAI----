import Navigo from 'navigo';
import { routes } from './routes.js';

export function initRouter({ renderApp }) {
  const router = new Navigo('/');

  routes.forEach((route) => {
    router.on(route.path, () => {
      document.title = route.title;
      renderApp(route.render());
      setActiveNavLink(window.location.pathname);
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
