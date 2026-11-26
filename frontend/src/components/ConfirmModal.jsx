/**
 * Muestra un cuadro de confirmación modal antes de ejecutar una eliminación
 * irreversible en la base de datos.
 */
export default function ConfirmModal({
  show,
  title = 'Confirmar eliminación',
  message = '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header text-white" style={{ backgroundColor: '#0b1f3a' }}>
              <h5 className="modal-title fs-6">
                <i className="bi bi-exclamation-octagon me-2 text-warning" />
                {title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Cerrar"
                disabled={loading}
                onClick={onCancel}
              />
            </div>

            <div className="modal-body">
              <p className="mb-0 text-secondary">{message}</p>
            </div>

            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={loading}
                onClick={onCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash me-1" />
                    Sí, eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}