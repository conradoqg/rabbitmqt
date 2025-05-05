import createNumeralRender from './createNumeralRender.js';

export default function PercentageRender(value) {
    return createNumeralRender('0%')(value);
}