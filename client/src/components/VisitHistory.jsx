/**
 * VisitHistory — A pet's visit history: completed visits only (cancelled and not-yet-done
 * visits are not part of it), newest first, each opening to the vet's medical record.
 */
import useAsync from '../hooks/useAsync';
import { getPetHistory } from '../services/petService';
import { formatDate, formatVetName } from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';
import MedicalRecordView from './MedicalRecordView';

export default function VisitHistory({ petId, excludeId = null, emptyMessage = 'No completed visits yet.' }) {
  const { data, loading, error } = useAsync(() => getPetHistory(petId), [petId]);

  if (loading && !data) return <LoadingSpinner compact label="Loading history…" />;
  if (error && !data) return <p className="text-muted-soft mb-0">{error.message}</p>;

  const visits = (data ?? []).filter((visit) => visit.id !== excludeId);
  if (!visits.length) return <p className="text-muted-soft mb-0">{emptyMessage}</p>;

  return (
    <ol className="visit-history">
      {visits.map((visit, index) => (
        <li key={visit.id}>
          <details open={index === 0}>
            <summary>
              <span className="visit-history-date tabular">{formatDate(visit.date, 'MMM d, yyyy')}</span>
              <span className="visit-history-main">
                <strong>{visit.service.name}</strong>
                <small>
                  {formatVetName(visit.vet)}
                  {visit.medicalRecord?.diagnosis ? ` · ${visit.medicalRecord.diagnosis}` : ''}
                </small>
              </span>
            </summary>
            <MedicalRecordView record={visit.medicalRecord} />
          </details>
        </li>
      ))}
    </ol>
  );
}
