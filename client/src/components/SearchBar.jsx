/**
 * SearchBar — Search input with an icon and a clear button. Controlled by the
 * parent (pair it with useDebounce to filter lists without lag).
 */
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchBar({ value, onChange, placeholder = 'Search…', label = 'Search', className = '' }) {
  return (
    <div className={`search-bar ${className}`.trim()}>
      <FiSearch className="search-icon" aria-hidden="true" />
      <input
        type="search"
        className="form-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <FiX aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
