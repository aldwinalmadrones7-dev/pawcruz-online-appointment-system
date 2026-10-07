/**
 * ManageAppointments — Admin CRUD for every appointment (final-vet's "List of Appointments"):
 * register walk-ins, edit, delete, mark completed, rebook and cancel, with search,
 * status / vet / source / date filters and pagination.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Form, Table } from 'react-bootstrap';
import { FiCheckCircle, FiEdit2, FiMoreVertical, FiPlus, FiRepeat, FiSearch, FiTrash2, FiX, FiXCircle } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppointmentCard from '../../components/AppointmentCard';
import AppointmentFormModal from '../../components/AppointmentFormModal';
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
import { deleteAppointment, getAppointments, updateAppointmentStatus } from '../../services/appointmentService';
import { getServices } from '../../services/serviceService';
import { getVets } from '../../services/vetService';
import { canComplete, isUpcoming } from '../../utils/appointmentRules';
import { APPOINTMENT_SOURCES, APPOINTMENT_STATUS, APPOINTMENT_STATUSES } from '../../utils/constants';
import { getManilaToday } from '../../utils/dateUtils';
import { formatDate, formatDateShort, formatTimeRange, formatVetName, getFullName } from '../../utils/formatters';

const { COMPLETED, CANCELLED } = APPOINTMENT_STATUS;
const CANCEL_REASONS = ['Veterinarian unavailable', 'Owner called to cancel', 'Clinic schedule change', 'Duplicate booking'];

export default function ManageAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, reload, setData } = useAsync(() => getAppointments(), []);
  const { data: vets } = useAsync(() => getVets(), []);
  const { data: services } = useAsync(() => getServices(), []);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vetId, setVetId] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState('');
  const query = useDebounce(search, 300).trim().toLowerCase();

  const [selected, setSelected] = useState(null);
  // The dashboard's "Register walk-in" button links here with ?new=1 to open the form right away.
  const [modal, setModal] = useState(() => (searchParams.get('new') === '1' ? 'form' : null)); // 'form' | 'rebook' | 'cancel' | 'delete' | null
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [busyId, setBusyId] = useState(null);

  // Remove ?new=1 from the address bar so a refresh doesn't reopen the form.
  useEffect(() => {
    if (searchParams.has('new')) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const appointments = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () =>
      appointments.filter((a) => {
        if (status && a.status !== status) return false;
        if (vetId && a.vetId !== vetId) return false;
        if (source && a.source !== source) return false;
        if (date && a.date !== date) return false;
        if (!query) return true;
        return [a.reference, a.queueNumber, a.pet.name, getFullName(a.owner), a.owner.phone, a.service.name, formatVetName(a.vet)].some((value) =>
          String(value ?? '').toLowerCase().includes(query),
        );
      }),
    [appointments, status, vetId, source, date, query],
  );
  const pagination = usePagination(filtered, { initialPageSize: 10, resetKey: `${query}|${status}|${vetId}|${source}|${date}` });
  const hasFilters = Boolean(search || status || vetId || source || date);

  const replaceAppointment = (updated) => setData((list) => list.map((a) => (a.id === updated.id ? updated : a)));

  const open = (type, appointment = null) => {
    setSelected(appointment);
    setCancelReason(CANCEL_REASONS[0]);
    setModal(type);
  };

  async function changeStatus(appointment, nextStatus, reason = '') {
    setBusyId(appointment.id);
    try {
      const updated = await updateAppointmentStatus(appointment.id, nextStatus, reason);
      replaceAppointment(updated);
      toast.success(`${updated.pet.name}'s visit ${nextStatus === COMPLETED ? 'marked as completed' : 'was cancelled'}.`);
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    setBusyId(selected.id);
    try {
      await deleteAppointment(selected.id);
      setData((list) => list.filter((a) => a.id !== selected.id));
      toast.success(`${selected.pet.name}'s appointment was deleted.`);
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  /** Adds new appointments to the top or replaces edited ones. */
  const handleSaved = (saved) =>
    setData((list) => {
      const added = saved.filter((a) => !list.some((existing) => existing.id === a.id));
      return [...added, ...list.map((a) => saved.find((s) => s.id === a.id) ?? a)];
    });

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setVetId('');
    setSource('');
    setDate('');
  };

  /** Workflow buttons for a row, depending on its status. */
  const rowActions = (appointment, withText = false) => {
    const busy = busyId === appointment.id;
    const cls = withText ? '' : 'btn-icon';
    const label = (text) => (withText ? <span>{text}</span> : null);
    return (
      <>
        {canComplete(appointment) && (
          <Button variant="brand" size="sm" className={cls} title="Mark completed" aria-label={`Mark ${appointment.pet.name}'s visit completed`} disabled={busy} onClick={() => changeStatus(appointment, COMPLETED)}>
            <FiCheckCircle aria-hidden="true" />
            {label('Complete')}
          </Button>
        )}
        {isUpcoming(appointment) && (
          <>
            <Button variant="soft" size="sm" className={cls} title="Rebook" aria-label={`Rebook ${appointment.pet.name}'s visit`} disabled={busy} onClick={() => open('rebook', appointment)}>
              <FiRepeat aria-hidden="true" />
              {label('Rebook')}
            </Button>
            <Button variant="outline-danger" size="sm" className={cls} title="Cancel" aria-label={`Cancel ${appointment.pet.name}'s visit`} disabled={busy} onClick={() => open('cancel', appointment)}>
              <FiXCircle aria-hidden="true" />
              {label('Cancel')}
            </Button>
          </>
        )}
        {withText ? (
          <>
            <Button variant="soft" size="sm" disabled={busy} onClick={() => open('form', appointment)}>
              <FiEdit2 aria-hidden="true" /> Edit
            </Button>
            <Button variant="outline-danger" size="sm" disabled={busy} onClick={() => open('delete', appointment)}>
              <FiTrash2 aria-hidden="true" /> Delete
            </Button>
          </>
        ) : (
          // Less frequent actions live in a small menu so the table row stays compact.
          <Dropdown align="end">
            <Dropdown.Toggle variant="soft" size="sm" className="btn-icon no-caret" disabled={busy} aria-label={`More actions for ${appointment.pet.name}'s appointment`} title="More">
              <FiMoreVertical aria-hidden="true" />
            </Dropdown.Toggle>
            <Dropdown.Menu popperConfig={{ strategy: 'fixed' }} renderOnMount>
              <Dropdown.Item as="button" onClick={() => open('form', appointment)}>
                <FiEdit2 aria-hidden="true" /> Edit details
              </Dropdown.Item>
              <Dropdown.Item as="button" className="text-danger" onClick={() => open('delete', appointment)}>
                <FiTrash2 aria-hidden="true" /> Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin panel"
        title="List of appointments"
        subtitle="Register walk-ins, keep the schedule tidy and close out visits once they’re done."
        actions={
          <Button variant="cta" onClick={() => open('form')} disabled={!services || !vets}>
            <FiPlus aria-hidden="true" /> Register walk-in
          </Button>
        }
      />

      <div className="pc-card">
        <div className="pc-card-body">
          <div className="toolbar is-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search pet, owner, vet, queue or reference…" label="Search appointments" className="toolbar-search" />
            <Form.Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className="toolbar-select">
              <option value="">All statuses</option>
              {APPOINTMENT_STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Form.Select>
            <Form.Select value={vetId} onChange={(event) => setVetId(event.target.value)} aria-label="Filter by veterinarian" className="toolbar-select">
              <option value="">All veterinarians</option>
              {(vets ?? []).map((vet) => (
                <option key={vet.id} value={vet.id}>
                  {formatVetName(vet)}
                </option>
              ))}
            </Form.Select>
            <Form.Select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Filter by source" className="toolbar-select is-narrow">
              <option value="">All sources</option>
              {APPOINTMENT_SOURCES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Form.Select>
            <Form.Control type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filter by date" className="toolbar-date" />
            <Button variant="soft" onClick={() => setDate(getManilaToday())}>
              Today
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <FiX aria-hidden="true" /> Clear
              </Button>
            )}
          </div>

          {loading && !data ? (
            <LoadingSpinner label="Loading appointments…" />
          ) : error ? (
            <EmptyState title="We couldn't load appointments" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
          ) : filtered.length ? (
            <>
              <div className="d-none d-lg-block">
                <Table hover responsive className="pc-table is-compact align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Date &amp; time</th>
                      <th scope="col">Pet / owner</th>
                      <th scope="col">Veterinarian</th>
                      <th scope="col">Status / queue</th>
                      <th scope="col" className="text-end">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.pageItems.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>
                          <strong className="d-block text-nowrap">{formatDate(appointment.date, 'MMM d, yyyy')}</strong>
                          <small className="text-muted-soft text-nowrap">{formatTimeRange(appointment.startTime, appointment.endTime)}</small>
                        </td>
                        <td>
                          <span className="person-cell">
                            <PetAvatar species={appointment.pet.species} size={36} />
                            <span>
                              <strong className="d-block text-nowrap">{appointment.pet.name}</strong>
                              <small className="text-muted-soft d-block text-nowrap">{appointment.service.name}</small>
                              <small className="text-muted-soft d-block text-nowrap">Owner: {getFullName(appointment.owner)}</small>
                            </span>
                          </span>
                        </td>
                        <td>{formatVetName(appointment.vet)}</td>
                        <td>
                          <StatusBadge status={appointment.status} />
                          <small className="d-block text-muted-soft mt-1 text-nowrap">
                            Queue {appointment.queueNumber} · {appointment.source}
                          </small>
                        </td>
                        <td className="text-end">
                          <div className="row-actions">{rowActions(appointment)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-lg-none card-list">
                {pagination.pageItems.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} showOwner actions={rowActions(appointment, true)} />
                ))}
              </div>
              <PaginationBar pagination={pagination} itemLabel="appointments" />
            </>
          ) : (
            <EmptyState
              compact
              icon={FiSearch}
              title={appointments.length ? 'No appointments match these filters' : 'No appointments yet'}
              message={appointments.length ? 'Try a different search, status, vet, source or date.' : 'New bookings will appear here.'}
              action={
                hasFilters && (
                  <Button variant="outline-ink" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )
              }
            />
          )}
        </div>
      </div>

      {services && vets && (
        <AppointmentFormModal show={modal === 'form'} appointment={selected} services={services} vets={vets} onHide={() => setModal(null)} onSaved={handleSaved} />
      )}

      <RebookModal appointment={selected} show={modal === 'rebook'} onHide={() => setModal(null)} onRebooked={replaceAppointment} />

      <ConfirmModal
        show={modal === 'cancel'}
        title="Cancel this visit?"
        message={selected ? `${selected.pet.name} (${getFullName(selected.owner)}) on ${formatDateShort(selected.date)}. The owner will see the reason.` : ''}
        confirmLabel="Cancel visit"
        cancelLabel="Keep it"
        icon={FiXCircle}
        busy={Boolean(busyId)}
        onConfirm={() => changeStatus(selected, CANCELLED, cancelReason)}
        onCancel={() => setModal(null)}
      >
        <Form.Group controlId="admin-cancel-reason" className="text-start">
          <Form.Label>Reason</Form.Label>
          <Form.Select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
            {CANCEL_REASONS.map((reason) => (
              <option key={reason}>{reason}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </ConfirmModal>

      <ConfirmModal
        show={modal === 'delete'}
        title="Delete this appointment?"
        message={selected ? `${selected.reference} · ${selected.pet.name} · ${formatDateShort(selected.date)}. This permanently removes the record.` : ''}
        confirmLabel="Delete permanently"
        icon={FiTrash2}
        busy={Boolean(busyId)}
        onConfirm={confirmDelete}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
