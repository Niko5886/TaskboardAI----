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
let draggingTaskId = null;
let isDraggingTask = false;
let suppressNextTaskClick = false;

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
    <div class="task-card ${doneClass}" data-task-id="${task.id}" draggable="true">
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
    if (suppressNextTaskClick || isDraggingTask) {
      suppressNextTaskClick = false;
      return;
    }

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

  columnsContainer.ondragstart = (event) => {
    const taskCard = event.target.closest('.task-card');
    if (!taskCard) return;

    draggingTaskId = taskCard.dataset.taskId;
    isDraggingTask = true;
    taskCard.classList.add('dragging');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggingTaskId || '');
    }
  };

  columnsContainer.ondragover = (event) => {
    const columnTasks = event.target.closest('.column-tasks');
    if (!columnTasks || !draggingTaskId) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    setDragOverColumn(columnTasks);
    const dropIndex = getDropIndex(columnTasks, event.clientY);
    placeDraggingCardPreview(columnTasks, dropIndex);
  };

  columnsContainer.ondragleave = (event) => {
    const columnTasks = event.target.closest('.column-tasks');
    if (!columnTasks) return;

    const relatedTarget = event.relatedTarget;
    if (relatedTarget && columnTasks.contains(relatedTarget)) {
      return;
    }

    columnTasks.classList.remove('drag-over');
  };

  columnsContainer.ondrop = async (event) => {
    const columnTasks = event.target.closest('.column-tasks');
    if (!columnTasks) return;

    event.preventDefault();

    const targetStageId = columnTasks.dataset.stageId;
    if (!targetStageId) {
      clearDragOverColumns();
      return;
    }

    if (!draggingTaskId && event.dataTransfer) {
      draggingTaskId = event.dataTransfer.getData('text/plain');
    }

    if (!draggingTaskId) {
      clearDragOverColumns();
      return;
    }

    const dropIndex = getDropIndex(columnTasks, event.clientY);

    try {
      await moveTaskByDragAndDrop(draggingTaskId, targetStageId, dropIndex);
      await refreshTaskboardData();
    } catch (error) {
      console.error('Task move failed:', error);
      showToast('Failed to move task.', 'error');
      await refreshTaskboardData();
    } finally {
      suppressNextTaskClick = true;
      setTimeout(() => {
        suppressNextTaskClick = false;
      }, 120);
      clearDragOverColumns();
    }
  };

  columnsContainer.ondragend = (event) => {
    const taskCard = event.target.closest('.task-card');
    if (taskCard) {
      taskCard.classList.remove('dragging');
    }

    clearDragOverColumns();
    draggingTaskId = null;
    setTimeout(() => {
      isDraggingTask = false;
    }, 0);
  };
}

function clearDragOverColumns() {
  document.querySelectorAll('.column-tasks.drag-over').forEach((column) => {
    column.classList.remove('drag-over');
  });
}

function setDragOverColumn(columnTasks) {
  document.querySelectorAll('.column-tasks.drag-over').forEach((column) => {
    if (column !== columnTasks) {
      column.classList.remove('drag-over');
    }
  });

  columnTasks.classList.add('drag-over');
}

function getDropIndex(columnTasks, clientY) {
  const cards = [...columnTasks.querySelectorAll('.task-card:not(.dragging)')];

  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    const rect = card.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    if (clientY < midPoint) {
      return index;
    }
  }

  return cards.length;
}

function placeDraggingCardPreview(columnTasks, dropIndex) {
  const draggingCard = document.querySelector('.task-card.dragging');
  if (!draggingCard) return;

  const cards = [...columnTasks.querySelectorAll('.task-card:not(.dragging)')];
  const addTaskButton = columnTasks.querySelector('.column-add-task-btn');
  const referenceNode = cards[dropIndex] || addTaskButton || null;

  if (referenceNode) {
    columnTasks.insertBefore(draggingCard, referenceNode);
  } else {
    columnTasks.appendChild(draggingCard);
  }
}

