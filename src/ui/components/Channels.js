import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import NameCell from './cell/NameCell.js';
import TimestampRender from './cell/TimestampRender.js';
import NumberRender from './cell/NumberRender.js';
import RateRender from './cell/RateRender.js';
import StateComponent from './cell/StateComponent.js';
import RecordComponent from './cell/RecordComponent.js';
import GroupMessageRateComponent from './cell/GroupMessageRateComponent.js';

const columns = [
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

export default function Channels() {
  return html`
    <${GenericList}
      title="Channels"
      route="channels"
      defaultSortDir="desc"
      defaultSortField="message_stats.deliver_details.rate"
      columns=${columns}
    />`;
}