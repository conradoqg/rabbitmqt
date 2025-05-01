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

// Exchanges state
export const exchanges = {
  data: signal(null),
  loading: signal(false),
  error: signal(null),
  page: signal(1),
  sortField: signal('name'),
  sortDir: signal('asc'),
  selectedVhost: signal('all'),
  searchName: signal(''),
  searchUseRegex: signal(false),
};

// Queues state
export const queues = {
  data: signal(null),
  loading: signal(false),
  error: signal(null),
  page: signal(1),
  sortField: signal('name'),
  sortDir: signal('asc'),
  selectedVhost: signal('all'),
  searchName: signal(''),
  searchUseRegex: signal(false),
};

// Common page size
export const PAGE_SIZE = 10;

// Internal helper for proxying requests with basic auth
async function fetchProxy(path) {
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
    exchanges.data.value = null;
    queues.data.value = null;
    exchanges.page.value = 1;
    queues.page.value = 1;
    exchanges.error.value = null;
    queues.error.value = null;
  });
  try {
    const ovrRes = await fetchProxy('/api/overview');
    overview.data.value = await ovrRes.json();
    const vhsRes = await fetchProxy('/api/vhosts');
    const vhsData = await vhsRes.json();
    vhosts.value = vhsData.map(v => v.name);
    batch(() => {
      exchanges.selectedVhost.value = 'all';
      queues.selectedVhost.value = 'all';
    });
  } catch (e) {
    overview.error.value = e.message;
  } finally {
    overview.loading.value = false;
    // If user is on Exchanges or Queues tab, load that data after connecting
    if (activeTab.value === 'exchanges') {
      fetchExchanges();
    } else if (activeTab.value === 'queues') {
      fetchQueues();
    }
  }
}

// Handle tab change: update activeTab and fetch data if needed
export function changeTab(tab) {
  activeTab.value = tab;
  if (tab === 'exchanges' && !exchanges.data.value) {
    fetchExchanges();
  } else if (tab === 'queues' && !queues.data.value) {
    fetchQueues();
  }
}

// Exchanges CRUD functions
export async function fetchExchanges() {
  if (!url.value || !username.value) {
    exchanges.error.value = 'URL and username are required';
    return;
  }
  exchanges.loading.value = true;
  exchanges.error.value = null;
  try {
    const vh = exchanges.selectedVhost.value;
    let basePath = vh === 'all'
      ? '/api/exchanges'
      : `/api/exchanges/${vh === '/' ? '%252F' : encodeURIComponent(vh)}`;
    let params = `?page=${exchanges.page.value}&page_size=${PAGE_SIZE}` +
      `&sort=${exchanges.sortField.value}` +
      `&sort_reverse=${exchanges.sortDir.value === 'desc'}`;
    if (exchanges.searchName.value) {
      params += `&name=${encodeURIComponent(exchanges.searchName.value)}`;
    }
    params += `&use_regex=${exchanges.searchUseRegex.value}`;
    const res = await fetchProxy(basePath + params);
    const data = await res.json();
    exchanges.data.value = {
      items: data.items || [],
      totalPages: data.page_count,
      page: data.page,
    };
  } catch (e) {
    exchanges.error.value = e.message;
  } finally {
    exchanges.loading.value = false;
  }
}

export function changeExchangeSort(field) {
  if (exchanges.sortField.value === field) {
    exchanges.sortDir.value = exchanges.sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    exchanges.sortField.value = field;
    exchanges.sortDir.value = 'asc';
  }
  exchanges.page.value = 1;
  fetchExchanges();
}

export function prevExchangePage() {
  if (exchanges.page.value > 1) {
    exchanges.page.value--;
    fetchExchanges();
  }
}

export function nextExchangePage() {
  if (exchanges.data.value && exchanges.page.value < exchanges.data.value.totalPages) {
    exchanges.page.value++;
    fetchExchanges();
  }
}

export function goExchangePage(n) {
  if (n !== exchanges.page.value) {
    exchanges.page.value = n;
    fetchExchanges();
  }
}

export function changeExchangeVhost(vh) {
  exchanges.selectedVhost.value = vh;
  exchanges.page.value = 1;
  fetchExchanges();
}

// Queues CRUD functions
export async function fetchQueues() {
  if (!url.value || !username.value) {
    queues.error.value = 'URL and username are required';
    return;
  }
  queues.loading.value = true;
  queues.error.value = null;
  try {
    const vh = queues.selectedVhost.value;
    let basePath = vh === 'all'
      ? '/api/queues'
      : `/api/queues/${vh === '/' ? '%252F' : encodeURIComponent(vh)}`;
    let params = `?page=${queues.page.value}&page_size=${PAGE_SIZE}` +
      `&sort=${queues.sortField.value}` +
      `&sort_reverse=${queues.sortDir.value === 'desc'}`;
    if (queues.searchName.value) {
      params += `&name=${encodeURIComponent(queues.searchName.value)}`;
    }
    params += `&use_regex=${queues.searchUseRegex.value}`;
    const res = await fetchProxy(basePath + params);
    const data = await res.json();
    queues.data.value = {
      items: data.items || [],
      totalCount: data.total_count,
      totalPages: data.page_count,
      page: data.page,
    };
  } catch (e) {
    queues.error.value = e.message;
  } finally {
    queues.loading.value = false;
  }
}

export function changeQueueSort(field) {
  if (queues.sortField.value === field) {
    queues.sortDir.value = queues.sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    queues.sortField.value = field;
    queues.sortDir.value = 'desc';
  }
  queues.page.value = 1;
  fetchQueues();
}

export function prevQueuePage() {
  if (queues.page.value > 1) {
    queues.page.value--;
    fetchQueues();
  }
}

export function nextQueuePage() {
  if (queues.data.value && queues.page.value < queues.data.value.totalPages) {
    queues.page.value++;
    fetchQueues();
  }
}

export function goQueuePage(n) {
  if (n !== queues.page.value) {
    queues.page.value = n;
    fetchQueues();
  }
}

export function changeQueueVhost(vh) {
  queues.selectedVhost.value = vh;
  queues.page.value = 1;
  fetchQueues();
}