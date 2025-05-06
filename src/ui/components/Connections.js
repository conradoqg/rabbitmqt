import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import NameCell from './cell/NameCell.js';
import TimestampRender from './cell/TimestampRender.js';
import NumberRender from './cell/NumberRender.js';
import ByteRender from './cell/ByteRender.js';
import RateRender from './cell/RateRender.js';
import StateComponent from './cell/StateComponent.js';
import RecordComponent from './cell/RecordComponent.js';

const columns = [
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

export default function Connections() {
  return html`
    <${GenericList}
      title="Connections"
      route="connections"
      defaultSortDir="desc"
      defaultSortField="connected_at"
      columns=${columns}
    />`;
}