import { html } from 'htm/preact';
import { useSignal } from '@preact/signals';
import { useRef } from 'preact/hooks';
import { url, username, password, addToast } from '../store.js';
import numberal from 'numeral';
import dayjs from 'dayjs';

// Numeric rendering utilities
function createNumeralRender(format, prefix = '', suffix = '') {
  return function NumeralRender(value) {
    const finalValue = value != null ? value : 0;
    return `${prefix}${numberal(finalValue).format(format)}${suffix}`;
  };
}

export const ByteRender = createNumeralRender('0.00b');
export const NumberRender = createNumeralRender('0a');
export const PercentageRender = createNumeralRender('0%');
export const RateRender = createNumeralRender('0.00a', '', '/s');
export function TimestampRender(value) {
  if (!value) return '';
  const v = value.toString();
  const ms = v.length === 10 ? Number(v) * 1000 : Number(v);
  return dayjs(ms).fromNow();
}

function GroupTable({ entries, cols, colorMap, renderFn }) {
  const rows = Math.ceil(entries.length / cols);
  return html`
    <table class="table table-xs table-compact table-auto text-xs">
      <tbody>
        ${Array.from({ length: rows }).map((_, rowIndex) => {
    const slice = entries.slice(rowIndex * cols, rowIndex * cols + cols);
    return html`
            <tr>
              ${slice.map(([key, val, tooltip]) => html`
                <td class="px-1 py-0 align-top">
                  <div class="flex items-center">
                    <span class="${colorMap[key] || ''} inline-block w-2 h-2 mr-1"></span>
                    <span class="text-xs font-medium" title=${tooltip}>
                      ${key} <i class="mdi mdi-information"></i>
                    </span>
                  </div>
                  <div class="text-xs text-left">${renderFn(val)}</div>
                </td>
              `)}
            </tr>
          `;
  })}
      </tbody>
    </table>
  `;
}

// Cell components
export function ArrayCell({ value }) {
  const items = Array.isArray(value) ? value : [];
  const title = items.join('\n');
  return html`<span class="cursor-help" title=${title}>${items.length} <i class="mdi mdi-information"></i></span>`;
}

