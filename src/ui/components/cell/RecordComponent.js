import { html } from 'htm/preact';
// Recursively flatten object properties into [path, value] pairs
function flattenProps(obj, prefix = '') {
  const entries = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      entries.push(...flattenProps(val, path));
    } else {
      let displayVal;
      if (Array.isArray(val)) {
        displayVal = JSON.stringify(val);
      } else {
        displayVal = String(val);
      }
      entries.push([path, displayVal]);
    }
  }
  return entries;
}

export default function RecordComponent({ value }) {
  if (value && typeof value === 'object' && Object.keys(value).length > 0) {
    // Flatten object and nested properties for tooltip
    const items = flattenProps(value);
    const title = items.map(([k, v]) => `${k}: ${v}`).join('\n');
    return html`
      <span class="cursor-help" title=${title}>
        <i class="mdi mdi-information"></i>
      </span>
    `;
  }
  return '';
}