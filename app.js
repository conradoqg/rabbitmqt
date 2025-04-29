import { html } from 'htm/preact';
import { useSignal } from '@preact/signals';

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
    const base = url.value.replace(/\/$/, '');
    // helper to call proxy with basic auth to avoid CORS issues
    async function fetchProxy(path) {
      const payload = {
        url: base + path,
        method: 'GET',
        user: username.value,
        password: password.value,
      };
      const res = await fetch('/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return res.json();
    }
    try {
      const [ovr, exs, qs] = await Promise.all([
        fetchProxy('/api/overview'),
        fetchProxy('/api/exchanges'),
        fetchProxy('/api/queues'),
      ]);
      overviewData.value = ovr;
      exchangesData.value = exs;
      queuesData.value = qs;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }
  return html`
    <div>
      <nav class="navbar is-light" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
          <a class="navbar-item"><strong>RabbitMQ Management</strong></a>
          <a
            role="button"
            class="navbar-burger"
            aria-label="menu"
            aria-expanded="false"
            onClick=${() => {
              const burger = document.querySelector('.navbar-burger');
              const menu = document.getElementById('navbarMenu');
              burger.classList.toggle('is-active');
              menu.classList.toggle('is-active');
            }}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div id="navbarMenu" class="navbar-menu">
          <div class="navbar-end">
            <div class="navbar-item">
              <input
                class="input"
                type="text"
                placeholder="URL"
                value=${url.value}
                onInput=${e => url.value = e.target.value}
              />
            </div>
            <div class="navbar-item">
              <input
                class="input"
                type="text"
                placeholder="Username"
                value=${username.value}
                onInput=${e => username.value = e.target.value}
              />
            </div>
            <div class="navbar-item">
              <input
                class="input"
                type="password"
                placeholder="Password"
                value=${password.value}
                onInput=${e => password.value = e.target.value}
              />
            </div>
            <div class="navbar-item">
              <button class="button is-primary" onClick=${fetchData}>Connect</button>
            </div>
          </div>
        </div>
      </nav>

      <section class="section">
        <div class="container">
          <div class="tabs is-boxed">
            <ul>
              <li class=${activeTab.value === 'overview' ? 'is-active' : ''}>
                <a onClick=${() => activeTab.value = 'overview'}>Overview</a>
              </li>
              <li class=${activeTab.value === 'exchanges' ? 'is-active' : ''}>
                <a onClick=${() => activeTab.value = 'exchanges'}>Exchanges</a>
              </li>
              <li class=${activeTab.value === 'queues' ? 'is-active' : ''}>
                <a onClick=${() => activeTab.value = 'queues'}>Queues</a>
              </li>
            </ul>
          </div>

          <div>
            ${activeTab.value === 'overview' && html`
              <h1 class="title">Overview</h1>
              ${loading.value && html`<p>Loading...</p>`}
              ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
              ${!loading.value && !error.value && overviewData.value && html`<pre>${JSON.stringify(overviewData.value, null, 2)}</pre>`}
              ${!loading.value && !error.value && !overviewData.value && html`<p>No overview data. Click Connect.</p>`}
            `}
            ${activeTab.value === 'exchanges' && html`
              <h1 class="title">Exchanges</h1>
              ${loading.value && html`<p>Loading...</p>`}
              ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
              ${!loading.value && !error.value && exchangesData.value && html`<pre>${JSON.stringify(exchangesData.value, null, 2)}</pre>`}
              ${!loading.value && !error.value && !exchangesData.value && html`<p>No exchanges data. Click Connect.</p>`}
            `}
            ${activeTab.value === 'queues' && html`
              <h1 class="title">Queues</h1>
              ${loading.value && html`<p>Loading...</p>`}
              ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
              ${!loading.value && !error.value && queuesData.value && html`<pre>${JSON.stringify(queuesData.value, null, 2)}</pre>`}
              ${!loading.value && !error.value && !queuesData.value && html`<p>No queues data. Click Connect.</p>`}
            `}
          </div>
        </div>
      </section>
    </div>
  `;
}
