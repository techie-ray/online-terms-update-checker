// Global state
let terms = [];

// DOM Elements
const addForm = document.getElementById('addForm');
const urlInput = document.getElementById('urlInput');
const addButton = document.getElementById('addButton');
const formError = document.getElementById('formError');
const refreshAllButton = document.getElementById('refreshAllButton');
const lastRefresh = document.getElementById('lastRefresh');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');
const termsContainer = document.getElementById('termsContainer');
const historyModal = document.getElementById('historyModal');
const closeModal = document.getElementById('closeModal');
const historyContent = document.getElementById('historyContent');
const successNotification = document.getElementById('successNotification');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTerms();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  addForm.addEventListener('submit', handleAddTerm);
  refreshAllButton.addEventListener('click', handleRefreshAll);
  closeModal.addEventListener('click', () => {
    historyModal.style.display = 'none';
  });
  historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
      historyModal.style.display = 'none';
    }
  });
}

// Load all terms
async function loadTerms() {
  try {
    loadingSpinner.style.display = 'block';
    emptyState.style.display = 'none';
    termsContainer.innerHTML = '';

    const response = await fetch('/api/terms');
    const data = await response.json();

    if (data.success) {
      terms = data.terms;
      renderTerms();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    alert('Error loading terms: ' + error.message);
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// Handle add term
async function handleAddTerm(e) {
  e.preventDefault();

  const url = urlInput.value.trim();
  if (!url) return;

  try {
    setButtonLoading(addButton, true);
    formError.classList.remove('show');

    const response = await fetch('/api/terms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (data.success) {
      terms.push(data.term);
      renderTerms();
      urlInput.value = '';
      showSuccess('URL added successfully!');
    } else {
      formError.textContent = data.error;
      formError.classList.add('show');
    }
  } catch (error) {
    formError.textContent = 'Error: ' + error.message;
    formError.classList.add('show');
  } finally {
    setButtonLoading(addButton, false);
  }
}

// Handle refresh all
async function handleRefreshAll() {
  if (terms.length === 0) return;

  try {
    setButtonLoading(refreshAllButton, true);

    const response = await fetch('/api/check-all', {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      // Update terms with results
      data.results.forEach(result => {
        if (result.success) {
          const index = terms.findIndex(t => t.id === result.id);
          if (index !== -1) {
            terms[index] = result.term;
          }
        }
      });

      renderTerms();
      lastRefresh.textContent = `Last refreshed: ${formatDateTime(new Date().toISOString())}`;
      showSuccess('All terms refreshed!');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    alert('Error refreshing terms: ' + error.message);
  } finally {
    setButtonLoading(refreshAllButton, false);
  }
}

// Refresh single term
async function refreshTerm(id) {
  try {
    const response = await fetch(`/api/check/${id}`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      const index = terms.findIndex(t => t.id === id);
      if (index !== -1) {
        terms[index] = data.term;
      }
      renderTerms();
      showSuccess('Term refreshed!');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    alert('Error refreshing term: ' + error.message);
  }
}

// Delete term
async function deleteTerm(id) {
  if (!confirm('Are you sure you want to delete this term?')) {
    return;
  }

  try {
    const response = await fetch(`/api/terms/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      terms = terms.filter(t => t.id !== id);
      renderTerms();
      showSuccess('Term deleted!');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    alert('Error deleting term: ' + error.message);
  }
}

// Render all terms
function renderTerms() {
  if (terms.length === 0) {
    emptyState.style.display = 'block';
    termsContainer.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  termsContainer.innerHTML = terms.map(term => createTermCard(term)).join('');
}

// Create term card HTML
function createTermCard(term) {
  const dateClass = getDateClass(term.lastUpdated);
  const recentlyChanged = hasRecentlyChanged(term);
  const changeBadge = recentlyChanged ? '<span class="change-badge">Changed</span>' : '';
  const truncatedUrl = truncateUrl(term.url, 60);

  return `
    <div class="term-card">
      <div class="term-header">
        <div class="term-title-section">
          <h3 class="term-title">${escapeHtml(term.title)}</h3>
          <a href="${escapeHtml(term.url)}" target="_blank" class="term-url" title="${escapeHtml(term.url)}">
            ${escapeHtml(truncatedUrl)}
          </a>
        </div>
        <div class="term-actions">
          <button class="btn btn-small btn-secondary" onclick="refreshTerm('${term.id}')">
            Refresh
          </button>
          <button class="btn btn-small btn-delete" onclick="deleteTerm('${term.id}')">
            Delete
          </button>
        </div>
      </div>
      <div class="term-info">
        <div class="info-item">
          <span class="info-label">Last Updated</span>
          <span class="info-value ${dateClass}">
            ${escapeHtml(term.lastUpdated)}${changeBadge}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Detection Method</span>
          <span class="info-value">${escapeHtml(formatDetectionMethod(term.detectionMethod))}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Last Checked</span>
          <span class="info-value">${formatDateTime(term.lastChecked)}</span>
        </div>
      </div>
      <div style="margin-top: 15px;">
        <button class="btn btn-small" onclick="showHistory('${term.id}')" style="background: #4299e1; color: white;">
          View History (${term.history.length})
        </button>
      </div>
    </div>
  `;
}

// Show history modal
function showHistory(id) {
  const term = terms.find(t => t.id === id);
  if (!term) return;

  // Sort history by newest first
  const sortedHistory = [...term.history].reverse();

  const historyHtml = sortedHistory.map(entry => {
    const changedClass = entry.changed ? 'changed' : '';
    const changedBadge = entry.changed ? '<span class="change-badge">Changed</span>' : '';

    return `
      <div class="history-item ${changedClass}">
        <div class="history-date">
          Last Updated: ${escapeHtml(entry.lastUpdated)}${changedBadge}
        </div>
        <div class="history-checked">
          Checked at: ${formatDateTime(entry.checkedAt)}
        </div>
      </div>
    `;
  }).join('');

  historyContent.innerHTML = historyHtml || '<p>No history available</p>';
  historyModal.style.display = 'flex';
}

// Helper: Get date class based on age
function getDateClass(dateStr) {
  if (dateStr === 'Unknown') return 'date-unknown';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return 'date-recent';
    if (diffDays < 180) return 'date-moderate';
    return 'date-old';
  } catch (e) {
    return 'date-unknown';
  }
}

// Helper: Check if recently changed
function hasRecentlyChanged(term) {
  if (!term.history || term.history.length === 0) return false;
  return term.history[term.history.length - 1].changed === true;
}

// Helper: Format detection method
function formatDetectionMethod(method) {
  const methods = {
    'meta-tag': 'Meta Tag',
    'structured-data': 'Structured Data',
    'text-parsing': 'Text Parsing',
    'http-header': 'HTTP Header',
    'not-detected': 'Not Detected'
  };
  return methods[method] || method;
}

// Helper: Format date/time
function formatDateTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString();
  } catch (e) {
    return isoString;
  }
}

// Helper: Truncate URL
function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

// Helper: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper: Set button loading state
function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

// Helper: Show success notification
function showSuccess(message) {
  successNotification.textContent = message;
  successNotification.style.display = 'block';

  setTimeout(() => {
    successNotification.style.display = 'none';
  }, 3000);
}
