import { signal, batch } from '@preact/signals';

/**
 * UI Store: state signals and actions for RabbitMQ Management UI
 */

// Authentication state
// Prefill URL from environment variable injected as window.DEFAULT_URL
const initialUrl = (typeof window !== 'undefined' && window.DEFAULT_URL) ? window.DEFAULT_URL : '';
export const url = signal(initialUrl);
export const username = signal('');
export const password = signal('');
// Application version
export const VERSION = '1.0.1';

// Navigation state
export const activeTab = signal('overview');

// UI settings
export const fastMode = signal(false);
// UI theme: 'light' or 'dark'
export const theme = signal('light');
// Allowed tabs for deep linking and navigation
const ALLOWED_TABS = ['overview', 'exchanges', 'queues', 'connections', 'channels'];

// Overview state
export const overview = {
  data: signal(null),
  loading: signal(false),
  error: signal(null),
};

// Virtual hosts list state
export const vhosts = signal([]);


/**
 * Default number of items per page in list views.
 */
export const PAGE_SIZE = 10;

/**
 * Proxy API requests with Basic Auth and optional fast mode parameters.
 * @param {string} path - API endpoint path (e.g., '/api/overview').
 * @returns {Promise<Response>}
 */
export async function fetchProxy(path) {
  const base = url.value.replace(/\/$/, '');
  // Build full path
  let fullPath = base + path;
  // If fast mode is enabled and this is not the channels endpoint, append fast query params
  if (fastMode.value && !path.startsWith('/api/channels')) {
    const fastParams = 'enable_queue_totals=true&disable_stats=true';
    fullPath += (fullPath.includes('?') ? '&' : '?') + fastParams;
  }
  const prefix = typeof window !== 'undefined'
    ? window.location.pathname.replace(/\/$/, '')
    : '';
  const proxyUrl = `${prefix}/proxy/${fullPath}`;
  const headers = {};
  if (username.value) {
    headers['Authorization'] = 'Basic ' + btoa(username.value + ':' + password.value);
  }
  const res = await fetch(proxyUrl, { method: 'GET', headers });
  if (!res.ok) {
    // If server indicates page out of range, return response for caller to handle bounce logic
    if (res.status === 400) {
      let errJson = null;
      try {
        // Clone response to avoid consuming the original body
        errJson = await res.clone().json();
      } catch (_) {
        /* ignore parse errors */
      }
      if (errJson && errJson.error === 'page_out_of_range') {
        return res;
      }
    }
    // For other errors, attempt to extract message and throw
    let errMsg;
    try {
      const errObj = await res.clone().json();
      errMsg = errObj.reason || errObj.error || `${res.status} ${res.statusText}`;
    } catch (_) {
      errMsg = `${res.status} ${res.statusText}`;
    }
    throw new Error(errMsg);
  }
  return res;
}

/**
 * Fetch overview data and list of virtual hosts.
 * Resets previous overview data and updates vhosts list.
 */
export async function fetchData() {
  if (!url.value || !username.value) {
    overview.error.value = 'URL and username are required';
    return;
  }
  batch(() => {
    overview.loading.value = true;
    overview.error.value = null;
    overview.data.value = null;
  });
  try {
    const ovrRes = await fetchProxy('/api/overview');
    overview.data.value = await ovrRes.json();
    const vhsRes = await fetchProxy('/api/vhosts');
    const vhsData = await vhsRes.json();
    vhosts.value = vhsData.map(v => v.name);
  } catch (e) {
    overview.error.value = e.message;
    // Show error via toast
    addToast(e.message, 'error');
  } finally {
    overview.loading.value = false;
  }
}

/**
 * Change the active UI tab and update the URL for deep-linking.
 * @param {string} tab
 */
export function changeTab(tab) {
  // Update browser URL search params for deep-linking
  if (typeof window !== 'undefined' && window.history && window.history.pushState) {
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', tab);
    const newSearch = sp.toString();
    window.history.pushState(null, '', `${window.location.pathname}?${newSearch}`);
  } else if (typeof window !== 'undefined') {
    window.location.search = `?tab=${tab}`;
  }
  activeTab.value = tab;
  // Component-specific data fetching should be handled within components
}

// Note: component-specific CRUD functions (exchanges/queues) have been moved to their respective components.

/**
 * Initialize activeTab from URL search params and handle browser navigation.
 */
if (typeof window !== 'undefined') {
  // Use ALLOWED_TABS constant for valid tab identifiers
  const sp = new URLSearchParams(window.location.search);
  const tabParam = sp.get('tab');
  if (ALLOWED_TABS.includes(tabParam)) {
    activeTab.value = tabParam;
  }
  window.addEventListener('popstate', () => {
    const sp2 = new URLSearchParams(window.location.search);
    const t = sp2.get('tab');
    if (ALLOWED_TABS.includes(t)) {
      activeTab.value = t;
    }
  });
}

// Toast notifications state
export const toasts = signal([]);

/**
 * Show a toast notification.
 * @param {string} message - The message to display.
 * @param {'info'|'success'|'error'} [type='info'] - The type of toast.
 * @param {number} [duration=5000] - Duration in ms before auto-dismiss.
 */
export function addToast(message, type = 'info', duration = 5000) {
  const id = Date.now() + Math.random();
  toasts.value = [...toasts.value, { id, message, type }];
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
}

/**
 * Toggle between light and dark themes.
 */
export function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  if (typeof window !== 'undefined') {
    const t = theme.value;
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('rabbitmqtTheme', t); } catch { };
  }
}

// Initialize theme from localStorage or system preference
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('rabbitmqtTheme');
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.value = 'dark';
    }
  } catch { }
  document.documentElement.setAttribute('data-theme', theme.value);
}