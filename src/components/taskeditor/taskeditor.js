import taskEditorTemplate from './taskeditor.html?raw';
import './taskeditor.css';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'];

let existingAttachments = [];
let removedAttachmentIds = new Set();
let newAttachmentItems = [];
let attachmentsInputEl = null;
let attachmentsListEl = null;

export function renderTaskEditor() {
  return taskEditorTemplate;
}

export function setupTaskEditor() {
  attachmentsInputEl = document.querySelector('#task-attachments-input');
  attachmentsListEl = document.querySelector('#task-attachments-list');

  if (!attachmentsInputEl || !attachmentsListEl) {
    return;
  }

  attachmentsInputEl.onchange = handleAttachmentInputChange;
  attachmentsListEl.onclick = handleAttachmentsListClick;
}

export function setTaskEditorValues({ mode, stageId, task, isDoneDefault }) {
  const modeInput = document.querySelector('#task-form-mode');
  const taskIdInput = document.querySelector('#task-form-task-id');
  const stageIdInput = document.querySelector('#task-form-stage-id');
  const titleInput = document.querySelector('#task-title-input');
  const descriptionInput = document.querySelector('#task-description-input');
  const openRadio = document.querySelector('#task-status-open');
  const doneRadio = document.querySelector('#task-status-done');

  if (!modeInput || !taskIdInput || !stageIdInput || !titleInput || !descriptionInput || !openRadio || !doneRadio) {
    return;
  }

  if (mode === 'add') {
    modeInput.value = 'add';
    taskIdInput.value = '';
    stageIdInput.value = stageId || '';
    titleInput.value = '';
    descriptionInput.value = '';
    openRadio.checked = !isDoneDefault;
    doneRadio.checked = Boolean(isDoneDefault);
  } else {
    modeInput.value = 'edit';
    taskIdInput.value = task?.id || '';
    stageIdInput.value = task?.stage_id || '';
    titleInput.value = task?.title || '';
    descriptionInput.value = task?.description || '';
    openRadio.checked = !task?.done;
    doneRadio.checked = Boolean(task?.done);
  }
}

export function setTaskEditorAttachments(attachments = []) {
  existingAttachments = attachments.map((attachment) => ({
    ...attachment,
    isImage: isImageAttachment(attachment)
  }));
  removedAttachmentIds = new Set();
  revokeNewAttachmentPreviewUrls();
  newAttachmentItems = [];

  if (attachmentsInputEl) {
    attachmentsInputEl.value = '';
  }

  renderAttachmentsList();
}

export function getTaskEditorValues() {
  const mode = document.querySelector('#task-form-mode')?.value || 'add';
  const taskId = document.querySelector('#task-form-task-id')?.value || '';
  const stageId = document.querySelector('#task-form-stage-id')?.value || '';
  const title = document.querySelector('#task-title-input')?.value.trim() || '';
  const description = document.querySelector('#task-description-input')?.value.trim() || '';
  const statusValue = document.querySelector('input[name="task-status"]:checked')?.value || 'open';

  return {
    mode,
    taskId,
    stageId,
    title,
    description,
    done: statusValue === 'done'
  };
}

export function getTaskEditorAttachmentChanges() {
  const newFiles = newAttachmentItems.map((item) => item.file);
  const removedAttachments = existingAttachments.filter((attachment) => removedAttachmentIds.has(attachment.id));

  return {
    newFiles,
    removedAttachments
  };
}

export function teardownTaskEditor() {
  revokeNewAttachmentPreviewUrls();
  newAttachmentItems = [];
  existingAttachments = [];
  removedAttachmentIds = new Set();

  if (attachmentsInputEl) {
    attachmentsInputEl.value = '';
    attachmentsInputEl.onchange = null;
  }

  if (attachmentsListEl) {
    attachmentsListEl.onclick = null;
  }

  attachmentsInputEl = null;
  attachmentsListEl = null;
}

