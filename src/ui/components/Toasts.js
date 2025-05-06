import { html } from 'htm/preact';
import { toasts } from '../store.js';

/**
 * Toasts container to display transient notifications.
 */
export default function Toasts() {
  return html`
    <div class="fixed top-4 right-4 flex flex-col gap-2 z-50">
      ${toasts.value.map(t => html`
        <div class="toast">
          <div class=${`
            alert
            ${t.type === 'error' ? 'alert-error' : t.type === 'success' ? 'alert-success' : 'alert-info'}
          `}>
            <span>${t.message}</span>
          </div>
        </div>
      `)}
    </div>
  `;
}