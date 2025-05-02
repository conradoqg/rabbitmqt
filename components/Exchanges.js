import { html } from 'htm/preact';
import { useEffect, useRef } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { vhosts, url, username, fetchProxy, PAGE_SIZE } from '../store.js';
import Pagination from './Pagination.js';

export default function Exchanges() {
  // Local state for exchanges
  const data = useSignal(null);
  const loading = useSignal(false);
  const error = useSignal(null);
  const page = useSignal(1);
  const sortField = useSignal('name');
  const sortDir = useSignal('asc');
  const selectedVhost = useSignal('all');
  const searchName = useSignal('');
  const searchUseRegex = useSignal(false);
  // CRUD functions for exchanges
  async function fetchExchanges() {
    if (!url.value || !username.value) {
      error.value = 'URL and username are required';
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const vh = selectedVhost.value;
      const basePath = vh === 'all'
        ? '/api/exchanges'
        : `/api/exchanges/${vh === '/' ? '%252F' : encodeURIComponent(vh)}`;
      let params = `?page=${page.value}&page_size=${PAGE_SIZE}` +
        `&sort=${sortField.value}` +
        `&sort_reverse=${sortDir.value === 'desc'}`;
      if (searchName.value) {
        params += `&name=${encodeURIComponent(searchName.value)}`;
      }
      params += `&use_regex=${searchUseRegex.value}`;
      const res = await fetchProxy(basePath + params);
      const json = await res.json();
      data.value = {
        items: json.items || [],
        totalPages: json.page_count,
        page: json.page,
      };
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }
  function changeExchangeSort(field) {
    if (sortField.value === field) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortField.value = field;
      sortDir.value = 'asc';
    }
    page.value = 1;
    fetchExchanges();
  }
  function prevExchangePage() {
    if (page.value > 1) {
      page.value--;
      fetchExchanges();
    }
  }
  function nextExchangePage() {
    if (data.value && page.value < data.value.totalPages) {
      page.value++;
      fetchExchanges();
    }
  }
  function goExchangePage(n) {
    if (n !== page.value) {
      page.value = n;
      fetchExchanges();
    }
  }
  function changeExchangeVhost(vh) {
    selectedVhost.value = vh;
    page.value = 1;
    fetchExchanges();
  }
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
  // Auto-fetch exchanges once when vhosts load
  useEffect(() => {
    if (vhosts.value.length > 0 && !data.value && !loading.value) {
      fetchExchanges();
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
      <h1 class="title">Exchanges</h1>
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <div class="field has-addons">
              <div class="control">
                <div class="select">
                  <select value=${selectedVhost.value} onChange=${e => { selectedVhost.value = e.target.value }}>
                    <option value="all">All</option>
                    ${vhosts.value.map(vh => html`<option key=${vh} value=${vh}>${vh}</option>`)}
                  </select>
                </div>
              </div>
              <div class="control">
                <button class="button is-link" onClick=${() => changeExchangeVhost(selectedVhost.value)} disabled=${loading.value}>
                  Change
                </button>
              </div>
            </div>
          </div>
          <div class="level-item">
            <div class="field has-addons">
              <div class="control">
                <input
                  class="input"
                  type="text"
                  placeholder="Search"
                  value=${searchName.value}
                  onInput=${e => searchName.value = e.target.value}
                  onKeyDown=${e => { if (e.key === 'Enter') { page.value = 1; fetchExchanges(); } }}
                />
              </div>
              <div class="control">
                <button 
                  class="button ${searchUseRegex.value ? 'is-success' : ''}"
                  onClick=${() => { searchUseRegex.value = !searchUseRegex.value }}
                  disabled=${loading.value}
                >
                  <i class="mdi mdi-regex is-small"></i>
                </button>                
              </div>
              <div class="control">
                <button 
                  class="button "
                  onClick=${() => { searchName.value = ''; fetchExchanges(); }}
                  disabled=${loading.value}
                >
                  <i class="mdi mdi-cancel"></i>
                </button>                
              </div>
              <div class="control">
                <button 
                  class="button is-link"
                  onClick=${() => { page.value = 1; fetchExchanges(); }}
                  disabled=${loading.value}
                >
                <i class="mdi mdi-magnify"></i>
                </button>                
              </div>
            </div>
          </div>
          <div class="level-item">
            <div class="field has-addons">
              <div class="control">
                <div class="select">
                  <select value=${sortField.value} onChange=${e => { sortField.value = e.target.value; }}>
                    ${allKeys.map(key => html`<option key=${key} value=${key} selected=${sortField.value === key}>${key}</option>`)}
                  </select>
                </div>
              </div>
              <div class="control">
                <div class="select">
                  <select value=${sortDir.value} onChange=${e => { sortDir.value = e.target.value; }}>
                    <option value=asc selected=${sortDir.value === 'asc'}>Asc</option>
                    <option value=desc selected=${sortDir.value === 'desc'}>Desc</option>
                  </select>
                </div>
              </div>
              <div class="control">
                <button class="button is-link" onClick=${() => { page.value = 1; fetchExchanges(); }} disabled=${loading.value}>
                  <i class="mdi mdi-sort"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="level-item">
            <div class="field">
              <div class="control">
                <div class="dropdown ${dropdownOpen.value ? 'is-active' : ''}" ref=${dropdownRef}>
                  <div class="dropdown-trigger">
                    <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" onClick=${() => dropdownOpen.value = !dropdownOpen.value}>
                      <span>Columns </span>
                      <span class="icon is-small">
                        <i class="fas fa-angle-down" aria-hidden="true"></i>
                      </span>
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
                              /> ${label}</label>
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
            <button 
              class="button is-primary ${loading.value ? 'is-loading' : ''}" 
              onClick=${fetchExchanges} 
              disabled=${loading.value}>
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
          return html`<th>${label}</th>`;
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
            prevPage=${prevExchangePage}
            nextPage=${nextExchangePage}
            goPage=${goExchangePage}
          />
      `}
      ${data.value && data.value.items && data.value.items.length === 0 && html`<p>No exchanges found.</p>`}
      ${!data.value && html`<p>No exchanges data. Select a vhost and refresh.</p>`}
    </div>
  `;
}