function handleAttachmentInputChange(event) {
  const files = Array.from(event.target?.files || []);
  if (!files.length) {
    return;
  }

  files.forEach((file) => {
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    newAttachmentItems.push({
      clientId: crypto.randomUUID(),
      file,
      previewUrl,
      isImage: file.type.startsWith('image/') || isImageAttachment({ file_name: file.name })
    });
  });

  event.target.value = '';
  renderAttachmentsList();
}

function handleAttachmentsListClick(event) {
  const removeBtn = event.target.closest('[data-remove-existing-id], [data-remove-new-id]');
  if (!removeBtn) {
    return;
  }

  const existingId = removeBtn.dataset.removeExistingId;
  if (existingId) {
    if (removedAttachmentIds.has(existingId)) {
      removedAttachmentIds.delete(existingId);
    } else {
      removedAttachmentIds.add(existingId);
    }
    renderAttachmentsList();
    return;
  }

  const newId = removeBtn.dataset.removeNewId;
  if (newId) {
    const item = newAttachmentItems.find((entry) => entry.clientId === newId);
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    newAttachmentItems = newAttachmentItems.filter((entry) => entry.clientId !== newId);
    renderAttachmentsList();
  }
}

function renderAttachmentsList() {
  if (!attachmentsListEl) {
    return;
  }

  const existingMarkup = existingAttachments.map((attachment) => {
    const isRemoved = removedAttachmentIds.has(attachment.id);
    const image = attachment.isImage && attachment.preview_url
      ? `<img src="${escapeHtml(attachment.preview_url)}" alt="${escapeHtml(attachment.file_name || 'image')}" class="task-attachment-preview" />`
      : `<div class="task-attachment-file-icon"><i class="bi bi-file-earmark"></i></div>`;

    const sizeText = formatBytes(attachment.file_size);
    const href = attachment.preview_url || '#';
    const downloadLabel = attachment.file_name || 'Attachment';

    return `
      <div class="task-attachment-item ${isRemoved ? 'is-removed' : ''}">
        ${image}
        <div class="task-attachment-meta">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="task-attachment-name">${escapeHtml(downloadLabel)}</a>
          <small class="text-muted">${escapeHtml(sizeText)}</small>
        </div>
        <button type="button" class="btn btn-sm ${isRemoved ? 'btn-outline-secondary' : 'btn-outline-danger'}" data-remove-existing-id="${attachment.id}">
          ${isRemoved ? 'Undo' : 'Remove'}
        </button>
      </div>
    `;
  }).join('');

  const newMarkup = newAttachmentItems.map((item) => {
    const image = item.isImage && item.previewUrl
      ? `<img src="${item.previewUrl}" alt="${escapeHtml(item.file.name)}" class="task-attachment-preview" />`
      : `<div class="task-attachment-file-icon"><i class="bi bi-file-earmark"></i></div>`;

    return `
      <div class="task-attachment-item is-new">
        ${image}
        <div class="task-attachment-meta">
          <span class="task-attachment-name">${escapeHtml(item.file.name)}</span>
          <small class="text-muted">${escapeHtml(formatBytes(item.file.size))}</small>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger" data-remove-new-id="${item.clientId}">
          Remove
        </button>
      </div>
    `;
  }).join('');

  const hasItems = existingMarkup || newMarkup;
  attachmentsListEl.innerHTML = hasItems
    ? `${existingMarkup}${newMarkup}`
    : '<div class="text-muted small">No attachments.</div>';
}

function isImageAttachment(attachment) {
  const mimeType = String(attachment?.file_type || '').toLowerCase();
  if (mimeType.startsWith('image/')) {
    return true;
  }

  const fileName = String(attachment?.file_name || '').toLowerCase();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
  return IMAGE_EXTENSIONS.includes(extension);
}

function formatBytes(bytes) {
  const size = Number(bytes) || 0;
  if (!size) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const displayValue = size / (1024 ** unitIndex);
  return `${displayValue.toFixed(displayValue >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function revokeNewAttachmentPreviewUrls() {
  newAttachmentItems.forEach((item) => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
}

function escapeHtml(text) {
  const value = String(text ?? '');
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}