import createNumeralRender from "./createNumeralRender.js"

export default function RateRender(value) {
    return createNumeralRender('0.0a', '', '/s')(value)
}