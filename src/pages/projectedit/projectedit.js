import pageTemplate from './projectedit.html?raw';
import './projectedit.css';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';
import { showToast } from '../../utils/toast.js';

let currentProjectId = null;
let memberCandidates = []; // Array of {id, email}
let userIdToEmailMap = {}; // Map id -> email
let initialMemberIds = [];
const selectedMemberIds = new Set(); // Stores IDs

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
  await initializeMemberPicker();
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

      const syncedMembers = await syncProjectMembers();
      if (!syncedMembers) {
        showError('Project was saved, but members could not be updated. Please try again.');
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

async function initializeMemberPicker() {
  const memberSearchInput = document.getElementById('member-search');
  const memberSelect = document.getElementById('member-select');
  const addMemberBtn = document.getElementById('add-member-btn');
  const selectedMembersEl = document.getElementById('selected-members');

  if (!memberSearchInput || !memberSelect || !addMemberBtn || !selectedMembersEl) {
    return;
  }

  memberCandidates = await loadMemberCandidates();
  initialMemberIds = await loadCurrentProjectMembers();

  selectedMemberIds.clear();
  initialMemberIds.forEach((userId) => selectedMemberIds.add(userId));

  renderSelectedMembers();
  renderMemberOptions('');

  memberSearchInput.addEventListener('input', () => {
    renderMemberOptions(memberSearchInput.value.trim().toLowerCase());
  });

  addMemberBtn.addEventListener('click', () => {
    addMemberFromSelection();
  });

  memberSelect.addEventListener('dblclick', () => {
    addMemberFromSelection();
  });

  selectedMembersEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-user-id]');
    if (!button) return;

    const userId = button.getAttribute('data-remove-user-id');
    if (!userId) return;

    selectedMemberIds.delete(userId);
    renderSelectedMembers();
    renderMemberOptions(memberSearchInput.value.trim().toLowerCase());
  });
}

async function loadCurrentProjectMembers() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', currentProjectId);

  if (error) {
    console.error('Error loading current project members:', error);
    return [];
  }

  return (data || []).map((row) => row.user_id).filter(Boolean);
}

async function loadMemberCandidates() {
  const supabase = getSupabase();
  const currentUser = getCurrentUser();

  if (!currentUser) return [];

  // Call the database function to get all accessible project users
  const { data, error } = await supabase
    .rpc('get_all_project_users');

  if (error) {
    console.error('Error loading project users:', error);
    return [];
  }

  // Build the email map and filter out current user
  userIdToEmailMap = {};
  const candidates = [];

  (data || []).forEach((user) => {
    if (user.id !== currentUser.id) {
      userIdToEmailMap[user.id] = user.email;
      candidates.push(user);
    }
  });

  return candidates;  // Returns array of {id, email}
}

function addMemberFromSelection() {
  const memberSelect = document.getElementById('member-select');
  const memberSearchInput = document.getElementById('member-search');
  if (!memberSearchInput) return;

  let userIdToAdd = null;

  // Try selecting from dropdown first
  if (memberSelect && memberSelect.value) {
    userIdToAdd = memberSelect.value;
  }
  // Otherwise try to parse email from input and find it in candidates
  else {
    const emailText = memberSearchInput.value.trim();
    if (!emailText) {
      alert('Please select a user from the list or type to search');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailText)) {
      alert('Please enter a valid email address');
      return;
    }

    // Try to find this email in our candidates to get the UUID
    const candidate = memberCandidates.find((u) => u.email.toLowerCase() === emailText.toLowerCase());
    if (!candidate) {
      alert('User not found. Please type the full registered email address.');
      return;
    }
    
    userIdToAdd = candidate.id;
  }

  if (!userIdToAdd) return;

  if (selectedMemberIds.has(userIdToAdd)) {
    alert('This user is already selected');
    return;
  }

  selectedMemberIds.add(userIdToAdd);
  memberSearchInput.value = '';
  renderSelectedMembers();
  if (memberSelect) {
    renderMemberOptions('');
  }
}

function renderMemberOptions(filterText) {
  const memberSelect = document.getElementById('member-select');
  if (!memberSelect) return;

  const options = memberCandidates
    .filter((user) => !selectedMemberIds.has(user.id))
    .filter((user) => !filterText || user.email.toLowerCase().includes(filterText));

  if (options.length === 0) {
    memberSelect.innerHTML = '<option value="" disabled>No matching users found</option>';
    return;
  }

  memberSelect.innerHTML = options
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.email)}</option>`)
    .join('');

  memberSelect.selectedIndex = 0;
}

function renderSelectedMembers() {
  const selectedMembersEl = document.getElementById('selected-members');
  if (!selectedMembersEl) return;

  const selectedValues = Array.from(selectedMemberIds);

  if (selectedValues.length === 0) {
    selectedMembersEl.innerHTML = '<span class="text-muted small">No members selected</span>';
    return;
  }

  selectedMembersEl.innerHTML = selectedValues
    .map((userId) => {
      const email = userIdToEmailMap[userId] || userId;
      return `
      <span class="badge rounded-pill text-bg-light border member-chip">
        ${escapeHtml(email)}
        <button type="button" class="btn-close btn-close-sm" aria-label="Remove" data-remove-user-id="${escapeHtml(userId)}"></button>
      </span>
    `;
    })
    .join('');
}

async function syncProjectMembers() {
  const supabase = getSupabase();
  const currentUser = getCurrentUser();

  const targetIds = Array.from(selectedMemberIds).filter((userId) => userId !== currentUser?.id);
  const currentIds = initialMemberIds;

  const toAdd = targetIds.filter((userId) => !currentIds.includes(userId));
  const toRemove = currentIds.filter((userId) => !targetIds.includes(userId));

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('project_members')
      .insert(toAdd.map((userId) => ({ project_id: currentProjectId, user_id: userId })));

    if (insertError) {
      console.error('Error adding project members:', insertError);
      return false;
    }
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', currentProjectId)
      .in('user_id', toRemove);

    if (deleteError) {
      console.error('Error removing project members:', deleteError);
      return false;
    }
  }

  initialMemberIds = targetIds;
  return true;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
