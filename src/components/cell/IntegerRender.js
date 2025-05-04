import numberal from 'numeral';

export default function IntegerRender(value) {
    let finalValue = value != null ? value : 0;
    return `${numberal(finalValue).format('0a')}`;
}