import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut } from '../api.jsx';
import AlertMessage from '../components/AlertMessage.jsx';

/**
 * Formulario controlado para crear o editar un servicio técnico, validando
 * precio positivo y mostrando errores de negocio del servidor.
 */
export default function ServicioFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: '',
    activo: true,
  });

  const [loadingData, setLoadingData] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Precarga los datos actuales del servicio cuando se accede en modo edición.
   */
  useEffect(() => {
    if (!isEdit) return;

    const loadServicio = async () => {
      setLoadingData(true);
      try {
        const data = await apiGet(`/servicios/${id}/`);
        setFormData({
          codigo: data.codigo || '',
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          precio: data.precio || '',
          activo: Boolean(data.activo),
        });
      } catch (err) {
        setError(err.message || 'No se pudo cargar el servicio.');
      } finally {
        setLoadingData(false);
      }
    };

    loadServicio();
  }, [id, isEdit]);

  /**
   * Sincroniza los cambios de cada input con el estado local del formulario.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Verifica los campos requeridos y que el precio sea mayor a cero antes de guardar.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.codigo.trim() || !formData.nombre.trim() || formData.precio === '') {
      setError('Complete los campos obligatorios marcados con *.');
      return;
    }

    if (Number(formData.precio) <= 0) {
      setFieldErrors({ precio: 'El precio debe ser mayor que cero.' });
      setError('El precio debe ser mayor que cero.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: Number(formData.precio).toFixed(2),
        activo: formData.activo,
      };

      if (isEdit) {
        await apiPut(`/servicios/${id}/`, payload);
      } else {
        await apiPost('/servicios/', payload);
      }
      navigate('/servicios');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el servicio.');
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted">Cargando datos del servicio...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px' }} className="mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0" style={{ color: '#0b1f3a' }}>
          <i className="bi bi-tools me-2 text-primary" />
          {isEdit ? `Editar Servicio #${id}` : 'Registrar Nuevo Servicio'}
        </h3>
        <Link to="/servicios" className="btn btn-outline-secondary btn-sm">
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
            <div className="col-12 col-md-5">
              <label htmlFor="codigo" className="form-label fw-semibold small">
                Código del servicio *
              </label>
              <input
                id="codigo"
                name="codigo"
                type="text"
                maxLength={20}
                className={`form-control ${fieldErrors.codigo ? 'is-invalid' : ''}`}
                placeholder="Ej. SER-001"
                value={formData.codigo}
                onChange={handleChange}
                required
              />
              {fieldErrors.codigo && <div className="invalid-feedback">{fieldErrors.codigo}</div>}
            </div>

            <div className="col-12 col-md-7">
              <label htmlFor="precio" className="form-label fw-semibold small">
                Precio (₡) *
              </label>
              <input
                id="precio"
                name="precio"
                type="number"
                step="0.01"
                min="0.01"
                className={`form-control ${fieldErrors.precio ? 'is-invalid' : ''}`}
                placeholder="Ej. 25000.00"
                value={formData.precio}
                onChange={handleChange}
                required
              />
              {fieldErrors.precio && <div className="invalid-feedback">{fieldErrors.precio}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="nombre" className="form-label fw-semibold small">
                Nombre del servicio *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                maxLength={100}
                className={`form-control ${fieldErrors.nombre ? 'is-invalid' : ''}`}
                placeholder="Ej. Diagnóstico y mantenimiento preventivo"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              {fieldErrors.nombre && <div className="invalid-feedback">{fieldErrors.nombre}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="descripcion" className="form-label fw-semibold small">
                Descripción técnica
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                className={`form-control ${fieldErrors.descripcion ? 'is-invalid' : ''}`}
                placeholder="Detalle opcional del alcance del servicio..."
                value={formData.descripcion}
                onChange={handleChange}
              />
              {fieldErrors.descripcion && <div className="invalid-feedback">{fieldErrors.descripcion}</div>}
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
                  Servicio activo en el catálogo
                </label>
                {fieldErrors.activo && <div className="text-danger small mt-1">{fieldErrors.activo}</div>}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Link to="/servicios" className="btn btn-outline-secondary">
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
                  {isEdit ? 'Guardar cambios' : 'Crear servicio'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}