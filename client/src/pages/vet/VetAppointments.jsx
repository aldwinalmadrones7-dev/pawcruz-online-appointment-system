/**
 * VetAppointments — Every visit the clinic accepted for this veterinarian, filtered into
 * "To complete" (today or earlier), "Upcoming" and "Completed", with search and pagination.
 * "Add record" opens the medical record form; completed visits show their saved record.
 */
import { useMemo, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { FiCalendar, FiClipboard, FiEye, FiSearch } from 'react-icons/fi';
import AppointmentCard from '../../components/AppointmentCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import MedicalRecordModal from '../../components/MedicalRecordModal';
import PageHeader from '../../components/PageHeader';
import PaginationBar from '../../components/PaginationBar';
import PetAvatar from '../../components/PetAvatar';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import { getVetAppointments } from '../../services/appointmentService';
import { canComplete, compareByDateTime } from '../../utils/appointmentRules';
import { APPOINTMENT_STATUS } from '../../utils/constants';
import { getManilaToday } from '../../utils/dateUtils';
import { formatDate, formatTimeRange, getFullName } from '../../utils/formatters';

const { CONFIRMED, COMPLETED } = APPOINTMENT_STATUS;

const TABS = {
  toComplete: { label: 'To complete', test: (a, today) => a.status === CONFIRMED && a.date <= today, compare: compareByDateTime },
  upcoming: { label: 'Upcoming', test: (a, today) => a.status === CONFIRMED && a.date > today, compare: compareByDateTime },
  completed: { label: 'Completed', test: (a) => a.status === COMPLETED, compare: (a, b) => compareByDateTime(b, a) },
  all: { label: 'All', test: () => true, compare: (a, b) => compareByDateTime(b, a) },
};

export default function VetAppointments() {
  const { data, loading, error, reload, setData } = useAsync(() => getVetAppointments(), []);
  const [tab, setTab] = useState('toComplete');
  const [search, setSearch] = useState('');
  const query = useDebounce(search, 300).trim().toLowerCase();
  const [selected, setSelected] = useState(null);

  const appointments = useMemo(() => data ?? [], [data]);
  const today = getManilaToday();
  const counts = useMemo(() => Object.fromEntries(Object.entries(TABS).map(([key, item]) => [key, appointments.filter((a) => item.test(a, today)).length])), [appointments, today]);

  const filtered = useMemo(
    () =>
      appointments
        .filter((a) => TABS[tab].test(a, today))
        .filter((a) => !query || [a.reference, a.queueNumber, a.pet.name, a.pet.species, getFullName(a.owner), a.service.name].some((value) => String(value ?? '').toLowerCase().includes(query)))
        .sort(TABS[tab].compare),
    [appointments, tab, today, query],
  );
  const pagination = usePagination(filtered, { initialPageSize: 10, resetKey: `${tab}|${query}` });

  const replaceAppointment = (updated) => setData((list) => list.map((a) => (a.id === updated.id ? updated : a)));

  const recordButton = (appointment) => {
    if (canComplete(appointment)) {
      return (
        <Button variant="brand" size="sm" onClick={() => setSelected(appointment)} aria-label={`Add ${appointment.pet.name}'s medical record`}>
          <FiClipboard aria-hidden="true" /> Add record
        </Button>
      );
    }
    return (
      <Button variant="soft" size="sm" onClick={() => setSelected(appointment)} aria-label={`View ${appointment.pet.name}'s visit`}>
        <FiEye aria-hidden="true" /> {appointment.status === COMPLETED ? 'View record' : 'View'}
      </Button>
    );
  };

  return (
    <div>
      <PageHeader eyebrow="Veterinarian portal" title="My appointments" subtitle="Visits the clinic accepted for you. Complete a visit by adding its medical record on or after the visit day." />

      {loading && !data ? (
        <LoadingSpinner label="Loading your appointments…" />
      ) : error ? (
        <EmptyState title="We couldn't load your appointments" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
      ) : (
        <div className="pc-card">
          <div className="pc-card-body">
            <div className="toolbar">
              <SearchBar value={search} onChange={setSearch} placeholder="Search pet, owner, reason, queue or reference…" label="Search appointments" className="toolbar-search" />
            </div>
            <div className="status-tabs" role="group" aria-label="Filter appointments">
              {Object.entries(TABS).map(([key, item]) => (
                <button key={key} type="button" className={`pill${key === tab ? ' is-active' : ''}`} aria-pressed={key === tab} onClick={() => setTab(key)}>
                  {item.label} <span className="pill-count">{counts[key]}</span>
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
                        <th scope="col">Patient / owner</th>
                        <th scope="col">Reason</th>
                        <th scope="col">Status / queue</th>
                        <th scope="col" className="text-end">
                          Medical record
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
                                <strong className="d-block">{appointment.pet.name}</strong>
                                <small className="text-muted-soft">Owner: {getFullName(appointment.owner)}</small>
                              </span>
                            </span>
                          </td>
                          <td>{appointment.service.name}</td>
                          <td>
                            <StatusBadge status={appointment.status} />
                            <small className="d-block text-muted-soft mt-1 text-nowrap">
                              Queue {appointment.queueNumber} · {appointment.source}
                            </small>
                          </td>
                          <td className="text-end">{recordButton(appointment)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="d-md-none card-list">
                  {pagination.pageItems.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} showOwner actions={recordButton(appointment)} />
                  ))}
                </div>
                <PaginationBar pagination={pagination} itemLabel="appointments" />
              </>
            ) : (
              <EmptyState
                compact
                icon={query ? FiSearch : FiCalendar}
                title={query ? 'No appointments match' : `No ${TABS[tab].label.toLowerCase()} visits`}
                message={query ? 'Try another pet, owner or reference.' : 'Visits appear here once the clinic accepts them.'}
              />
            )}
          </div>
        </div>
      )}

      <MedicalRecordModal appointment={selected} show={Boolean(selected)} onHide={() => setSelected(null)} onCompleted={replaceAppointment} />
    </div>
  );
}