function getStageTasksSorted(stageId) {
  return currentTasks
    .filter(task => String(task.stage_id) === String(stageId))
    .sort((first, second) => (Number(first.position) || 0) - (Number(second.position) || 0));
}

function buildTaskPositionUpdates(taskId, targetStageId, targetIndex) {
  const movingTask = currentTasks.find(task => String(task.id) === String(taskId));
  if (!movingTask) {
    return [];
  }

  const sourceStageId = String(movingTask.stage_id);
  const destinationStageId = String(targetStageId);
  const sourceTasksWithoutMoved = getStageTasksSorted(sourceStageId)
    .filter(task => String(task.id) !== String(taskId));

  const destinationTasks = sourceStageId === destinationStageId
    ? sourceTasksWithoutMoved
    : getStageTasksSorted(destinationStageId);

  const safeIndex = Math.max(0, Math.min(targetIndex, destinationTasks.length));
  destinationTasks.splice(safeIndex, 0, {
    ...movingTask,
    stage_id: destinationStageId,
    done: isDoneStage(destinationStageId)
  });

  const updates = [];

  const collectUpdatesForStage = (stageId, tasksForStage) => {
    const doneValue = isDoneStage(stageId);

    tasksForStage.forEach((task, index) => {
      const nextPosition = index + 1;
      const stageChanged = String(task.stage_id) !== String(stageId);
      const positionChanged = Number(task.position) !== nextPosition;
      const doneChanged = Boolean(task.done) !== Boolean(doneValue);

      if (stageChanged || positionChanged || doneChanged) {
        updates.push({
          id: task.id,
          stage_id: stageId,
          position: nextPosition,
          done: doneValue
        });
      }
    });
  };

  if (sourceStageId === destinationStageId) {
    collectUpdatesForStage(destinationStageId, destinationTasks);
  } else {
    collectUpdatesForStage(sourceStageId, sourceTasksWithoutMoved);
    collectUpdatesForStage(destinationStageId, destinationTasks);
  }

  return updates;
}

async function persistTaskPositionUpdates(updates) {
  if (!updates.length) {
    return;
  }

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const operations = updates.map((taskUpdate) => (
    supabase
      .from('tasks')
      .update({
        stage_id: taskUpdate.stage_id,
        position: taskUpdate.position,
        done: taskUpdate.done,
        updated_at: now
      })
      .eq('id', taskUpdate.id)
      .eq('project_id', currentProjectId)
  ));

  const results = await Promise.all(operations);
  const failedResult = results.find(result => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }
}

async function moveTaskByDragAndDrop(taskId, targetStageId, targetIndex) {
  const updates = buildTaskPositionUpdates(taskId, targetStageId, targetIndex);

  if (!updates.length) {
    return;
  }

  await persistTaskPositionUpdates(updates);
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
  const statusValue = getTaskStatusValue();
  const done = statusValue === 'done';
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
      await addTask(stageId, title, description, done);
      showToast('Task added successfully.', 'success');
    } else {
      await editTask(taskId, title, description, done);
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
    setTaskStatusRadios(isDoneStage(stageId));
    if (modalTitle) modalTitle.textContent = 'Add New Task';
    if (submitBtn) submitBtn.textContent = 'Add Task';
  } else if (task) {
    modeInput.value = 'edit';
    taskIdInput.value = task.id;
    stageIdInput.value = task.stage_id;
    titleInput.value = task.title || '';
    descriptionInput.value = htmlToText(task.description_html || '');
    setTaskStatusRadios(Boolean(task.done));
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

async function addTask(stageId, title, description, done) {
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
      done
    });

  if (error) {
    throw error;
  }
}

async function editTask(taskId, title, description, done) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      description_html: textToHtml(description),
      done,
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

function getTaskStatusValue() {
  const checked = document.querySelector('input[name="task-status"]:checked');
  return checked?.value || 'open';
}

function setTaskStatusRadios(isDone) {
  const openRadio = document.querySelector('#task-status-open');
  const doneRadio = document.querySelector('#task-status-done');

  if (openRadio) openRadio.checked = !isDone;
  if (doneRadio) doneRadio.checked = isDone;
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
