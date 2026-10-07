/**
 * Contact — Clinic contact details, hours and a validated message form.
 */
import { Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { FiMail, FiMapPin, FiPhone, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ClinicHoursCard from '../../components/ClinicHoursCard';
import FormField from '../../components/FormField';
import PageHero from '../../components/PageHero';
import useForm from '../../hooks/useForm';
import { sendContactMessage } from '../../services/contactService';
import { CLINIC_INFO } from '../../utils/constants';
import { sanitizePhoneInput, validateContact } from '../../utils/validators';

const INITIAL_VALUES = { name: '', email: '', phone: '', subject: '', message: '' };
const SUBJECTS = ['Booking help', 'Services & prices', 'Pet health question', 'Feedback', 'Something else'];

const CONTACT_ITEMS = [
  { icon: FiMapPin, label: 'Address', value: CLINIC_INFO.address, href: CLINIC_INFO.mapUrl },
  { icon: FiPhone, label: 'Phone', value: CLINIC_INFO.phones.join(' | '), href: `tel:${CLINIC_INFO.phones[0]}` },
  { icon: FiMail, label: 'Email', value: CLINIC_INFO.email, href: `mailto:${CLINIC_INFO.email}` },
];

export default function Contact() {
  const form = useForm(INITIAL_VALUES, validateContact);
  const { values, errors } = form;

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const result = await sendContactMessage(formValues);
      toast.success(`Thanks, ${result.name}! We'll reply within one business day.`);
      form.reset();
    } catch (err) {
      toast.error(err.message);
    }
  });

  return (
    <>
      <PageHero eyebrow="Contact" title="We'd love to hear from you" subtitle="Questions about your pet, a service or a booking? Send us a message or drop by the clinic." />
      <section className="section pt-2">
        <Container>
          <Row className="g-4 g-lg-5">
            <Col lg={5}>
              <div className="d-grid gap-3">
                {CONTACT_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.label} className="contact-tile hover-lift" href={item.href} target={item.label === 'Address' ? '_blank' : undefined} rel="noreferrer">
                      <span className="contact-icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <span>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </span>
                    </a>
                  );
                })}
                <ClinicHoursCard />
              </div>
            </Col>

            <Col lg={7}>
              <div className="pc-card">
                <div className="pc-card-body">
                  <h2 className="h3 mb-1">Send a message</h2>
                  <p className="mb-4">Fields marked * are required.</p>
                  <Form noValidate onSubmit={onSubmit}>
                    <Row className="g-0 gx-3">
                      <Col md={6}>
                        <FormField label="Full name" required autoComplete="name" placeholder="Juan Dela Cruz" error={errors.name} {...form.register('name')} />
                      </Col>
                      <Col md={6}>
                        <FormField label="Email" type="email" required autoComplete="email" placeholder="juan@email.com" error={errors.email} {...form.register('email')} />
                      </Col>
                      <Col md={6}>
                        <FormField
                          label="Mobile number"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="09XXXXXXXXX"
                          hint="Optional — for a faster callback."
                          error={errors.phone}
                          {...form.register('phone')}
                          onChange={(event) => form.setFieldValue('phone', sanitizePhoneInput(event.target.value))}
                        />
                      </Col>
                      <Col md={6}>
                        <FormField label="Subject" controlId="contact-subject" required error={errors.subject}>
                          <Form.Select {...form.register('subject')}>
                            <option value="">Choose a subject…</option>
                            {SUBJECTS.map((subject) => (
                              <option key={subject}>{subject}</option>
                            ))}
                          </Form.Select>
                        </FormField>
                      </Col>
                    </Row>
                    <FormField
                      label="Message"
                      as="textarea"
                      rows={5}
                      maxLength={1000}
                      required
                      placeholder="How can we help?"
                      error={errors.message}
                      hint={`${values.message.length}/1000`}
                      {...form.register('message')}
                    />
                    <Button type="submit" variant="brand" size="lg" disabled={form.submitting}>
                      {form.submitting ? (
                        <>
                          <Spinner animation="border" size="sm" aria-hidden="true" /> Sending…
                        </>
                      ) : (
                        <>
                          <FiSend aria-hidden="true" /> Send message
                        </>
                      )}
                    </Button>
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
