import { html } from 'htm/preact';
import { useEffect, useRef } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import {
  queues,
  vhosts,
  fetchQueues,
  changeQueueSort,
  prevQueuePage,
  nextQueuePage,
  goQueuePage,
  changeQueueVhost,
} from '../store.js';
import Pagination from './Pagination.js';

export default function Queues() {
  const { data, loading, error, page, sortField, sortDir, selectedVhost, searchName, searchUseRegex } = queues;
  const visibleColumns = useSignal([]);
  const dropdownOpen = useSignal(false);
  const dropdownRef = useRef(null);

  const items = data.value?.items || [];
  const keySet = new Set();
  items.forEach(item => Object.keys(item).forEach(k => keySet.add(k)));
  const allKeys = Array.from(keySet).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (allKeys.length > 0 && visibleColumns.value.length === 0) {
      visibleColumns.value = allKeys;
    }
  }, [data.value]);
  useEffect(() => {
    const handleClick = e => {
      if (dropdownOpen.value && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        dropdownOpen.value = false;
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  // When vhosts list is loaded, auto-fetch queues if none loaded yet
  useEffect(() => {
    if (vhosts.value.length > 0 && !data.value) {
      fetchQueues();
    }
  }, [vhosts.value]);

  const toggleColumn = key => {
    const cols = visibleColumns.value;
    const newSet = new Set(cols);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    visibleColumns.value = allKeys.filter(k => newSet.has(k));
  };
  return html`
    <div>
      <h1 class="title">Queues</h1>
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <div class="field">
              <label class="label">VHost</label>
              <div class="control">
                <div class="select">
                  <select value=${selectedVhost.value} onChange=${e => changeQueueVhost(e.target.value)}>
                    <option value="all">All</option>
                    ${vhosts.value.map(vh => html`<option key=${vh} value=${vh}>${vh}</option>`)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="level-item">
            <button
              class="button is-primary ${loading.value ? 'is-loading' : ''}"
              onClick=${() => { page.value = 1; fetchQueues(); }}
              disabled=${loading.value}
            >
              Search
            </button>
          </div>
          <div class="level-item">
            <div class="field">
              <label class="label">Name</label>
              <div class="control">
                <input
                  class="input"
                  type="text"
                  placeholder="Search name"
                  value=${searchName.value}
                  onInput=${e => searchName.value = e.target.value}
                />
              </div>
            </div>
          </div>
          <div class="level-item">
            <div class="field">
              <label class="label">Regex</label>
              <div class="control">
                <label class="checkbox">
                  <input
                    type="checkbox"
                    checked=${searchUseRegex.value}
                    onChange=${e => searchUseRegex.value = e.target.checked}
                  />
                  Use regex
                </label>
              </div>
            </div>
          </div>
          <div class="level-item">
            <div class="field">
              <label class="label">Columns</label>
              <div class="control">
                <div class="dropdown ${dropdownOpen.value ? 'is-active' : ''}" ref=${dropdownRef}>
                  <div class="dropdown-trigger">
                    <button class="button " aria-haspopup="true" aria-controls="dropdown-menu" onClick=${() => dropdownOpen.value = !dropdownOpen.value}>
                      <span>Columns ${dropdownOpen.value ? '▲' : '▼'}</span>
                    </button>
                  </div>
                  <div class="dropdown-menu" id="dropdown-menu" role="menu">
                    <div class="dropdown-content">
                      ${allKeys.map(key => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return html`
                          <div class="dropdown-item">
                            <label class="checkbox">
                              <input
                                type="checkbox"
                                checked=${visibleColumns.value.includes(key)}
                                onChange=${() => toggleColumn(key)}
                              />
                              ${label}
                            </label>
                          </div>
                        `;
  })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <button class="button is-primary ${loading.value ? 'is-loading' : ''}" onClick=${fetchQueues} disabled=${loading.value}>
              Refresh
            </button>
          </div>
        </div>
      </div>
      ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
      ${data.value && data.value.items && data.value.items.length > 0 && html`
        <div class="table-container">
          ${(() => {
        const items = data.value.items;
        // visibleColumns state controls which columns to display
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
                    ${visibleColumns.value.map(key => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return html`<th onClick=${() => changeQueueSort(key)} style="cursor:pointer;">${label} ${sortField.value === key ? (sortDir.value === 'asc' ? '▲' : '▼') : ''}</th>`;
        })}
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => html`<tr>${visibleColumns.value.map(key => html`<td>${renderValue(item[key])}</td>`)}</tr>`)}
                </tbody>
              </table>
            `;
      })()}
        </div>
        <${Pagination}
            page=${page.value}
            totalPages=${data.value.totalPages}
            prevPage=${prevQueuePage}
            nextPage=${nextQueuePage}
            goPage=${goQueuePage}
          />
      `}
      ${data.value && data.value.items && data.value.items.length === 0 && html`<p>No queues found.</p>`}
      ${!data.value && html`<p>No queues data. Select a vhost and refresh.</p>`}
    </div>
  `;
}