/**
 * Muestra alertas Bootstrap reutilizables para mensajes de éxito, advertencia
 * o errores HTTP con desglose opcional por campo.
 */
export default function AlertMessage({ type = 'danger', message, fieldErrors = null, onClose }) {
  if (!message) return null;

  const iconMap = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill',
  };

  const entries = fieldErrors ? Object.entries(fieldErrors) : [];

  return (
    <div className={`alert alert-${type} alert-dismissible fade show shadow-sm`} role="alert">
      <div className="d-flex align-items-start gap-2">
        <i className={`bi ${iconMap[type] || iconMap.info} mt-1`} />
        <div className="flex-grow-1">
          <div className="fw-semibold">{message}</div>
          {entries.length > 1 && (
            <ul className="mb-0 mt-1 ps-3 small">
              {entries.map(([field, detail]) => (
                <li key={field}>
                  <strong className="text-capitalize">{field}:</strong> {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={onClose}
          />
        )}
      </div>
    </div>
  );
}