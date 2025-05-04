import { html } from 'htm/preact';

export default function RateRender(value) {
  return `${value != null ? value.toFixed(2) : (0.0).toFixed(2)}/s`
}