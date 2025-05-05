import createNumeralRender from "./createNumeralRender.js"

export default function RateRender(value) {
    return createNumeralRender('0.00a', '', '/s')(value)
}