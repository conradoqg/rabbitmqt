import { html } from 'htm/preact';

// A table cell for displaying names with limited width, tooltip, and copy-to-clipboard button
export default function NameCell({ value }) {
  const copyToClipboard = async e => {
    // Prevent row click events
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return html`
    <div class="flex items-center">
      <span class="flex-1 min-w-0 truncate" title=${value}>${value}</span>
      <button
        class="btn btn-ghost btn-xs ml-2 text-gray-500 hover:text-gray-700"
        onClick=${copyToClipboard}
        title="Copy"
      >
        <i class="mdi mdi-content-copy"></i>
      </button>
    </div>
  `;
}