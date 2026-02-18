import pageTemplate from './project.html?raw';
import './project.css';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';

let currentProjectId = null;

export function renderProjectPage() {
  return `<div class="page-project">${pageTemplate}</div>`;
}

export async function setupProjectPage(projectId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  currentProjectId = projectId;

  const loadingSpinner = document.querySelector('#project-loading');
  const errorContainer = document.querySelector('#project-error');
  const taskboardContainer = document.querySelector('#taskboard');

  // Show loading state
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (errorContainer) errorContainer.style.display = 'none';
  if (taskboardContainer) taskboardContainer.style.display = 'none';

  try {
    const supabase = getSupabase();

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', currentUser.id)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      showError('Project not found or you do not have access to it.');
      return;
    }

    // Update project header
    updateProjectHeader(project);

    // Fetch project stages
    const { data: stages, error: stagesError } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (stagesError) {
      console.error('Error fetching stages:', stagesError);
      showError('Failed to load project stages.');
      return;
    }

    // Fetch tasks for this project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      showError('Failed to load tasks.');
      return;
    }

    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (taskboardContainer) taskboardContainer.style.display = 'block';

    // Update project info table with stats
    updateProjectInfoTable(project, stages, tasks);

    // Render taskboard
    renderTaskboard(stages, tasks);
    setupAddTaskButton();

  } catch (error) {
    console.error('Error:', error);
    showError('An unexpected error occurred.');
  }
}

function updateProjectHeader(project) {
  const titleEl = document.querySelector('#project-title');
  const descriptionEl = document.querySelector('#project-description');
  const breadcrumbEl = document.querySelector('#project-breadcrumb');

  if (titleEl) titleEl.textContent = project.title;
  if (descriptionEl) descriptionEl.textContent = project.description || 'No description';
  if (breadcrumbEl) breadcrumbEl.textContent = project.title;
}

function updateProjectInfoTable(project, stages, tasks) {
  const infoContainer = document.querySelector('#project-info-container');
  const infoTitle = document.querySelector('#info-title');
  const infoDescription = document.querySelector('#info-description');
  const infoOpenTasks = document.querySelector('#info-open-tasks');
  const infoDoneTasks = document.querySelector('#info-done-tasks');
  const infoStages = document.querySelector('#info-stages');

  if (infoTitle) infoTitle.textContent = project.title;
  if (infoDescription) infoDescription.textContent = project.description || '-';
  
  const openTasksCount = tasks.filter(t => !t.done).length;
  const doneTasksCount = tasks.filter(t => t.done).length;
  const stagesCount = stages.length;

  if (infoOpenTasks) infoOpenTasks.innerHTML = `<span class="badge bg-warning text-dark">${openTasksCount}</span>`;
  if (infoDoneTasks) infoDoneTasks.innerHTML = `<span class="badge bg-success">${doneTasksCount}</span>`;
  if (infoStages) infoStages.innerHTML = `<span class="badge bg-info">${stagesCount}</span>`;

  if (infoContainer) infoContainer.style.display = 'block';
}

function renderTaskboard(stages, tasks) {
  const columnsContainer = document.querySelector('#taskboard-columns');
  if (!columnsContainer) return;

  const columnsHtml = stages.map(stage => {
    const stageTasks = tasks.filter(task => task.stage_id === stage.id);
    
    return `
      <div class="taskboard-column" data-stage-id="${stage.id}">
        <div class="column-header">
          <h4 class="column-title">${escapeHtml(stage.title)}</h4>
          <span class="task-count badge bg-secondary">${stageTasks.length}</span>
        </div>
        <div class="column-tasks" data-stage-id="${stage.id}">
          ${stageTasks.map(task => renderTaskCard(task)).join('')}
        </div>
      </div>
    `;
  }).join('');

  columnsContainer.innerHTML = columnsHtml;
}

function renderTaskCard(task) {
  const doneClass = task.done ? 'task-done' : '';
  const doneIcon = task.done ? '<i class="bi bi-check-circle-fill text-success me-2"></i>' : '';
  
  return `
    <div class="task-card ${doneClass}" data-task-id="${task.id}">
      <div class="task-header">
        ${doneIcon}<span class="task-title">${escapeHtml(task.title)}</span>
      </div>
      ${task.description_html ? `<div class="task-description">${task.description_html}</div>` : ''}
    </div>
  `;
}

function setupAddTaskButton() {
  const addTaskBtn = document.querySelector('#add-task-btn');
  
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      // TODO: Implement add task functionality
      alert('Add task functionality coming soon!');
    });
  }
}

function showError(message) {
  const loadingSpinner = document.querySelector('#project-loading');
  const errorContainer = document.querySelector('#project-error');
  const taskboardContainer = document.querySelector('#taskboard');
  const errorMessage = document.querySelector('#error-message');

  if (loadingSpinner) loadingSpinner.style.display = 'none';
  if (taskboardContainer) taskboardContainer.style.display = 'none';
  if (errorContainer) errorContainer.style.display = 'block';
  if (errorMessage) errorMessage.textContent = message;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
