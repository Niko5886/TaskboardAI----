import pageTemplate from './projects.html?raw';
import './projects.css';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';
import { showToast } from '../../utils/toast.js';
import { Modal } from 'bootstrap';

let deleteModal = null;
let projectToDelete = null;

export function renderProjectsPage() {
  return `<div class="page-projects">${pageTemplate}</div>`;
}

export async function setupProjectsPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  // Initialize delete modal
  const deleteModalEl = document.getElementById('deleteModal');
  if (deleteModalEl) {
    deleteModal = new Modal(deleteModalEl);
  }

  await loadProjects();
  setupDeleteConfirmation();
}

async function loadProjects() {
  const loadingEl = document.getElementById('projects-loading');
  const errorEl = document.getElementById('projects-error');
  const noProjectsEl = document.getElementById('no-projects');
  const tableContainer = document.getElementById('projects-table-container');
  const tbody = document.getElementById('projects-tbody');

  // Show loading
  loadingEl?.classList.remove('d-none');
  errorEl?.classList.add('d-none');
  noProjectsEl?.classList.add('d-none');
  tableContainer?.classList.add('d-none');

  try {
    const currentUser = getCurrentUser();
    const supabase = getSupabase();

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    loadingEl?.classList.add('d-none');

    if (error) {
      console.error('Error fetching projects:', error);
      showError('Failed to load projects. Please try again.');
      return;
    }

    if (!projects || projects.length === 0) {
      noProjectsEl?.classList.remove('d-none');
      return;
    }

    // Render projects table
    tbody.innerHTML = projects
      .map(project => createProjectRow(project, project.owner_id === currentUser.id))
      .join('');
    tableContainer?.classList.remove('d-none');

    // Setup action buttons
    setupActionButtons();

  } catch (error) {
    console.error('Error:', error);
    loadingEl?.classList.add('d-none');
    showError('An unexpected error occurred.');
  }
}

function createProjectRow(project, isOwner) {
  const createdDate = new Date(project.created_at).toLocaleDateString();
  const updatedDate = new Date(project.updated_at).toLocaleDateString();
  const description = project.description || 'No description';
  const ownerActions = isOwner
    ? `
          <a href="/projects/edit/${project.id}" class="btn btn-sm btn-outline-secondary" data-navigo title="Edit">
            <i class="bi bi-pencil"></i>
          </a>
          <button class="btn btn-sm btn-outline-danger delete-project-btn" data-project-id="${project.id}" data-project-title="${escapeHtml(project.title)}" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
      `
    : '';

  return `
    <tr data-project-id="${project.id}">
      <td>
        <a href="/projects/${project.id}" data-navigo class="text-decoration-none">
          <strong class="text-primary">${escapeHtml(project.title)}</strong>
        </a>
      </td>
      <td class="text-muted">${escapeHtml(description)}</td>
      <td>${createdDate}</td>
      <td>${updatedDate}</td>
      <td class="text-end">
        <div class="btn-group" role="group">
          <a href="/projects/${project.id}" class="btn btn-sm btn-outline-primary" data-navigo title="View">
            <i class="bi bi-eye"></i>
          </a>
          ${ownerActions}
        </div>
      </td>
    </tr>
  `;
}

function setupActionButtons() {
  const deleteButtons = document.querySelectorAll('.delete-project-btn');
  
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const projectId = btn.dataset.projectId;
      const projectTitle = btn.dataset.projectTitle;
      showDeleteConfirmation(projectId, projectTitle);
    });
  });
}

function showDeleteConfirmation(projectId, projectTitle) {
  projectToDelete = projectId;
  const nameEl = document.getElementById('delete-project-name');
  if (nameEl) {
    nameEl.textContent = projectTitle;
  }
  deleteModal?.show();
}

function setupDeleteConfirmation() {
  const confirmBtn = document.getElementById('confirm-delete-btn');
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!projectToDelete) return;

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

      try {
        const supabase = getSupabase();

        // Delete project (cascading will delete related data)
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectToDelete);

        if (error) {
          console.error('Error deleting project:', error);
          showError('Failed to delete project. Please try again.');
          return;
        }

        deleteModal?.hide();
        showToast('Project deleted successfully', 'success', 3000);
      } catch (error) {
        console.error('Error:', error);
        showError('An unexpected error occurred.');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Delete Project';
        projectToDelete = null;
      }

      // Reload projects (outside try-catch so it uses its own error handling)
      await loadProjects();
    });
  }
}

function showError(message) {
  const errorEl = document.getElementById('projects-error');
  const errorMessage = document.getElementById('error-message');
  
  if (errorEl && errorMessage) {
    errorMessage.textContent = message;
    errorEl.classList.remove('d-none');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
