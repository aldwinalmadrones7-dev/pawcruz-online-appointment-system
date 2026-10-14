/**
 * ManageServices — Admin list of clinic services (search, category filter,
 * pagination) with add, edit and delete in modals.
 */
import { useMemo, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { FiEdit2, FiPlus, FiSearch, FiStar, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import ImageWithFallback from '../../components/ImageWithFallback';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PaginationBar from '../../components/PaginationBar';
import SearchBar from '../../components/SearchBar';
import ServiceFormModal from '../../components/ServiceFormModal';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import { deleteService, getServices } from '../../services/serviceService';
import { SERVICE_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDuration } from '../../utils/formatters';

export default function ManageServices() {
  const { data, loading, error, reload, setData } = useAsync(() => getServices(), []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const query = useDebounce(search, 300).trim().toLowerCase();
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'form' | 'delete' | null
  const [deleting, setDeleting] = useState(false);

  const services = useMemo(
    () =>
      (data ?? [])
        .filter((s) => !category || s.category === category)
        .filter((s) => !query || `${s.name} ${s.description}`.toLowerCase().includes(query)),
    [data, category, query],
  );
  const pagination = usePagination(services, { initialPageSize: 5, resetKey: `${query}|${category}` });

  const open = (type, service = null) => {
    setSelected(service);
    setModal(type);
  };

  const handleSaved = (saved) =>
    setData((list) => (list.some((s) => s.id === saved.id) ? list.map((s) => (s.id === saved.id ? saved : s)) : [...list, saved]));

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteService(selected.id);
      setData((list) => list.filter((s) => s.id !== selected.id));
      toast.success(`${selected.name} was deleted.`);
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const actions = (service) => (
    <div className="row-actions">
      <Button variant="soft" size="sm" onClick={() => open('form', service)} aria-label={`Edit ${service.name}`}>
        <FiEdit2 aria-hidden="true" /> <span className="d-none d-xl-inline">Edit</span>
      </Button>
      <Button variant="outline-danger" size="sm" onClick={() => open('delete', service)} aria-label={`Delete ${service.name}`}>
        <FiTrash2 aria-hidden="true" /> <span className="d-none d-xl-inline">Delete</span>
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Admin panel"
        title="Services"
        subtitle="The clinic’s services and starting prices. Pet owners pick one as their reason for visit when booking."
        actions={
          <Button variant="cta" onClick={() => open('form')}>
            <FiPlus aria-hidden="true" /> Add service
          </Button>
        }
      />

      <div className="pc-card">
        <div className="pc-card-body">
          <div className="toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search services…" label="Search services" className="toolbar-search" />
            <Form.Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category" className="toolbar-select">
              <option value="">All categories</option>
              {SERVICE_CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Form.Select>
          </div>

          {loading && !data ? (
            <LoadingSpinner label="Loading services…" />
          ) : error ? (
            <EmptyState title="We couldn't load services" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
          ) : services.length ? (
            <>
              <div className="d-none d-md-block">
                <Table hover responsive className="pc-table align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Service</th>
                      <th scope="col">Category</th>
                      <th scope="col">Duration</th>
                      <th scope="col" className="text-end">
                        Price
                      </th>
                      <th scope="col" className="text-end">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.pageItems.map((service) => (
                      <tr key={service.id}>
                        <td>
                          <span className="person-cell">
                            <ImageWithFallback src={service.image} alt="" className="service-thumb" />
                            <span>
                              <strong className="d-block">
                                {service.name}
                                {service.featured && (
                                  <span className="featured-tag" title="Featured on the home page">
                                    <FiStar aria-hidden="true" /> Featured
                                  </span>
                                )}
                              </strong>
                              <small className="text-muted-soft line-clamp-1">{service.description}</small>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="category-tag">{service.category}</span>
                        </td>
                        <td>{formatDuration(service.duration)}</td>
                        <td className="text-end fw-bold tabular">{formatCurrency(service.price)}</td>
                        <td className="text-end">{actions(service)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-md-none card-list">
                {pagination.pageItems.map((service) => (
                  <article key={service.id} className="mobile-row-card">
                    <ImageWithFallback src={service.image} alt="" className="service-thumb" />
                    <div className="flex-grow-1">
                      <strong className="d-block">{service.name}</strong>
                      <small className="text-muted-soft">
                        {service.category} · {formatDuration(service.duration)} · {formatCurrency(service.price)}
                      </small>
                      <div className="mt-2">{actions(service)}</div>
                    </div>
                  </article>
                ))}
              </div>
              <PaginationBar pagination={pagination} itemLabel="services" />
            </>
          ) : (
            <EmptyState compact icon={FiSearch} title="No services match" message="Try another search or category." />
          )}
        </div>
      </div>

      <ServiceFormModal show={modal === 'form'} service={selected} onHide={() => setModal(null)} onSaved={handleSaved} />

      <ConfirmModal
        show={modal === 'delete'}
        title="Delete this service?"
        message={selected ? `${selected.name} will no longer be offered as a reason for visit. Past appointments keep their records.` : ''}
        confirmLabel="Delete service"
        icon={FiTrash2}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
