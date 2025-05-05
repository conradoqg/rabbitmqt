import createNumeralRender from "./createNumeralRender.js";

export default function IntegerRender(value) {
    return createNumeralRender('0a')(value)
}