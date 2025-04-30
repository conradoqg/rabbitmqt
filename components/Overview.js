import { html } from 'htm/preact';
import { overview, fetchData } from '../store.js';

export default function Overview() {
  const { loading, error } = overview;
  const data = overview.data.value;
  return html`
    <div>
      <h1 class="title">Overview</h1>
      <button class="button is-small is-primary ${loading.value ? 'is-loading' : ''}" onClick=${fetchData} disabled=${loading.value}>Refresh</button>
      ${loading.value && html`<p>Loading...</p>`}
      ${error.value && html`<p class="has-text-danger">${error.value}</p>`}
      ${!loading.value && !error.value && data && html`
        <div class="columns is-multiline">
          <div class="column is-one-third">
            <strong>Product</strong>
            <p>${data.product_name} ${data.product_version}</p>
            <strong>Cluster</strong>
            <p>${data.cluster_name}</p>
          </div>
          <div class="column is-one-third">
            <strong>Node</strong>
            <p>${data.node}</p>
            <strong>Erlang</strong>
            <p>${data.erlang_version}</p>
          </div>
          <div class="column is-one-third">
            <strong>Management Version</strong>
            <p>${data.management_version}</p>
            <strong>Rates Mode</strong>
            <p>${data.rates_mode}</p>
          </div>
        </div>
        <div class="columns">
        ${Object.entries(data.object_totals || {}).map(([key, val]) => html`
            <div class="column has-text-centered">
              <p class="title is-4">${val}</p>
              <p class="subtitle is-6">${key.charAt(0).toUpperCase() + key.slice(1)}</p>
            </div>
          `)}
        </div>
        <div class="columns">
          ${Object.entries(data.queue_totals || {}).filter(([k]) => !k.endsWith('_details')).map(([key, val]) => html`
            <div class="column has-text-centered">
              <p class="title is-4">${val}</p>
              <p class="subtitle is-6">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
          `)}
        </div>
        <div class="columns">
          ${['publish_details','deliver_details','ack_details'].map(metric => {
            const m = data.message_stats && data.message_stats[metric];
            const rate = m && m.rate != null ? m.rate.toFixed(2) : '0';
            const name = metric.replace(/_details$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return html`
            <div class="column has-text-centered">
              <p class="title is-4">${rate}</p>
              <p class="subtitle is-6">${name}/s</p>
            </div>
          `})}
        </div>
        <!-- General Info -->
        <h2 class="subtitle">General Info</h2>
        <table class="table is-fullwidth is-striped">
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
            ].map(([key, val]) => html`<tr><th>${key}</th><td>${String(val)}</td></tr>`)}
          </tbody>
        </table>

        <!-- Sample Retention Policies -->
        <h2 class="subtitle">Sample Retention Policies</h2>
        <table class="table is-fullwidth is-striped">
          <thead>
            <tr><th>Policy</th><th>Intervals (s)</th></tr>
          </thead>
          <tbody>
            ${Object.entries(data.sample_retention_policies || {}).map(([policy, intervals]) => html`
              <tr><td>${policy}</td><td>${intervals.join(', ')}</td></tr>
            `)}
          </tbody>
        </table>

        <!-- Exchange Types -->
        ${data.exchange_types?.length > 0 && html`
        <h2 class="subtitle">Exchange Types</h2>
        <table class="table is-fullwidth is-striped is-size-7">
          <thead><tr><th>Name</th><th>Description</th><th>Enabled</th><th>Purpose</th></tr></thead>
          <tbody>
            ${data.exchange_types?.map(ex => html`
              <tr>
                <td>${ex.name}</td>
                <td>${ex.description}</td>
                <td>${ex.enabled ? '✔' : ''}</td>
                <td>${ex.internal_purpose || ''}</td>
              </tr>
            `)}
          </tbody>
        </table>
        `}

        <!-- Message Stats -->
        <h2 class="subtitle">Message Stats</h2>
        <table class="table is-fullwidth is-striped is-size-7">
          <thead><tr><th>Metric</th><th>Count</th><th>Rate</th></tr></thead>
          <tbody>
            ${Object.entries(data.message_stats || {}).filter(([key]) => !key.endsWith('_details')).map(([key, val]) => {
              const details = data.message_stats[`${key}_details`];
              const rate = details && details.rate != null ? details.rate.toFixed(2) : '';
              return html`<tr><td>${key}</td><td>${val}</td><td>${rate}</td></tr>`;
            })}
          </tbody>
        </table>

        <!-- Churn Rates -->
        <h2 class="subtitle">Churn Rates</h2>
        <table class="table is-fullwidth is-striped is-size-7">
          <thead><tr><th>Metric</th><th>Count</th><th>Rate</th></tr></thead>
          <tbody>
            ${Object.entries(data.churn_rates || {}).filter(([key]) => !key.endsWith('_details')).map(([key, val]) => {
              const details = data.churn_rates[`${key}_details`];
              const rate = details && details.rate != null ? details.rate.toFixed(2) : '';
              return html`<tr><td>${key}</td><td>${val}</td><td>${rate}</td></tr>`;
            })}
          </tbody>
        </table>

        ${data.listeners?.length > 0 && html`
        <h2 class="subtitle">Listeners</h2>
        <table class="table is-fullwidth is-striped is-size-7">
          <thead><tr><th>Node</th><th>Protocol</th><th>IP Address</th><th>Port</th></tr></thead>
          <tbody>
            ${data.listeners?.map(l => html`
              <tr>
                <td>${l.node}</td>
                <td>${l.protocol}</td>
                <td>${l.ip_address}</td>
                <td>${l.port}</td>
              </tr>
            `)}
          </tbody>
        </table>
        `}
      `}
      ${!loading.value && !error.value && !data && html`<p>No overview data. Click Connect.</p>`}
    </div>
  `;
}