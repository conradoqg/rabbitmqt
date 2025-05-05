import { html } from 'htm/preact';
import { overview, fetchData } from '../store.js';
import RateRender from './cell/RateRender.js';
import NumberRender from './cell/NumberRender.js';

export default function Overview() {
  const { loading, error } = overview;
  const data = overview.data.value;
  const listeners = data?.listeners || [];
  const groupedListeners = listeners.reduce((acc, l) => {
    (acc[l.node] = acc[l.node] || []).push(l);
    return acc;
  }, {});
  const nbsp = '\xA0'

  return html`
    <div>
      <h1 class="text-2xl font-bold mb-4">Overview</h1>
      <div class="flex flex-wrap justify-between items-center mb-4">
        <div class="flex flex-wrap items-center gap-4"></div>
        <button 
          class=${`btn btn-primary`}          
          onClick=${fetchData} 
          disabled=${loading.value}>${loading.value ? html`<span class="loading loading-spinner"></span>` : 'Refresh'}
        </button>
      </div>      
      ${error.value && html`<div class="alert alert-error mb-4"><div>${error.value}</div></div>`}
      ${!loading.value && !error.value && data && html`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="space-y-1">
            <strong>Product</strong>
            <p>${data.product_name} ${data.product_version}</p>
            <strong>Cluster</strong>
            <p>${data.cluster_name}</p>
          </div>
          <div class="space-y-1">
            <strong>Node</strong>
            <p>${data.node}</p>
            <strong>Erlang</strong>
            <p>${data.erlang_version}</p>
          </div>
          <div class="space-y-1">
            <strong>Management Version</strong>
            <p>${data.management_version}</p>
            <strong>Rates Mode</strong>
            <p>${data.rates_mode}</p>
          </div>
        </div>
        <div class="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <div class="stats stats-vertical lg:stats-horizontal shadow">
          ${Object.entries(data.object_totals || {}).map(([key, val]) => html`
            <div class="stat">
              <div class="stat-value">${NumberRender(val)}</div>
              <div class="stat-desc">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
            </div>
          `)}
        </div>
        <div class="stats stats-vertical lg:stats-horizontal shadow">
          ${Object.entries(data.queue_totals || {}).filter(([k]) => !k.endsWith('_details')).map(([key, val]) => html`
            <div class="stat">
              <div class="stat-value">${NumberRender(val)}</div>
              <div class="stat-desc">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            </div>
          `)}
        </div>
        <div class="stats stats-vertical lg:stats-horizontal shadow">
          ${['publish_details', 'deliver_details', 'ack_details'].map(metric => {
    const m = data.message_stats && data.message_stats[metric];
    const rate = m && RateRender(m.rate);
    const name = metric.replace(/_details$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return html`
            <div class="stat">
              <div class="stat-value">${rate}</div>
              <div class="stat-desc">${name}/s</div>
            </div>
          `})}
        </div>
        </div>
        <div class="flex flex-wrap gap-4 mb-4">
          <div class="w-full md:w-1/2 lg:w-1/3">
            <h2 class="text-xl font-semibold mb-2">General Info</h2>
            <div class="overflow-x-auto">
              <table class="table table-xs table-zebra table-pin-rows w-full">
                <tbody>
                  ${[
        ['Product Name', data.product_name],
        ['Product Version', data.product_version],
        ['RabbitMQ Version', data.rabbitmq_version],
        ['Management Version', data.management_version],
        ['Rates Mode', data.rates_mode],
        ['Cluster Name', data.cluster_name],
        ['Node', data.node],
        ['Erlang Version', data.erlang_version],
        ['Erlang Full Version', data.erlang_full_version],
        ['Release Series Support Status', data.release_series_support_status],
        ['Disable Stats', data.disable_stats],
        ['Policy Updating Enabled', data.is_op_policy_updating_enabled],
        ['Enable Queue Totals', data.enable_queue_totals],
        ['Statistics DB Event Queue', data.statistics_db_event_queue]
      ].map(([key, val]) => html`<tr class="hover:bg-base-200"><th>${key}</th><td>${String(val)}</td></tr>`)}
                </tbody>
              </table>
            </div>
          </div>
          <div class="w-full md:w-1/2 lg:w-1/3">
            <h2 class="text-xl font-semibold mb-2">Sample Retention Policies</h2>
            <div class="overflow-x-auto">
              <table class="table table-xs table-zebra table-pin-rows w-full">
                <thead>
                  <tr><th>Policy</th><th>Intervals (s)</th></tr>
                </thead>
                <tbody>
                  ${Object.entries(data.sample_retention_policies || {}).map(([policy, intervals]) => html`<tr class="hover:bg-base-200"><td>${policy}</td><td>${intervals.join(', ')}</td></tr>`)}
                </tbody>
              </table>
            </div>
            ${data.exchange_types?.length > 0 && html`
            <h2 class="text-xl font-semibold mb-2">Exchange Types</h2>
            <div class="overflow-x-auto">
              <table class="table table-xs table-zebra table-pin-rows w-full">
                <thead><tr><th>Name</th><th>Description</th><th>Enabled</th><th>Purpose</th></tr></thead>
                <tbody>
                  ${data.exchange_types.map(ex => html`<tr class="hover:bg-base-200"><td>${ex.name}</td><td>${ex.description}</td><td>${ex.enabled ? '✔' : ''}</td><td>${ex.internal_purpose || ''}</td></tr>`)}
                </tbody>
              </table>
            </div>
            `}
          </div>          
          <div class="w-full md:w-1/2 lg:w-1/3">
            <h2 class="text-xl font-semibold mb-2">Message Stats</h2>
            <div class="overflow-x-auto">
              <table class="table table-xs table-zebra table-pin-rows w-full">
                <thead><tr><th>Metric</th><th>Count</th><th>Rate</th></tr></thead>
                <tbody>
                  ${Object.entries(data.message_stats || {}).filter(([key]) => !key.endsWith('_details')).map(([key, val]) => {
        const details = data.message_stats[`${key}_details`];
        const rate = details && details.rate != null ? details.rate.toFixed(2) : '';
        return html`<tr class="hover:bg-base-200"><td>${key}</td><td>${NumberRender(val)}</td><td>${RateRender(rate)}</td></tr>`;
      })}
                </tbody>
              </table>
            </div>
          </div>
          <div class="w-full md:w-1/2 lg:w-1/3">
            <h2 class="text-xl font-semibold mb-2">Churn Rates</h2>
            <div class="overflow-x-auto">
              <table class="table table-xs table-zebra table-pin-rows w-full">
                <thead><tr><th>Metric</th><th>Count</th><th>Rate</th></tr></thead>
                <tbody>
                  ${Object.entries(data.churn_rates || {}).filter(([key]) => !key.endsWith('_details')).map(([key, val]) => {
        const details = data.churn_rates[`${key}_details`];
        const rate = details && details.rate != null ? details.rate.toFixed(2) : '';
        return html`<tr class="hover:bg-base-200"><td>${key}</td><td>${NumberRender(val)}</td><td>${RateRender(rate)}</td></tr>`;
      })}
                </tbody>
              </table>
            </div>
          </div>
          ${listeners.length > 0 && html`
          <div class="w-full md:w-1/2 lg:w-1/3">
            <h2 class="text-xl font-semibold mb-2">Listeners</h2>
            <div class="overflow-x-auto">
              <table class="table table-xs table-zebra table-pin-rows w-full">
                <thead><tr><th>Protocol</th><th>IP Address</th><th>Port</th></tr></thead>
                <tbody>
                  ${Object.entries(groupedListeners).map(([node, ls]) => html`
                    <tr class="font-semibold bg-base-200"><td colspan="3">${node}</td></tr>
                    ${ls.map(l => html`
                      <tr class="hover:bg-base-200">
                        <td>${nbsp}${nbsp}${l.protocol}</td>
                        <td>${l.ip_address}</td>
                        <td>${l.port}</td>
                      </tr>
                    `)}
                  `)}
                </tbody>
              </table>
            </div>
          </div>
          `}
        </div>
        `}
      ${!loading.value && !error.value && !data && html`<p>No overview data. Click Connect.</p>`}
    </div>
  `;
}