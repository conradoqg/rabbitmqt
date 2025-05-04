import { html } from 'htm/preact';
import GenericList from './GenericList.js';

// Column definitions for Queues tab
const columns = [
  { field: 'arguments', shortName: 'Arguments', group: 'Settings' },
  { field: 'auto_delete', shortName: 'Auto Delete', group: 'Settings' },
  { field: 'consumer_capacity', shortName: 'Consumer Capacity', group: 'Consumers' },
  { field: 'consumer_utilisation', shortName: 'Consumer Utilisation', group: 'Consumers' },
  { field: 'consumers', shortName: 'Consumers', group: 'Consumers' },
  { field: 'durable', shortName: 'Durable', group: 'Settings' },
  { field: 'effective_policy_definition', shortName: 'Effective Policy Definition', group: 'Policy' },
  { field: 'exclusive', shortName: 'Exclusive', group: 'Settings' },
  { field: 'exclusive_consumer_tag', shortName: 'Exclusive Consumer Tag', group: 'Settings' },
  { field: 'garbage_collection', shortName: 'Garbage Collection', group: 'Settings' },
  { field: 'head_message_timestamp', shortName: 'Head Message Timestamp', group: 'Timestamps' },
  { field: 'idle_since', shortName: 'Idle Since', group: 'Timestamps' },
  { field: 'memory', shortName: 'Memory', group: 'Memory' },
  { field: 'message_bytes', shortName: 'Message Bytes', group: 'Bytes' },
  { field: 'message_bytes_paged_out', shortName: 'Message Bytes Paged Out', group: 'Bytes' },
  { field: 'message_bytes_persistent', shortName: 'Message Bytes Persistent', group: 'Bytes' },
  { field: 'message_bytes_ram', shortName: 'Message Bytes RAM', group: 'Bytes' },
  { field: 'message_bytes_ready', shortName: 'Message Bytes Ready', group: 'Bytes' },
  { field: 'message_bytes_unacknowledged', shortName: 'Message Bytes Unacknowledged', group: 'Bytes' },
  { field: 'message_stats', shortName: 'Message Stats', group: 'Stats' },
  { field: 'messages', shortName: 'Messages', group: 'Messages' },
  { field: 'messages_details', shortName: 'Messages Details', group: 'Messages' },
  { field: 'messages_paged_out', shortName: 'Messages Paged Out', group: 'Messages' },
  { field: 'messages_persistent', shortName: 'Messages Persistent', group: 'Messages' },
  { field: 'messages_ram', shortName: 'Messages RAM', group: 'Messages' },
  { field: 'messages_ready', shortName: 'Messages Ready', group: 'Messages' },
  { field: 'messages_ready_details', shortName: 'Messages Ready Details', group: 'Messages' },
  { field: 'messages_ready_ram', shortName: 'Messages Ready RAM', group: 'Messages' },
  { field: 'messages_unacknowledged', shortName: 'Messages Unacknowledged', group: 'Messages' },
  { field: 'messages_unacknowledged_details', shortName: 'Messages Unacknowledged Details', group: 'Messages' },
  { field: 'messages_unacknowledged_ram', shortName: 'Messages Unacknowledged RAM', group: 'Messages' },
  { field: 'name', shortName: 'Name', group: 'General' },
  { field: 'node', shortName: 'Node', group: 'General' },
  { field: 'operator_policy', shortName: 'Operator Policy', group: 'Policy' },
  { field: 'policy', shortName: 'Policy', group: 'Policy' },
  { field: 'recoverable_slaves', shortName: 'Recoverable Slaves', group: 'Replication' },
  { field: 'reductions', shortName: 'Reductions', group: 'Reductions' },
  { field: 'reductions_details', shortName: 'Reductions Details', group: 'Reductions' },
  { field: 'single_active_consumer_tag', shortName: 'Single Active Consumer Tag', group: 'Settings' },
  { field: 'slave_nodes', shortName: 'Slave Nodes', group: 'Replication' },
  { field: 'state', shortName: 'State', group: 'General' },
  { field: 'synchronised_slave_nodes', shortName: 'Synchronised Slave Nodes', group: 'Replication' },
  { field: 'type', shortName: 'Type', group: 'General' },
  { field: 'vhost', shortName: 'Vhost', group: 'General' },
];

export default function Queues() {
  return html`
    <${GenericList}
      title="Queues"
      route="queues"
      defaultSortDir="desc"
      columns=${columns}
    />`;
}
