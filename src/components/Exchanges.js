import { html } from 'htm/preact';
import GenericList from './GenericList.js';

// Column definitions for Exchanges tab
const columns = [
  { field: 'vhost', shortName: 'Vhost', group: '' },
  { field: 'name', shortName: 'Name', group: '' },
  { field: 'message_stats.publish_in_details.rate', shortName: 'Publish In', render: (value) => `${value != null ? value.toFixed(2) : (0.0).toFixed(2)}/s`, group: 'Stats' },
  { field: 'message_stats.publish_ou_details.rate', shortName: 'Publish Out', render: (value) => `${value != null ? value.toFixed(2) : (0.0).toFixed(2)}/s`, group: 'Stats' },
  { field: 'policy', shortName: 'Policy', group: 'Settings' },
  { field: 'auto_delete', shortName: 'AD', group: 'Settings', displayName: 'Auto Delete' },
  { field: 'durable', shortName: 'D', group: 'Settings', displayName: 'Durable' },
  { field: 'internal', shortName: 'I', group: 'Settings', displayName: 'Internal' },
  { field: 'type', shortName: 'Type', group: 'Settings' },
  {
    field: 'arguments', shortName: 'A', group: 'Settings', displayName: 'Arguments', component: ({ value }) =>
      typeof value === 'object' && value && Object.keys(value).length > 0 ?
        html`
          <span
            class="cursor-help"
            title=${Object.entries(value).map(([key, val]) => `${key}: ${val}`).join('\\n')}
          >
            <i class="mdi mdi-information"></i>
          </span>
        `
        :
        ''
  },
  { field: 'user_who_performed_action', shortName: 'User', group: 'Audit' },
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
