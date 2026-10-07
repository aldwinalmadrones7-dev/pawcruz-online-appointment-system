/**
 * BookAppointment — 4-step booking wizard modelled on final-vet's appointment form:
 * 1) pets + reason  2) date + open 10-minute time  3) a vet free at that time  4) review & confirm.
 * Links like ?pet=, ?service= and ?vet= (from My Pets, Services and a vet's profile) pre-fill choices.
 */
import { useRef, useState } from 'react';
import { Button, Col, Row, Spinner } from 'react-bootstrap';
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PetFormModal from '../../components/PetFormModal';
import StepProgress from '../../components/StepProgress';
import useAsync from '../../hooks/useAsync';
import useAuth from '../../hooks/useAuth';
import useAvailability from '../../hooks/useAvailability';
import { createAppointment } from '../../services/appointmentService';
import { getMyPets } from '../../services/petService';
import { getServices } from '../../services/serviceService';
import { getVets } from '../../services/vetService';
import { MAX_PETS_PER_VISIT } from '../../utils/constants';
import { isVetOnDuty } from '../../utils/schedule';
import BookingSuccess from './booking/BookingSuccess';
import BookingSummary from './booking/BookingSummary';
import PetsStep from './booking/PetsStep';
import ReviewStep from './booking/ReviewStep';
import ScheduleStep from './booking/ScheduleStep';
import VetStep from './booking/VetStep';

const STEPS = ['Pets & reason', 'Date & time', 'Veterinarian', 'Review'];

