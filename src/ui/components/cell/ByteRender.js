import createNumeralRender from "./createNumeralRender.js";

export default function ByteRender(value) {
    return createNumeralRender('0.00b')(value)
}