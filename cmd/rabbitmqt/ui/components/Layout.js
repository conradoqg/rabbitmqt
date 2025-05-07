import { html } from 'htm/preact';
import { url, username, password, fetchData, overview, fastMode, activeTab, changeTab, toasts, VERSION } from '../store.js';

// Navigation bar component with connection inputs and controls
export function NavBar() {
  return html`
    <nav class="navbar bg-base-100 shadow px-4">
      <div class="flex-1">
        <a class="normal-case text-xl">
          RabbitMQT
          <span class="text-xs opacity-50 ml-2">v${VERSION}</span>
        </a>
      </div>
      <div class="flex-none flex flex-wrap items-center gap-2">
        <div class="relative">
          <input
            class="input input-bordered bg-base-200 w-48 pr-8"
            id="url"
            type="text"
            placeholder="URL"
            value=${url.value}
            onInput=${e => (url.value = e.target.value)}
            disabled=${overview.loading.value}
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick=${() => (url.value = '')}
            disabled=${overview.loading.value}
          >
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="relative">
          <input
            class="input input-bordered bg-base-200 w-32 pr-8"
            id="username"
            type="text"
            placeholder="Username"
            value=${username.value}
            onInput=${e => (username.value = e.target.value)}
            disabled=${overview.loading.value}
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick=${() => (username.value = '')}
            disabled=${overview.loading.value}
          >
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="relative">
          <input
            class="input input-bordered bg-base-200 w-32 pr-8"
            type="password"
            id="password"
            placeholder="Password"
            value=${password.value}
            onInput=${e => (password.value = e.target.value)}
            disabled=${overview.loading.value}
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick=${() => (password.value = '')}
            disabled=${overview.loading.value}
          >
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <button
          class=${`btn ml-2 ${fastMode.value ? 'btn-accent' : ''}`}
          type="button"
          title="Fast Mode (No Stats)"
          onClick=${() => (fastMode.value = !fastMode.value)}
          disabled=${overview.loading.value}
        >
          <i class="mdi mdi-flash"></i>
        </button>
        <button
          class=${`btn btn-primary ml-2`}
          disabled=${overview.loading.value}
          onClick=${fetchData}
        >
          ${overview.loading.value ? html`<span class="loading loading-spinner"></span>` : 'Connect'}
        </button>
      </div>
    </nav>
  `;
}

// Tabs for navigating between different management views
export function Tabs() {
  const tabs = ['overview', 'connections', 'channels', 'exchanges', 'queues'];
  return html`
    <div class="tabs tabs-boxed mb-4">
      ${tabs.map(tab => html`
        <a
          class=${`tab ${activeTab.value === tab ? 'tab-active' : ''}`}
          onClick=${() => changeTab(tab)}
        >
          ${tab.charAt(0).toUpperCase() + tab.slice(1)}
        </a>
      `)}
    </div>
  `;
}

// Toasts container for transient notifications
export function Toasts() {
  return html`
    <div class="fixed top-4 right-4 flex flex-col gap-2 z-50">
      ${toasts.value.map(t => html`
        <div class="toast">
          <div class=${`
            alert
            ${t.type === 'error' ? 'alert-error' : t.type === 'success' ? 'alert-success' : 'alert-info'}
          `}>
            <span>${t.message}</span>
          </div>
        </div>
      `)}
    </div>
  `;
}