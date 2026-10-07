/**
 * StepProgress — Wizard progress bar with numbered steps. Finished steps are
 * clickable so the user can go back and change an earlier choice.
 */
import { ProgressBar } from 'react-bootstrap';
import { FiCheck } from 'react-icons/fi';

export default function StepProgress({ steps, current, onStepClick }) {
  const percent = Math.round(((current + 1) / steps.length) * 100);

  return (
    <div className="step-progress">
      <div className="step-progress-top">
        <span className="step-count">
          Step {current + 1} of {steps.length}
        </span>
        <span className="step-percent">{percent}% complete</span>
      </div>
      <ProgressBar now={percent} aria-label="Booking progress" className="step-bar" />
      <ol className="steps">
        {steps.map((label, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'todo';
          return (
            <li key={label} className={`step is-${state}`}>
              <button type="button" onClick={() => onStepClick(index)} disabled={index >= current} aria-current={index === current ? 'step' : undefined}>
                <span className="step-dot" aria-hidden="true">
                  {state === 'done' ? <FiCheck /> : index + 1}
                </span>
                <span className="step-label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
