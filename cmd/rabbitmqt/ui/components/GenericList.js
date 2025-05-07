import { html } from 'htm/preact';
import { useEffect } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { vhosts, url, username, fetchProxy, PAGE_SIZE, activeTab, addToast } from '../store.js';
// Inline Pagination component
function Pagination({ page, totalPages, prevPage, nextPage, goPage, itemsPerPage, onChangeItemsPerPage, disabled = false }) {
  const jumpPage = useSignal(String(page));

  useEffect(() => {
    jumpPage.value = String(page);
  }, [page]);

  // Calculate visible page links with ellipses
  let links = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) {
    links.push(1);
    if (start > 2) links.push('...');
  }
  for (let i = start; i <= end; i++) links.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) links.push('...');
    links.push(totalPages);
  }

  const handleJump = () => {
    const p0 = parseInt(jumpPage.value, 10);
    if (isNaN(p0)) return;
    const p = Math.max(1, Math.min(totalPages, p0));
    if (p !== page) goPage(p);
  };

  const onInputKeyDown = e => {
    if (e.key === 'Enter') handleJump();
  };

  return html`
    <div class="join">
      <button
        class=${`btn join-item ${(disabled || page === 1) ? 'btn-disabled' : ''}`}
        onClick=${prevPage}
        disabled=${disabled || page === 1}
      >
        Previous
      </button>
      ${links.map(link =>
    link === '...'
      ? html`<button class="btn join-item btn-disabled" disabled>…</button>`
      : html`<button
              class=${`btn join-item ${link === page ? 'btn-active' : ''}${disabled ? ' btn-disabled' : ''}`}
              onClick=${() => goPage(link)}
              disabled=${disabled}
            >
              ${link}
            </button>`
  )}
      <button
        class=${`btn join-item ${(disabled || page === totalPages) ? 'btn-disabled' : ''}`}
        onClick=${nextPage}
        disabled=${disabled || page === totalPages}
      >
        Next
      </button>
      <select
        class="select select-bordered join-item"
        value=${itemsPerPage}
        onChange=${e => onChangeItemsPerPage(parseInt(e.target.value, 10))}
        disabled=${disabled}
      >
        <option value="10">10</option>
        <option value="30">30</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <input
        class="input input-bordered join-item w-16 text-center"
        type="number"
        min="1"
        max=${totalPages}
        value=${jumpPage.value}
        onInput=${e => { jumpPage.value = e.target.value }}
        onKeyDown=${onInputKeyDown}
        disabled=${disabled}
      />
      <button
        class=${`btn join-item${disabled ? ' btn-disabled' : ''}`}
        onClick=${handleJump}
        disabled=${disabled}
      >
        <i class="mdi mdi-arrow-right-bold"></i>
      </button>
    </div>
  `;
}

