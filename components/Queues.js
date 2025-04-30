import { html } from 'htm/preact';
import Pagination from './Pagination.js';

export default function Queues({ loading, error, queuesData, queueSortField, queueSortDir, changeSort, prevPage, nextPage, goPage, vhosts, selectedVhost, onVhostChange, onRefresh }) {

  return html`
    <div>
      <h1 class="title">Queues</h1>
      <div class="field">
        <label class="label">VHost</label>
        <div class="control">
          <div class="select">
            <select value=${selectedVhost.value} onChange=${e => onVhostChange(e.target.value)}>
              <option value="all">All</option>
              ${vhosts.value.map(vh => html`<option value=${vh}>${vh}</option>`)}
            </select>
          </div>
        </div>
      </div>
      <div class="level">
        <div class="level-left"></div>
        <div class="level-right">
          <div class="level-item">
            <button
              class="button is-small is-primary ${loading.value ? 'is-loading' : ''}"
              onClick=${onRefresh}
              disabled=${loading.value}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
      ${queuesData.value && queuesData.value.items && queuesData.value.items.length > 0 && html`
        <div class="table-container">
          ${(() => {
            const items = queuesData.value.items;
            const keySet = new Set();
            items.forEach(item => Object.keys(item).forEach(k => keySet.add(k)));
            const keys = Array.from(keySet).sort((a, b) => a.localeCompare(b));
            const renderValue = val => {
              if (val == null) return '';
              if (typeof val === 'boolean') return val ? '✔' : '';
              if (typeof val === 'object') return JSON.stringify(val);
              return String(val);
            };
            return html`
              <table class="table is-fullwidth is-striped is-hoverable is-narrow">
                <thead>
                  <tr>
                    ${keys.map(key => {
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return html`<th onClick=${() => changeSort(key)} style="cursor:pointer;">${label} ${queueSortField.value === key ? (queueSortDir.value === 'asc' ? '▲' : '▼') : ''}</th>`;
                    })}
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => html`<tr>${keys.map(key => html`<td>${renderValue(item[key])}</td>`)}</tr>`)}
                </tbody>
              </table>
            `;
          })()}
          <${Pagination}
            page=${queuesData.value.page}
            totalPages=${queuesData.value.totalPages}
            prevPage=${prevPage}
            nextPage=${nextPage}
            goPage=${goPage}
          />
        </div>
      `}
      ${queuesData.value && queuesData.value.items && queuesData.value.items.length === 0 && html`<p>No queues found.</p>`}
      ${!queuesData.value && html`<p>No queues data. Select a vhost and refresh.</p>`}
    </div>
  `;
}