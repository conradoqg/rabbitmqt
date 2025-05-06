import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import {
  NameCell,
  StateCell,
  RecordCell,
  GroupMessageRateCell,
  GroupMessagesCell,
  GroupBytesCell,
  ArrayCell,
  ConfirmQueueCell,
  TimestampRender,
  NumberRender,
  ByteRender,
  RateRender,
  PercentageRender
} from './Cells.js';
// Overview page moved into Pages.js
import { overview, fetchData } from '../store.js';

export function Overview() {
  const { loading, error } = overview;
  const data = overview.data.value;
  const listeners = data?.listeners || [];
  const groupedListeners = listeners.reduce((acc, l) => {
    (acc[l.node] = acc[l.node] || []).push(l);
    return acc;
  }, {});
  const nbsp = '\u00A0';

  return html`
    <div>
      <h1 class="text-2xl font-bold mb-4">Overview</h1>
      <div class="flex flex-wrap justify-between items-center mb-4">
        <button class="btn btn-primary" onClick=${fetchData} disabled=${loading.value}>
          ${loading.value ? html`<span class="loading loading-spinner"></span>` : 'Refresh'}
        </button>
      </div>
      ${error.value && html`<div class="alert alert-error mb-4">${error.value}</div>`}
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
              `;
  })}
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
                <thead><tr><th>Policy</th><th>Intervals (s)</th></tr></thead>
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
                      ${ls.map(l => html`<tr class="hover:bg-base-200"><td>${nbsp}${nbsp}${l.protocol}</td><td>${l.ip_address}</td><td>${l.port}</td></tr>`)}
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

