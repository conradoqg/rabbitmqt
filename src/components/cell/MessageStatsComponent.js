import { html } from 'htm/preact';
import RecordComponent from './RecordComponent.js';

export default function MessageStatsComponent({ value }) {
    const stats = {
        'Ack': `${value?.ack_details?.rate != null ? value.ack_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
        'Deliver': `${value?.deliver_details?.rate != null ? value.deliver_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
        'Deliver Get': `${value?.deliver_get_details?.rate != null ? value.deliver_get_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
        'Deliver No Ack': `${value?.deliver_no_ack_details?.rate != null ? value.deliver_no_ack_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
        'Get Ack': `${value?.get_details?.rate != null ? value.get_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
        'Get Empty Ack': `${value?.get_empty_details?.rate != null ? value.get_empty_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
        'Get No Ack': `${value?.get_no_ack_details?.rate != null ? value.get_no_ack_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
        'Redeliver': `${value?.redeliver_details?.rate != null ? value.redeliver_details.rate.toFixed(2) : (0.0).toFixed(2)}/s`,
    }

    return html`<${RecordComponent} value=${stats}/>`;
}