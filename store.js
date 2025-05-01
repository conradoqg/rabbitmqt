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
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
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
  activeTab.value = tab;
  // Component-specific data fetching should be handled within components
}

// Note: component-specific CRUD functions (exchanges/queues) have been moved to their respective components.