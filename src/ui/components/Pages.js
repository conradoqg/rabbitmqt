import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import {
  NameCell,
  StateComponent,
  RecordComponent,
  GroupMessageRateComponent,
  GroupMessagesComponent,
  GroupBytesComponent,
  ArrayComponent,
  ConfirmQueueComponent
} from './Cells.js';
import {
  TimestampRender,
  NumberRender,
  ByteRender,
  RateRender,
  PercentageRender
} from './Renders.js';

// Channels list page
const channelsColumns = [
  { field: 'vhost', shortName: 'Vhost', group: 'General', component: NameCell, width: 'max-w-[150px]' },
  { field: 'name', shortName: 'Name', group: 'General', component: NameCell, width: 'max-w-[300px]' },
  { field: 'connection_details.name', shortName: 'Connection', displayName: 'Connection Name', group: 'General', component: NameCell },
  { field: 'connection_details.peer_host', shortName: 'Peer Host', group: 'General' },
  { field: 'number', shortName: '#', group: 'General', render: NumberRender },
  { field: 'consumer_count', shortName: 'Consumers', group: 'General', render: NumberRender },
  { field: 'state', shortName: 'State', group: 'General', component: StateComponent, align: 'center' },
  { field: 'idle_since', shortName: 'Idle Since', group: 'Stats', render: TimestampRender },
  { field: 'message_stats', shortName: 'Msg Stats', displayName: 'Message Stats', group: 'Stats', sortable: false, component: GroupMessageRateComponent },
  { field: 'pending_raft_commands', shortName: 'RAFT', group: 'Stats', render: NumberRender },
  { field: 'reductions', shortName: 'Reductions', group: 'Stats', render: NumberRender },
  { field: 'reductions_details.rate', shortName: 'Reductions Rate', group: 'Stats', render: RateRender },
  { field: 'prefetch_count', shortName: 'Prefetch', group: 'Settings', render: NumberRender },
  { field: 'confirm', shortName: 'Confirm', group: 'Settings', align: 'center' },
  { field: 'transactional', shortName: 'Transactional', group: 'Settings', align: 'center' },
  { field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', group: 'Settings', component: RecordComponent },
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
  { field: 'state', shortName: 'State', group: 'General', component: StateComponent, align: 'center' },
  { field: 'ssl', shortName: 'SSL', group: 'Security', align: 'center' },
  { field: 'auth_mechanism', shortName: 'Auth Mech', group: 'Security' },
  { field: 'timeout', shortName: 'Timeout', group: 'Settings', render: NumberRender },
  { field: 'user_who_performed_action', shortName: 'User Action', group: 'Audit', component: NameCell, width: 'max-w-[150px]' },
  { field: 'client_properties', shortName: 'Props', displayName: 'Client Properties', group: 'Settings', component: RecordComponent },
  { field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', group: 'Settings', component: RecordComponent },
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
  { field: 'arguments', shortName: 'A', group: 'Settings', displayName: 'Arguments', component: RecordComponent },
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
  { group: 'General', field: 'state', shortName: 'State', align: 'center', component: StateComponent },
  { group: 'General', field: 'node', shortName: 'Node', visible: false },
  { group: 'General', field: 'type', shortName: 'Type' },
  { group: 'Policy', field: 'effective_policy_definition', shortName: 'E', displayName: 'Effective Policy Definition', component: RecordComponent },
  { group: 'Policy', field: 'operator_policy', shortName: 'Operator', displayName: 'Operator Policy', visible: false },
  { group: 'Policy', field: 'policy', shortName: 'Policy' },
  { group: 'Message Rate', field: 'message_stats', shortName: 'Stats', displayName: 'Message Rate Stats', sortable: false, component: GroupMessageRateComponent },
  { group: 'Message Rate', field: 'message_stats.publish_details.rate', shortName: 'Publish', displayName: 'Publish Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.ack_details.rate', shortName: 'Ack', displayName: 'Ack Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.redeliver_details.rate', shortName: 'Redeliver', displayName: 'Redeliver Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_details.rate', shortName: 'Deliver', displayName: 'Deliver Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_get_details.rate', shortName: 'Deliver Get', displayName: 'Deliver Get Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_no_ack_details.rate', shortName: 'Deliver No Ack', displayName: 'Deliver No Ack Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_details.rate', shortName: 'Get Ack', displayName: 'Get Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_empty_details.rate', shortName: 'Get Empty Ack', displayName: 'Get Empty Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_no_ack_details.rate', shortName: 'Get No Ack', displayName: 'Get No Ack Rate', visible: false, render: RateRender },
  { group: 'Messages', field: 'messages_stats', shortName: 'Stats', displayName: 'Messages Stats', sortable: false, component: GroupMessagesComponent },
  { group: 'Messages', field: 'messages', shortName: 'Messages', displayName: 'Messages', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_paged_out', shortName: 'Paged Out', displayName: 'Messages Paged Out', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_persistent', shortName: 'Persistent', displayName: 'Messages Persistent', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ram', shortName: 'RAM', displayName: 'Messages RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready', shortName: 'Ready', displayName: 'Messages Ready', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready_ram', shortName: 'Ready RAM', displayName: 'Messages Ready RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged', shortName: 'Unacked', displayName: 'Messages Unacknowledged', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged_ram', shortName: 'Unacked RAM', displayName: 'Messages Unacknowledged RAM', visible: false, render: NumberRender },
  { group: 'Bytes', field: 'bytes_stats', shortName: 'Stats', displayName: 'Bytes Stats', sortable: false, component: GroupBytesComponent },
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
  { group: 'Settings', field: 'arguments', shortName: 'A', displayName: 'Arguments', align: 'center', component: RecordComponent },
  { group: 'Settings', field: 'auto_delete', shortName: 'AD', displayName: 'Auto Delete', align: 'center' },
  { group: 'Settings', field: 'durable', shortName: 'D', displayName: 'Durable' },
  { group: 'Settings', field: 'exclusive', shortName: 'E', displayName: 'Exclusive' },
  { group: 'Settings', field: 'exclusive_consumer_tag', shortName: 'Exclusive Consumer Tag', visible: false },
  { group: 'Settings', field: 'single_active_consumer_tag', shortName: 'Single Active Consumer Tag', visible: false },
  { group: 'Settings', field: 'garbage_collection', shortName: 'GC', displayName: 'Garbage Collection', component: RecordComponent },
  { group: 'Reductions', field: 'reductions', shortName: '∑', displayName: 'Reductions', render: NumberRender },
  { group: 'Reductions', field: 'reductions_details.rate', shortName: 'Rate', displayName: 'Reductions Rate', render: RateRender },
  { group: 'Replication', field: 'recoverable_slaves', shortName: 'Recoverable', displayName: 'Recoverable Slaves', component: ArrayComponent },
  { group: 'Replication', field: 'slave_nodes', shortName: 'Slaves', displayName: 'Slave Nodes', component: ArrayComponent },
  { group: 'Replication', field: 'synchronised_slave_nodes', shortName: 'Synced', displayName: 'Synchronised Slave Nodes', component: ArrayComponent },
  { group: 'Actions', field: 'purge', shortName: 'Purge', component: ConfirmQueueComponent },
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