export default function BookAppointment() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const petsQuery = useAsync(() => getMyPets(), []);
  const servicesQuery = useAsync(() => getServices(), []);
  const vetsQuery = useAsync(() => getVets(), []);
  const pets = petsQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const allVets = vetsQuery.data ?? [];

  const presetVetId = searchParams.get('vet');
  const [step, setStep] = useState(0);
  const [chosenPetIds, setPetIds] = useState(() => (searchParams.get('pet') ? [searchParams.get('pet')] : []));
  const [serviceId, setServiceId] = useState(() => searchParams.get('service') ?? ''); // '' = the first service
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [vetId, setVetId] = useState('');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const [agreeError, setAgreeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null);
  const [showPetForm, setShowPetForm] = useState(false);
  const wizardTop = useRef(null);

  // Only the owner's own pets count (a ?pet= link for someone else's pet is ignored).
  const petIds = chosenPetIds.filter((id) => pets.some((pet) => pet.id === id));
  const availability = useAvailability({ date, petIds });
  const presetVet = allVets.find((vet) => vet.id === presetVetId) ?? null;
  const selectedPets = pets.filter((pet) => petIds.includes(pet.id));
  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const vet = allVets.find((v) => v.id === vetId) ?? null;

  // With a preferred vet (from their profile), only that vet's free times count as open.
  const slots = presetVet
    ? availability.slots.map((slot) => (slot.available && !slot.vetIds.includes(presetVet.id) ? { ...slot, available: false, reason: 'booked' } : slot))
    : availability.slots;
  const freeVets = availability.vets.filter((v) => availability.slotMap[v.id]?.includes(startTime));

  const goToStep = (index) => {
    setStep(index);
    wizardTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Changing an earlier choice clears the choices that depended on it.
  const togglePet = (id) => {
    setPetIds((current) => {
      if (current.includes(id)) return current.filter((petId) => petId !== id);
      if (current.length >= MAX_PETS_PER_VISIT) {
        toast.info(`You can book up to ${MAX_PETS_PER_VISIT} pets in one visit.`);
        return current;
      }
      return [...current, id];
    });
    setStartTime('');
    setVetId('');
  };
  const changeDate = (key) => {
    setDate(key);
    setStartTime('');
    setVetId('');
  };
  const changeTime = (time) => {
    setStartTime(time);
    const keep = presetVet && availability.slotMap[presetVet.id]?.includes(time) ? presetVet.id : '';
    setVetId(keep);
  };

  const isDateDisabled = (key) => (presetVet ? !isVetOnDuty(presetVet, key) : !allVets.some((v) => isVetOnDuty(v, key)));

  const canContinue = [petIds.length > 0 && Boolean(service), Boolean(date && startTime), Boolean(vetId && freeVets.some((v) => v.id === vetId)), true][step];

  async function confirmBooking() {
    if (!agree) {
      setAgreeError('Please tick the box to confirm the clinic policy.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createAppointment({ petIds, vetId, date, startTime, serviceId: service.id, notes });
      toast.success(`Booked! Your queue number is ${result.queueNumber}.`);
      setBooked(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.message);
      // The slot or vet was taken in the meantime: send the owner back to choose again.
      if (err.field === 'startTime' || err.field === 'date') {
        setStartTime('');
        setVetId('');
        availability.reload();
        goToStep(1);
      } else if (err.field === 'vetId') {
        setVetId('');
        availability.reload();
        goToStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const bookAnother = () => {
    setBooked(null);
    setPetIds([]);
    setDate('');
    setStartTime('');
    setVetId('');
    setNotes('');
    setAgree(false);
    setAgreeError('');
    setStep(0);
    setSearchParams({}, { replace: true });
  };

  const handlePetAdded = (pet) => {
    petsQuery.setData((list) => [...(list ?? []), pet].sort((a, b) => a.name.localeCompare(b.name)));
    setPetIds((current) => (current.length < MAX_PETS_PER_VISIT ? [...current, pet.id] : current));
  };

  if (booked) return <BookingSuccess booking={booked} onBookAnother={bookAnother} />;

  const loadingData = [petsQuery, servicesQuery, vetsQuery].some((query) => query.loading && !query.data);
  const loadError = petsQuery.error || servicesQuery.error || vetsQuery.error;

  return (
    <div className="booking-page" ref={wizardTop}>
      <PageHeader eyebrow="New appointment" title="Book an appointment" subtitle="General consultation · 10-minute time slots · four quick steps." />

      {loadingData ? (
        <LoadingSpinner label="Getting the clinic schedule ready…" />
      ) : loadError ? (
        <EmptyState title="We couldn't load the booking form" message={loadError.message} tone="accent" />
      ) : !pets.length ? (
        <EmptyState
          title="Add a pet first"
          message="Tell us about your pet once, then you can book visits in seconds."
          action={
            <>
              <Button variant="brand" onClick={() => setShowPetForm(true)}>
                Add a pet
              </Button>{' '}
              <Button as={Link} to="/owner/pets" variant="outline-ink">
                Go to My Pets
              </Button>
            </>
          }
        />
      ) : (
        <>
          <StepProgress steps={STEPS} current={step} onStepClick={goToStep} />
          <Row className="g-4 mt-1">
            <Col lg={8}>
              <div className="pc-card wizard-card">
                <div className="pc-card-body">
                  {step === 0 && (
                    <PetsStep
                      pets={pets}
                      selectedIds={petIds}
                      onTogglePet={togglePet}
                      onAddPet={() => setShowPetForm(true)}
                      services={services}
                      serviceId={service?.id}
                      onServiceChange={setServiceId}
                      presetVet={presetVet}
                    />
                  )}
                  {step === 1 && (
                    <ScheduleStep
                      date={date}
                      startTime={startTime}
                      onDateChange={changeDate}
                      onTimeChange={changeTime}
                      slots={slots}
                      loading={availability.loading}
                      error={availability.error}
                      unscheduled={availability.unscheduled}
                      isDateDisabled={isDateDisabled}
                      petCount={petIds.length}
                    />
                  )}
                  {step === 2 && <VetStep vets={freeVets} selectedId={vetId} onSelect={setVetId} date={date} startTime={startTime} />}
                  {step === 3 && vet && (
                    <ReviewStep
                      user={user}
                      pets={selectedPets}
                      service={service}
                      vet={vet}
                      date={date}
                      startTime={startTime}
                      notes={notes}
                      onNotesChange={setNotes}
                      agree={agree}
                      onAgreeChange={(checked) => {
                        setAgree(checked);
                        if (checked) setAgreeError('');
                      }}
                      agreeError={agreeError}
                    />
                  )}

                  <div className="wizard-nav">
                    <Button variant="soft" onClick={() => goToStep(step - 1)} disabled={step === 0 || submitting}>
                      <FiArrowLeft aria-hidden="true" /> Back
                    </Button>
                    {step < STEPS.length - 1 ? (
                      <Button variant="brand" onClick={() => goToStep(step + 1)} disabled={!canContinue}>
                        Continue <FiArrowRight aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button variant="cta" onClick={confirmBooking} disabled={submitting}>
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" aria-hidden="true" /> Booking…
                          </>
                        ) : (
                          <>
                            <FiCheck aria-hidden="true" /> Book appointment
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={4}>
              <BookingSummary pets={selectedPets} service={service} date={date} startTime={startTime} vet={vet} />
            </Col>
          </Row>
        </>
      )}

      <PetFormModal show={showPetForm} pet={null} onHide={() => setShowPetForm(false)} onSaved={handlePetAdded} />
    </div>
  );
}
