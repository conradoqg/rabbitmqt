import { html } from 'htm/preact';
import ByteRender from './ByteRender.js';

export default function GroupBytesComponent({ item }) {
    const entries = [
        ['Total', item.message_bytes],
        ['Ready', item.message_bytes_ready],
        ['Unack', item.message_bytes_unacknowledged],
    ];

    const colorMap = {
        'Total': 'bg-primary',
        'Ready': 'bg-success',
        'Unack': 'bg-warning',
    };

    const items = entries.map(([key, val]) => ({
        key,
        text: ByteRender(val),
        colorClass: colorMap[key] || 'bg-base-200',
    }));

    const cols = items.length;
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
                                        <span class="text-xs font-medium">${item.key}</span>
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