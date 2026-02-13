import { renderIndexPage } from '../pages/index/index.js';
import { renderDashboardPage, setupDashboardPage } from '../pages/dashboard/dashboard.js';
import { renderLoginPage, setupLoginPage } from '../pages/login/login.js';
import { renderRegisterPage, setupRegisterPage } from '../pages/register/register.js';
import { renderProjectPage, setupProjectPage } from '../pages/project/project.js';
import { renderNotFoundPage } from '../pages/notfound/notfound.js';

export const routes = [
  {
    path: '/',
    title: 'Taskboard | Home',
    render: renderIndexPage
  },
  {
    path: '/login',
    title: 'Taskboard | Login',
    render: renderLoginPage,
    setup: setupLoginPage
  },
  {
    path: '/register',
    title: 'Taskboard | Register',
    render: renderRegisterPage,
    setup: setupRegisterPage
  },
  {
    path: '/dashboard',
    title: 'Taskboard | Dashboard',
    render: renderDashboardPage,
    setup: setupDashboardPage
  },
  {
    path: '/projects/:id',
    title: 'Taskboard | Project',
    render: renderProjectPage,
    setup: setupProjectPage,
    isDynamic: true
  }
];

export const notFoundRoute = {
  path: '/404',
  title: 'Taskboard | 404 Not Found',
  render: renderNotFoundPage
};
