import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import { columnsConfig } from './columns.js';

export default function Queues() {
  return html`
    <${GenericList}
      title="Queues"
      route="queues"
      defaultSortDir="desc"
      columns=${columnsConfig.queues}
    />`;
}
