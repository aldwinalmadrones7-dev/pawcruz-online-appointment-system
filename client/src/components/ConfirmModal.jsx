/**
 * ConfirmModal — Styled replacement for window.confirm() (cancel, delete, decline,
 * logout…). Shows a busy state while the action runs; extra inputs go in `children`.
 */
import { useId } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmModal({
  show,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon: Icon = FiAlertTriangle,
  busy = false,
  onConfirm,
  onCancel,
  children,
}) {
  const titleId = useId();

  return (
    <Modal show={show} onHide={() => !busy && onCancel()} centered className="confirm-modal" aria-labelledby={titleId} backdrop={busy ? 'static' : true}>
      <Modal.Body>
        <span className={`confirm-icon is-${variant}`} aria-hidden="true">
          <Icon />
        </span>
        <h2 id={titleId} className="confirm-title">
          {title}
        </h2>
        {message && <p className="confirm-message">{message}</p>}
        {children && <div className="confirm-extra">{children}</div>}
        <div className="confirm-actions">
          <Button variant="soft" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={busy}>
            {busy ? (
              <>
                <Spinner animation="border" size="sm" aria-hidden="true" /> Please wait…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
