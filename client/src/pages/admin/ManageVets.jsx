/**
 * ManageVets — Admin list of veterinarians (search + pagination) with add, edit and
 * delete in modals. Deleting is blocked while a vet still has upcoming visits.
 */
import { useMemo, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiClock, FiEdit2, FiPlus, FiSearch, FiShield, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import DayChips from '../../components/DayChips';
import EmptyState from '../../components/EmptyState';
import ImageWithFallback from '../../components/ImageWithFallback';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PaginationBar from '../../components/PaginationBar';
import RatingStars from '../../components/RatingStars';
import SearchBar from '../../components/SearchBar';
import VetFormModal from '../../components/VetFormModal';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import { deleteVet, getVets } from '../../services/vetService';
import { formatShift, formatVetName } from '../../utils/formatters';

export default function ManageVets() {
  const { data, loading, error, reload, setData } = useAsync(() => getVets(), []);
  const [search, setSearch] = useState('');
  const query = useDebounce(search, 300).trim().toLowerCase();
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'form' | 'delete' | null
  const [deleting, setDeleting] = useState(false);

  const vets = useMemo(
    () => (data ?? []).filter((v) => !query || `${v.name} ${v.specialty} ${v.email} ${v.licenseNo}`.toLowerCase().includes(query)),
    [data, query],
  );
  const pagination = usePagination(vets, { initialPageSize: 10, resetKey: query });

  const open = (type, vet = null) => {
    setSelected(vet);
    setModal(type);
  };

  const handleSaved = (saved) =>
    setData((list) => {
      const next = list.some((v) => v.id === saved.id) ? list.map((v) => (v.id === saved.id ? saved : v)) : [...list, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteVet(selected.id);
      setData((list) => list.filter((v) => v.id !== selected.id));
      toast.success(`${formatVetName(selected)} was removed.`);
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin panel"
        title="Veterinarians"
        subtitle="Manage the vet team, their PRC licenses, duty days and shift hours (these drive the booking slots)."
        actions={
          <Button variant="cta" onClick={() => open('form')}>
            <FiPlus aria-hidden="true" /> Add veterinarian
          </Button>
        }
      />

      <div className="pc-card">
        <div className="pc-card-body">
          <div className="toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, specialty, email or license…" label="Search veterinarians" className="toolbar-search" />
          </div>

          {loading && !data ? (
            <LoadingSpinner label="Loading veterinarians…" />
          ) : error ? (
            <EmptyState title="We couldn't load veterinarians" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
          ) : vets.length ? (
            <>
              <Row className="g-3">
                {pagination.pageItems.map((vet) => (
                  <Col md={6} xxl={4} key={vet.id}>
                    <article className="admin-vet">
                      <ImageWithFallback src={vet.photo} alt={formatVetName(vet)} icon={FaUserMd} className="admin-vet-photo" />
                      <div className="admin-vet-body">
                        <span className="vet-specialty">{vet.specialty}</span>
                        <h3>{formatVetName(vet)}</h3>
                        <small className="text-muted-soft d-block text-break">
                          {vet.email} · {vet.phone}
                        </small>
                        <RatingStars rating={vet.rating} count={vet.reviewCount} />
                        <p className="admin-vet-meta">
                          <span>
                            <FiClock aria-hidden="true" /> {formatShift(vet)}
                          </span>
                          <span>
                            <FiShield aria-hidden="true" /> {vet.licenseNo}
                          </span>
                        </p>
                        <DayChips days={vet.availableDays} />
                        <div className="row-actions justify-content-start mt-3">
                          <Button variant="soft" size="sm" onClick={() => open('form', vet)}>
                            <FiEdit2 aria-hidden="true" /> Edit
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => open('delete', vet)}>
                            <FiTrash2 aria-hidden="true" /> Delete
                          </Button>
                        </div>
                      </div>
                    </article>
                  </Col>
                ))}
              </Row>
              <PaginationBar pagination={pagination} itemLabel="veterinarians" />
            </>
          ) : (
            <EmptyState compact icon={FiSearch} title="No veterinarians match" message="Try another name, specialty or license number." />
          )}
        </div>
      </div>

      <VetFormModal show={modal === 'form'} vet={selected} onHide={() => setModal(null)} onSaved={handleSaved} />

      <ConfirmModal
        show={modal === 'delete'}
        title="Remove this veterinarian?"
        message={selected ? `${formatVetName(selected)} will no longer appear on the website or in booking. Past visits stay in the records.` : ''}
        confirmLabel="Remove veterinarian"
        icon={FiTrash2}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
