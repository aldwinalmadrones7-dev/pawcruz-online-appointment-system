/**
 * MyPets — The owner's pets: add, edit and remove pets (removing is blocked while a
 * pet has upcoming visits), see each pet's next visit, and book straight from a card.
 */
import { useMemo, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FiCalendar, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PetCard from '../../components/PetCard';
import PetFormModal from '../../components/PetFormModal';
import useAsync from '../../hooks/useAsync';
import { getMyAppointments } from '../../services/appointmentService';
import { deletePet, getMyPets } from '../../services/petService';
import { compareByDateTime, isUpcoming } from '../../utils/appointmentRules';
import { formatDateShort, formatTime } from '../../utils/formatters';

export default function MyPets() {
  const { data, loading, error, reload, setData } = useAsync(() => getMyPets(), []);
  const { data: appointments } = useAsync(() => getMyAppointments(), []);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // 'form' | 'delete' | null
  const [deleting, setDeleting] = useState(false);

  const nextVisitByPet = useMemo(() => {
    const map = {};
    (appointments ?? [])
      .filter(isUpcoming)
      .sort(compareByDateTime)
      .forEach((a) => {
        map[a.petId] = map[a.petId] ?? a;
      });
    return map;
  }, [appointments]);

  const open = (type, pet = null) => {
    setSelected(pet);
    setModal(type);
  };

  const handleSaved = (saved) =>
    setData((list) => {
      const next = list.some((p) => p.id === saved.id) ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deletePet(selected.id);
      setData((list) => list.filter((p) => p.id !== selected.id));
      toast.success(`${selected.name} was removed from your pets.`);
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const pets = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Pet owner portal"
        title="My pets"
        subtitle="Keep your pets’ details up to date — vets see them before every visit."
        actions={
          <Button variant="cta" onClick={() => open('form')}>
            <FiPlus aria-hidden="true" /> Add pet
          </Button>
        }
      />

      {loading && !data ? (
        <LoadingSpinner label="Loading your pets…" />
      ) : error ? (
        <EmptyState title="We couldn't load your pets" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
      ) : pets.length ? (
        <Row className="g-4">
          {pets.map((pet) => {
            const visit = nextVisitByPet[pet.id];
            return (
              <Col md={6} xl={4} key={pet.id}>
                <PetCard
                  pet={pet}
                  footer={
                    <p className={`pet-next${visit ? ' is-booked' : ''}`}>
                      <FiCalendar aria-hidden="true" />{' '}
                      {visit ? `Next visit ${formatDateShort(visit.date)}, ${formatTime(visit.startTime)} · queue ${visit.queueNumber}` : 'No upcoming visit'}
                    </p>
                  }
                  actions={
                    <>
                      <Button as={Link} to={`/owner/book?pet=${pet.id}`} variant="brand" size="sm">
                        <FiCalendar aria-hidden="true" /> Book
                      </Button>
                      <Button variant="soft" size="sm" onClick={() => open('form', pet)}>
                        <FiEdit2 aria-hidden="true" /> Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => open('delete', pet)} aria-label={`Remove ${pet.name}`}>
                        <FiTrash2 aria-hidden="true" />
                      </Button>
                    </>
                  }
                />
              </Col>
            );
          })}
        </Row>
      ) : (
        <EmptyState
          title="No pets yet"
          message="Add your dog, cat, rabbit, bird or any other companion to start booking visits."
          action={
            <Button variant="brand" onClick={() => open('form')}>
              <FiPlus aria-hidden="true" /> Add your first pet
            </Button>
          }
        />
      )}

      <PetFormModal show={modal === 'form'} pet={selected} onHide={() => setModal(null)} onSaved={handleSaved} />

      <ConfirmModal
        show={modal === 'delete'}
        title={`Remove ${selected?.name ?? 'this pet'}?`}
        message="Their profile will be removed from your account. Past visit records stay with the clinic."
        confirmLabel="Remove pet"
        icon={FiTrash2}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
