import pageTemplate from './projectadd.html?raw';
import './projectadd.css';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';

export function renderProjectAddPage() {
  return `<div class="page-project-add">${pageTemplate}</div>`;
}

export async function setupProjectAddPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  setupForm();
}

function setupForm() {
  const form = document.getElementById('add-project-form');
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
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
    errorEl?.classList.add('d-none');

    try {
      const currentUser = getCurrentUser();
      const supabase = getSupabase();

      // Insert project
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            owner_id: currentUser.id,
            title: title,
            description: description || null
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        showError('Failed to create project. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Create Project';
        return;
      }

      // Create default stages for the new project
      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert([
          { project_id: data.id, title: 'Not Started', position: 1 },
          { project_id: data.id, title: 'In Progress', position: 2 },
          { project_id: data.id, title: 'Done', position: 3 }
        ]);

      if (stagesError) {
        console.error('Error creating default stages:', stagesError);
      }

      // Redirect to projects list
      window.location.href = '/projects';

    } catch (error) {
      console.error('Error:', error);
      showError('An unexpected error occurred.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Create Project';
    }
  });

  function showError(message) {
    if (errorMessage) errorMessage.textContent = message;
    errorEl?.classList.remove('d-none');
  }
}
