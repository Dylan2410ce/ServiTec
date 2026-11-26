import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut } from '../api.jsx';
import AlertMessage from '../components/AlertMessage.jsx';

/**
 * Formulario controlado para crear o editar un cliente, aplicando validaciones
 * previas en cliente y mostrando errores de negocio devueltos por Django.
 */
export default function ClienteFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    activo: true,
  });

  const [loadingData, setLoadingData] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Precarga los datos del cliente desde la API cuando el formulario está en modo edición.
   */
  useEffect(() => {
    if (!isEdit) return;

    const loadCliente = async () => {
      setLoadingData(true);
      try {
        const data = await apiGet(`/clientes/${id}/`);
        setFormData({
          documento: data.documento || '',
          nombre: data.nombre || '',
          correo: data.correo || '',
          telefono: data.telefono || '',
          activo: Boolean(data.activo),
        });
      } catch (err) {
        setError(err.message || 'No se pudo cargar la información del cliente.');
      } finally {
        setLoadingData(false);
      }
    };

    loadCliente();
  }, [id, isEdit]);

  /**
   * Actualiza el estado del formulario controlado conforme cambian los inputs.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Valida campos obligatorios y envía la petición POST o PUT según corresponda.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.documento.trim() || !formData.nombre.trim() || !formData.correo.trim() || !formData.telefono.trim()) {
      setError('Complete todos los campos obligatorios marcados con *.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        documento: formData.documento.trim(),
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono.trim(),
      };

      if (isEdit) {
        await apiPut(`/clientes/${id}/`, payload);
      } else {
        await apiPost('/clientes/', payload);
      }
      navigate('/clientes');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cliente.');
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted">Cargando datos del cliente...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px' }} className="mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0" style={{ color: '#0b1f3a' }}>
          <i className="bi bi-person-lines-fill me-2 text-primary" />
          {isEdit ? `Editar Cliente #${id}` : 'Registrar Nuevo Cliente'}
        </h3>
        <Link to="/clientes" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" />
          Volver
        </Link>
      </div>

      <AlertMessage
        type="danger"
        message={error}
        fieldErrors={fieldErrors}
        onClose={() => setError('')}
      />

      <div className="servitec-card p-4">
        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="documento" className="form-label fw-semibold small">
                Documento de identificación *
              </label>
              <input
                id="documento"
                name="documento"
                type="text"
                maxLength={20}
                className={`form-control ${fieldErrors.documento ? 'is-invalid' : ''}`}
                placeholder="Ej. 1-1234-5678 o CLI-001"
                value={formData.documento}
                onChange={handleChange}
                required
              />
              {fieldErrors.documento && <div className="invalid-feedback">{fieldErrors.documento}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="telefono" className="form-label fw-semibold small">
                Teléfono *
              </label>
              <input
                id="telefono"
                name="telefono"
                type="text"
                maxLength={20}
                className={`form-control ${fieldErrors.telefono ? 'is-invalid' : ''}`}
                placeholder="Ej. 8888-9999"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
              {fieldErrors.telefono && <div className="invalid-feedback">{fieldErrors.telefono}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="nombre" className="form-label fw-semibold small">
                Nombre completo o empresa *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                maxLength={100}
                className={`form-control ${fieldErrors.nombre ? 'is-invalid' : ''}`}
                placeholder="Nombre del cliente"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              {fieldErrors.nombre && <div className="invalid-feedback">{fieldErrors.nombre}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="correo" className="form-label fw-semibold small">
                Correo electrónico *
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                className={`form-control ${fieldErrors.correo ? 'is-invalid' : ''}`}
                placeholder="cliente@correo.com"
                value={formData.correo}
                onChange={handleChange}
                required
              />
              {fieldErrors.correo && <div className="invalid-feedback">{fieldErrors.correo}</div>}
            </div>

            <div className="col-12">
              <div className="form-check form-switch mt-1">
                <input
                  id="activo"
                  name="activo"
                  type="checkbox"
                  className={`form-check-input ${fieldErrors.activo ? 'is-invalid' : ''}`}
                  checked={formData.activo}
                  onChange={handleChange}
                />
                <label htmlFor="activo" className="form-check-label fw-medium">
                  Cliente activo (disponible para nuevas solicitudes)
                </label>
                {fieldErrors.activo && <div className="text-danger small mt-1">{fieldErrors.activo}</div>}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Link to="/clientes" className="btn btn-outline-secondary">
              Cancelar
            </Link>
            <button type="submit" className="btn btn-navy" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-1" />
                  {isEdit ? 'Guardar cambios' : 'Crear cliente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}