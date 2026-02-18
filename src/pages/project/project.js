import pageTemplate from './project.html?raw';
import './project.css';
import { Modal } from 'bootstrap';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';
import { showToast } from '../../utils/toast.js';

let currentProjectId = null;
let currentProject = null;
let currentStages = [];
let currentTasks = [];
let taskModalInstance = null;
let deleteTaskModalInstance = null;
let pendingDeleteTaskId = null;
let isTaskSubmitting = false;

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
  pendingDeleteTaskId = null;
  taskModalInstance = null;
  deleteTaskModalInstance = null;

  const loadingSpinner = document.querySelector('#project-loading');
  const errorContainer = document.querySelector('#project-error');
  const taskboardContainer = document.querySelector('#taskboard');

  // Show loading state
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (errorContainer) errorContainer.style.display = 'none';
  if (taskboardContainer) taskboardContainer.style.display = 'none';

  try {
    await loadProjectData();

    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (taskboardContainer) taskboardContainer.style.display = 'block';

    updateProjectHeader(currentProject);
    updateProjectInfoTable(currentProject, currentStages, currentTasks);
    renderTaskboard(currentStages, currentTasks);
    setupTaskboardEvents();
    setupTaskModals();

  } catch (error) {
    console.error('Error:', error);
    showError('An unexpected error occurred.');
  }
}

async function loadProjectData() {
  const supabase = getSupabase();
  const currentUser = getCurrentUser();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', currentProjectId)
    .eq('owner_id', currentUser.id)
    .single();

  if (projectError || !project) {
    console.error('Error fetching project:', projectError);
    showError('Project not found or you do not have access to it.');
    throw new Error('Project not found');
  }

  const { data: stages, error: stagesError } = await supabase
    .from('project_stages')
    .select('*')
    .eq('project_id', currentProjectId)
    .order('position', { ascending: true });

  if (stagesError) {
    console.error('Error fetching stages:', stagesError);
    showError('Failed to load project stages.');
    throw stagesError;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', currentProjectId)
    .order('position', { ascending: true });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
    showError('Failed to load tasks.');
    throw tasksError;
  }

  currentProject = project;
  currentStages = stages || [];
  currentTasks = tasks || [];
}