// Channels list page
const channelsColumns = [
  { field: 'vhost', shortName: 'Vhost', group: 'General', component: NameCell, width: 'max-w-[150px]' },
  { field: 'name', shortName: 'Name', group: 'General', component: NameCell, width: 'max-w-[300px]' },
  { field: 'connection_details.name', shortName: 'Connection', displayName: 'Connection Name', group: 'General', component: NameCell },
  { field: 'connection_details.peer_host', shortName: 'Peer Host', group: 'General' },
  { field: 'number', shortName: '#', group: 'General', render: NumberRender },
  { field: 'consumer_count', shortName: 'Consumers', group: 'General', render: NumberRender },
  { field: 'state', shortName: 'State', group: 'General', component: StateCell, align: 'center' },
  { field: 'idle_since', shortName: 'Idle Since', group: 'Stats', render: TimestampRender },
  { field: 'message_stats', shortName: 'Msg Stats', displayName: 'Message Stats', group: 'Stats', sortable: false, component: GroupMessageRateCell },
  { field: 'pending_raft_commands', shortName: 'RAFT', group: 'Stats', render: NumberRender },
  { field: 'reductions', shortName: 'Reductions', group: 'Stats', render: NumberRender },
  { field: 'reductions_details.rate', shortName: 'Reductions Rate', group: 'Stats', render: RateRender },
  { field: 'prefetch_count', shortName: 'Prefetch', group: 'Settings', render: NumberRender },
  { field: 'confirm', shortName: 'Confirm', group: 'Settings', align: 'center' },
  { field: 'transactional', shortName: 'Transactional', group: 'Settings', align: 'center' },
  { field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', group: 'Settings', component: RecordCell },
  { field: 'user', shortName: 'User', group: 'Audit', component: NameCell },
  { field: 'user_who_performed_action', shortName: 'User Action', group: 'Audit', component: NameCell },
];

export function Channels() {
  return html`
    <${GenericList}
      title="Channels"
      route="channels"
      defaultSortDir="desc"
      defaultSortField="message_stats.deliver_details.rate"
      columns=${channelsColumns}
    />`;
}

// Connections list page
const connectionsColumns = [
  { field: 'vhost', shortName: 'Vhost', group: 'General', component: NameCell, width: 'max-w-[150px]' },
  { field: 'name', shortName: 'Name', group: 'General', component: NameCell, width: 'max-w-[300px]' },
  { field: 'user', shortName: 'User', group: 'General', component: NameCell, width: 'max-w-[150px]' },
  { field: 'type', shortName: 'Type', group: 'General' },
  { field: 'protocol', shortName: 'Protocol', group: 'General' },
  { field: 'node', shortName: 'Node', group: 'General', visible: false },
  { field: 'connected_at', shortName: 'Connected', group: 'General', render: TimestampRender },
  { field: 'channels', shortName: 'Channels', group: 'Channels', render: NumberRender },
  { field: 'channel_max', shortName: 'Max Chan', group: 'Channels', render: NumberRender },
  { field: 'recv_cnt', shortName: 'Recv Count', group: 'Traffic', render: NumberRender },
  { field: 'recv_oct', shortName: 'Recv Bytes', group: 'Traffic', render: ByteRender },
  { field: 'recv_oct_details.rate', shortName: 'Recv Rate', group: 'Traffic', render: RateRender },
  { field: 'send_cnt', shortName: 'Send Count', group: 'Traffic', render: NumberRender },
  { field: 'send_oct', shortName: 'Send Bytes', group: 'Traffic', render: ByteRender },
  { field: 'send_oct_details.rate', shortName: 'Send Rate', group: 'Traffic', render: RateRender },
  { field: 'reductions', shortName: 'Reductions', group: 'Traffic', render: NumberRender },
  { field: 'reductions_details.rate', shortName: 'Reductions Rate', group: 'Traffic', render: RateRender },
  { field: 'state', shortName: 'State', group: 'General', component: StateCell, align: 'center' },
  { field: 'ssl', shortName: 'SSL', group: 'Security', align: 'center' },
  { field: 'auth_mechanism', shortName: 'Auth Mech', group: 'Security' },
  { field: 'timeout', shortName: 'Timeout', group: 'Settings', render: NumberRender },
  { field: 'user_who_performed_action', shortName: 'User Action', group: 'Audit', component: NameCell, width: 'max-w-[150px]' },
  { field: 'client_properties', shortName: 'Props', displayName: 'Client Properties', group: 'Settings', component: RecordCell },
  { field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', group: 'Settings', component: RecordCell },
];

export function Connections() {
  return html`
    <${GenericList}
      title="Connections"
      route="connections"
      defaultSortDir="desc"
      defaultSortField="connected_at"
      columns=${connectionsColumns}
    />`;
}

// Exchanges list page
const exchangesColumns = [
  { field: 'vhost', shortName: 'Vhost', group: '', component: NameCell, width: 'max-w-[150px]' },
  { field: 'name', shortName: 'Name', group: '', component: NameCell, width: 'max-w-[300px]' },
  { field: 'message_stats.publish_in_details.rate', shortName: 'Publish In', group: 'Stats', render: RateRender },
  { field: 'message_stats.publish_ou_details.rate', shortName: 'Publish Out', group: 'Stats', render: RateRender },
  { field: 'policy', shortName: 'Policy', group: 'Settings' },
  { field: 'auto_delete', shortName: 'AD', group: 'Settings', displayName: 'Auto Delete' },
  { field: 'durable', shortName: 'D', group: 'Settings', displayName: 'Durable' },
  { field: 'internal', shortName: 'I', group: 'Settings', displayName: 'Internal' },
  { field: 'type', shortName: 'Type', group: 'Settings' },
  { field: 'arguments', shortName: 'A', group: 'Settings', displayName: 'Arguments', component: RecordCell },
  { field: 'user_who_performed_action', shortName: 'User', group: 'Audit', component: NameCell, width: 'max-w-[150px]' },
];

export function Exchanges() {
  return html`
    <${GenericList}
      title="Exchanges"
      route="exchanges"
      defaultSortDir="desc"
      defaultSortField="message_stats.publish_in_details.rate"
      columns=${exchangesColumns}
    />`;
}

// Queues list page
const queuesColumns = [
  { group: 'General', field: 'vhost', shortName: 'Vhost', component: NameCell, width: 'max-w-[150px]' },
  { group: 'General', field: 'name', shortName: 'Name', component: NameCell, width: 'max-w-[300px]' },
  { group: 'General', field: 'state', shortName: 'State', align: 'center', component: StateCell },
  { group: 'General', field: 'node', shortName: 'Node', visible: false },
  { group: 'General', field: 'type', shortName: 'Type' },
  { group: 'Policy', field: 'effective_policy_definition', shortName: 'E', displayName: 'Effective Policy Definition', component: RecordCell },
  { group: 'Policy', field: 'operator_policy', shortName: 'Operator', displayName: 'Operator Policy', visible: false },
  { group: 'Policy', field: 'policy', shortName: 'Policy' },
  { group: 'Message Rate', field: 'message_stats', shortName: 'Stats', displayName: 'Message Rate Stats', sortable: false, component: GroupMessageRateCell },
  { group: 'Message Rate', field: 'message_stats.publish_details.rate', shortName: 'Publish', displayName: 'Publish Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.ack_details.rate', shortName: 'Ack', displayName: 'Ack Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.redeliver_details.rate', shortName: 'Redeliver', displayName: 'Redeliver Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_details.rate', shortName: 'Deliver', displayName: 'Deliver Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_get_details.rate', shortName: 'Deliver Get', displayName: 'Deliver Get Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_no_ack_details.rate', shortName: 'Deliver No Ack', displayName: 'Deliver No Ack Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_details.rate', shortName: 'Get Ack', displayName: 'Get Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_empty_details.rate', shortName: 'Get Empty Ack', displayName: 'Get Empty Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_no_ack_details.rate', shortName: 'Get No Ack', displayName: 'Get No Ack Rate', visible: false, render: RateRender },
  { group: 'Messages', field: 'messages_stats', shortName: 'Stats', displayName: 'Messages Stats', sortable: false, component: GroupMessagesCell },
  { group: 'Messages', field: 'messages', shortName: 'Messages', displayName: 'Messages', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_paged_out', shortName: 'Paged Out', displayName: 'Messages Paged Out', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_persistent', shortName: 'Persistent', displayName: 'Messages Persistent', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ram', shortName: 'RAM', displayName: 'Messages RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready', shortName: 'Ready', displayName: 'Messages Ready', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready_ram', shortName: 'Ready RAM', displayName: 'Messages Ready RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged', shortName: 'Unacked', displayName: 'Messages Unacknowledged', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged_ram', shortName: 'Unacked RAM', displayName: 'Messages Unacknowledged RAM', visible: false, render: NumberRender },
  { group: 'Bytes', field: 'bytes_stats', shortName: 'Stats', displayName: 'Bytes Stats', sortable: false, component: GroupBytesCell },
  { group: 'Bytes', field: 'message_bytes', shortName: 'Bytes', displayName: 'Message Bytes', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_paged_out', shortName: 'Paged Out', displayName: 'Message Bytes Paged Out', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_persistent', shortName: 'Persistent', displayName: 'Message Bytes Persistent', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_ram', shortName: 'RAM', displayName: 'Message Bytes RAM', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_ready', shortName: 'Ready', displayName: 'Message Bytes Ready', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_unacknowledged', shortName: 'Unacked', displayName: 'Message Bytes Unacknowledged', visible: false, render: ByteRender },
  { group: 'Memory', field: 'memory', shortName: 'Memory', render: ByteRender },
  { group: 'Timestamps', field: 'head_message_timestamp', shortName: 'Head', displayName: 'Head Message Timestamp', render: TimestampRender },
  { group: 'Timestamps', field: 'idle_since', shortName: 'Idle Since', render: TimestampRender },
  { group: 'Consumers', field: 'consumer_capacity', shortName: 'CC', displayName: 'Consumer Capacity', visible: false, render: PercentageRender },
  { group: 'Consumers', field: 'consumer_utilisation', shortName: 'CU', displayName: 'Consumer Utilisation', render: PercentageRender },
  { group: 'Consumers', field: 'consumers', shortName: 'C', displayName: 'Consumers', render: NumberRender },
  { group: 'Settings', field: 'arguments', shortName: 'A', displayName: 'Arguments', align: 'center', component: RecordCell },
  { group: 'Settings', field: 'auto_delete', shortName: 'AD', displayName: 'Auto Delete', align: 'center' },
  { group: 'Settings', field: 'durable', shortName: 'D', displayName: 'Durable' },
  { group: 'Settings', field: 'exclusive', shortName: 'E', displayName: 'Exclusive' },
  { group: 'Settings', field: 'exclusive_consumer_tag', shortName: 'Exclusive Consumer Tag', visible: false },
  { group: 'Settings', field: 'single_active_consumer_tag', shortName: 'Single Active Consumer Tag', visible: false },
  { group: 'Settings', field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', component: RecordCell },
  { group: 'Reductions', field: 'reductions', shortName: '∑', displayName: 'Reductions', render: NumberRender },
  { group: 'Reductions', field: 'reductions_details.rate', shortName: 'Rate', displayName: 'Reductions Rate', render: RateRender },
  { group: 'Replication', field: 'recoverable_slaves', shortName: 'Recoverable', displayName: 'Recoverable Slaves', component: ArrayCell },
  { group: 'Replication', field: 'slave_nodes', shortName: 'Slaves', displayName: 'Slave Nodes', component: ArrayCell },
  { group: 'Replication', field: 'synchronised_slave_nodes', shortName: 'Synced', displayName: 'Synchronised Slave Nodes', component: ArrayCell },
  { group: 'Actions', field: 'purge', shortName: 'Purge', component: ConfirmQueueCell },
];

export function Queues() {
  return html`
    <${GenericList}
      title="Queues"
      route="queues"
      defaultSortDir="desc"
      defaultSortField="message_stats.deliver_details.rate"
      columns=${queuesColumns}
    />`;
}