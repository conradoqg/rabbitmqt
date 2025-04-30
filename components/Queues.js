import { html } from 'htm/preact';
import Pagination from './Pagination.js';

export default function Queues({ loading, error, queuesData, queueSortField, queueSortDir, changeSort, prevPage, nextPage, goPage }) {

  return html`
    <div>
      <h1 class="title">Queues</h1>
      ${loading.value && html`<p>Loading...</p>`}
      ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
      ${!loading.value && !error.value && queuesData.value && queuesData.value.items && queuesData.value.items.length > 0 && html`
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable is-narrow is-size-7">
            <thead>
              <tr>
                <th onClick=${() => changeSort('name')} style="cursor:pointer;">Name ${queueSortField.value==='name' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('vhost')} style="cursor:pointer;">VHost ${queueSortField.value==='vhost' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('messages')} style="cursor:pointer;">Total ${queueSortField.value==='messages' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('ready')} style="cursor:pointer;">Ready ${queueSortField.value==='ready' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('unack')} style="cursor:pointer;">Unacked ${queueSortField.value==='unack' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('rate')} style="cursor:pointer;">Rate ${queueSortField.value==='rate' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('consumers')} style="cursor:pointer;">Consumers ${queueSortField.value==='consumers' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
                <th onClick=${() => changeSort('memory')} style="cursor:pointer;">Memory ${queueSortField.value==='memory' ? (queueSortDir.value==='asc'?'▲':'▼') : ''}</th>
              </tr>
            </thead>
            <tbody>
              ${queuesData.value.items.map(q => html`
                <tr>
                  <td>${q.name}</td>
                  <td>${q.vhost}</td>
                  <td>${q.messages}</td>
                  <td>${q.messages_ready}</td>
                  <td>${q.messages_unacknowledged}</td>
                  <td>${q.message_stats && q.message_stats.deliver_details
                      ? q.message_stats.deliver_details.rate.toFixed(2)
                      : (q.messages_details ? q.messages_details.rate.toFixed(2) : '0')}</td>
                  <td>${q.consumers}</td>
                  <td>${(q.memory / 1024).toFixed(1)} KB</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <${Pagination}
          page=${queuesData.value.page}
          totalPages=${queuesData.value.totalPages}
          prevPage=${prevPage}
          nextPage=${nextPage}
          goPage=${goPage}
        />
      `}
      ${!loading.value && !error.value && queuesData.value && queuesData.value.items && queuesData.value.items.length === 0 && html`<p>No queues found.</p>`}
      ${!loading.value && !error.value && !queuesData.value && html`<p>No queues data. Click Connect.</p>`}
    </div>
  `;
}