export function ConfirmQueueCell({ item }) {
  const inputVal = useSignal('');
  const isLoading = useSignal(false);
  const inputRef = useRef(null);
  const id = `confirm-modal-${item.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const handleConfirm = async () => {
    if (inputRef.current) inputRef.current.checked = false;
    isLoading.value = true;
    try {
      const base = url.value.replace(/\/$/, '');
      const vh = item.vhost;
      const encVh = vh === '/' ? '%252F' : encodeURIComponent(vh);
      const encName = encodeURIComponent(item.name);
      const endpoint = `/api/queues/${encVh}/${encName}/contents`;
      const prefix = typeof window !== 'undefined'
        ? window.location.pathname.replace(/\/$/, '')
        : '';
      const proxyUrl = `${prefix}/proxy/${base}${endpoint}`;
      const headers = {};
      if (username.value) {
        headers['Authorization'] = 'Basic ' + btoa(username.value + ':' + password.value);
      }
      const res = await fetch(proxyUrl, { method: 'DELETE', headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `${res.status} ${res.statusText}`);
      }
      addToast(`Purged queue: ${item.name}`, 'success');
    } catch (e) {
      console.error('Error purging queue:', e);
      addToast(`Error purging queue: ${e.message}`, 'error');
    } finally {
      isLoading.value = false;
      inputVal.value = '';
    }
  };
  return html`
    <input type="checkbox" id=${id} class="modal-toggle" ref=${el => (inputRef.current = el)} />
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
          onInput=${e => (inputVal.value = e.target.value)}
        />
        <div class="modal-action">
          <button class="btn btn-primary" disabled=${isLoading.value} onClick=${() => { inputVal.value = ''; if (inputRef.current) inputRef.current.checked = false }}>Cancel</button>
          <button class="btn btn-warning" disabled=${inputVal.value !== item.name} onClick=${handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
    <button class="btn btn-sm btn-warning" disabled=${isLoading.value} onClick=${() => { inputVal.value = ''; if (inputRef.current) inputRef.current.checked = true }}>
      ${isLoading.value ? html`<span class="loading loading-spinner"></span>` : html`<i class="mdi mdi-delete-sweep"></i>`}
    </button>
  `;
}

export function GroupBytesCell({ item }) {
  const entries = [
    ['Total', item.message_bytes, 'Total size of all messages in the queue in bytes.'],
    ['Paged Out', item.message_bytes_paged_out, 'Size of messages moved to disk.'],
    ['Persistent', item.message_bytes_persistent, 'Size of persistent messages.'],
    ['RAM', item.message_bytes_ram, 'Size of messages in RAM.'],
    ['Ready', item.message_bytes_ready, 'Size of messages ready to be delivered.'],
    ['Unacked', item.message_bytes_unacknowledged, 'Size of unacknowledged messages.']
  ];
  const colorMap = {
    'Total': 'bg-primary', 'Paged Out': 'bg-secondary', 'Persistent': 'bg-error',
    'RAM': 'bg-info', 'Ready': 'bg-success', 'Unacked': 'bg-warning'
  };
  return html`<${GroupTable}
    entries=${entries}
    cols=${3}
    colorMap=${colorMap}
    renderFn=${val => ByteRender(val)}
  />`;
}

export function GroupMessageRateCell({ value }) {
  const entries = [
    ['Publish', value?.publish_details?.rate, 'Rate of messages published.'],
    ['Ack', value?.ack_details?.rate, 'Rate of messages acknowledged.'],
    ['Redeliver', value?.redeliver_details?.rate, 'Rate of messages redelivered.'],
    ['Deliver', value?.deliver_details?.rate, 'Rate of messages delivered.'],
    ['Deliver Get', value?.deliver_get_details?.rate, 'Rate of messages delivered/get.'],
    ['Deliver No Ack', value?.deliver_no_ack_details?.rate, 'Rate of messages delivered no ack.'],
    ['Get', value?.get_details?.rate, 'Rate of messages get.'],
    ['Get Empty', value?.get_empty_details?.rate, 'Rate of empty gets.'],
    ['Get No Ack', value?.get_no_ack_details?.rate, 'Rate of get no ack.']
  ];
  const colorMap = {
    'Publish': 'bg-success-content', 'Ack': 'bg-success', 'Redeliver': 'bg-error',
    'Deliver': 'bg-info', 'Deliver Get': 'bg-secondary', 'Deliver No Ack': 'bg-warning',
    'Get': 'bg-primary', 'Get Empty': 'bg-neutral', 'Get No Ack': 'bg-warning-content'
  };
  return html`<${GroupTable}
    entries=${entries}
    cols=${5}
    colorMap=${colorMap}
    renderFn=${val => RateRender(val)}
  />`;
}

export function GroupMessagesCell({ item }) {
  const entries = [
    ['Total', item.messages, 'Total number of messages.'],
    ['Paged Out', item.messages_paged_out, 'Messages moved to disk.'],
    ['Persistent', item.messages_persistent, 'Persistent messages.'],
    ['RAM', item.messages_ram, 'Messages in RAM.'],
    ['Ready', item.messages_ready, 'Ready messages.'],
    ['Ready RAM', item.messages_ready_ram, 'Ready RAM messages.'],
    ['Unacked', item.messages_unacknowledged, 'Unacknowledged messages.'],
    ['Unacked RAM', item.messages_unacknowledged_ram, 'Unacked RAM messages.']
  ];
  const colorMap = {
    'Total': 'bg-success-content', 'Paged Out': 'bg-success',
    'Persistent': 'bg-error', 'RAM': 'bg-info',
    'Ready': 'bg-secondary', 'Ready RAM': 'bg-warning',
    'Unacked': 'bg-primary', 'Unacked RAM': 'bg-warning-content'
  };
  return html`<${GroupTable}
    entries=${entries}
    cols=${4}
    colorMap=${colorMap}
    renderFn=${val => NumberRender(val)}
  />`;
}

export function NameCell({ value }) {
  const copyToClipboard = async e => { e.stopPropagation(); try { await navigator.clipboard.writeText(value); addToast(`Copied: ${value}`, 'success'); } catch (_) { addToast(`Copy failed`, 'error'); } };
  return html`
    <div class="flex items-center">
      <span class="flex-1 min-w-0 truncate" title=${value}>${value}</span>
      <button class="btn btn-ghost btn-xs ml-2 text-gray-500 hover:text-gray-700" onClick=${copyToClipboard} title="Copy"><i class="mdi mdi-content-copy"></i></button>
    </div>
  `;
}

function flattenProps(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return flattenProps(v, path);
    }
    return [[path, Array.isArray(v) ? JSON.stringify(v) : String(v)]];
  });
}

export function RecordCell({ value }) {
  if (value && typeof value === 'object' && Object.keys(value).length) {
    const items = flattenProps(value);
    const title = items.map(([k, v]) => `${k}: ${v}`).join('\n');
    return html`<span class="cursor-help" title=${title}><i class="mdi mdi-information"></i></span>`;
  }
  return null;
}

export function StateCell({ value }) {
  const map = { running: 'status-success', idle: 'status-info', flow: 'status-warning' };
  return html`<span class="status ${map[value] || 'status-error'}" title=${value}></span>`;
}