import { html } from 'htm/preact';
import { useSignal } from '@preact/signals';
import { useRef } from 'preact/hooks';
import { url, username, password, addToast } from '../../store.js';

export default function ConfirmQueueComponent({ value, item }) {
  const inputVal = useSignal('');
  const isLoading = useSignal(false);
  const inputRef = useRef(null);
  // sanitize queue name for use in element ID
  const id = `confirm-modal-${item.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  // Purge handler: API call after confirmation
  const handleConfirm = () => {
    // close modal
    if (inputRef.current) inputRef.current.checked = false;
    isLoading.value = true;
    (async () => {
      try {
        const base = url.value.replace(/\/$/, '');
        const vh = item.vhost;
        const encodedVhost = vh === '/' ? '%252F' : encodeURIComponent(vh);
        const encodedName = encodeURIComponent(item.name);
        const endpoint = `/api/queues/${encodedVhost}/${encodedName}/contents`;
        const proxyUrl = `/proxy/${base}${endpoint}`;
        const headers = {};
        if (username.value) {
          headers['Authorization'] = 'Basic ' + btoa(username.value + ':' + password.value);
        }
        const res = await fetch(proxyUrl, { method: 'DELETE', headers });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `${res.status} ${res.statusText}`);
        }
        // Notify success
        addToast(`Purged queue: ${item.name}`, 'success');
      } catch (e) {
        console.error('Error purging queue:', e);
        addToast(`Error purging queue: ${e.message}`, 'error');
      } finally {
        isLoading.value = false;
        inputVal.value = '';
      }
    })();
  };
  return html`
    <input type="checkbox" id=${id} class="modal-toggle" ref=${el => { inputRef.current = el }} />
    <div class="modal">
      <div class="modal-box relative">
        <label for=${id} class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
        <h3 class="font-bold text-lg">Confirm Action</h3>
        <p class="py-2">Type the queue name to confirm:</p>
        <input
          type="text"
          class="input input-bordered w-full"
          placeholder="Queue name"
          value=${inputVal.value}
          onInput=${e => { inputVal.value = e.target.value }}
        />
        <div class="modal-action">
          <button
            class="btn btn-primary"
            disabled=${isLoading.value}
            onClick=${() => { inputVal.value = ''; if (inputRef.current) inputRef.current.checked = false }}
          >
            Cancel
          </button>
          <button
            class="btn btn-warning"
            disabled=${inputVal.value !== item.name}
            onClick=${handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
    <button
      class=${`btn btn-sm btn-warning`}
      disabled=${isLoading.value}
      onClick=${() => { inputVal.value = ''; if (inputRef.current) inputRef.current.checked = true }}
    >
      ${isLoading.value ? html`<span class="loading loading-spinner"></span>` : html`<i class="mdi mdi-delete-sweep"></i>`}
    </button>
  `;
}