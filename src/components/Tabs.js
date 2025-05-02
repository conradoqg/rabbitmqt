import { html } from 'htm/preact';
import { activeTab, changeTab } from '../store.js';

export default function Tabs() {
  const tabs = ['overview', 'exchanges', 'queues'];
  return html`
    <div class="tabs is-boxed">
      <ul>
        ${tabs.map(tab => html`
          <li class=${activeTab.value === tab ? 'is-active' : ''}>
            <a onClick=${() => changeTab(tab)}>${tab.charAt(0).toUpperCase() + tab.slice(1)}</a>
          </li>
        `)}
      </ul>
    </div>
  `;
}