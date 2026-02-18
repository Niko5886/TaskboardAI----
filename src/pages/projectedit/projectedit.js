import pageTemplate from './projectedit.html?raw';
import './projectedit.css';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';
import { showToast } from '../../utils/toast.js';

let currentProjectId = null;

export function renderProjectEditPage() {
  return `<div class="page-project-edit">${pageTemplate}</div>`;
}

export async function setupProjectEditPage(projectId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  currentProjectId = projectId;
  await loadProject();
  setupForm();
}

async function loadProject() {
  const loadingEl = document.getElementById('project-loading');
  const loadErrorEl = document.getElementById('load-error');
  const loadErrorMessage = document.getElementById('load-error-message');
  const formContainer = document.getElementById('form-container');

  // Show loading
  loadingEl?.classList.remove('d-none');
  loadErrorEl?.classList.add('d-none');
  formContainer?.classList.add('d-none');

  try {
    const currentUser = getCurrentUser();
    const supabase = getSupabase();

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', currentProjectId)
      .eq('owner_id', currentUser.id)
      .single();

    loadingEl?.classList.add('d-none');

    if (error || !project) {
      console.error('Error loading project:', error);
      if (loadErrorMessage) {
        loadErrorMessage.textContent = 'Project not found or you do not have permission to edit it.';
      }
      loadErrorEl?.classList.remove('d-none');
      return;
    }

    // Populate form
    const titleInput = document.getElementById('project-title');
    const descriptionInput = document.getElementById('project-description');

    if (titleInput) titleInput.value = project.title;
    if (descriptionInput) descriptionInput.value = project.description || '';

    formContainer?.classList.remove('d-none');

  } catch (error) {
    console.error('Error:', error);
    loadingEl?.classList.add('d-none');
    if (loadErrorMessage) {
      loadErrorMessage.textContent = 'An unexpected error occurred.';
    }
    loadErrorEl?.classList.remove('d-none');
  }
}

function setupForm() {
  const form = document.getElementById('edit-project-form');
  const submitBtn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('form-error');
  const errorMessage = document.getElementById('form-error-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('project-title')?.value.trim();
    const description = document.getElementById('project-description')?.value.trim();

    if (!title) {
      showError('Project title is required');
      return;
    }

    // Disable form
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    errorEl?.classList.add('d-none');

    try {
      const supabase = getSupabase();

      // Update project
      const { error } = await supabase
        .from('projects')
        .update({
          title: title,
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProjectId);

      if (error) {
        console.error('Error updating project:', error);
        showError('Failed to update project. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save Changes';
        return;
      }

      // Show toast and redirect
      showToast('Project updated successfully', 'success', 3000);
      setTimeout(() => {
        window.location.href = '/projects';
      }, 500);

    } catch (error) {
      console.error('Error:', error);
      showError('An unexpected error occurred.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save Changes';
    }
  });

  function showError(message) {
    if (errorMessage) errorMessage.textContent = message;
    errorEl?.classList.remove('d-none');
  }
}
