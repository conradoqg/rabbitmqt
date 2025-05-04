import { html } from 'htm/preact';

// Column metadata definitions for GenericList component
// Each column metadata object may include the following properties:
//   field: string - key in the data item
//   displayName: string - column header label
//   component: Preact component (optional) - custom cell component, receives props { value, item }
//   render: function (optional) - custom render function, signature (value, item) => html
//   group: string (optional) - group name for grouping columns
//   tooltip: string (optional) - tooltip text for the column header
export const columnsConfig = {
  exchanges: [
    { field: 'vhost', displayName: 'Vhost', group: '' },
    { field: 'name', displayName: 'Name', group: '' },
    { field: 'message_stats.publish_in_details.rate', displayName: 'Publish In', render: (value) => `${value != null ? value.toFixed(2) : (0.0).toFixed(2)}/s`, group: 'Stats' },
    { field: 'message_stats.publish_ou_details.rate', displayName: 'Publish Out', render: (value) => `${value != null ? value.toFixed(2) : (0.0).toFixed(2)}/s`, group: 'Stats' },
    { field: 'policy', displayName: 'Policy', group: 'Settings' },
    { field: 'auto_delete', displayName: 'AD', group: 'Settings', tooltip: 'Auto Delete' },
    { field: 'durable', displayName: 'D', group: 'Settings', tooltip: 'Durable' },
    { field: 'internal', displayName: 'I', group: 'Settings', tooltip: 'Internal' },
    { field: 'type', displayName: 'Type', group: 'Settings' },
    {
      field: 'arguments', displayName: 'A', group: 'Settings', component: ({ value }) =>
        typeof value === 'object' && value && Object.keys(value).length > 0 ?
          html`
            <span
              class="cursor-help"
              title=${Object.entries(value).map(([key, val]) => `${key}: ${val}`).join('\n')}
            >
              <i class="mdi mdi-information"></i>
            </span>
          `
          :
          ''
    },
    { field: 'user_who_performed_action', displayName: 'User', group: 'Audit' },
  ],
  queues: [
    { field: 'arguments', displayName: 'Arguments', group: 'Settings' },
    { field: 'auto_delete', displayName: 'Auto Delete', group: 'Settings' },
    { field: 'consumer_capacity', displayName: 'Consumer Capacity', group: 'Consumers' },
    { field: 'consumer_utilisation', displayName: 'Consumer Utilisation', group: 'Consumers' },
    { field: 'consumers', displayName: 'Consumers', group: 'Consumers' },
    { field: 'durable', displayName: 'Durable', group: 'Settings' },
    { field: 'effective_policy_definition', displayName: 'Effective Policy Definition', group: 'Policy' },
    { field: 'exclusive', displayName: 'Exclusive', group: 'Settings' },
    { field: 'exclusive_consumer_tag', displayName: 'Exclusive Consumer Tag', group: 'Settings' },
    { field: 'garbage_collection', displayName: 'Garbage Collection', group: 'Settings' },
    { field: 'head_message_timestamp', displayName: 'Head Message Timestamp', group: 'Timestamps' },
    { field: 'idle_since', displayName: 'Idle Since', group: 'Timestamps' },
    { field: 'memory', displayName: 'Memory', group: 'Memory' },
    { field: 'message_bytes', displayName: 'Message Bytes', group: 'Bytes' },
    { field: 'message_bytes_paged_out', displayName: 'Message Bytes Paged Out', group: 'Bytes' },
    { field: 'message_bytes_persistent', displayName: 'Message Bytes Persistent', group: 'Bytes' },
    { field: 'message_bytes_ram', displayName: 'Message Bytes RAM', group: 'Bytes' },
    { field: 'message_bytes_ready', displayName: 'Message Bytes Ready', group: 'Bytes' },
    { field: 'message_bytes_unacknowledged', displayName: 'Message Bytes Unacknowledged', group: 'Bytes' },
    { field: 'message_stats', displayName: 'Message Stats', group: 'Stats' },
    { field: 'messages', displayName: 'Messages', group: 'Messages' },
    { field: 'messages_details', displayName: 'Messages Details', group: 'Messages' },
    { field: 'messages_paged_out', displayName: 'Messages Paged Out', group: 'Messages' },
    { field: 'messages_persistent', displayName: 'Messages Persistent', group: 'Messages' },
    { field: 'messages_ram', displayName: 'Messages RAM', group: 'Messages' },
    { field: 'messages_ready', displayName: 'Messages Ready', group: 'Messages' },
    { field: 'messages_ready_details', displayName: 'Messages Ready Details', group: 'Messages' },
    { field: 'messages_ready_ram', displayName: 'Messages Ready RAM', group: 'Messages' },
    { field: 'messages_unacknowledged', displayName: 'Messages Unacknowledged', group: 'Messages' },
    { field: 'messages_unacknowledged_details', displayName: 'Messages Unacknowledged Details', group: 'Messages' },
    { field: 'messages_unacknowledged_ram', displayName: 'Messages Unacknowledged RAM', group: 'Messages' },
    { field: 'name', displayName: 'Name', group: 'General' },
    { field: 'node', displayName: 'Node', group: 'General' },
    { field: 'operator_policy', displayName: 'Operator Policy', group: 'Policy' },
    { field: 'policy', displayName: 'Policy', group: 'Policy' },
    { field: 'recoverable_slaves', displayName: 'Recoverable Slaves', group: 'Replication' },
    { field: 'reductions', displayName: 'Reductions', group: 'Reductions' },
    { field: 'reductions_details', displayName: 'Reductions Details', group: 'Reductions' },
    { field: 'single_active_consumer_tag', displayName: 'Single Active Consumer Tag', group: 'Settings' },
    { field: 'slave_nodes', displayName: 'Slave Nodes', group: 'Replication' },
    { field: 'state', displayName: 'State', group: 'General' },
    { field: 'synchronised_slave_nodes', displayName: 'Synchronised Slave Nodes', group: 'Replication' },
    { field: 'type', displayName: 'Type', group: 'General' },
    { field: 'vhost', displayName: 'Vhost', group: 'General' },
  ],
};