async function refreshTaskboardData() {
  const supabase = getSupabase();
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', currentProjectId)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  currentTasks = tasks || [];
  updateProjectInfoTable(currentProject, currentStages, currentTasks);
  renderTaskboard(currentStages, currentTasks);
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
          <button type="button" class="btn column-add-task-btn add-task-column-btn" data-stage-id="${stage.id}">
            <i class="bi bi-plus-lg fs-2 d-block mb-1"></i>
            <span>Add New Task</span>
          </button>
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
      <div class="task-actions">
        <button type="button" class="task-action-btn edit-btn" data-action="edit-task" data-task-id="${task.id}" aria-label="Edit task" title="Edit">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button type="button" class="task-action-btn delete-btn" data-action="delete-task" data-task-id="${task.id}" aria-label="Delete task" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `;
}

function setupTaskboardEvents() {
  const columnsContainer = document.querySelector('#taskboard-columns');
  if (!columnsContainer) return;

  columnsContainer.onclick = (event) => {
    const addTaskBtn = event.target.closest('.add-task-column-btn');
    if (addTaskBtn) {
      openTaskModal({ mode: 'add', stageId: addTaskBtn.dataset.stageId });
      return;
    }

    const actionBtn = event.target.closest('[data-action]');
    if (actionBtn) {
      const taskId = actionBtn.dataset.taskId;
      const task = currentTasks.find(item => String(item.id) === String(taskId));
      if (!task) return;

      if (actionBtn.dataset.action === 'edit-task') {
        openTaskModal({ mode: 'edit', task });
      }

      if (actionBtn.dataset.action === 'delete-task') {
        openDeleteTaskModal(task);
      }
      return;
    }

    const taskCard = event.target.closest('.task-card');
    if (taskCard) {
      const taskId = taskCard.dataset.taskId;
      const task = currentTasks.find(item => String(item.id) === String(taskId));
      if (task) {
        openTaskModal({ mode: 'edit', task });
      }
    }
  };
}

function setupTaskModals() {
  const taskModalEl = document.querySelector('#task-modal');
  const deleteModalEl = document.querySelector('#delete-task-modal');
  const taskForm = document.querySelector('#task-form');
  const confirmDeleteBtn = document.querySelector('#confirm-delete-task-btn');

  if (taskModalEl && !taskModalInstance) {
    taskModalInstance = new Modal(taskModalEl);
  }

  if (deleteModalEl && !deleteTaskModalInstance) {
    deleteTaskModalInstance = new Modal(deleteModalEl);
  }

  if (taskForm) {
    // Remove any previous listeners to prevent duplicate handlers
    const newForm = taskForm.cloneNode(true);
    taskForm.parentNode.replaceChild(newForm, taskForm);
    
    const updatedForm = document.querySelector('#task-form');
    if (updatedForm) {
      updatedForm.addEventListener('submit', handleTaskFormSubmit);
    }
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
  }
}

async function handleTaskFormSubmit(event) {
  event.preventDefault();

  if (isTaskSubmitting) {
    return;
  }

  const mode = document.querySelector('#task-form-mode')?.value || 'add';
  const taskId = document.querySelector('#task-form-task-id')?.value;
  const stageId = document.querySelector('#task-form-stage-id')?.value;
  const title = document.querySelector('#task-title-input')?.value.trim();
  const description = document.querySelector('#task-description-input')?.value.trim() || '';
  const submitBtn = document.querySelector('#task-form-submit-btn');

  if (!title) {
    showToast('Task title is required.', 'warning');
    return;
  }

  try {
    isTaskSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    if (mode === 'add') {
      await addTask(stageId, title, description);
      showToast('Task added successfully.', 'success');
    } else {
      await editTask(taskId, title, description);
      showToast('Task updated successfully.', 'success');
    }

    if (taskModalInstance) {
      taskModalInstance.hide();
    }

    await refreshTaskboardData();
  } catch (error) {
    console.error('Task save failed:', error);
    showToast('Failed to save task.', 'error');
  } finally {
    isTaskSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }
}

async function handleDeleteConfirm() {
  if (!pendingDeleteTaskId) return;

  try {
    await deleteTask(pendingDeleteTaskId);
    pendingDeleteTaskId = null;

    if (deleteTaskModalInstance) {
      deleteTaskModalInstance.hide();
    }

    await refreshTaskboardData();
    showToast('Task deleted successfully.', 'success');
  } catch (error) {
    console.error('Task delete failed:', error);
    showToast('Failed to delete task.', 'error');
  }
}

function openTaskModal({ mode, stageId = '', task = null }) {
  const modalTitle = document.querySelector('#task-modal-title');
  const submitBtn = document.querySelector('#task-form-submit-btn');
  const modeInput = document.querySelector('#task-form-mode');
  const taskIdInput = document.querySelector('#task-form-task-id');
  const stageIdInput = document.querySelector('#task-form-stage-id');
  const titleInput = document.querySelector('#task-title-input');
  const descriptionInput = document.querySelector('#task-description-input');

  if (!modeInput || !taskIdInput || !stageIdInput || !titleInput || !descriptionInput || !taskModalInstance) {
    return;
  }

  if (mode === 'add') {
    modeInput.value = 'add';
    taskIdInput.value = '';
    stageIdInput.value = stageId;
    titleInput.value = '';
    descriptionInput.value = '';
    if (modalTitle) modalTitle.textContent = 'Add New Task';
    if (submitBtn) submitBtn.textContent = 'Add Task';
  } else if (task) {
    modeInput.value = 'edit';
    taskIdInput.value = task.id;
    stageIdInput.value = task.stage_id;
    titleInput.value = task.title || '';
    descriptionInput.value = htmlToText(task.description_html || '');
    if (modalTitle) modalTitle.textContent = 'Edit Task';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
  }

  taskModalInstance.show();
}

function openDeleteTaskModal(task) {
  const messageEl = document.querySelector('#delete-task-message');
  if (messageEl) {
    messageEl.innerHTML = `Are you sure you want to delete <strong>${escapeHtml(task.title)}</strong>?`;
  }

  pendingDeleteTaskId = task.id;
  if (deleteTaskModalInstance) {
    deleteTaskModalInstance.show();
  }
}

async function addTask(stageId, title, description) {
  const supabase = getSupabase();
  const nextPosition = getNextPositionForStage(stageId);

  const { error } = await supabase
    .from('tasks')
    .insert({
      project_id: currentProjectId,
      stage_id: stageId,
      title,
      description_html: textToHtml(description),
      position: nextPosition,
      done: isDoneStage(stageId)
    });

  if (error) {
    throw error;
  }
}

async function editTask(taskId, title, description) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      description_html: textToHtml(description),
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('project_id', currentProjectId);

  if (error) {
    throw error;
  }
}

async function deleteTask(taskId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('project_id', currentProjectId);

  if (error) {
    throw error;
  }
}

function textToHtml(text) {
  const safeText = escapeHtml(text || '');
  if (!safeText.trim()) {
    return '';
  }

  return `<p>${safeText.replace(/\n/g, '<br>')}</p>`;
}

function htmlToText(html) {
  if (!html) return '';

  const withLineBreaks = html.replace(/<br\s*\/?\s*>/gi, '\n');
  const temp = document.createElement('div');
  temp.innerHTML = withLineBreaks;
  return temp.textContent || temp.innerText || '';
}

function getNextPositionForStage(stageId) {
  const stageTasks = currentTasks
    .filter(task => String(task.stage_id) === String(stageId))
    .map(task => Number(task.position) || 0);

  if (!stageTasks.length) {
    return 1;
  }

  return Math.max(...stageTasks) + 1;
}

function isDoneStage(stageId) {
  const stage = currentStages.find(item => String(item.id) === String(stageId));
  if (!stage) return false;
  return /done/i.test(stage.title || '');
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
