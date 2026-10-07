/**
 * MyAppointments — The owner's appointments (final-vet style): table on desktop, cards
 * on mobile; debounced search, status and pet filters, date sorting, pagination, and
 * view / rebook (online bookings) / cancel (with confirmation) actions.
 */
import { useMemo, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { FiCalendar, FiEye, FiPlusCircle, FiRepeat, FiSearch, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppointmentCard from '../../components/AppointmentCard';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PaginationBar from '../../components/PaginationBar';
import PetAvatar from '../../components/PetAvatar';
import RebookModal from '../../components/RebookModal';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import { cancelAppointment, getMyAppointments } from '../../services/appointmentService';
import { canOwnerCancel, canOwnerRebook, compareByDateTime, isUpcoming } from '../../utils/appointmentRules';
import { APPOINTMENT_STATUSES } from '../../utils/constants';
import { formatDate, formatDateShort, formatTime, formatTimeRange, formatVetName } from '../../utils/formatters';

const SORTS = {
  upcoming: { label: 'Upcoming first', compare: (a, b) => (isUpcoming(a) === isUpcoming(b) ? (isUpcoming(a) ? compareByDateTime(a, b) : compareByDateTime(b, a)) : isUpcoming(a) ? -1 : 1) },
  newest: { label: 'Date: newest first', compare: (a, b) => compareByDateTime(b, a) },
  oldest: { label: 'Date: oldest first', compare: compareByDateTime },
};

const CANCEL_REASONS = ['Schedule conflict', 'My pet is feeling better', 'Found another time', 'Other'];

export default function MyAppointments() {
  const { data, loading, error, reload, setData } = useAsync(() => getMyAppointments(), []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [petId, setPetId] = useState('');
  const [sort, setSort] = useState('upcoming');
  const query = useDebounce(search, 300).trim().toLowerCase();

  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'rebook' | 'cancel' | null
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelling, setCancelling] = useState(false);

  const appointments = useMemo(() => data ?? [], [data]);
  const petOptions = useMemo(() => [...new Map(appointments.map((a) => [a.petId, a.pet])).values()].sort((a, b) => a.name.localeCompare(b.name)), [appointments]);

  const counts = useMemo(
    () => Object.fromEntries(['All', ...APPOINTMENT_STATUSES].map((s) => [s, s === 'All' ? appointments.length : appointments.filter((a) => a.status === s).length])),
    [appointments],
  );

  const filtered = useMemo(
    () =>
      appointments
        .filter((a) => status === 'All' || a.status === status)
        .filter((a) => !petId || a.petId === petId)
        .filter((a) => !query || [a.reference, a.queueNumber, a.pet.name, a.service.name, formatVetName(a.vet)].some((value) => value.toLowerCase().includes(query)))
        .sort(SORTS[sort].compare),
    [appointments, status, petId, query, sort],
  );

  const pagination = usePagination(filtered, { initialPageSize: 5, resetKey: `${query}|${status}|${petId}|${sort}` });

  const replaceAppointment = (updated) => setData((list) => list.map((a) => (a.id === updated.id ? updated : a)));

  const openModal = (type, appointment) => {
    setSelected(appointment);
    setCancelReason(CANCEL_REASONS[0]);
    setModal(type);
  };

  async function confirmCancel() {
    setCancelling(true);
    try {
      const updated = await cancelAppointment(selected.id, cancelReason);
      replaceAppointment(updated);
      toast.success(`${updated.pet.name}'s appointment was cancelled.`);
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const clearFilters = () => {
    setSearch('');
    setStatus('All');
    setPetId('');
  };

  const iconActions = (appointment) => (
    <div className="row-actions">
      <Button as={Link} to={`/owner/appointments/${appointment.id}`} variant="soft" size="sm" className="btn-icon" title="View details" aria-label={`View ${appointment.pet.name}'s appointment`}>
        <FiEye aria-hidden="true" />
      </Button>
      {canOwnerRebook(appointment) && (
        <Button variant="soft" size="sm" className="btn-icon" title="Rebook" aria-label={`Rebook ${appointment.pet.name}'s appointment`} onClick={() => openModal('rebook', appointment)}>
          <FiRepeat aria-hidden="true" />
        </Button>
      )}
      {canOwnerCancel(appointment) && (
        <Button variant="outline-danger" size="sm" className="btn-icon" title="Cancel" aria-label={`Cancel ${appointment.pet.name}'s appointment`} onClick={() => openModal('cancel', appointment)}>
          <FiXCircle aria-hidden="true" />
        </Button>
      )}
    </div>
  );

  const cardActions = (appointment) => (
    <>
      <Button as={Link} to={`/owner/appointments/${appointment.id}`} variant="soft" size="sm">
        <FiEye aria-hidden="true" /> View
      </Button>
      {canOwnerRebook(appointment) && (
        <Button variant="outline-ink" size="sm" onClick={() => openModal('rebook', appointment)}>
          <FiRepeat aria-hidden="true" /> Rebook
        </Button>
      )}
      {canOwnerCancel(appointment) && (
        <Button variant="outline-danger" size="sm" onClick={() => openModal('cancel', appointment)}>
          <FiXCircle aria-hidden="true" /> Cancel
        </Button>
      )}
    </>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Pet owner portal"
        title="Appointments"
        subtitle="Your pets’ visits in one place. Cancel any upcoming visit, or rebook an online booking to a new time."
        actions={
          <Button as={Link} to="/owner/book" variant="cta">
            <FiPlusCircle aria-hidden="true" /> Book new
          </Button>
        }
      />

      {loading && !data ? (
        <LoadingSpinner label="Loading your appointments…" />
      ) : error ? (
        <EmptyState title="We couldn't load your appointments" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
      ) : !appointments.length ? (
        <EmptyState
          icon={FiCalendar}
          title="No appointments yet"
          message="Your pets’ bookings will show up here. Ready for the first visit?"
          action={
            <Button as={Link} to="/owner/book" variant="brand">
              Book an appointment
            </Button>
          }
        />
      ) : (
        <div className="pc-card">
          <div className="pc-card-body">
            <div className="toolbar">
              <SearchBar value={search} onChange={setSearch} placeholder="Search pet, vet, reason or reference…" label="Search appointments" className="toolbar-search" />
              <Form.Select value={petId} onChange={(event) => setPetId(event.target.value)} aria-label="Filter by pet" className="toolbar-select">
                <option value="">All pets</option>
                {petOptions.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort appointments" className="toolbar-select">
                {Object.entries(SORTS).map(([key, option]) => (
                  <option key={key} value={key}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="status-tabs" role="group" aria-label="Filter by status">
              {['All', ...APPOINTMENT_STATUSES].map((item) => (
                <button key={item} type="button" className={`pill${item === status ? ' is-active' : ''}`} aria-pressed={item === status} onClick={() => setStatus(item)}>
                  {item} <span className="pill-count">{counts[item]}</span>
                </button>
              ))}
            </div>

            {filtered.length ? (
              <>
                <div className="d-none d-md-block">
                  <Table hover responsive className="pc-table align-middle">
                    <thead>
                      <tr>
                        <th scope="col">Date &amp; time</th>
                        <th scope="col">Pet</th>
                        <th scope="col">Veterinarian</th>
                        <th scope="col">Reason</th>
                        <th scope="col">Queue</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="text-end">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagination.pageItems.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>
                            <strong className="d-block text-nowrap">{formatDate(appointment.date, 'EEE, MMM d, yyyy')}</strong>
                            <small className="text-muted-soft text-nowrap">{formatTimeRange(appointment.startTime, appointment.endTime)}</small>
                          </td>
                          <td>
                            <span className="person-cell">
                              <PetAvatar species={appointment.pet.species} size={36} />
                              <span>
                                <strong className="d-block">{appointment.pet.name}</strong>
                                <small className="text-muted-soft">{appointment.pet.breed || appointment.pet.species}</small>
                              </span>
                            </span>
                          </td>
                          <td className="text-nowrap">{formatVetName(appointment.vet)}</td>
                          <td>{appointment.service.name}</td>
                          <td>
                            <strong className="d-block">{appointment.queueNumber}</strong>
                            <small className="text-muted-soft">{appointment.source}</small>
                          </td>
                          <td>
                            <StatusBadge status={appointment.status} />
                          </td>
                          <td className="text-end">{iconActions(appointment)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="d-md-none card-list">
                  {pagination.pageItems.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} actions={cardActions(appointment)} />
                  ))}
                </div>
                <PaginationBar pagination={pagination} itemLabel="appointments" />
              </>
            ) : (
              <EmptyState
                compact
                icon={FiSearch}
                title="No appointments match"
                message="Try another search word, pet or status."
                action={
                  <Button variant="outline-ink" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}

      <RebookModal appointment={selected} show={modal === 'rebook'} onHide={() => setModal(null)} onRebooked={replaceAppointment} />

      <ConfirmModal
        show={modal === 'cancel'}
        title="Cancel this appointment?"
        message={selected ? `${selected.pet.name} · ${selected.service.name} on ${formatDateShort(selected.date)} at ${formatTime(selected.startTime)} with ${formatVetName(selected.vet)}. This can't be undone.` : ''}
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep appointment"
        icon={FiXCircle}
        busy={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setModal(null)}
      >
        <Form.Group controlId="cancel-reason" className="text-start">
          <Form.Label>Reason (helps us improve)</Form.Label>
          <Form.Select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
            {CANCEL_REASONS.map((reason) => (
              <option key={reason}>{reason}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </ConfirmModal>
    </div>
  );
}
