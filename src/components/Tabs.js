import { html } from 'htm/preact';
import { activeTab, changeTab } from '../store.js';

export default function Tabs() {
  const tabs = ['overview', 'exchanges', 'queues'];
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