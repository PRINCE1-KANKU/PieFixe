const API = () => window.PIE_FIXE_API;

const loginPanel = document.querySelector('#login-panel');
const editorPanel = document.querySelector('#editor-panel');
const loginForm = document.querySelector('#author-login');
const articleForm = document.querySelector('#article-form');
const loginMessage = document.querySelector('#login-message');
const editorMessage = document.querySelector('#editor-message');
const draftList = document.querySelector('#draft-list');
const formHeading = document.querySelector('#form-heading');
const saveButton = document.querySelector('#save-post');
const cancelEditButton = document.querySelector('#cancel-edit');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function showEditor() {
  loginPanel.hidden = true;
  editorPanel.hidden = false;
  loadPosts();
}

function showLogin(message) {
  editorPanel.hidden = true;
  loginPanel.hidden = false;
  loginForm.reset();
  if (message) loginMessage.textContent = message;
}

function resetFormToCreateMode() {
  articleForm.reset();
  articleForm.elements.postId.value = '';
  formHeading.textContent = 'New article or tip';
  saveButton.textContent = 'Publish post ↗';
  cancelEditButton.hidden = true;
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const passphrase = new FormData(loginForm).get('passphrase');
  loginMessage.textContent = 'Signing in…';
  try {
    const response = await fetch(`${API()}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ passphrase })
    });
    const result = await response.json();
    if (!response.ok) {
      loginMessage.textContent = result.error || 'That passphrase is not recognised.';
      return;
    }
    loginMessage.textContent = '';
    showEditor();
  } catch {
    loginMessage.textContent = 'Could not reach the server. Is it running?';
  }
});

document.querySelector('#sign-out')?.addEventListener('click', () => {
  fetch(`${API()}/admin/logout`, { method: 'POST', credentials: 'include' })
    .finally(() => showLogin());
});

cancelEditButton?.addEventListener('click', () => {
  resetFormToCreateMode();
  editorMessage.textContent = '';
});

articleForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const postId = articleForm.elements.postId.value;
  const formData = new FormData(articleForm);
  formData.delete('postId');

  saveButton.setAttribute('disabled', 'true');
  editorMessage.textContent = 'Saving…';

  try {
    const response = await fetch(`${API()}/posts${postId ? `/${postId}` : ''}`, {
      method: postId ? 'PUT' : 'POST',
      credentials: 'include',
      body: formData
    });
    const result = await response.json();

    if (response.status === 401) {
      showLogin('Your session expired. Please sign in again.');
      return;
    }
    if (!response.ok) {
      editorMessage.textContent = result.error || 'Could not save the post.';
      return;
    }

    editorMessage.textContent = postId
      ? 'Post updated.'
      : (result.status === 'draft' ? 'Draft saved (not visible on the public blog yet).' : 'Post published — it is now live on the blog.');
    if (result.emailWarning) {
      editorMessage.textContent += ` ${result.emailWarning}`;
    }
    resetFormToCreateMode();
    loadPosts();
  } catch {
    editorMessage.textContent = 'Could not reach the server. Is it running?';
  } finally {
    saveButton.removeAttribute('disabled');
  }
});

async function loadPosts() {
  draftList.innerHTML = '<p class="admin-muted">Loading…</p>';
  try {
    const response = await fetch(`${API()}/posts?all=true`, {
      credentials: 'include'
    });
    if (response.status === 401) {
      showLogin('Your session expired. Please sign in again.');
      return;
    }
    const posts = await response.json();
    renderPosts(posts);
  } catch {
    draftList.innerHTML = '<p class="admin-muted">Could not reach the server.</p>';
  }
}

function renderPosts(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    draftList.innerHTML = '<p class="admin-muted">No posts yet — build your first one above.</p>';
    return;
  }

  draftList.innerHTML = posts.map((post) => `
    <div class="draft-item" data-post-id="${post.id}">
      <div>
        <strong>${escapeHtml(post.title)}</strong>
        <span>${escapeHtml(post.type)} / ${escapeHtml(post.topic)} · ${post.status === 'draft' ? 'Draft' : 'Published'}</span>
      </div>
      <div class="draft-item__actions">
        <button class="text-link" type="button" data-action="edit">Edit</button>
        <button class="text-link" type="button" data-action="delete">Delete</button>
      </div>
    </div>
  `).join('');

  draftList.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('[data-post-id]').dataset.postId;
      const post = posts.find((item) => item.id === id);
      if (post) editPost(post);
    });
  });

  draftList.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('[data-post-id]').dataset.postId;
      const post = posts.find((item) => item.id === id);
      if (post) deletePost(post);
    });
  });
}

function editPost(post) {
  articleForm.elements.postId.value = post.id;
  articleForm.elements.title.value = post.title;
  articleForm.elements.type.value = post.type;
  articleForm.elements.topic.value = post.topic;
  articleForm.elements.readingTime.value = post.readingTime;
  articleForm.elements.status.value = post.status;
  articleForm.elements.summary.value = post.summary;
  articleForm.elements.body.value = post.body;
  formHeading.textContent = `Editing: ${post.title}`;
  saveButton.textContent = 'Save changes ↗';
  cancelEditButton.hidden = false;
  editorMessage.textContent = 'Cover image field is left blank unless you want to replace the existing image.';
  articleForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deletePost(post) {
  if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return;
  try {
    const response = await fetch(`${API()}/posts/${post.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.status === 401) {
      showLogin('Your session expired. Please sign in again.');
      return;
    }
    if (!response.ok && response.status !== 204) {
      editorMessage.textContent = 'Could not delete that post.';
      return;
    }
    loadPosts();
  } catch {
    editorMessage.textContent = 'Could not reach the server.';
  }
}

showEditor();
