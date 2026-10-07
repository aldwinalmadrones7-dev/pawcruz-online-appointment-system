/**
 * PetFormModal — Add or edit a pet (name, species, breed, sex, birth date, weight,
 * color, microchip and notes), using final-vet's species and breed lists.
 */
import { Button, Col, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useForm from '../hooks/useForm';
import { createPet, updatePet } from '../services/petService';
import { getManilaToday } from '../utils/dateUtils';
import { BREEDS_BY_SPECIES, SEX_OPTIONS, SPECIES_GROUPS, SPECIES_OPTIONS } from '../utils/petOptions';
import { validatePet } from '../utils/validators';
import FormField from './FormField';
import PetAvatar from './PetAvatar';

function buildInitialValues(pet) {
  const knownSpecies = !pet || SPECIES_OPTIONS.includes(pet.species);
  const breedList = BREEDS_BY_SPECIES[pet?.species] ?? null;
  const knownBreed = !pet?.breed || !breedList || breedList.includes(pet.breed);
  return {
    name: pet?.name ?? '',
    species: pet ? (knownSpecies ? pet.species : 'Other') : '',
    customSpecies: pet && !knownSpecies ? pet.species : '',
    breed: pet?.breed ? (knownBreed ? pet.breed : 'Other') : '',
    customBreed: pet?.breed && !knownBreed ? pet.breed : '',
    sex: pet?.sex ?? 'Unknown',
    birthDate: pet?.birthDate ?? '',
    weight: pet?.weight ? String(pet.weight) : '',
    color: pet?.color ?? '',
    microchip: pet?.microchip ?? '',
    notes: pet?.notes ?? '',
  };
}

export default function PetFormModal({ show, pet, onHide, onSaved }) {
  const isEdit = Boolean(pet);
  const form = useForm(buildInitialValues(pet), validatePet);
  const { values, errors, setValues } = form;
  const breedOptions = BREEDS_BY_SPECIES[values.species] ?? null;

  const changeSpecies = (event) => setValues((current) => ({ ...current, species: event.target.value, breed: '', customBreed: '' }));

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const saved = isEdit ? await updatePet(pet.id, formValues) : await createPet(formValues);
      toast.success(isEdit ? `${saved.name}'s profile was updated.` : `${saved.name} was added to your pets.`);
      onSaved(saved);
      onHide();
    } catch (err) {
      if (!form.applyServerError(err)) toast.error(err.message);
    }
  });

  return (
    <Modal
      show={show}
      onHide={() => !form.submitting && onHide()}
      onShow={() => form.reset(buildInitialValues(pet))}
      size="lg"
      centered
      scrollable
      aria-labelledby="pet-form-title"
    >
      <Form noValidate onSubmit={onSubmit}>
        <Modal.Header closeButton={!form.submitting}>
          <Modal.Title id="pet-form-title" className="d-flex align-items-center gap-2">
            <PetAvatar species={values.species === 'Other' ? values.customSpecies : values.species} size={36} />
            {isEdit ? `Edit ${pet.name}` : 'Add a pet'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-0 gx-3">
            <Col md={6}>
              <FormField label="Pet name" required placeholder="e.g. Mochi" error={errors.name} {...form.register('name')} />
            </Col>
            <Col md={6}>
              <FormField label="Species" controlId="pet-species" required error={errors.species}>
                <Form.Select name="species" value={values.species} onChange={changeSpecies} isInvalid={Boolean(errors.species)}>
                  <option value="">Choose a species…</option>
                  {SPECIES_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </optgroup>
                  ))}
                </Form.Select>
              </FormField>
            </Col>
            {values.species === 'Other' && (
              <Col md={6}>
                <FormField label="Specify species" required placeholder="e.g. Sugar Glider" error={errors.customSpecies} {...form.register('customSpecies')} />
              </Col>
            )}
            <Col md={6}>
              {breedOptions ? (
                <FormField label="Breed" controlId="pet-breed" required error={errors.breed}>
                  <Form.Select {...form.register('breed')}>
                    <option value="">Choose a breed…</option>
                    {breedOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                    <option value="Other">Other (type it)</option>
                  </Form.Select>
                </FormField>
              ) : (
                <FormField label="Breed" placeholder="Optional" error={errors.breed} {...form.register('breed')} />
              )}
            </Col>
            {breedOptions && values.breed === 'Other' && (
              <Col md={6}>
                <FormField label="Specify breed" required placeholder="e.g. Shih Poo" error={errors.customBreed} {...form.register('customBreed')} />
              </Col>
            )}
            <Col sm={6} md={4}>
              <FormField label="Sex" controlId="pet-sex" required error={errors.sex}>
                <Form.Select {...form.register('sex')}>
                  {SEX_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Form.Select>
              </FormField>
            </Col>
            <Col sm={6} md={4}>
              <FormField label="Birth date" type="date" max={getManilaToday()} hint="Approximate is fine." error={errors.birthDate} {...form.register('birthDate')} />
            </Col>
            <Col sm={6} md={4}>
              <FormField label="Weight" controlId="pet-weight" error={errors.weight}>
                <InputGroup hasValidation>
                  <Form.Control type="number" min={0.1} max={150} step={0.1} inputMode="decimal" placeholder="e.g. 6.5" {...form.register('weight')} />
                  <InputGroup.Text>kg</InputGroup.Text>
                </InputGroup>
              </FormField>
            </Col>
            <Col sm={6}>
              <FormField label="Color / markings" placeholder="e.g. White & gold" maxLength={40} {...form.register('color')} />
            </Col>
            <Col sm={6}>
              <FormField label="Microchip no." placeholder="Optional" maxLength={20} {...form.register('microchip')} />
            </Col>
            <Col xs={12}>
              <FormField
                label="Allergies, conditions or notes"
                as="textarea"
                rows={3}
                maxLength={300}
                placeholder="e.g. Allergic to chicken, on joint supplements, nervous around other dogs…"
                error={errors.notes}
                hint={`${values.notes.length}/300`}
                className="mb-0"
                {...form.register('notes')}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="soft" onClick={onHide} disabled={form.submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={form.submitting}>
            {form.submitting ? (
              <>
                <Spinner animation="border" size="sm" aria-hidden="true" /> Saving…
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Add pet'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
