import pageTemplate from './projectadd.html?raw';
import './projectadd.css';
import { getSupabase, getCurrentUser } from '../../utils/auth.js';

let memberCandidates = []; // Array of {id, email}
let userIdToEmailMap = {}; // Map id -> email
const selectedMemberIds = new Set(); // Stores IDs

export function renderProjectAddPage() {
  return `<div class="page-project-add">${pageTemplate}</div>`;
}

export async function setupProjectAddPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  selectedMemberIds.clear();
  memberCandidates = [];
  userIdToEmailMap = {};

  await setupForm();
}

async function setupForm() {
  const form = document.getElementById('add-project-form');
  const submitBtn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('form-error');
  const errorMessage = document.getElementById('form-error-message');

  if (!form) return;

  await initializeMemberPicker();

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
      const supabase = getSupabase();
      const {
        data: { user: authUser },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        showError('Your session expired. Please login again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Create Project';
        setTimeout(() => {
          window.location.href = '/login';
        }, 800);
        return;
      }

      // Insert project
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
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

      if (selectedMemberIds.size > 0) {
        const memberRows = Array.from(selectedMemberIds).map((userId) => ({
          project_id: data.id,
          user_id: userId
        }));

        const { error: membersError } = await supabase
          .from('project_members')
          .insert(memberRows);

        if (membersError) {
          console.error('Error adding project members:', membersError);
        }
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

async function initializeMemberPicker() {
  const memberSearchInput = document.getElementById('member-search');
  const memberSelect = document.getElementById('member-select');
  const addMemberBtn = document.getElementById('add-member-btn');
  const selectedMembersEl = document.getElementById('selected-members');

  if (!memberSearchInput || !memberSelect || !addMemberBtn || !selectedMembersEl) {
    return;
  }

  memberCandidates = await loadMemberCandidates();
  renderMemberOptions('');
  renderSelectedMembers();

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
