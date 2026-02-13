import pageTemplate from './dashboard.html?raw';
import './dashboard.css';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';

export function renderDashboardPage() {
  return `<div class="page-dashboard">${pageTemplate}</div>`;
}

export async function setupDashboardPage() {
  const currentUser = getCurrentUser();
  const projectsContainer = document.querySelector('#projects-grid');
  const noprojectsMsg = document.querySelector('#no-projects-msg');
  const loadingSpinner = document.querySelector('#projects-loading');

  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  // Show loading state
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (projectsContainer) projectsContainer.innerHTML = '';

  try {
    const supabase = getSupabase();
    
    // Fetch user's projects (owned by user)
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', currentUser.id);

    if (error) {
      console.error('Error fetching projects:', error);
      if (loadingSpinner) loadingSpinner.style.display = 'none';
      if (noprojectsMsg) noprojectsMsg.innerHTML = '<div class="alert alert-danger">Error loading projects. Please try again.</div>';
      return;
    }

    // Fetch user's tasks across all their projects
    const projectIds = projects?.map(p => p.id) || [];
    let tasks = [];
    
    if (projectIds.length > 0) {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else {
        tasks = tasksData || [];
      }
    }

    if (loadingSpinner) loadingSpinner.style.display = 'none';

    // Update statistics
    updateStatistics(projects?.length || 0, tasks);

    if (!projects || projects.length === 0) {
      if (projectsContainer) projectsContainer.innerHTML = '';
      if (noprojectsMsg) noprojectsMsg.style.display = 'block';
      setupCreateProjectButton();
      return;
    }

    // Hide no projects message
    if (noprojectsMsg) noprojectsMsg.style.display = 'none';

    // Fetch task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);
        
        return { ...project, taskCount: count || 0 };
      })
    );

    // Render projects
    const projectsHtml = projectsWithCounts.map(project => `
      <div class="col-md-6 col-lg-4">
        <div class="card project-card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${escapeHtml(project.title)}</h5>
            <p class="card-text text-muted small">${escapeHtml(project.description || 'No description')}</p>
            <div class="mt-2">
              <span class="badge bg-secondary">${project.taskCount} tasks</span>
            </div>
          </div>
          <div class="card-footer bg-transparent">
            <a href="/projects/${project.id}" class="btn btn-sm btn-primary" data-navigo>
              <i class="bi bi-arrow-right"></i> Open Project
            </a>
          </div>
        </div>
      </div>
    `).join('');

    if (projectsContainer) projectsContainer.innerHTML = projectsHtml;
    setupCreateProjectButton();

  } catch (error) {
    console.error('Error:', error);
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (noprojectsMsg) noprojectsMsg.innerHTML = '<div class="alert alert-danger">An error occurred. Please try again.</div>';
  }
}

function updateStatistics(projectCount, tasks) {
  const totalProjectsEl = document.querySelector('#total-projects');
  const totalTasksEl = document.querySelector('#total-tasks');
  const pendingTasksEl = document.querySelector('#pending-tasks');
  const doneTasksEl = document.querySelector('#done-tasks');

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done === true).length;
  const pendingTasks = totalTasks - doneTasks;

  if (totalProjectsEl) totalProjectsEl.textContent = projectCount;
  if (totalTasksEl) totalTasksEl.textContent = totalTasks;
  if (pendingTasksEl) pendingTasksEl.textContent = pendingTasks;
  if (doneTasksEl) doneTasksEl.textContent = doneTasks;
}

function setupCreateProjectButton() {
  const createBtns = document.querySelectorAll('#create-project-btn, #create-project-btn-2');
  
  createBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // TODO: Implement create project functionality
      alert('Create project functionality coming soon!');
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
