import { html } from 'htm/preact';
import GenericList from './GenericList.js';
import { columnsConfig } from './columns.js';

export default function Exchanges() {
  return html`
    <${GenericList}
      title="Exchanges"
      route="exchanges"
      newFieldSortDir="asc"
      columns=${columnsConfig.exchanges}
    />`;
}
