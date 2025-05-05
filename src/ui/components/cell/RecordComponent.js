import { html } from 'htm/preact';
export default function RecordComponent({ value }) {
  return typeof value === 'object' && value && Object.keys(value).length > 0 ?
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
}