import createNumeralRender from "./createNumeralRender.js";

export default function NumberRender(value) {
    let finalValue = value != null ? value : 0;
    let format = '0'
    if (finalValue > 1000) format = '0.0'

    return createNumeralRender(`${format}a`)(value)
}