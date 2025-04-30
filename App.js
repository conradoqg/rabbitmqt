import { html } from 'htm/preact';
import { useSignal } from '@preact/signals';
import NavBar from './components/NavBar.js';
import Tabs from './components/Tabs.js';
import Overview from './components/Overview.js';
import Exchanges from './components/Exchanges.js';
import Queues from './components/Queues.js';

export default function App() {
  const url = useSignal('');
  const username = useSignal('');
  const password = useSignal('');
  const activeTab = useSignal('overview');
  const overviewData = useSignal(null);
  const exchangesData = useSignal(null);
  const queuesData = useSignal(null);
  const loading = useSignal(false);
  const error = useSignal(null);
  // Pagination and sorting for queues
  const queuePage = useSignal(1);
  // Default sort field for queues: Name
  const queueSortField = useSignal('name');
  const queueSortDir = useSignal('asc');
  // Pagination and sorting for exchanges
  const exchangePage = useSignal(1);
  const exchangeSortField = useSignal('name');
  const exchangeSortDir = useSignal('asc');
  const pageSize = 10;
  // VHosts list and selected filters
  const vhosts = useSignal([]);
  const selectedExchangeVhost = useSignal('all');
  const selectedQueueVhost = useSignal('all');
  // Separate loading/error for exchanges and queues
  const exchangeLoading = useSignal(false);
  const exchangeError = useSignal(null);
  const queueLoading = useSignal(false);
  const queueError = useSignal(null);

  // Fetch helper for proxying with headers and metadata
  async function fetchProxy(path) {
    const base = url.value.replace(/\/$/, '');
    const fullPath = base + path;
    const proxyUrl = `/proxy/${fullPath}`;
    const headers = {};
    if (username.value) {
      headers['Authorization'] = 'Basic ' + btoa(username.value + ':' + password.value);
    }
    const res = await fetch(proxyUrl, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return res;
  }

  function changeSort(field) {
    if (queueSortField.value === field) {
      queueSortDir.value = queueSortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      queueSortField.value = field;
      queueSortDir.value = 'desc';
    }
    queuePage.value = 1;
    fetchQueues();
  }

// Change sorting for exchanges
function changeExchangeSort(field) {
  if (exchangeSortField.value === field) {
    exchangeSortDir.value = exchangeSortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    exchangeSortField.value = field;
    exchangeSortDir.value = 'asc';
  }
  exchangePage.value = 1;
  fetchExchanges();
}

  function prevPage() {
    if (queuePage.value > 1) {
      queuePage.value--;
      fetchQueues();
    }
  }

  function nextPage() {
    if (queuesData.value && queuePage.value < queuesData.value.totalPages) {
      queuePage.value++;
      fetchQueues();
    }
  }

// Pagination controls for exchanges
function prevExchangePage() {
  if (exchangePage.value > 1) {
    exchangePage.value--;
    fetchExchanges();
  }
}

  function goPage(n) {
    if (n !== queuePage.value) {
      queuePage.value = n;
      fetchQueues();
    }
  }

function nextExchangePage() {
  if (exchangesData.value && exchangePage.value < exchangesData.value.totalPages) {
    exchangePage.value++;
    fetchExchanges();
  }
}

function goExchangePage(n) {
  if (n !== exchangePage.value) {
    exchangePage.value = n;
    fetchExchanges();
  }
}
// Change vhost selection for exchanges
function changeExchangeVhost(vh) {
  selectedExchangeVhost.value = vh;
  exchangePage.value = 1;
  fetchExchanges();
}
// Change vhost selection for queues
function changeQueueVhost(vh) {
  selectedQueueVhost.value = vh;
  queuePage.value = 1;
  fetchQueues();
}
// Handle tab change: fetch data when entering exchanges or queues
// Switch tabs; only fetch if data not yet loaded
function handleTabChange(tab) {
  activeTab.value = tab;
  if (tab === 'exchanges' && exchangesData.value == null) {
    fetchExchanges();
  } else if (tab === 'queues' && queuesData.value == null) {
    fetchQueues();
  }
}

  // Fetch overview and exchanges, then initial queues page
  async function fetchData() {
    if (!url.value || !username.value) {
      error.value = 'URL and username are required';
      return;
    }
    loading.value = true;
    error.value = null;
    overviewData.value = null;
    exchangesData.value = null;
    queuesData.value = null;
    queuePage.value = 1;
    try {
      // Fetch overview then exchanges page and initial queues page
      const ovrRes = await fetchProxy('/api/overview');
      overviewData.value = await ovrRes.json();
      // Fetch available vhosts for selectors
      const vhsRes = await fetchProxy('/api/vhosts');
      const vhsData = await vhsRes.json();
      vhosts.value = vhsData.map(v => v.name);
      // Reset filters to all
      selectedExchangeVhost.value = 'all';
      selectedQueueVhost.value = 'all';
      // Clear previous exchange/queue errors
      exchangeError.value = null;
      queueError.value = null;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  // Fetch queues with paging and sorting
  async function fetchQueues() {
    queueLoading.value = true;
    queueError.value = null;
    try {
      // Determine queues API path based on selected vhost
      const qvh = selectedQueueVhost.value;
      let baseQueuesPath;
      if (qvh === 'all') {
        baseQueuesPath = '/api/queues';
      } else {
        // encode default vhost "/" as "%2F"
        const vhSeg = qvh === '/' ? '%2F' : encodeURIComponent(qvh);
        baseQueuesPath = `/api/queues/${vhSeg}`;
      }
      // Use sort_reverse (true=descending) instead of sort_dir
      const path = `${baseQueuesPath}?page=${queuePage.value}&page_size=${pageSize}&sort=${queueSortField.value}&sort_reverse=${queueSortDir.value === 'desc'}`;
      const res = await fetchProxy(path);
      const data = await res.json();
      const items = data.items || [];
      const totalCount = data.total_count;
      const totalPages = data.page_count;
      const page = data.page;
      queuesData.value = { items, totalCount, totalPages, page };
    } catch (e) {
      queueError.value = e.message;
    } finally {
      queueLoading.value = false;
    }
  }

  // Fetch exchanges with paging and sorting
  async function fetchExchanges() {
    exchangeLoading.value = true;
    exchangeError.value = null;
    try {
      // Determine exchanges API path based on selected vhost
      const evh = selectedExchangeVhost.value;
      let baseExchangesPath;
      if (evh === 'all') {
        baseExchangesPath = '/api/exchanges';
      } else {
        // encode default vhost "/" as "%2F"
        const vhSeg = evh === '/' ? '%2F' : encodeURIComponent(evh);
        baseExchangesPath = `/api/exchanges/${vhSeg}`;
      }
      // Use sort_reverse (true=descending) instead of sort_dir
      const path = `${baseExchangesPath}?page=${exchangePage.value}&page_size=${pageSize}&sort=${exchangeSortField.value}&sort_reverse=${exchangeSortDir.value === 'desc'}`;
      const res = await fetchProxy(path);
      const data = await res.json();
      const items = data.items || [];
      const totalPages = data.page_count;
      const page = data.page;
      exchangesData.value = { items, totalPages, page };
    } catch (e) {
      exchangeError.value = e.message;
    } finally {
      exchangeLoading.value = false;
    }
  }



  return html`
    <div>
      <${NavBar}
        url=${url}
        username=${username}
        password=${password}
        onConnect=${fetchData}
      />

      <section class="section">
        <div class="container is-fluid">
          <${Tabs} activeTab=${activeTab} onChange=${handleTabChange} />

          <div>
            ${activeTab.value === 'overview' && html`<${Overview} loading=${loading} error=${error} overviewData=${overviewData} />`}
            ${activeTab.value === 'exchanges' && html`<${Exchanges}
              loading=${exchangeLoading}
              error=${exchangeError}
              exchangesData=${exchangesData}
              exchangeSortField=${exchangeSortField}
              exchangeSortDir=${exchangeSortDir}
              changeSort=${changeExchangeSort}
              prevPage=${prevExchangePage}
              nextPage=${nextExchangePage}
              goPage=${goExchangePage}
              vhosts=${vhosts}
              selectedVhost=${selectedExchangeVhost}
              onVhostChange=${changeExchangeVhost}
              onRefresh=${fetchExchanges}
            />`}
            ${activeTab.value === 'queues' && html`<${Queues}
              loading=${queueLoading}
              error=${queueError}
              queuesData=${queuesData}
              queueSortField=${queueSortField}
              queueSortDir=${queueSortDir}
              changeSort=${changeSort}
              prevPage=${prevPage}
              nextPage=${nextPage}
              goPage=${goPage}
              vhosts=${vhosts}
              selectedVhost=${selectedQueueVhost}
              onVhostChange=${changeQueueVhost}
              onRefresh=${fetchQueues}
            />`}
          </div>
        </div>
      </section>
    </div>
  `;
}
