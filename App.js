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
  const queueSortField = useSignal('rate');
  const queueSortDir = useSignal('desc');
  // Pagination and sorting for exchanges
  const exchangePage = useSignal(1);
  const exchangeSortField = useSignal('name');
  const exchangeSortDir = useSignal('asc');
  const pageSize = 10;

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
      await fetchExchanges();
      await fetchQueues();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  // Fetch queues with paging and sorting
  async function fetchQueues() {
    loading.value = true;
    error.value = null;
    try {
      // Use sort_reverse (true=descending) instead of sort_dir
      const path = `/api/queues?page=${queuePage.value}&page_size=${pageSize}&sort=${queueSortField.value}&sort_reverse=${queueSortDir.value === 'desc'}`;
      const res = await fetchProxy(path);
      const data = await res.json();
      const items = data.items || [];
      const totalCount = data.total_count;
      const totalPages = data.page_count;
      const page = data.page;
      queuesData.value = { items, totalCount, totalPages, page };
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  // Fetch exchanges with paging and sorting
  async function fetchExchanges() {
    loading.value = true;
    error.value = null;
    try {
      // Use sort_reverse (true=descending) instead of sort_dir
      const path = `/api/exchanges?page=${exchangePage.value}&page_size=${pageSize}&sort=${exchangeSortField.value}&sort_reverse=${exchangeSortDir.value === 'desc'}`;
      const res = await fetchProxy(path);
      const data = await res.json();
      const items = data.items || [];
      const totalPages = data.page_count;
      const page = data.page;
      exchangesData.value = { items, totalPages, page };
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
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
          <${Tabs} activeTab=${activeTab} onChange=${t => (activeTab.value = t)} />

          <div>
            ${activeTab.value === 'overview' && html`<${Overview} loading=${loading} error=${error} overviewData=${overviewData} />`}
            ${activeTab.value === 'exchanges' && html`<${Exchanges}
              loading=${loading}
              error=${error}
              exchangesData=${exchangesData}
              exchangeSortField=${exchangeSortField}
              exchangeSortDir=${exchangeSortDir}
              changeSort=${changeExchangeSort}
              prevPage=${prevExchangePage}
              nextPage=${nextExchangePage}
              goPage=${goExchangePage}
            />`}
            ${activeTab.value === 'queues' && html`<${Queues} loading=${loading} error=${error} queuesData=${queuesData} queueSortField=${queueSortField} queueSortDir=${queueSortDir} changeSort=${changeSort} prevPage=${prevPage} nextPage=${nextPage} goPage=${goPage} />`}
          </div>
        </div>
      </section>
    </div>
  `;
}
