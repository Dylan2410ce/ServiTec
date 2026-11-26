import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, fetchAllPages } from '../api.jsx';
import AlertMessage from '../components/AlertMessage.jsx';

/**
 * Formulario controlado para crear o editar un técnico y asociar
 * mediante checkboxes los servicios que está capacitado para atender.
 */
export default function TecnicoFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [serviciosCatalog, setServiciosCatalog] = useState([]);
  const [formData, setFormData] = useState({
    identificacion: '',
    nombre: '',
    correo: '',
    activo: true,
    servicios: [],
  });

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Carga el catálogo de servicios y, si es edición, precarga los datos del técnico.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        const serviciosList = await fetchAllPages('/servicios/');
        setServiciosCatalog(serviciosList);

        if (isEdit) {
          const tec = await apiGet(`/tecnicos/${id}/`);
          setFormData({
            identificacion: tec.identificacion || '',
            nombre: tec.nombre || '',
            correo: tec.correo || '',
            activo: Boolean(tec.activo),
            servicios: Array.isArray(tec.servicios) ? tec.servicios : [],
          });
        }
      } catch (err) {
        setError(err.message || 'Error al cargar los datos requeridos.');
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [id, isEdit]);

  /**
   * Actualiza los campos simples del formulario controlado.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Agrega o quita el ID de un servicio en la lista de especialidades del técnico.
   */
  const handleToggleServicio = (servicioId) => {
    setFormData((prev) => {
      const exists = prev.servicios.includes(servicioId);
      const updated = exists
        ? prev.servicios.filter((item) => item !== servicioId)
        : [...prev.servicios, servicioId];
      return { ...prev, servicios: updated };
    });
  };

  /**
   * Valida que exista al menos un servicio seleccionado y guarda en Django.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.identificacion.trim() || !formData.nombre.trim() || !formData.correo.trim()) {
      setError('Complete todos los campos obligatorios marcados con *.');
      return;
    }

    if (formData.servicios.length === 0) {
      setFieldErrors({ servicios: 'Debe seleccionar al menos un servicio.' });
      setError('Cada técnico debe ofrecer al menos un servicio.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        identificacion: formData.identificacion.trim(),
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        activo: formData.activo,
        servicios: formData.servicios,
      };

      if (isEdit) {
        await apiPut(`/tecnicos/${id}/`, payload);
      } else {
        await apiPost('/tecnicos/', payload);
      }
      navigate('/tecnicos');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el técnico.');
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted">Cargando formulario de técnico...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px' }} className="mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0" style={{ color: '#0b1f3a' }}>
          <i className="bi bi-person-badge me-2 text-primary" />
          {isEdit ? `Editar Técnico #${id}` : 'Registrar Nuevo Técnico'}
        </h3>
        <Link to="/tecnicos" className="btn btn-outline-secondary btn-sm">
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
              <label htmlFor="identificacion" className="form-label fw-semibold small">
                Identificación *
              </label>
              <input
                id="identificacion"
                name="identificacion"
                type="text"
                maxLength={20}
                className={`form-control ${fieldErrors.identificacion ? 'is-invalid' : ''}`}
                placeholder="Ej. TEC-001"
                value={formData.identificacion}
                onChange={handleChange}
                required
              />
              {fieldErrors.identificacion && (
                <div className="invalid-feedback">{fieldErrors.identificacion}</div>
              )}
            </div>

            <div className="col-12 col-md-7">
              <label htmlFor="nombre" className="form-label fw-semibold small">
                Nombre completo *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                maxLength={100}
                className={`form-control ${fieldErrors.nombre ? 'is-invalid' : ''}`}
                placeholder="Nombre del técnico"
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
                placeholder="tecnico@servitec.com"
                value={formData.correo}
                onChange={handleChange}
                required
              />
              {fieldErrors.correo && <div className="invalid-feedback">{fieldErrors.correo}</div>}
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold small d-block">
                Servicios que sabe realizar * (seleccione al menos uno)
              </label>
              <div
                className={`border rounded-3 p-3 bg-light ${
                  fieldErrors.servicios ? 'border-danger' : ''
                }`}
                style={{ maxHeight: '220px', overflowY: 'auto' }}
              >
                {serviciosCatalog.length === 0 ? (
                  <p className="text-muted small mb-0">No hay servicios registrados en el catálogo.</p>
                ) : (
                  <div className="row g-2">
                    {serviciosCatalog.map((srv) => {
                      const checked = formData.servicios.includes(srv.id);
                      return (
                        <div key={srv.id} className="col-12 col-sm-6">
                          <div className="form-check">
                            <input
                              id={`srv-${srv.id}`}
                              type="checkbox"
                              className="form-check-input"
                              checked={checked}
                              onChange={() => handleToggleServicio(srv.id)}
                            />
                            <label htmlFor={`srv-${srv.id}`} className="form-check-label small">
                              <span className="fw-medium">{srv.nombre}</span>{' '}
                              {!srv.activo && (
                                <span className="badge bg-secondary ms-1">Inactivo</span>
                              )}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {fieldErrors.servicios && (
                <div className="text-danger small mt-1">{fieldErrors.servicios}</div>
              )}
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
                  Técnico activo (disponible para asignaciones)
                </label>
                {fieldErrors.activo && (
                  <div className="text-danger small mt-1">{fieldErrors.activo}</div>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Link to="/tecnicos" className="btn btn-outline-secondary">
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
                  {isEdit ? 'Guardar cambios' : 'Crear técnico'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}