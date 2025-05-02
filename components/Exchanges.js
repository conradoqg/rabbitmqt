import { html } from 'htm/preact';
import GenericList from './GenericList.js';

export default function Exchanges() {
  return html`<${GenericList} title="Exchanges" route="exchanges" newFieldSortDir="asc" />`;
}
