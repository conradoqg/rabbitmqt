import { html } from 'htm/preact';
import { useSignal } from '@preact/signals';
import { useRef } from 'preact/hooks';
import { url, username, password, addToast } from '../../store.js';
import { ByteRender, NumberRender, RateRender } from './Renders.js';

export function ArrayComponent({ value }) {
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

export function ConfirmQueueComponent({ value, item }) {
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

export function GroupBytesComponent({ item }) {
  const entries = [
    ['Total', item.message_bytes, 'Total size of all messages in the queue, in bytes. Represents the overall memory footprint of the queue.'],
    ['Paged Out', item.message_bytes_paged_out, 'Size of messages moved to disk, in bytes. Indicates how much data is stored outside of RAM.'],
    ['Persistent', item.message_bytes_persistent, 'Size of persistent messages, in bytes. Reflects the data volume that will survive a broker restart.'],
    ['RAM', item.message_bytes_ram, 'Size of messages currently in RAM, in bytes. Shows the memory usage for messages stored in memory.'],
    ['Ready', item.message_bytes_ready, 'Size of messages ready to be delivered, in bytes. Indicates the data volume waiting to be consumed.'],
    ['Unacked', item.message_bytes_unacknowledged, 'Size of messages delivered but not yet acknowledged, in bytes. Highlights potential processing delays or issues in terms of data volume.'],
  ];

  const colorMap = {
    'Total': 'bg-primary',
    'Paged Out': 'bg-secondary',
    'Persistent': 'bg-error',
    'RAM': 'bg-info',
    'Ready': 'bg-success',
    'Unacked': 'bg-warning',
  };

  const items = entries.map(([key, val, tooltip]) => ({
    key,
    text: ByteRender(val),
    tooltip: tooltip,
    colorClass: colorMap[key] || 'bg-base-200',
  }));

  const cols = 3;
  const rows = Math.ceil(items.length / cols);

  return html`
      <table class="table table-xs table-compact table-auto text-xs">
          <tbody>
              ${Array.from({ length: rows }).map((_, rowIndex) => {
    const rowItems = items.slice(rowIndex * cols, rowIndex * cols + cols);
    return html`
                      <tr>
                          ${rowItems.map(item => html`
                              <td class="px-1 py-0 align-top">
                                  <div class="flex items-center">
                                      <span class="${item.colorClass} inline-block w-2 h-2 mr-1"></span>
                                      <span class="text-xs font-medium" title=${item.tooltip}>${item.key} <i class="mdi mdi-information"></i></span>
                                  </div>
                                  <div class="text-xs text-left">
                                      ${item.text}
                                  </div>
                              </td>
                          `)}
                      </tr>
                  `;
  })}
          </tbody>
      </table>
  `;
}

export function GroupMessageRateComponent({ value }) {
  const statsEntries = [
    ['Publish', value?.publish_details?.rate, 'Rate of messages published to the queue. Provides insight into how quickly messages are being added to the queue.'],
    ['Ack', value?.ack_details?.rate, 'Rate of messages acknowledged by consumers. Indicates how quickly consumers are confirming receipt of messages.'],
    ['Redeliver', value?.redeliver_details?.rate, 'Rate of messages that have been redelivered. Indicates how often messages are being returned to the queue for reprocessing, often due to negative acknowledgments or timeouts.'],
    ['Deliver', value?.deliver_details?.rate, 'Rate of messages delivered to consumers and acknowledged. Shows the speed of message delivery and processing.'],
    ['Deliver Get', value?.deliver_get_details?.rate, 'Rate of messages either delivered to consumers or retrieved using basic.get. Reflects overall message consumption activity.'],
    ['Deliver No Ack', value?.deliver_no_ack_details?.rate, 'Rate of messages delivered to consumers without requiring acknowledgment. Useful for monitoring "no-ack" message delivery.'],
    ['Get', value?.get_details?.rate, 'Rate of messages fetched using basic.get. Indicates how often messages are being synchronously retrieved from the queue.'],
    ['Get Empty', value?.get_empty_details?.rate, 'Rate of basic.get operations that found the queue empty. Helps identify how often consumers attempt to fetch messages when none are available.'],
    ['Get No Ack', value?.get_no_ack_details?.rate, 'Rate of messages fetched using basic.get without requiring acknowledgment. Shows the rate of synchronous retrievals without acknowledgment.'],
  ];

  const colorMap = {
    'Publish': 'bg-success-content',
    'Ack': 'bg-success',
    'Redeliver': 'bg-error',
    'Deliver': 'bg-info',
    'Deliver Get': 'bg-secondary',
    'Deliver No Ack': 'bg-warning',
    'Get': 'bg-primary',
    'Get Empty': 'bg-neutral',
    'Get No Ack': 'bg-warning-content',
  };

  const items = statsEntries.map(([key, rate, tooltip]) => ({
    key,
    rate: rate != null ? rate : 0,
    text: RateRender(rate),
    tooltip: tooltip,
    colorClass: colorMap[key] || 'bg-base-200',
  }));

  // Number of columns for message rate stats (4 columns across)
  const cols = 5;
  const rows = Math.ceil(items.length / cols);

  return html`
      <table class="table table-xs table-compact table-auto text-xs">
          <tbody>
              ${Array.from({ length: rows }).map((_, rowIndex) => {
    const rowItems = items.slice(rowIndex * cols, rowIndex * cols + cols);
    return html`
                      <tr>
                      ${rowItems.map(item => html`
                              <td class="px-1 py-0 align-top">
                                  <div class="flex items-center">
                                      <span class="${item.colorClass} inline-block w-2 h-2 mr-1"></span>
                                      <span class="text-xs font-medium" title=${item.tooltip}>${item.key} <i class="mdi mdi-information"></i></span>
                                  </div>
                                  <div class="text-xs text-left">
                                      ${item.text}
                                  </div>
                              </td>
                          `)}
                          ${rowItems.length < cols ? Array.from({ length: cols - rowItems.length }).map(() => html`<td></td>`) : ''}
                      </tr>
                  `;
  })}
          </tbody>
      </table>
  `;
}

export function GroupMessagesComponent({ item }) {
  const entries = [
    ['Total', item.messages, 'Total number of messages in the queue. Represents the current queue size.'],
    ['Paged Out', item.messages_paged_out, 'Number of messages moved to disk. Indicates how many messages are stored outside of RAM.'],
    ['Persistent', item.messages_persistent, 'Number of persistent messages in the queue. Reflects messages that will survive a broker restart.'],
    ['RAM', item.messages_ram, 'Number of messages currently in RAM. Shows how many messages are stored in memory for faster access.'],
    ['Ready', item.messages_ready, 'Number of messages ready to be delivered to consumers. Indicates messages waiting to be consumed.'],
    ['Ready RAM', item.messages_ready_ram, 'Number of ready messages stored in RAM. Highlights how many ready messages are in memory.'],
    ['Unacked', item.messages_unacknowledged, 'Number of messages delivered to consumers but not yet acknowledged. Indicates potential processing delays or issues.'],
    ['Unacked RAM', item.messages_unacknowledged_ram, 'Number of unacknowledged messages stored in RAM. Shows how many unacknowledged messages are kept in memory.'],
  ];

  const colorMap = {
    'Total': 'bg-success-content',
    'Paged Out': 'bg-success',
    'Persistent': 'bg-error',
    'RAM': 'bg-info',
    'Ready': 'bg-secondary',
    'Ready RAM': 'bg-warning',
    'Unacked': 'bg-primary',
    'Unacked RAM': 'bg-warning-content',
  };

  const items = entries.map(([key, val, tooltip]) => ({
    key,
    text: NumberRender(val),
    tooltip: tooltip,
    colorClass: colorMap[key] || 'bg-base-200',
  }));

  const cols = 4;
  const rows = Math.ceil(items.length / cols);

  return html`
      <table class="table table-xs table-compact table-auto text-xs">
          <tbody>
              ${Array.from({ length: rows }).map((_, rowIndex) => {
    const rowItems = items.slice(rowIndex * cols, rowIndex * cols + cols);
    return html`
                      <tr>
                          ${rowItems.map(item => html`
                              <td class="px-1 py-0 align-top">
                                  <div class="flex items-center">
                                      <span class="${item.colorClass} inline-block w-2 h-2 mr-1"></span>
                                      <span class="text-xs font-medium" title=${item.tooltip}>${item.key} <i class="mdi mdi-information"></i></span>
                                  </div>
                                  <div class="text-xs text-left">
                                      ${item.text}
                                  </div>
                              </td>
                          `)}
                      </tr>
                  `;
  })}
          </tbody>
      </table>
  `;
}

export function NameCell({ value }) {
  const copyToClipboard = async e => {
    // Prevent row click events
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return html`
    <div class="flex items-center">
      <span class="flex-1 min-w-0 truncate" title=${value}>${value}</span>
      <button
        class="btn btn-ghost btn-xs ml-2 text-gray-500 hover:text-gray-700"
        onClick=${copyToClipboard}
        title="Copy"
      >
        <i class="mdi mdi-content-copy"></i>
      </button>
    </div>
  `;
}

// Recursively flatten object properties into [path, value] pairs
function flattenProps(obj, prefix = '') {
  const entries = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      entries.push(...flattenProps(val, path));
    } else {
      let displayVal;
      if (Array.isArray(val)) {
        displayVal = JSON.stringify(val);
      } else {
        displayVal = String(val);
      }
      entries.push([path, displayVal]);
    }
  }
  return entries;
}

export function RecordComponent({ value }) {
  if (value && typeof value === 'object' && Object.keys(value).length > 0) {
    // Flatten object and nested properties for tooltip
    const items = flattenProps(value);
    const title = items.map(([k, v]) => `${k}: ${v}`).join('\n');
    return html`
      <span class="cursor-help" title=${title}>
        <i class="mdi mdi-information"></i>
      </span>
    `;
  }
  return '';
}

export function StateComponent({ value }) {
  const stateMap = {
    'running': 'status-success',
    'idle': 'status-info',
    'flow': 'status-warning',
  }

  if (stateMap[value]) return html`<span title="${value}" class="status ${stateMap[value]}"></span>`
  else return html`<span class="status status-error"></span>`
}