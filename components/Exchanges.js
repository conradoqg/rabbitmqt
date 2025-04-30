import { html } from 'htm/preact';
import Pagination from './Pagination.js';

export default function Exchanges({ loading, error, exchangesData, exchangeSortField, exchangeSortDir, changeSort, prevPage, nextPage, goPage }) {
  return html`
    <div>
      <h1 class="title">Exchanges</h1>
      ${loading.value && html`<p>Loading...</p>`}
      ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
      ${!loading.value && !error.value && exchangesData.value && exchangesData.value.items && exchangesData.value.items.length > 0 && html`
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable is-narrow">
            <thead>
              <tr>
                <th onClick=${() => changeSort('name')} style="cursor:pointer;">Name ${exchangeSortField.value==='name' ? (exchangeSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('vhost')} style="cursor:pointer;">VHost ${exchangeSortField.value==='vhost' ? (exchangeSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('type')} style="cursor:pointer;">Type ${exchangeSortField.value==='type' ? (exchangeSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('policy')} style="cursor:pointer;">Policy ${exchangeSortField.value==='policy' ? (exchangeSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('durable')} style="cursor:pointer;">Durable ${exchangeSortField.value==='durable' ? (exchangeSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('auto_delete')} style="cursor:pointer;">Auto Delete ${exchangeSortField.value==='auto_delete' ? (exchangeSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('internal')} style="cursor:pointer;">Internal ${exchangeSortField.value==='internal' ? (exchangeSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('message_stats.publish_in_details.rate')} style="cursor:pointer;">
                  In/s ${exchangeSortField.value === 'message_stats.publish_in_details.rate' ? (exchangeSortDir.value === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick=${() => changeSort('message_stats.publish_out_details.rate')} style="cursor:pointer;">
                  Out/s ${exchangeSortField.value === 'message_stats.publish_out_details.rate' ? (exchangeSortDir.value === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              ${exchangesData.value.items.map(ex => {
                const inRate = ex.message_stats && ex.message_stats.publish_in_details ? ex.message_stats.publish_in_details.rate.toFixed(2) : '0';
                const outRate = ex.message_stats && ex.message_stats.publish_out_details ? ex.message_stats.publish_out_details.rate.toFixed(2) : '0';
                return html`
                <tr>
                  <td title=${ex.name}>${ex.name || '<default>'}</td>
                  <td>${ex.vhost}</td>
                  <td>${ex.type}</td>
                  <td>${ex.policy || ''}</td>
                  <td>${ex.durable ? '✔' : ''}</td>
                  <td>${ex.auto_delete ? '✔' : ''}</td>
                  <td>${ex.internal ? '✔' : ''}</td>
                  <td>${inRate}</td>
                  <td>${outRate}</td>
                </tr>
              `})}
            </tbody>
          </table>
        </div>
        <${Pagination}
          page=${exchangesData.value.page}
          totalPages=${exchangesData.value.totalPages}
          prevPage=${prevPage}
          nextPage=${nextPage}
          goPage=${goPage}
        />
      `}
      ${!loading.value && !error.value && exchangesData.value && exchangesData.value.items && exchangesData.value.items.length === 0 && html`<p>No exchanges found.</p>`}
      ${!loading.value && !error.value && !exchangesData.value && html`<p>No exchanges data. Click Connect.</p>`}
    </div>
  `;
}