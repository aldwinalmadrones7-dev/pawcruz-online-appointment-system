/**
 * Services — All dental services with a debounced search, category filter and
 * price sorting. Each card links straight into the booking wizard.
 */
import { useMemo, useState } from 'react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import CtaBand from '../../components/CtaBand';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHero from '../../components/PageHero';
import SearchBar from '../../components/SearchBar';
import ServiceCard from '../../components/ServiceCard';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { getServices } from '../../services/serviceService';
import { SERVICE_CATEGORIES } from '../../utils/constants';

const SORTS = {
  featured: { label: 'Featured first', compare: (a, b) => Number(b.featured) - Number(a.featured) },
  priceAsc: { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  priceDesc: { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  duration: { label: 'Shortest first', compare: (a, b) => a.duration - b.duration },
};

export default function Services() {
  const { data, loading, error, reload } = useAsync(() => getServices(), []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const query = useDebounce(search, 250).trim().toLowerCase();

  const services = useMemo(
    () =>
      (data ?? [])
        .filter((service) => category === 'All' || service.category === category)
        .filter((service) => !query || `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(query))
        .sort(SORTS[sort].compare),
    [data, category, query, sort],
  );

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
  };

  return (
    <>
      <PageHero
        eyebrow="Services & pricing"
        title="Care for every kind of pet"
        subtitle="Starting prices in Philippine pesos. Book any service as your reason for visit — every booking starts with a 10-minute consultation slot."
      />

      <section className="section pt-2">
        <Container>
          <div className="filter-bar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search services…" label="Search services" className="filter-search" />
            <Form.Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort services" className="filter-sort">
              {Object.entries(SORTS).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="category-pills" role="group" aria-label="Filter by category">
            {['All', ...SERVICE_CATEGORIES].map((item) => (
              <button key={item} type="button" className={`pill${item === category ? ' is-active' : ''}`} aria-pressed={item === category} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>

          {loading && !data ? (
            <LoadingSpinner label="Loading services…" />
          ) : error ? (
            <EmptyState title="We couldn't load our services" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
          ) : services.length ? (
            <>
              <p className="results-count" aria-live="polite">
                {services.length} service{services.length === 1 ? '' : 's'}
              </p>
              <Row className="g-4">
                {services.map((service) => (
                  <Col sm={6} lg={4} xl={3} key={service.id}>
                    <ServiceCard
                      service={service}
                      action={
                        <Button as={Link} to={`/owner/book?service=${service.id}`} variant="brand" className="w-100">
                          Book this service
                        </Button>
                      }
                    />
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <EmptyState
              icon={FiSearch}
              title="No services match your search"
              message="Try a different word or category."
              action={
                <Button variant="outline-ink" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          )}
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
