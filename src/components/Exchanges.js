import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import { columnsConfig } from './columns.js';

export default function Exchanges() {
  return html`
    <${GenericList}
      title="Exchanges"
      route="exchanges"
      defaultSortDir="desc"
      defaultSortField="message_stats.publish_in_details.rate"
      columns=${columnsConfig.exchanges}
    />`;
}
