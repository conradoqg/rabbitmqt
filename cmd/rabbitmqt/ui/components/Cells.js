import { html } from 'htm/preact';
import { useSignal } from '@preact/signals';
import { useRef } from 'preact/hooks';
import { url, username, password, addToast, fastMode } from '../store.js';
import numberal from 'numeral';
import dayjs from 'dayjs';

export const ByteRender = createNumeralRender('0.00b');
export const NumberRender = createNumeralRender('0a');
export const PercentageRender = createNumeralRender('0%');
export const RateRender = createNumeralRender('0.00a', '', '/s');
export const RateByteRender = createNumeralRender('0.00b', '', '/s');
export function TimestampRender(value) {
  if (!value) return '';
  const v = value.toString();
  const ms = v.length === 10 ? Number(v) * 1000 : Number(v);
  return dayjs(ms).fromNow();
}

export function DurationRender(value) {
  if (!value) return '';
  return `${dayjs.duration({ seconds: value }).asSeconds()}s`;
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

export function GroupTrafficCountCell({ item }) {
  const entries = [
    ['Recv', item.recv_cnt, 'Total number of messages received. Indicates the volume of incoming messages.', 'bg-primary'],
    ['Send', item.send_cnt, 'Total number of messages sent. Indicates the volume of outgoing messages.', 'bg-secondary'],
  ];

  return html`<${GroupTable}
    entries=${entries}
    cols=${2}
    renderFn=${val => NumberRender(val)}
  />`;
}

export function GroupTrafficBytesCell({ item }) {
  const entries = [
    ['Recv', item.recv_oct, 'Total size of received messages, in bytes. Reflects the data volume of incoming messages.', 'bg-primary'],
    ['Send', item.send_oct, 'Total size of sent messages, in bytes. Reflects the data volume of outgoing messages.', 'bg-secondary'],
  ];

  return html`<${GroupTable}
    entries=${entries}
    cols=${2}
    renderFn=${val => ByteRender(val)}
  />`;
}

export function GroupTrafficRateCell({ item }) {
  const entries = [
    ['Recv', item.recv_oct_details?.rate, 'Rate of incoming message data, in bytes per second. Shows how quickly data is being received.', 'bg-primary'],
    ['Send', item.send_oct_details?.rate, 'Rate of outgoing message data, in bytes per second. Shows how quickly data is being sent.', 'bg-secondary'],
  ];

  return html`<${GroupTable}
    entries=${entries}
    cols=${2}
    renderFn=${val => RateByteRender(val)}
  />`;
}

export function GroupPublishCell({ item }) {
  const entries = [
    ['In', item.publish_in_details?.rate, 'Total size of all messages in the queue in bytes.', 'bg-primary'],
    ['Out', item.publish_out_details?.rate, 'Size of messages moved to disk.', 'bg-secondary'],
  ];

  return html`<${GroupTable}
    entries=${entries}
    cols=${2}
    renderFn=${val => RateRender(val)}
  />`;
}


export function GroupBytesCell({ item }) {
  const entries = [
    ['Total', item.message_bytes, 'Total size of all messages in the queue in bytes.', 'bg-primary'],
    ['Paged Out', item.message_bytes_paged_out, 'Size of messages moved to disk.', 'bg-secondary'],
    ['Persistent', item.message_bytes_persistent, 'Size of persistent messages.', 'bg-error'],
    ['RAM', item.message_bytes_ram, 'Size of messages in RAM.', 'bg-info'],
    ['Ready', item.message_bytes_ready, 'Size of messages ready to be delivered.', 'bg-success'],
    ['Unacked', item.message_bytes_unacknowledged, 'Size of unacknowledged messages.', 'bg-warning']
  ];

  return html`<${GroupTable}
    entries=${entries}
    cols=${3}
    renderFn=${val => ByteRender(val)}
  />`;
}

export function GroupChannelMessageRateCell({ value }) {
  const entries = [
    ['Publish', value?.publish_details?.rate, 'Rate of messages published.', 'bg-success-content'],
    ['Ack', value?.ack_details?.rate, 'Rate of messages acknowledged.', 'bg-success'],
    ['Redeliver', value?.redeliver_details?.rate, 'Rate of messages redelivered.', 'bg-error'],
    ['Deliver', value?.deliver_details?.rate, 'Rate of messages delivered.', 'bg-info'],
    ['Deliver Get', value?.deliver_get_details?.rate, 'Rate of messages delivered/get.', 'bg-secondary'],
    ['Deliver No Ack', value?.deliver_no_ack_details?.rate, 'Rate of messages delivered no ack.', 'bg-warning'],
    ['Get', value?.get_details?.rate, 'Rate of messages get.', 'bg-primary'],
    ['Get Empty', value?.get_empty_details?.rate, 'Rate of empty gets.', 'bg-neutral'],
    ['Get No Ack', value?.get_no_ack_details?.rate, 'Rate of get no ack.', 'bg-warning-content'],
    ['Confirm', value?.confirm_details?.rate, 'Rate of confirm.', 'bg-warning-content'],
    ['Drop Unroutable', value?.drop_unroutable?.rate, 'Rate of unroutable messages dropped.', 'bg-warning-content'],
    ['Return Unroutable', value?.return_unroutable?.rate, 'Rate of unroutable messages returned.', 'bg-warning-content'],
  ];

  return html`<${GroupTable}
    entries=${entries}
    cols=${4}
    renderFn=${val => RateRender(val)}
  />`;
}

export function GroupQueueMessageRateCell({ value }) {
  const entries = [
    ['Publish', value?.publish_details?.rate, 'Rate of messages published.', 'bg-success-content'],
    ['Ack', value?.ack_details?.rate, 'Rate of messages acknowledged.', 'bg-success'],
    ['Redeliver', value?.redeliver_details?.rate, 'Rate of messages redelivered.', 'bg-error'],
    ['Deliver', value?.deliver_details?.rate, 'Rate of messages delivered.', 'bg-info'],
    ['Deliver Get', value?.deliver_get_details?.rate, 'Rate of messages delivered/get.', 'bg-secondary'],
    ['Deliver No Ack', value?.deliver_no_ack_details?.rate, 'Rate of messages delivered no ack.', 'bg-warning'],
    ['Get', value?.get_details?.rate, 'Rate of messages get.', 'bg-primary'],
    ['Get Empty', value?.get_empty_details?.rate, 'Rate of empty gets.', 'bg-neutral'],
    ['Get No Ack', value?.get_no_ack_details?.rate, 'Rate of get no ack.', 'bg-warning-content']
  ];

  return html`<${GroupTable}
    entries=${entries}
    cols=${5}
    renderFn=${val => RateRender(val)}
  />`;
}

export function GroupMessagesCell({ item }) {
  let entries = null
  if (fastMode.value) {
    entries = [
      ['Total', item.messages, 'Total number of messages.', 'bg-success-content'],
      ['Ready', item.messages_ready, 'Ready messages.', 'bg-secondary'],
      ['Unacked', item.messages_unacknowledged, 'Unacknowledged messages.', 'bg-primary'],
    ];
  } else {
    entries = [
      ['Total', item.messages, 'Total number of messages.', 'bg-success-content'],
      ['Paged Out', item.messages_paged_out, 'Messages moved to disk.', 'bg-success'],
      ['Persistent', item.messages_persistent, 'Persistent messages.', 'bg-error'],
      ['RAM', item.messages_ram, 'Messages in RAM.', 'bg-info'],
      ['Ready', item.messages_ready, 'Ready messages.', 'bg-secondary'],
      ['Ready RAM', item.messages_ready_ram, 'Ready RAM messages.', 'bg-warning'],
      ['Unacked', item.messages_unacknowledged, 'Unacknowledged messages.', 'bg-primary'],
      ['Unacked RAM', item.messages_unacknowledged_ram, 'Unacked RAM messages.', 'bg-warning-content']
    ];
  }

  return html`<${GroupTable}
    entries=${entries}
    cols=${4}
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

export function SSLCell({ value, item }) {
  const record = {
    'SSL Cipher': item.ssl_cipher,
    'SSL Hash': item.ssl_hash,
    'SSL Key Exchange': item.ssl_key_exchange,
    'SSL Protocol': item.ssl_protocol,
  }
  return html`<${RecordCell} value=${record}/>`;
}

export function PeerCell({ value, item }) {
  const record = {
    'Cert Issuer': item.peer_cert_issuer,
    'Cert Subject': item.peer_cert_subject,
    'Cert Validity': item.peer_cert_validity
  }
  return html`<${RecordCell} value=${record}/>`;
}

export function RecordCell({ value }) {
  if (value && typeof value === 'object' && Object.keys(value).length) {
    const items = flattenProps(value);
    const title = items.map(([k, v]) => `${k}: ${v}`).join('\n');
    return html`<span class="cursor-help" title=${title}><i class="mdi mdi-information"></i></span>`;
  }
  return null;
}

export function ConnectionStateCell({ value }) {
  const map = {
    starting: 'status-info',
    tuning: 'status-info',
    opening: 'status-info',
    running: 'status-success',
    flow: 'status-warning',
    blocking: 'status-warning',
    blocked: 'status-error',
    closing: 'status-warning',
    closed: 'status-error'
  }
  return html`<span class="status ${map[value] || 'status-error'}" title=${value}></span>`;
}

export function ChannelCell({ value }) {
  const map = {
    running: 'status-success',
    idle: 'status-info',
    flow: 'status-warning',
    blocking: 'status-warning',
    blocked: 'status-error',
    closing: 'status-warning',
    closed: 'status-error',
    crashed: 'status-error'
  };

  return html`<span class="status ${map[value] || 'status-error'}" title=${value}></span>`;
}


export function QueueStateCell({ value }) {
  const map = {
    running: 'status-success',
    idle: 'status-info',
    flow: 'status-warning',
    blocked: 'status-error',
    draining: 'status-warning'
  };

  return html`<span class="status ${map[value] || 'status-error'}" title=${value}></span>`;
}

function GroupTable({ entries, cols, renderFn }) {
  const rows = Math.ceil(entries.length / cols);
  return html`
    <table class="table table-xs table-compact table-auto text-xs">
      <tbody>
        ${Array.from({ length: rows }).map((_, rowIndex) => {
    const slice = entries.slice(rowIndex * cols, rowIndex * cols + cols);
    return html`
            <tr>
              ${slice.map(([key, val, tooltip, color]) => html`
                <td class="px-1 py-0 align-top">
                  <div class="flex items-center">
                    <span class="${color || ''} inline-block w-2 h-2 mr-1"></span>
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

function flattenProps(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return flattenProps(v, path);
    }
    return [[path, Array.isArray(v) ? JSON.stringify(v) : String(v)]];
  });
}

function createNumeralRender(format, prefix = '', suffix = '') {
  return function NumeralRender(value) {
    const finalValue = value != null ? value : 0;
    return `${prefix}${numberal(finalValue).format(format)}${suffix}`;
  };
}