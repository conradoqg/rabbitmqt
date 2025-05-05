import { html } from 'htm/preact';
import RateRender from './RateRender.js';

export default function GroupMessageRateComponent({ value }) {
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
        'Get No Ack': 'bg-warning',
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