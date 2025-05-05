import { html } from 'htm/preact';

export default function StateComponent({ value }) {
    const stateMap = {
        'running': 'status-success',
        'idle': 'status-info',
        'flow': 'status-warning',
    }

    if (stateMap[value]) return html`<span title="${value}" class="status ${stateMap[value]}"></span>`
    else return html`<span class="status status-error"></span>`

}