import numberal from 'numeral';

export default function createNumeralRender(format, prefix = '', suffix = '') {
    return function NumeralRender(value) {
        let finalValue = value != null ? value : 0;
        return `${prefix}${numberal(finalValue).format(format)}${suffix}`;
    }
}