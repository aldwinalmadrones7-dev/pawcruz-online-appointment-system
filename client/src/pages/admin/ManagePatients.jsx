/**
 * ManagePatients — Read-only, searchable and paginated list of animal patients (pets)
 * with their owners, plus a details modal showing the pet's profile and visit history
 * (completed visits with the vet's medical records; cancelled visits are not part of it).
 * Shared by the admin panel (every pet) and the vet portal (the vet's own patients).
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { FiEye, FiMail, FiMapPin, FiPhone, FiSearch, FiUser } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PaginationBar from '../../components/PaginationBar';
import PetAvatar from '../../components/PetAvatar';
import SearchBar from '../../components/SearchBar';
import VisitHistory from '../../components/VisitHistory';
import useAsync from '../../hooks/useAsync';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import { getPatients } from '../../services/patientService';
import { ROLES } from '../../utils/constants';
import { getSpeciesFamily } from '../../utils/petOptions';
import { describePet, formatDate, formatIsoDate, getFullName } from '../../utils/formatters';

const SPECIES_FILTERS = [
  { value: '', label: 'All species' },
  { value: 'dog', label: 'Dogs' },
  { value: 'cat', label: 'Cats' },
  { value: 'rabbit', label: 'Rabbits' },
  { value: 'small', label: 'Small pets' },
  { value: 'bird', label: 'Birds' },
  { value: 'reptile', label: 'Reptiles' },
  { value: 'fish', label: 'Fish' },
  { value: 'other', label: 'Others' },
];

export default function ManagePatients() {
  const { role } = useAuth();
  const isVet = role === ROLES.VET;
  const { data, loading, error, reload } = useAsync(() => getPatients(), []);
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const query = useDebounce(search, 300).trim().toLowerCase();
  const [picked, setPicked] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  // ?pet=<id> opens that patient's details, e.g. right after a vet saves a medical record.
  const [focusPetId, setFocusPetId] = useState(() => searchParams.get('pet'));
  const focused = focusPetId ? (data?.find((p) => p.id === focusPetId) ?? null) : null;
  const selected = focused ?? picked;
  const detailsOpen = Boolean(focused) || showDetails;

  // Drop ?pet= from the address bar so a refresh doesn't reopen it.
  useEffect(() => {
    if (searchParams.has('pet')) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeDetails = () => {
    setShowDetails(false);
    setFocusPetId(null);
  };

  const patients = useMemo(
    () =>
      (data ?? [])
        .filter((p) => !family || getSpeciesFamily(p.species) === family)
        .filter((p) => !query || `${p.name} ${p.species} ${p.breed} ${getFullName(p.owner)} ${p.owner?.phone}`.toLowerCase().includes(query)),
    [data, family, query],
  );
  const pagination = usePagination(patients, { initialPageSize: 10, resetKey: `${query}|${family}` });

  const openDetails = (patient) => {
    setPicked(patient);
    setShowDetails(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow={isVet ? 'Veterinarian portal' : 'Admin panel'}
        title="Animal patients"
        subtitle={
          isVet
            ? 'Pets the clinic has assigned to you. Open a patient to read their visit history. Every record you save when completing a visit is added here.'
            : "Every registered pet with its owner and completed visits. Open a patient to read the vets' medical records. Owners update pet details in their account."
        }
      />

      <div className="pc-card">
        <div className="pc-card-body">
          <div className="toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search pet, breed, owner or mobile…" label="Search patients" className="toolbar-search" />
            <Form.Select value={family} onChange={(event) => setFamily(event.target.value)} aria-label="Filter by species" className="toolbar-select">
              {SPECIES_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
            {data && <span className="toolbar-count">{data.length} patients</span>}
          </div>

          {loading && !data ? (
            <LoadingSpinner label="Loading patients…" />
          ) : error ? (
            <EmptyState title="We couldn't load patients" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
          ) : patients.length ? (
            <>
              <div className="d-none d-md-block">
                <Table hover responsive className="pc-table align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Patient</th>
                      <th scope="col">Owner</th>
                      <th scope="col" className="text-center">
                        Completed visits
                      </th>
                      <th scope="col">Last visit</th>
                      <th scope="col" className="text-end">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.pageItems.map((patient) => (
                      <tr key={patient.id}>
                        <td>
                          <span className="person-cell">
                            <PetAvatar species={patient.species} size={38} />
                            <span>
                              <strong className="d-block">{patient.name}</strong>
                              <small className="text-muted-soft">{describePet(patient)}</small>
                            </span>
                          </span>
                        </td>
                        <td>
                          <strong className="d-block">{getFullName(patient.owner)}</strong>
                          <small className="text-muted-soft tabular">{patient.owner?.phone}</small>
                        </td>
                        <td className="text-center tabular">
                          <strong>{patient.totalVisits}</strong>
                          {patient.upcomingVisits > 0 && <small className="upcoming-tag">{patient.upcomingVisits} upcoming</small>}
                        </td>
                        <td>{patient.lastVisit ? formatDate(patient.lastVisit) : '—'}</td>
                        <td className="text-end">
                          <Button variant="soft" size="sm" onClick={() => openDetails(patient)} aria-label={`View ${patient.name}`}>
                            <FiEye aria-hidden="true" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-md-none card-list">
                {pagination.pageItems.map((patient) => (
                  <article key={patient.id} className="mobile-row-card">
                    <PetAvatar species={patient.species} size={42} />
                    <div className="flex-grow-1 min-w-0">
                      <strong className="d-block">{patient.name}</strong>
                      <small className="text-muted-soft d-block text-truncate">{describePet(patient)}</small>
                      <small className="text-muted-soft">
                        {getFullName(patient.owner)} · {patient.totalVisits} completed visit{patient.totalVisits === 1 ? '' : 's'}
                      </small>
                    </div>
                    <Button variant="soft" size="sm" className="btn-icon" onClick={() => openDetails(patient)} aria-label={`View ${patient.name}`}>
                      <FiEye aria-hidden="true" />
                    </Button>
                  </article>
                ))}
              </div>
              <PaginationBar pagination={pagination} itemLabel="patients" />
            </>
          ) : (
            <EmptyState compact icon={FiSearch} title={data?.length ? 'No patients match' : 'No patients yet'} message={data?.length ? 'Try another name, species or owner.' : 'Pets appear here once owners add them.'} />
          )}
        </div>
      </div>

      <Modal show={detailsOpen} onHide={closeDetails} centered size="lg" scrollable aria-labelledby="patient-details-title">
        <Modal.Header closeButton>
          <Modal.Title id="patient-details-title">Patient details</Modal.Title>
        </Modal.Header>
        {selected && (
          <Modal.Body>
            <div className="patient-head">
              <PetAvatar species={selected.species} size={64} />
              <div>
                <h3 className="h4 mb-1">{selected.name}</h3>
                <small className="text-muted-soft">
                  {describePet(selected)} · registered {formatIsoDate(selected.createdAt)}
                </small>
              </div>
            </div>
            <dl className="pet-facts is-wide my-3">
              <div>
                <dt>Weight</dt>
                <dd>{selected.weight ? `${selected.weight} kg` : '—'}</dd>
              </div>
              <div>
                <dt>Color</dt>
                <dd>{selected.color || '—'}</dd>
              </div>
              <div>
                <dt>Microchip</dt>
                <dd>{selected.microchip || '—'}</dd>
              </div>
            </dl>
            {selected.notes && <p className="pet-notes">Notes: {selected.notes}</p>}
            <h4 className="h6 mt-4 mb-2">Owner</h4>
            <Row className="g-3">
              <Col sm={6}>
                <div className="info-tile">
                  <FiUser aria-hidden="true" />
                  <div>
                    <small>Name</small>
                    <strong>{getFullName(selected.owner)}</strong>
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="info-tile">
                  <FiPhone aria-hidden="true" />
                  <div>
                    <small>Mobile</small>
                    <strong>{selected.owner?.phone}</strong>
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="info-tile">
                  <FiMail aria-hidden="true" />
                  <div>
                    <small>Email</small>
                    <strong className="text-break">{selected.owner?.email}</strong>
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="info-tile">
                  <FiMapPin aria-hidden="true" />
                  <div>
                    <small>Address</small>
                    <strong>{selected.owner?.address || 'Not provided'}</strong>
                  </div>
                </div>
              </Col>
            </Row>
            <h4 className="h6 mt-4 mb-2">Visit history &amp; medical records</h4>
            <VisitHistory petId={selected.id} />
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="soft" onClick={closeDetails}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
