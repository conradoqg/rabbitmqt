import { html } from 'htm/preact';
import { useEffect } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { vhosts, url, username, fetchProxy, PAGE_SIZE, activeTab } from '../store.js';
import Pagination from './Pagination.js';

export default function GenericList({
  title,
  route,
  columns,
  // initial sort field and direction
  defaultSortField = 'name',
  defaultSortDir = 'asc'
}) {
  const data = useSignal(null);
  const loading = useSignal(false);
  const error = useSignal(null);
  const page = useSignal(1);
  // Sort field and direction, initialized from props
  const sortField = useSignal(defaultSortField);
  const sortDir = useSignal(defaultSortDir);
  const selectedVhost = useSignal('all');
  const itemsPerPage = useSignal(PAGE_SIZE);
  const searchName = useSignal('');
  const searchUseRegex = useSignal(false);
  const visibleColumns = useSignal([]);
  // Determine if hard-coded columns metadata is provided
  const columnsProvided = Array.isArray(columns) && columns.length > 0;

  async function fetchList() {
    if (!url.value || !username.value) {
      error.value = 'URL and username are required';
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const vh = selectedVhost.value;
      const encodedVhost = vh === '/' ? '%252F' : encodeURIComponent(vh);
      const basePath = vh === 'all'
        ? `/api/${route}`
        : `/api/${route}/${encodedVhost}`;
      let params = `?page=${page.value}&page_size=${itemsPerPage.value}` +
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

  // Toggle sort direction, resetting to default on new field
  function changeSort(field) {
    if (sortField.value === field) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortField.value = field;
      sortDir.value = defaultSortDir;
    }
    page.value = 1;
    fetchList();
  }

  function prevPage() {
    if (page.value > 1) {
      page.value--;
      fetchList();
    }
  }

  function nextPage() {
    if (data.value && page.value < data.value.totalPages) {
      page.value++;
      fetchList();
    }
  }

  function goPage(n) {
    if (n !== page.value) {
      page.value = n;
      fetchList();
    }
  }

  function changeVhost(vh) {
    selectedVhost.value = vh;
    page.value = 1;
    fetchList();
  }

  const items = data.value?.items || [];
  // Determine columns: use provided metadata or infer keys dynamically
  let allKeys = [];
  const headerNamesMap = {};
  if (columnsProvided) {
    allKeys = columns.map(c => c.field);
    columns.forEach(c => { headerNamesMap[c.field] = c.displayName; });
  } else {
    const keySet = new Set();
    items.forEach(item => Object.keys(item).forEach(k => keySet.add(k)));
    allKeys = Array.from(keySet).sort((a, b) => a.localeCompare(b));
    allKeys.forEach(key => {
      headerNamesMap[key] = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    });
  }

  useEffect(() => {
    if (columnsProvided) {
      // initialize visible columns to metadata-defined fields
      visibleColumns.value = allKeys;
    } else if (allKeys.length > 0 && visibleColumns.value.length === 0) {
      visibleColumns.value = allKeys;
    }
  }, [data.value]);


  // Fetch list when vhosts are loaded and this tab becomes active
  useEffect(() => {
    if (
      vhosts.value.length > 0 &&
      !data.value &&
      !loading.value &&
      activeTab.value === route
    ) {
      fetchList();
    }
  }, [vhosts.value, activeTab.value]);
  // Handler for changing items per page
  function changePageSize(size) {
    itemsPerPage.value = size;
    page.value = 1;
    fetchList();
  }

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

  // Map field to column metadata for custom rendering
  const columnsMap = {};
  if (columnsProvided) {
    columns.forEach(c => { columnsMap[c.field] = c; });
  }
  // Helper to get nested value by dot-separated path (e.g., 'a.b.c')
  const getValueByPath = (obj, path) =>
    path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);

  return html`
    <div class="flex flex-col h-full">
      <h1 class="text-2xl font-bold mb-4">${title}</h1>
      <div class="flex flex-wrap justify-between items-center mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center join">
            <select
              class="select select-bordered join-item"
              value=${selectedVhost.value}
              onChange=${e => { selectedVhost.value = e.target.value }}
              disabled=${loading.value}
            >
              <option value="all">All</option>
              ${vhosts.value.map(vh => html`<option key=${vh} value=${vh}>${vh}</option>`)}
            </select>
            <button
              class="btn btn-secondary join-item"
              onClick=${() => changeVhost(selectedVhost.value)}
              disabled=${loading.value}
            ><i class="mdi mdi-arrow-right-bold"></i></button>
          </div>
          <div class="flex items-center join">
            <input
              class="input input-bordered flex-grow join-item"
              type="text"
              placeholder="Search"
              value=${searchName.value}
              disabled=${loading.value}
              onInput=${e => (searchName.value = e.target.value)}
              onKeyDown=${e => { if (e.key === 'Enter') { page.value = 1; fetchList(); } }}
            />
            <button
              class=${`btn ${searchUseRegex.value ? 'btn-secondary' : ''} join-item`}
              onClick=${() => { searchUseRegex.value = !searchUseRegex.value }}
              disabled=${loading.value}
            ><i class="mdi mdi-regex"></i></button>
            <button
              class="btn btn-secondary join-item"
              onClick=${() => { searchName.value = ''; fetchList(); }}
              disabled=${loading.value}
            ><i class="mdi mdi-cancel"></i></button>
            <button
              class="btn btn-secondary join-item"
              onClick=${() => { page.value = 1; fetchList(); }}
              disabled=${loading.value}
            ><i class="mdi mdi-magnify"></i></button>
          </div>
          <div class="flex items-center join">
            <select
              class="select select-bordered join-item"
              value=${sortField.value}
              onChange=${e => { sortField.value = e.target.value }}
              disabled=${loading.value}
            >
              ${allKeys.map(key => html`
                <option key=${key} value=${key}>${headerNamesMap[key] || key}</option>
              `)}
            </select>
            <select
              class="select select-bordered join-item"
              value=${sortDir.value}
              onChange=${e => { sortDir.value = e.target.value }}
              disabled=${loading.value}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <button
              class="btn btn-secondary join-item"
              onClick=${() => { page.value = 1; fetchList(); }}
              disabled=${loading.value}
            ><i class="mdi mdi-sort"></i></button>
          </div>
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-secondary" disabled=${loading.value}><i class="mdi mdi-view-column"></i></label>
            <ul
              tabindex="0"
              class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              ${allKeys.map(key => html`
                <li>
                  <label class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked=${visibleColumns.value.includes(key)}
                      onChange=${() => toggleColumn(key)}
                    /> ${headerNamesMap[key] || key}
                  </label>
                </li>
              `)}
            </ul>
          </div>
        </div>
        <button
          class=${`btn btn-primary ${loading.value ? 'loading' : ''}`}
          onClick=${fetchList}
          disabled=${loading.value}
        >Refresh</button>
      </div>      
      ${error.value && html`<div class="alert alert-error mb-4"><div>${error.value}</div></div>`}
      ${data.value && data.value.items && data.value.items.length > 0 && html`
        <div class="card bg-base-100 shadow mb-4">
          <div class="card-body p-0">
            <div class="overflow-x-auto overflow-y-auto max-h-[calc(100vh-21rem)]">
              ${(() => {
        const items = data.value.items;
        const renderValue = val => {
          if (val == null) return '';
          if (typeof val === 'boolean') return val ? '✔' : '✖';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        };
        // Compute header grouping based on column metadata
        const headerGroups = [];
        if (columnsProvided) {
          const groupList = visibleColumns.value.map(key => columnsMap[key]?.group || '');
          let lastGroup = null;
          let span = 0;
          groupList.forEach((g, idx) => {
            if (idx === 0) {
              lastGroup = g;
              span = 1;
            } else if (g === lastGroup) {
              span++;
            } else {
              headerGroups.push({ group: lastGroup, span });
              lastGroup = g;
              span = 1;
            }
          });
          headerGroups.push({ group: lastGroup, span });
        }
        const showHeaderGroups = headerGroups.some(hg => hg.group);
        return html`
                  <table class="table table-xs w-full max-h-[calc(100vh-21rem)]">
                    <thead>
                      ${showHeaderGroups && html`
                        <tr>
                          ${headerGroups.map(hg => html`
                            <th
                              colspan=${hg.span}
                              class="sticky top-0 bg-base-100 z-20 text-center"
                            >
                              ${hg.group}
                            </th>
                          `)}
                        </tr>
                      `}
                      <tr>
                        ${visibleColumns.value.map(key => html`
                          <th class="sticky top-7 bg-base-100 z-10">
                            ${headerNamesMap[key] || key}
                          </th>
                        `)}
                      </tr>
                    </thead>
                    <tbody>
                      ${items.map(item => html`
                        <tr class="hover:bg-base-200">
                          ${visibleColumns.value.map(key => {
          const colMeta = columnsMap[key] || {};
          const val = getValueByPath(item, key);
          if (colMeta.component) {
            return html`<td><${colMeta.component} value=${val} item=${item} /></td>`;
          }
          if (colMeta.render) {
            return html`<td>${colMeta.render(val, item)}</td>`;
          }
          return html`<td>${renderValue(val)}</td>`;
        })}
                        </tr>
                      `)}
                    </tbody>
                  </table>
                `;
      })()}
            </div>
            <div class="card-actions justify-center p-4">
              <${Pagination}
                page=${page.value}
                totalPages=${data.value.totalPages}
                prevPage=${prevPage}
                nextPage=${nextPage}
                goPage=${goPage}
                itemsPerPage=${itemsPerPage.value}
                onChangeItemsPerPage=${changePageSize}
              />
            </div>
          </div>
        </div>
      `}
      ${data.value && data.value.items && data.value.items.length === 0 && html`
        <p class="text-center">No ${route} found.</p>
      `}
      ${!data.value && html`
        <p class="text-center">No ${route} data. Select a vhost and refresh.</p>
      `}
    </div>
  `;
}
