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
    <div class="join">
      <button
        class=${`btn join-item ${page === 1 ? 'btn-disabled' : ''}`}
        onClick=${prevPage}
        disabled=${page === 1}
      >Previous</button>
      ${links.map(link =>
    link === '...'
      ? html`<button class="btn join-item btn-disabled">…</button>`
      : html`<button
              class=${`btn join-item ${link === page ? 'btn-active' : ''}`}
              onClick=${() => goPage(link)}
            >${link}</button>`
  )}
      <button
        class=${`btn join-item ${page === totalPages ? 'btn-disabled' : ''}`}
        onClick=${nextPage}
        disabled=${page === totalPages}
      >Next</button>
    </div>
  `;
}