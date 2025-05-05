import { html } from 'htm/preact';
import ByteRender from './ByteRender.js';

export default function GroupBytesComponent({ item }) {
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