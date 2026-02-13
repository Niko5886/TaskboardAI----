import { renderIndexPage } from '../pages/index/index.js';
import { renderDashboardPage } from '../pages/dashboard/dashboard.js';

export const routes = [
  {
    path: '/',
    title: 'Taskboard | Home',
    render: renderIndexPage
  },
  {
    path: '/dashboard',
    title: 'Taskboard | Dashboard',
    render: renderDashboardPage
  }
];
