import { html } from 'htm/preact';
import { url, username, password, fetchData, overview } from '../store.js';

export default function NavBar() {
  return html`
    <nav class="navbar bg-base-100 shadow px-4">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl">RabbitMQ Management</a>
      </div>
      <div class="flex-none flex flex-wrap items-center gap-2">
        <input
          class="input input-bordered w-48"
          type="text"
          placeholder="URL"
          value=${url.value}
          onInput=${e => (url.value = e.target.value)}
          disabled=${overview.loading.value}
        />
        <input
          class="input input-bordered w-32"
          type="text"
          placeholder="Username"
          value=${username.value}
          onInput=${e => (username.value = e.target.value)}
          disabled=${overview.loading.value}
        />
        <input
          class="input input-bordered w-32"
          type="password"
          placeholder="Password"
          value=${password.value}
          onInput=${e => (password.value = e.target.value)}
          disabled=${overview.loading.value}
        />
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