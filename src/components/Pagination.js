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
    <nav class="pagination is-small" role="navigation" aria-label="pagination">
      <a class="pagination-previous ${page === 1 ? 'is-disabled' : ''}" onClick=${prevPage}>Previous</a>
      <a class="pagination-next ${page === totalPages ? 'is-disabled' : ''}" onClick=${nextPage}>Next</a>
      <ul class="pagination-list">
        ${links.map(link =>
    link === '...'
      ? html`<li><span class="pagination-ellipsis">...</span></li>`
      : html`<li><a class="pagination-link ${link === page ? 'is-current' : ''}" onClick=${() => goPage(link)}>${link}</a></li>`
  )}
      </ul>
    </nav>
  `;
}