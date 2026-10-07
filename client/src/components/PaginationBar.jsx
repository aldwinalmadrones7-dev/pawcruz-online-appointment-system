/**
 * PaginationBar — "Showing X–Y of Z", a rows-per-page selector and page buttons
 * (with ellipsis for long lists). Takes the object returned by usePagination.
 */
import { Form } from 'react-bootstrap';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PAGE_SIZE_OPTIONS } from '../utils/constants';

/** e.g. current 6 of 12 → [1, '…', 5, 6, 7, '…', 12] */
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('gap-start');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('gap-end');
  pages.push(total);
  return pages;
}

export default function PaginationBar({ pagination, itemLabel = 'items', showPageSize = true }) {
  const { page, totalPages, setPage, total, startItem, endItem, pageSize, setPageSize } = pagination;
  if (!total) return null;

  return (
    <div className="pagination-bar">
      <p className="pagination-summary">
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{total}</strong> {itemLabel}
      </p>
      <div className="pagination-controls">
        {showPageSize && (
          <label className="page-size">
            <span>Rows</span>
            <Form.Select size="sm" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Rows per page">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Form.Select>
          </label>
        )}
        <nav aria-label="Pagination">
          <ul className="pagination-list">
            <li>
              <button type="button" className="page-btn" onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
                <FiChevronLeft aria-hidden="true" />
              </button>
            </li>
            {getPageNumbers(page, totalPages).map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <button
                    type="button"
                    className={`page-btn${item === page ? ' is-active' : ''}`}
                    onClick={() => setPage(item)}
                    aria-current={item === page ? 'page' : undefined}
                    aria-label={`Page ${item}`}
                  >
                    {item}
                  </button>
                </li>
              ) : (
                <li key={item} className="page-gap" aria-hidden="true">
                  …
                </li>
              ),
            )}
            <li>
              <button type="button" className="page-btn" onClick={() => setPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
                <FiChevronRight aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
