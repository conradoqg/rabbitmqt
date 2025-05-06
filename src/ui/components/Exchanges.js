import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import RecordComponent from './cell/RecordComponent.js';
import RateRender from './cell/RateRender.js';
import NameCell from './cell/NameCell.js';

// Column definitions for Exchanges tab
const columns = [
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

export default function Exchanges() {
  return html`
    <${GenericList}
      title="Exchanges"
      route="exchanges"
      defaultSortDir="desc"
      defaultSortField="message_stats.publish_in_details.rate"
      columns=${columns}
    />`;
}