export default function GenericList({
  title,
  route,
  columns, // optional array of column metadata; each may include: field, shortName, displayName, group, render, component, align, visible, sortable (default true)
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
  // Initialize list state from URL search params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('tab') !== route) return;
    const vh = sp.get('vhost');
    if (vh) selectedVhost.value = vh;
    const p = parseInt(sp.get('page'), 10);
    if (!isNaN(p) && p > 0) page.value = p;
    const sf = sp.get('sortField');
    if (sf) sortField.value = sf;
    const sd = sp.get('sortDir');
    if (sd === 'asc' || sd === 'desc') sortDir.value = sd;
    const ps = parseInt(sp.get('pageSize'), 10);
    if (!isNaN(ps) && ps > 0) itemsPerPage.value = ps;
    const s = sp.get('search');
    if (s != null) searchName.value = s;
    const rx = sp.get('regex');
    if (rx === 'true' || rx === 'false') searchUseRegex.value = (rx === 'true');
  }, []);

  // Helper to update URL search params on state change
  function updateURL() {
    if (typeof window === 'undefined' || !window.history || !window.history.pushState) return;
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', route);
    sp.set('vhost', selectedVhost.value);
    sp.set('page', String(page.value));
    sp.set('sortField', sortField.value);
    sp.set('sortDir', sortDir.value);
    sp.set('pageSize', String(itemsPerPage.value));
    if (searchName.value) sp.set('search', searchName.value);
    sp.set('regex', String(searchUseRegex.value));
    window.history.pushState(null, '', `${window.location.pathname}?${sp.toString()}`);
  }

  // Determine if hard-coded columns metadata is provided
  const columnsProvided = Array.isArray(columns) && columns.length > 0;
  // Prepare effective columns: shortName is header label, displayName is full display name (from tooltip)
  // const effectiveColumns = columnsProvided
  //   ? columns.map(c => ({ ...c, shortName: c.shortName, displayName: c.displayName }))
  //   : [];

  async function fetchList() {
    // If the selected vhost no longer exists on the server, reset to "all" and retry
    if (vhosts.value.length > 0 && selectedVhost.value !== 'all' && !vhosts.value.includes(selectedVhost.value)) {
      selectedVhost.value = 'all';
      page.value = 1;
      updateURL();
      return fetchList();
    }
    if (!url.value || !username.value) {
      // Notify missing credentials error via toast
      addToast('URL and username are required', 'error');
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
      // Handle server-side page_out_of_range error: bounce to the last valid page
      if (json.error === 'page_out_of_range') {
        const reason = json.reason || '';
        const lenMatch = reason.match(/len:\s*(\d+)/i);
        const sizeMatch = reason.match(/page size:\s*(\d+)/i);
        const totalCount = lenMatch ? parseInt(lenMatch[1], 10) : 0;
        const pageSize = sizeMatch ? parseInt(sizeMatch[1], 10) : itemsPerPage.value;
        const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));
        if (page.value !== lastPage) {
          page.value = lastPage;
          updateURL();
          return fetchList();
        }
        if (page.value !== 1) {
          page.value = 1;
          updateURL();
          return fetchList();
        }
      }
      // Client-side bounce: if page_count provided and requested page exceeds it, go to last page
      if (json.page_count > 0 && page.value > json.page_count) {
        page.value = json.page_count;
        updateURL();
        return fetchList();
      }
      // Normal response
      data.value = {
        items: json.items || [],
        totalPages: json.page_count,
        page: json.page,
      };
    } catch (e) {
      error.value = e.message;
      // Show error via toast
      addToast(e.message, 'error');
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
    updateURL();
  }

  function prevPage() {
    if (page.value > 1) {
      page.value--;
      fetchList();
      updateURL();
    }
  }

  function nextPage() {
    if (data.value && page.value < data.value.totalPages) {
      page.value++;
      fetchList();
      updateURL();
    }
  }

  function goPage(n) {
    if (n !== page.value) {
      page.value = n;
      fetchList();
      updateURL();
    }
  }

  function changeVhost(vh) {
    selectedVhost.value = vh;
    page.value = 1;
    fetchList();
    updateURL();
  }

  const items = data.value?.items || [];
  // Determine columns: use provided metadata or infer keys dynamically
  let allKeys = [];
  const headerNamesMap = {};
  if (columnsProvided) {
    allKeys = columns.map(c => c.field);
    columns.forEach(c => { headerNamesMap[c.field] = c.shortName; });
  } else {
    const keySet = new Set();
    items.forEach(item => Object.keys(item).forEach(k => keySet.add(k)));
    allKeys = Array.from(keySet).sort((a, b) => a.localeCompare(b));
    allKeys.forEach(key => {
      headerNamesMap[key] = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    });
  }

  useEffect(() => {
    // Initialize visible columns only once (when none are selected)
    if (columnsProvided && visibleColumns.value.length === 0) {
      visibleColumns.value = columns
        .filter(c => c.visible !== false)
        .map(c => c.field);
    } else if (!columnsProvided && allKeys.length > 0 && visibleColumns.value.length === 0) {
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
    updateURL();
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

  // Map field to column metadata for custom rendering and labels
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
            <div class="relative join-item flex-grow">
              <input
                class="input input-bordered bg-base-200 w-full pr-8"
                type="text"
                placeholder="Search"
                value=${searchName.value}
                disabled=${loading.value}
                onInput=${e => (searchName.value = e.target.value)}
                onKeyDown=${e => { if (e.key === 'Enter') { page.value = 1; fetchList(); updateURL(); } }}
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick=${() => { searchName.value = ''; fetchList(); updateURL(); }}
                disabled=${loading.value}
              >
                <i class="mdi mdi-close"></i>
              </button>
            </div>
            <button
              class=${`btn ${searchUseRegex.value ? 'btn-accent' : ''} join-item`}
              onClick=${() => { searchUseRegex.value = !searchUseRegex.value }}
              disabled=${loading.value}
            ><i class="mdi mdi-regex"></i></button>
            <button
              class="btn btn-secondary join-item"
              onClick=${() => { page.value = 1; fetchList(); updateURL(); }}
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
              ${allKeys
      .filter(key => columnsMap[key]?.sortable !== false)
      .map(key => html`
                  <option key=${key} value=${key}>
                    ${columnsMap[key]?.group
          ? `${columnsMap[key].group}: ${columnsMap[key]?.displayName || headerNamesMap[key] || key}`
          : (columnsMap[key]?.displayName || headerNamesMap[key] || key)}
                  </option>
                `)}
            </select>
            <select
              class="select select-bordered join-item"
              style="width:auto"
              value=${sortDir.value}
              onChange=${e => { sortDir.value = e.target.value }}
              disabled=${loading.value}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <button
              class="btn btn-secondary join-item"
              onClick=${() => { page.value = 1; fetchList(); updateURL(); }}
              disabled=${loading.value}
            ><i class="mdi mdi-sort"></i></button>
          </div>
          <div class="dropdown dropdown-center">
            <label tabindex="0" class="btn btn-secondary" disabled=${loading.value}><i class="mdi mdi-view-column"></i></label>
            <div tabindex="0" class="dropdown-content shadow bg-base-100 rounded-box w-80 max-h-80 overflow-y-auto p-2 flex flex-col gap-2">
              ${allKeys.map(key => html`
                <label class="flex items-center gap-2 whitespace-normal">
                  <input
                    type="checkbox"
                    checked=${visibleColumns.value.includes(key)}
                    onChange=${() => toggleColumn(key)}
                  />
                  <span>
                    ${columnsMap[key]?.group
              ? `${columnsMap[key].group}: ${columnsMap[key]?.displayName || headerNamesMap[key] || key}`
              : (columnsMap[key]?.displayName || headerNamesMap[key] || key)}
                  </span>
                </label>
              `)}
            </div>
          </div>
        </div>
        <button
          class=${`btn btn-primary`}
          onClick=${fetchList}
          disabled=${loading.value}
        >${loading.value ? html`<span class="loading loading-spinner"></span>` : 'Refresh'}</button>
      </div>      
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
          if (typeof val === 'number') return val.toString()
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
                  <table class="table table-xs table-auto w-full min-w-max max-h-[calc(100vh-21rem)] whitespace-nowrap">
                    <thead>
                      ${showHeaderGroups && html`
                        <tr>
                          ${headerGroups.map(hg => html`
                            <th
                              colspan=${hg.span}
                              class="sticky top-0 bg-base-100 z-20 text-center border-l border-l-base-300 border-r border-r-base-300"
                            >
                              ${hg.group}
                            </th>
                          `)}
                        </tr>
                      `}
                      <tr>
                        ${visibleColumns.value.map(key => {
          const colMeta = columnsMap[key] || {};
          // Align and width classes; use width class from column metadata if provided
          // Apply text alignment: use configured align or default to left
          const baseClass = colMeta.align ? `text-${colMeta.align}` : 'text-left';
          const widthClass = colMeta.width ? ` ${colMeta.width}` : '';
          const alignClass = `${baseClass}${widthClass}`;
          return html`
                            <th class=${`sticky top-7 bg-base-100 z-10 ${alignClass}`}>
                              ${headerNamesMap[key] || key}
                              ${colMeta.displayName && html`
                                <span class="ml-1 cursor-help" title=${colMeta.displayName}>
                                  <i class="mdi mdi-information"></i>
                                </span>
                              `}
                            </th>
                          `;
        })}
                      </tr>
                    </thead>
                    <tbody>
                      ${items.map(item => html`
                        <tr class="hover:bg-base-200">
                          ${visibleColumns.value.map(key => {
          const colMeta = columnsMap[key] || {};
          const val = getValueByPath(item, key);
          // Align and width classes; use width class from column metadata if provided
          // Apply text alignment: use configured align or default to left
          const baseClass = colMeta.align ? `text-${colMeta.align}` : 'text-left';
          const widthClass = colMeta.width ? ` ${colMeta.width}` : '';
          const alignClass = `${baseClass}${widthClass}`;
          if (colMeta.component) {
            return html`<td class=${alignClass}><${colMeta.component} value=${val} item=${item} /></td>`;
          }
          if (colMeta.render) {
            return html`<td class=${alignClass}>${colMeta.render(val, item)}</td>`;
          }
          return html`<td class=${alignClass}>${renderValue(val)}</td>`;
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
                disabled=${loading.value}
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
