/**
 * MedicalRecordView — The vet's medical record for a completed visit (read-only):
 * vitals, diagnosis, treatment, prescription, follow-up date and remarks.
 */
import { formatDate, formatTimestamp } from '../utils/formatters';

const hasValue = (value) => value !== null && value !== undefined && value !== '';

export default function MedicalRecordView({ record }) {
  if (!record) return <p className="text-muted-soft mb-0">No medical record was saved for this visit.</p>;

  const vitals = [
    { label: 'Weight', value: hasValue(record.weight) ? `${record.weight} kg` : '—' },
    { label: 'Temperature', value: hasValue(record.temperature) ? `${record.temperature} °C` : '—' },
    { label: 'Follow-up', value: record.followUpDate ? formatDate(record.followUpDate) : 'None' },
  ];
  const fields = [
    { label: 'Diagnosis', value: record.diagnosis },
    { label: 'Treatment / procedure', value: record.treatment },
    { label: 'Prescription', value: record.prescription },
    { label: 'Remarks for the owner', value: record.remarks },
  ].filter((field) => field.value);

  return (
    <div className="medical-record">
      <dl className="record-vitals">
        {vitals.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className="tabular">{item.value}</dd>
          </div>
        ))}
      </dl>
      <dl className="record-fields">
        {fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      {record.recordedAt && <small className="record-stamp">Recorded {formatTimestamp(record.recordedAt)}</small>}
    </div>
  );
}
