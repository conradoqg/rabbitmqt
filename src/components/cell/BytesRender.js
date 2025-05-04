import numberal from 'numeral';

export default function BytesRender(value) {
    let finalValue = value != null ? value : 0;
    return `${numberal(finalValue).format('0b')}`;
}