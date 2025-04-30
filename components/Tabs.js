import { html } from 'htm/preact';

export default function Tabs({ activeTab, onChange }) {
  const tabs = ['overview', 'exchanges', 'queues'];
  return html`
    <div class="tabs is-boxed">
      <ul>
        ${tabs.map(
          tab => html`
            <li class=${activeTab.value === tab ? 'is-active' : ''}>
              <a onClick=${() => onChange(tab)}>${tab.charAt(0).toUpperCase() + tab.slice(1)}</a>
            </li>
          `
        )}
      </ul>
    </div>
  `;
}