import { html } from 'htm/preact';

export default function Pagination({ page, totalPages, prevPage, nextPage, goPage }) {
  // Calculate visible page links (with ellipses)
  let links = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) {
    links.push(1);
    if (start > 2) links.push('...');
  }
  for (let i = start; i <= end; i++) links.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) links.push('...');
    links.push(totalPages);
  }

  const ellipses = "&hellip;"

  return html`
    <div class="flex flex-wrap items-center space-x-1 mb-4">
      <button
        class=${`btn btn-sm ${page === 1 ? 'btn-disabled' : 'btn-ghost'}`}
        onClick=${prevPage}
        disabled=${page === 1}
      >Previous</button>
      ${links.map(link =>
        link === '...'
          ? html`<button class="btn btn-sm btn-ghost">…</button>`
          : html`<button
              class=${`btn btn-sm ${link === page ? 'btn-active' : 'btn-ghost'}`}
              onClick=${() => goPage(link)}
            >${link}</button>`
      )}
      <button
        class=${`btn btn-sm ${page === totalPages ? 'btn-disabled' : 'btn-ghost'}`}
        onClick=${nextPage}
        disabled=${page === totalPages}
      >Next</button>
    </div>
  `;
}