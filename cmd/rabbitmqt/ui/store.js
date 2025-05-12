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
export const VERSION = '1.0.2';

// Navigation state
export const activeTab = signal('overview');

// UI settings
export const fastMode = signal(false);
// UI theme: 'light' or 'dark'
export const theme = signal('light');
// Allowed tabs for deep linking and navigation
// Note: policies and limits tabs use client-side search and require X-Vhost header
const ALLOWED_TABS = [
  'overview',
  'vhosts',
  'connections',
  'channels',
  'exchanges',
  'queues',
  'policies',
  'limits',
];

// Overview state
export const overview = {
  data: signal(null),
  loading: signal(false),
  error: signal(null),
};

// Virtual hosts list state
export const vhosts = signal([]);
// Global selected vhost for all views
export const selectedVhost = signal('all');


/**
 * Default number of items per page in list views.
 */
export const PAGE_SIZE = 10;
import ApiService from './api.js';

// Instantiate API service with state signals
const api = new ApiService({
  urlSignal: url,
  usernameSignal: username,
  passwordSignal: password,
  fastModeSignal: fastMode,
});
/** Proxy API requests via API service. */
export const fetchProxy = api.proxyFetch.bind(api);
/** API service instance for direct access */
export const apiService = api;
/** Direct API methods bound to the service */
export const fetchOverview = api.fetchOverview.bind(api);
export const fetchVhosts = api.fetchVhosts.bind(api);
export const fetchList = api.fetchList.bind(api);
export const fetchAll = api.fetchAll.bind(api);
export const fetchExchanges = api.fetchExchanges.bind(api);
export const fetchQueues = api.fetchQueues.bind(api);
export const fetchConnections = api.fetchConnections.bind(api);
export const fetchChannels = api.fetchChannels.bind(api);
export const purgeQueue = api.purgeQueue.bind(api);


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
    const overviewData = await fetchOverview();
    overview.data.value = overviewData;
    // Always use fast mode for fetching vhost names (only names needed)
    const prevFast = fastMode.value;
    fastMode.value = true;
    try {
      const vhsData = await fetchVhosts();
      vhosts.value = vhsData.map(v => v.name);
    } finally {
      // restore fast mode to previous setting
      fastMode.value = prevFast;
    }
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
  // Initialize activeTab and selectedVhost from URL search params
  const sp = new URLSearchParams(window.location.search);
  const tabParam = sp.get('tab');
  if (ALLOWED_TABS.includes(tabParam)) {
    activeTab.value = tabParam;
  }
  const vhParam = sp.get('vhost');
  if (vhParam != null) {
    selectedVhost.value = vhParam;
  }
  window.addEventListener('popstate', () => {
    const sp2 = new URLSearchParams(window.location.search);
    const t = sp2.get('tab');
    if (ALLOWED_TABS.includes(t)) {
      activeTab.value = t;
    }
    const vh2 = sp2.get('vhost');
    if (vh2 != null) {
      selectedVhost.value = vh2;
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