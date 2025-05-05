import { html } from 'htm/preact';
import NumberRender from './NumberRender.js';
import RateRender from './RateRender.js';

export default function GroupMessagesComponent({ item }) {
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