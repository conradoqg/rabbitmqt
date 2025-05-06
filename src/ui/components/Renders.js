import numberal from 'numeral';
import dayjs from 'dayjs';
export default function createNumeralRender(format, prefix = '', suffix = '') {
    return function NumeralRender(value) {
        let finalValue = value != null ? value : 0;
        return `${prefix}${numberal(finalValue).format(format)}${suffix}`;
    }
}

export function ByteRender(value) {
    return createNumeralRender('0.00b')(value)
}

export function NumberRender(value) {
    let finalValue = value != null ? value : 0;
    let format = '0'
    if (finalValue > 1000) format = '0.0'

    return createNumeralRender(`${format}a`)(value)
}

export function PercentageRender(value) {
    return createNumeralRender('0%')(value);
}

export function RateRender(value) {
    return createNumeralRender('0.00a', '', '/s')(value)
}

export function TimestampRender(value) {
    return value ? dayjs(value.toString().length === 10 ? value * 1000 : value).fromNow() : ''
}