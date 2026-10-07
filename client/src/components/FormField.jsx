/**
 * FormField — Label + input + inline error message, used by every form.
 * Spread `register('fieldName')` from useForm into it, or pass a custom control as
 * children (then give `controlId` so the label points at that control).
 */
import { Form } from 'react-bootstrap';

export default function FormField({ label, error, hint, required = false, className = 'mb-3', controlId, children, ...controlProps }) {
  const id = controlId || controlProps.id || controlProps.name;
  const errorId = `${id}-error`;

  return (
    <Form.Group className={className} controlId={id}>
      {label && (
        <Form.Label>
          {label}
          {required && (
            <span className="required-mark" aria-hidden="true">
              {' '}*
            </span>
          )}
        </Form.Label>
      )}
      {children ?? (
        <Form.Control
          {...controlProps}
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
        />
      )}
      {error ? (
        <Form.Control.Feedback type="invalid" className="d-block" id={errorId}>
          {error}
        </Form.Control.Feedback>
      ) : (
        hint && <Form.Text className="field-hint d-block">{hint}</Form.Text>
      )}
    </Form.Group>
  );
}
