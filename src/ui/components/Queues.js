import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import GroupMessageRateComponent from './cell/GroupMessageRateComponent.js';
import GroupMessagesComponent from './cell/GroupMessagesComponent.js';
import GroupBytesComponent from './cell/GroupBytesComponent.js';
import RecordComponent from './cell/RecordComponent.js';
import ArrayComponent from './cell/ArrayComponent.js';
import TimestampRender from './cell/TimestampRender.js';
import RateRender from './cell/RateRender.js';
import ByteRender from './cell/ByteRender.js';
import NumberRender from './cell/NumberRender.js';
import PercentageRender from './cell/PercentageRender.js';
import StateComponent from './cell/StateComponent.js';

// Column definitions for Queues tab
const columns = [
  { group: 'General', field: 'vhost', shortName: 'Vhost' },
  { group: 'General', field: 'name', shortName: 'Name' },
  { group: 'General', field: 'state', shortName: 'State', align: 'center', component: StateComponent },
  { group: 'General', field: 'node', shortName: 'Node', visible: false },
  { group: 'General', field: 'type', shortName: 'Type' },
  { group: 'Policy', field: 'effective_policy_definition', shortName: 'E', displayName: 'Effective Policy Definition', component: RecordComponent },
  { group: 'Policy', field: 'operator_policy', shortName: 'Operator', displayName: 'Operator Policy', visible: false },
  { group: 'Policy', field: 'policy', shortName: 'Policy' },
  { group: 'Message Rate', field: 'message_stats', shortName: 'Stats', displayName: 'Message Rate Stats', sortable: false, component: GroupMessageRateComponent },
  { group: 'Message Rate', field: 'message_stats.ack_details.rate', shortName: 'Ack', displayName: 'Ack Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_details.rate', shortName: 'Deliver', displayName: 'Deliver Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_get_details.rate', shortName: 'Deliver Get', displayName: 'Deliver Get Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.deliver_no_ack_details.rate', shortName: 'Deliver No Ack', displayName: 'Deliver No Ack Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_details.rate', shortName: 'Get Ack', displayName: 'Get Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_empty_details.rate', shortName: 'Get Empty Ack', displayName: 'Get Empty Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.get_no_ack_details.rate', shortName: 'Get No Ack', displayName: 'Get No Ack Rate', visible: false, render: RateRender },
  { group: 'Message Rate', field: 'message_stats.redeliver_details.rate', shortName: 'Redeliver', displayName: 'Redeliver Rate', visible: false, render: RateRender },
  { group: 'Messages', field: 'messages_stats', shortName: 'Stats', displayName: 'Messages Stats', sortable: false, component: GroupMessagesComponent },
  { group: 'Messages', field: 'messages', shortName: 'Messages', displayName: 'Messages', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_details', shortName: 'Details', displayName: 'Messages Details', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_paged_out', shortName: 'Paged Out', displayName: 'Messages Paged Out', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_persistent', shortName: 'Persistent', displayName: 'Messages Persistent', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ram', shortName: 'RAM', displayName: 'Messages RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready', shortName: 'Ready', displayName: 'Messages Ready', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready_details', shortName: 'Ready Details', displayName: 'Messages Ready Details', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_ready_ram', shortName: 'Ready RAM', displayName: 'Messages Ready RAM', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged', shortName: 'Unacked', displayName: 'Messages Unacknowledged', visible: false, render: NumberRender },
  { group: 'Messages', field: 'messages_unacknowledged_details', shortName: 'Unacked Details', displayName: 'Messages Unacknowledged Details', visible: false, render: NumberRender },
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
];

export default function Queues() {
  return html`
    <${GenericList}
      title="Queues"
      route="queues"
      defaultSortDir="desc"
      defaultSortField="message_stats.deliver_details.rate"
      columns=${columns}
    />`;
}
