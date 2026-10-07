/**
 * PasswordInput — Password field with a show/hide toggle button.
 * Accepts the same props as React-Bootstrap's Form.Control.
 */
import { forwardRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <Form.Control ref={ref} type={visible ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
      </button>
    </div>
  );
});

export default PasswordInput;
