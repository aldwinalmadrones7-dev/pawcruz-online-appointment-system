/**
 * ServiceFormModal — Admin form to add or edit a dental service: name, category,
 * peso price, duration, description, image path (with preview) and "featured" flag.
 */
import { Button, Col, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useForm from '../hooks/useForm';
import { createService, updateService } from '../services/serviceService';
import { SERVICE_CATEGORIES, SERVICE_DURATIONS } from '../utils/constants';
import { formatDuration } from '../utils/formatters';
import { validateService } from '../utils/validators';
import FormField from './FormField';
import ImageWithFallback from './ImageWithFallback';

function buildInitialValues(service) {
  return {
    name: service?.name ?? '',
    category: service?.category ?? '',
    price: service ? String(service.price) : '',
    duration: service ? String(service.duration) : '30',
    description: service?.description ?? '',
    image: service?.image ?? '/images/service-checkup.jpg',
    featured: service?.featured ?? false,
  };
}

export default function ServiceFormModal({ show, service, onHide, onSaved }) {
  const isEdit = Boolean(service);
  const form = useForm(buildInitialValues(service), validateService);
  const { values, errors } = form;

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const saved = isEdit ? await updateService(service.id, formValues) : await createService(formValues);
      toast.success(isEdit ? `${saved.name} updated.` : `${saved.name} added.`);
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
      onShow={() => form.reset(buildInitialValues(service))}
      size="lg"
      centered
      scrollable
      aria-labelledby="service-form-title"
    >
      <Form noValidate onSubmit={onSubmit}>
        <Modal.Header closeButton={!form.submitting}>
          <Modal.Title id="service-form-title">{isEdit ? `Edit ${service.name}` : 'Add a service'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={8}>
              <FormField label="Service name" required placeholder="e.g. Fluoride Treatment" error={errors.name} {...form.register('name')} />
              <Row className="g-3">
                <Col sm={6}>
                  <FormField label="Category" controlId="service-category" required error={errors.category} className="mb-0">
                    <Form.Select {...form.register('category')}>
                      <option value="">Choose…</option>
                      {SERVICE_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </Form.Select>
                  </FormField>
                </Col>
                <Col sm={6}>
                  <FormField label="Duration" controlId="service-duration" required error={errors.duration} className="mb-0">
                    <Form.Select {...form.register('duration')}>
                      {SERVICE_DURATIONS.map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {formatDuration(minutes)}
                        </option>
                      ))}
                    </Form.Select>
                  </FormField>
                </Col>
              </Row>
            </Col>
            <Col md={4}>
              <div className="photo-preview is-landscape">
                <ImageWithFallback src={values.image} alt="Image preview" ratio="4 / 3" />
              </div>
            </Col>
            <Col sm={6}>
              <FormField label="Price" controlId="service-price" required error={errors.price}>
                <InputGroup hasValidation>
                  <InputGroup.Text>₱</InputGroup.Text>
                  <Form.Control type="number" min={1} step={50} inputMode="numeric" placeholder="1500" {...form.register('price')} />
                </InputGroup>
              </FormField>
            </Col>
            <Col sm={6}>
              <FormField label="Image path" placeholder="/images/service-new.jpg" hint="Put the file in client/public/images." {...form.register('image')} />
            </Col>
            <Col xs={12}>
              <FormField
                label="Description"
                as="textarea"
                rows={3}
                maxLength={300}
                required
                placeholder="What the service includes and who it is for"
                error={errors.description}
                hint={`${values.description.length}/300`}
                {...form.register('description')}
              />
            </Col>
            <Col xs={12}>
              <Form.Check
                type="switch"
                id="service-featured"
                name="featured"
                label="Feature this service on the home page"
                checked={values.featured}
                onChange={form.handleChange}
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
              'Add service'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
