import { signal, batch } from '@preact/signals';

// Connection and navigation state
export const url = signal('');
export const username = signal('');
export const password = signal('');
export const activeTab = signal('overview');

// Overview state
export const overview = {
  data: signal(null),
  loading: signal(false),
  error: signal(null),
};

// VHosts list state
export const vhosts = signal([]);


// Common page size
export const PAGE_SIZE = 10;

// Internal helper for proxying requests with basic auth
export async function fetchProxy(path) {
  const base = url.value.replace(/\/$/, '');
  const fullPath = base + path;
  const proxyUrl = `/proxy/${fullPath}`;
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

// Fetch overview and initialize vhosts, reset other data
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
  } finally {
    overview.loading.value = false;
  }
}

// Handle tab change: update activeTab and fetch data if needed
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

// Initialize activeTab from URL search params and handle back/forward
if (typeof window !== 'undefined') {
  const allowedTabs = ['overview', 'exchanges', 'queues'];
  const sp = new URLSearchParams(window.location.search);
  const tabParam = sp.get('tab');
  if (allowedTabs.includes(tabParam)) {
    activeTab.value = tabParam;
  }
  window.addEventListener('popstate', () => {
    const sp2 = new URLSearchParams(window.location.search);
    const t = sp2.get('tab');
    if (allowedTabs.includes(t)) {
      activeTab.value = t;
    }
  });
}