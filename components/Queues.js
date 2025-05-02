import { html } from 'htm/preact';
import GenericList from './GenericList.js';

export default function Queues() {
  return html`<${GenericList} title="Queues" route="queues" newFieldSortDir="desc" />`;
}
