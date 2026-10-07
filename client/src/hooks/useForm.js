/**
 * useForm — Small form-state hook used by every form in the app.
 * - values + change handlers (text inputs, selects and checkboxes)
 * - inline errors that appear after the first submit and update live as fields are fixed
 * - server errors attached to a field (e.g. "email already exists")
 * - a submit wrapper that blocks double submits and focuses the first invalid field
 */
import { useCallback, useState } from 'react';

function focusFirstInvalid(form, errors) {
  const field = Array.from(form.elements).find((element) => element.name && errors[element.name]);
  if (!field) return;
  field.focus({ preventScroll: true });
  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  // Don't nag before the first submit; afterwards, errors follow the current values.
  const errors = { ...(submitted ? validate(values) : {}), ...serverErrors };

  const setFieldValue = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setServerErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, type, checked, value } = event.target;
      setFieldValue(name, type === 'checkbox' ? checked : value);
    },
    [setFieldValue],
  );

  /** Props for a text input/select/textarea: name, value, onChange and isInvalid. */
  const register = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    isInvalid: Boolean(errors[name]),
  });

  /** Wraps a submit handler: validates, focuses the first error, and tracks `submitting`. */
  const handleSubmit = (onValid) => async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    const found = validate(values);
    if (Object.keys(found).length) {
      focusFirstInvalid(event.currentTarget, found);
      return;
    }
    setSubmitting(true);
    try {
      await onValid(values);
    } finally {
      setSubmitting(false);
    }
  };

  /** Shows an API error under its field when the error names one; returns true if it did. */
  const applyServerError = (error) => {
    if (!error?.field || !(error.field in values)) return false;
    setServerErrors((current) => ({ ...current, [error.field]: error.message }));
    return true;
  };

  const reset = (nextValues = initialValues) => {
    setValues(nextValues);
    setSubmitted(false);
    setServerErrors({});
  };

  return {
    values,
    errors,
    submitting,
    register,
    handleChange,
    setFieldValue,
    setValues,
    handleSubmit,
    applyServerError,
    reset,
  };
}
