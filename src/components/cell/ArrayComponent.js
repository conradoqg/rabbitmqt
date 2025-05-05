import { html } from 'htm/preact';
export default function ArrayComponent({ value }) {
  return value && Array.isArray(value) ?
    html`
        <span
          class="cursor-help"
          title=${value.map((val) => val).join('\n')}
        >
          ${value.length} <i class="mdi mdi-information"></i>
        </span>
      `
    :
    html`<span
          class="cursor-help"
          title=""
        >
          0 <i class="mdi mdi-information"></i>
        </span>
      `
}