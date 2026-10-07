/**
 * PasswordChecklist — Live list of password rules that tick green as the user types.
 */
import { FiCheck, FiX } from 'react-icons/fi';
import { getPasswordRuleStatus } from '../utils/validators';

export default function PasswordChecklist({ password }) {
  return (
    <ul className="password-checklist" aria-label="Password requirements">
      {getPasswordRuleStatus(password).map((rule) => (
        <li key={rule.key} className={rule.met ? 'is-met' : ''}>
          {rule.met ? <FiCheck aria-hidden="true" /> : <FiX aria-hidden="true" />}
          {rule.label}
          <span className="visually-hidden">{rule.met ? ' (done)' : ' (not yet)'}</span>
        </li>
      ))}
    </ul>
  );
}
