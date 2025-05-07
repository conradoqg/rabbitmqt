import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import {
  NameCell,
  QueueStateCell,
  RecordCell,
  GroupQueueMessageRateCell,
  GroupMessagesCell,
  GroupBytesCell,
  ArrayCell,
  ConfirmQueueCell,
  TimestampRender,
  NumberRender,
  ByteRender,
  RateRender,
  PercentageRender,
  GroupChannelMessageRateCell,
  SSLCell,
  GroupTrafficCountCell,
  GroupTrafficBytesCell,
  GroupTrafficRateCell,
  GroupPublishCell,
  DurationRender,
  PeerCell,
  ConnectionStateCell,
  ChannelCell
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
      <div class="flex flex-wrap items-center gap-4"></div>
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

// Connections list page
const connectionsColumns = [
  { group: 'General', field: 'vhost', shortName: 'Vhost', component: NameCell, width: 'max-w-[150px]' },
  { group: 'General', field: 'name', shortName: 'Name', component: NameCell, width: 'max-w-[300px]' },
  { group: 'General', field: 'user_provided_name', shortName: 'User Provided Name', component: NameCell, width: 'max-w-[300px]' },
  { group: 'General', field: 'user', shortName: 'User', component: NameCell, width: 'max-w-[150px]' },
  { group: 'General', field: 'type', shortName: 'Type' },
  { group: 'General', field: 'state', shortName: 'State', component: ConnectionStateCell, align: 'center' },
  { group: 'General', field: 'protocol', shortName: 'Protocol' },
  { group: 'General', field: 'node', shortName: 'Node', visible: false },
  { group: 'General', field: 'connected_at', shortName: 'Connected', render: TimestampRender },
  { group: 'Connection', field: 'host', shortName: 'Host', visible: false, component: NameCell },
  { group: 'Connection', field: 'port', shortName: 'Port', visible: false },
  { group: 'Connection', field: 'peer_host', shortName: 'Peer Host', visible: false, component: NameCell },
  { group: 'Connection', field: 'peer_port', shortName: 'Peer Port', visible: false },
  { group: 'Connection', field: 'peer_detail', shortName: 'Detail', displayName: 'Peer Detail', sortable: false, component: PeerCell },
  { group: 'Connection', field: 'peer_cert_issuer', shortName: 'Cert Issuer', displayName: 'Peer Cert Issuer', visible: false },
  { group: 'Connection', field: 'peer_cert_subject', shortName: 'Cert Subject', displayName: 'Peer Cert Subject', visible: false },
  { group: 'Connection', field: 'peer_cert_validity', shortName: 'Cert Validity', displayName: 'Peer Cert Validity', visible: false },
  { group: 'Channels', field: 'channels', shortName: 'Channels', render: NumberRender },
  { group: 'Channels', field: 'channel_max', shortName: 'Max Chan', render: NumberRender },
  { group: 'Traffic Count', field: 'cnt_stats', shortName: 'Stats', sortable: false, component: GroupTrafficCountCell },
  { group: 'Traffic Count', field: 'recv_cnt', shortName: 'Recv Count', visible: false, render: NumberRender },
  { group: 'Traffic Count', field: 'send_cnt', shortName: 'Send Count', visible: false, render: NumberRender },
  { group: 'Traffic Bytes', field: 'bytes_stats', shortName: 'Stats', sortable: false, component: GroupTrafficBytesCell },
  { group: 'Traffic Bytes', field: 'recv_oct', shortName: 'Recv Bytes', visible: false, render: ByteRender },
  { group: 'Traffic Bytes', field: 'send_oct', shortName: 'Send Bytes', visible: false, render: ByteRender },
  { group: 'Traffic Rate', field: 'rate_stats', shortName: 'Stats', sortable: false, component: GroupTrafficRateCell },
  { group: 'Traffic Rate', field: 'recv_oct_details.rate', shortName: 'Recv Rate', visible: false, render: RateRender },
  { group: 'Traffic Rate', field: 'send_oct_details.rate', shortName: 'Send Rate', visible: false, render: RateRender },
  { group: 'Traffic', field: 'send_pend', shortName: 'Pending', displayName: 'Send Pending', render: NumberRender },
  { group: 'Reductions', field: 'reductions', shortName: '∑', displayName: 'Total', render: NumberRender },
  { group: 'Reductions', field: 'reductions_details.rate', shortName: 'Rate', displayName: 'Reductions Rate', render: RateRender },
  { group: 'Security', field: 'ssl', shortName: 'SSL', align: 'center' },
  { group: 'Security', field: 'ssl_details', shortName: 'Details', displayName: 'SSL Details', align: 'center', sortable: false, component: SSLCell },
  { group: 'Security', field: 'ssl_cipher', shortName: 'Cipher', displayName: 'SSL Cipher', align: 'center', visible: false, component: SSLCell },
  { group: 'Security', field: 'ssl_hash', shortName: 'Hash', displayName: 'SSL Hash', align: 'center', visible: false, component: SSLCell },
  { group: 'Security', field: 'ssl_key_exchange', shortName: 'Key Exchange', displayName: 'SSL Key Exchange', align: 'center', visible: false, component: SSLCell },
  { group: 'Security', field: 'ssl_protocol', shortName: 'Protocol', displayName: 'SSL Protocol', align: 'center', visible: false, component: SSLCell },
  { group: 'Security', field: 'auth_mechanism', shortName: 'Auth Mech', },
  { group: 'Settings', field: 'timeout', shortName: 'Timeout', render: DurationRender },
  { group: 'Settings', field: 'client_properties', shortName: 'Props', displayName: 'Client Properties', component: RecordCell },
  { group: 'Settings', field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', component: RecordCell },
  { group: 'Settings', field: 'frame_max', shortName: 'Frame Max', render: ByteRender },
  { group: 'Audit', field: 'user_who_performed_action', shortName: 'User Who Performed Action', visible: false, component: NameCell, width: 'max-w-[150px]' },
];

export function Connections() {
  return html`
    <${GenericList}
      title="Connections"
      route="connections"
      defaultSortDir="desc"
      defaultSortField="recv_oct_details.rate"
      columns=${connectionsColumns}
    />`;
}

// Channels list page
const channelsColumns = [
  { group: 'General', field: 'vhost', shortName: 'Vhost', component: NameCell, width: 'max-w-[150px]' },
  { group: 'General', field: 'name', shortName: 'Name', component: NameCell, width: 'max-w-[300px]' },
  { group: 'General', field: 'node', shortName: 'Node', component: NameCell, visible: false },
  { group: 'General', field: 'consumer_count', shortName: 'Consumers', render: NumberRender },
  { group: 'General', field: 'state', shortName: 'State', component: ChannelCell, align: 'center' },
  { group: 'Connection', field: 'connection_details.name', shortName: 'Connection', displayName: 'Connection Name', visible: false, component: NameCell },
  { group: 'Connection', field: 'number', shortName: '#', displayName: 'Connection Number', visible: false, render: NumberRender },
  { group: 'Connection', field: 'connection_details.peer_host', shortName: 'Peer Host', visible: false },
  { group: 'Connection', field: 'connection_details.peer_port', shortName: 'Peer Port', visible: false },
  { group: 'Message Rate', field: 'message_stats', shortName: 'Stats', displayName: 'Message Rate Stats', sortable: false, component: GroupChannelMessageRateCell },
  { group: 'Message Rate', field: 'message_stats.publish_details.rate', shortName: 'Publish', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.ack_details.rate', shortName: 'Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.redeliver_details.rate', shortName: 'Redeliver', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_details.rate', shortName: 'Deliver', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_get_details.rate', shortName: 'Deliver Get', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_no_ack_details.rate', shortName: 'Deliver No Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_details.rate', shortName: 'Get Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_empty_details.rate', shortName: 'Get Empty Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_no_ack_details.rate', shortName: 'Get No Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.confirm_details.rate', shortName: 'Confirm', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.drop_unroutable.rate', shortName: 'Drop Unroutable', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.return_unroutable.rate', shortName: 'Return Unroutable', visible: false, render: RateRender },
  { group: 'Timestamps', field: 'idle_since', shortName: 'Idle Since', render: TimestampRender },
  { group: 'RAFT', field: 'pending_raft_commands', shortName: 'PC', displayName: 'Pending Commands', render: NumberRender },
  { group: 'Reductions', field: 'reductions', shortName: '∑', displayName: 'Total', render: NumberRender },
  { group: 'Reductions', field: 'reductions_details.rate', shortName: 'Rate', displayName: 'Reductions Rate', render: RateRender },
  { group: 'Settings', field: 'prefetch_count', shortName: 'P', displayName: 'Prefetch', render: NumberRender },
  { group: 'Settings', field: 'confirm', shortName: 'C', displayName: 'Confirm', align: 'center' },
  { group: 'Settings', field: 'transactional', shortName: 'T', shortName: 'Transactional', align: 'center' },
  { group: 'Settings', field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', component: RecordCell },
  { group: 'Audit', field: 'user', shortName: 'User', component: NameCell },
  { group: 'Audit', field: 'user_who_performed_action', shortName: 'User Who Performed Action', visible: false, component: NameCell },
];

export function Channels() {
  return html`
    <${GenericList}
      title="Channels"
      route="channels"
      defaultSortDir="desc"
      defaultSortField="message_stats.publish_details.rate"
      columns=${channelsColumns}
    />`;
}

// Exchanges list page
const exchangesColumns = [
  { group: 'General', field: 'vhost', shortName: 'Vhost', component: NameCell, width: 'max-w-[150px]' },
  { group: 'General', field: 'name', shortName: 'Name', component: NameCell, width: 'max-w-[300px]' },
  { group: 'Publish', field: 'message_stats', shortName: 'Stats', sortable: false, component: GroupPublishCell },
  { group: 'Publish', field: 'message_stats.publish_in_details.rate', shortName: 'In', visible: false, render: RateRender },
  { group: 'Publish', field: 'message_stats.publish_out_details.rate', shortName: 'Out', visible: false, render: RateRender },
  { group: 'Settings', field: 'policy', shortName: 'Policy' },
  { group: 'Settings', field: 'auto_delete', shortName: 'AD', displayName: 'Auto Delete' },
  { group: 'Settings', field: 'durable', shortName: 'D', displayName: 'Durable' },
  { group: 'Settings', field: 'internal', shortName: 'I', displayName: 'Internal' },
  { group: 'Settings', field: 'type', shortName: 'Type' },
  { group: 'Settings', field: 'arguments', shortName: 'A', displayName: 'Arguments', component: RecordCell },
  { group: 'Audit', field: 'user_who_performed_action', shortName: 'User Who Performed Action', visible: false, component: NameCell, width: 'max-w-[150px]' },
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
  { group: 'General', field: 'state', shortName: 'State', align: 'center', component: QueueStateCell },
  { group: 'General', field: 'node', shortName: 'Node', visible: false },
  { group: 'General', field: 'type', shortName: 'Type' },
  { group: 'Policy', field: 'effective_policy_definition', shortName: 'E', displayName: 'Effective Policy Definition', component: RecordCell },
  { group: 'Policy', field: 'operator_policy', shortName: 'Operator', displayName: 'Operator Policy', visible: false },
  { group: 'Policy', field: 'policy', shortName: 'Policy' },
  { group: 'Message Rate', field: 'message_stats', shortName: 'Stats', displayName: 'Message Rate Stats', sortable: false, component: GroupQueueMessageRateCell },
  { group: 'Message Rate', field: 'message_stats.publish_details.rate', shortName: 'Publish', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.ack_details.rate', shortName: 'Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.redeliver_details.rate', shortName: 'Redeliver', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_details.rate', shortName: 'Deliver', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_get_details.rate', shortName: 'Deliver Get', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_no_ack_details.rate', shortName: 'Deliver No Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_details.rate', shortName: 'Get Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_empty_details.rate', shortName: 'Get Empty Ack', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_no_ack_details.rate', shortName: 'Get No Ack', visible: false, render: RateRender },
  { group: 'Messages', field: 'messages_stats', shortName: 'Stats', displayName: 'Messages Stats', sortable: false, component: GroupMessagesCell },
  { group: 'Messages', field: 'messages', shortName: 'Messages', displayName: 'Total', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_paged_out', shortName: 'Paged Out', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_persistent', shortName: 'Persistent', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ram', shortName: 'RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready', shortName: 'Ready', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready_ram', shortName: 'Ready RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged', shortName: 'Unacked', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged_ram', shortName: 'Unacked RAM', visible: false, render: NumberRender },
  { group: 'Bytes', field: 'bytes_stats', shortName: 'Stats', displayName: 'Bytes Stats', sortable: false, component: GroupBytesCell },
  { group: 'Bytes', field: 'message_bytes', shortName: 'Bytes', displayName: 'Total', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_paged_out', shortName: 'Paged Out', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_persistent', shortName: 'Persistent', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_ram', shortName: 'RAM', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_ready', shortName: 'Ready', visible: false, render: ByteRender },
  { group: 'Bytes', field: 'message_bytes_unacknowledged', shortName: 'Unacked', visible: false, render: ByteRender },
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