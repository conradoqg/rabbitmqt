import { html } from 'htm/preact';
import RecordComponent from './RecordComponent.js';
import RateRender from './RateRender.js';

export default function MessageStatsComponent({ value }) {
    const stats = {
        'Ack': RateRender(value?.ack_details?.rate),
        'Deliver': RateRender(value?.deliver_details?.rate),
        'Deliver Get': RateRender(value?.deliver_get_details?.rate),
        'Deliver No Ack': RateRender(value?.deliver_no_ack_details?.rate),
        'Get Ack': RateRender(value?.get_details?.rate),
        'Get Empty Ack': RateRender(value?.get_empty_details?.rate),
        'Get No Ack': RateRender(value?.get_no_ack_details?.rate),
        'Redeliver': RateRender(value?.redeliver_details?.rate),
    }

    return html`<${RecordComponent} value=${stats}/>`;
}