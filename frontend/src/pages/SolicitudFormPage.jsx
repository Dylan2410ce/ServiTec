import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, fetchAllPages } from '../api.jsx';
import AlertMessage from '../components/AlertMessage.jsx';

const STATE_TRANSITIONS = {
  PENDIENTE: ['PENDIENTE', 'EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['EN_PROCESO', 'RESUELTA', 'CANCELADA'],
  RESUELTA: ['RESUELTA'],
  CANCELADA: ['CANCELADA'],
};

const STATE_LABELS = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
  CANCELADA: 'Cancelada',
};

/**
 * Formulario controlado para crear o editar una solicitud de servicio,
 * aplicando las reglas de transición de estados y mostrando errores de negocio.
 */
export default function SolicitudFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [originalEstado, setOriginalEstado] = useState('PENDIENTE');

  const [formData, setFormData] = useState({
    cliente: '',
    servicio: '',
    asunto: '',
    descripcion: '',
    prioridad: 'NORMAL',
    estado: 'PENDIENTE',
  });

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Carga los catálogos de clientes y servicios y precarga la solicitud en modo edición.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        const [clientesList, serviciosList] = await Promise.all([
          fetchAllPages('/clientes/'),
          fetchAllPages('/servicios/'),
        ]);
        setClientes(clientesList);
        setServicios(serviciosList);

        if (isEdit) {
          const sol = await apiGet(`/solicitudes/${id}/`);
          setOriginalEstado(sol.estado);
          setFormData({
            cliente: String(sol.cliente),
            servicio: String(sol.servicio),
            asunto: sol.asunto || '',
            descripcion: sol.descripcion || '',
            prioridad: sol.prioridad || 'NORMAL',
            estado: sol.estado || 'PENDIENTE',
          });
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos de la solicitud.');
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [id, isEdit]);

  /**
   * Actualiza los valores del formulario controlado.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Valida campos obligatorios y envía la solicitud al backend mediante POST o PUT.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.cliente || !formData.servicio || !formData.asunto.trim() || !formData.descripcion.trim()) {
      setError('Complete todos los campos obligatorios marcados con *.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        cliente: Number(formData.cliente),
        servicio: Number(formData.servicio),
        asunto: formData.asunto.trim(),
        descripcion: formData.descripcion.trim(),
        prioridad: formData.prioridad,
        estado: isEdit ? formData.estado : 'PENDIENTE',
      };

      if (isEdit) {
        await apiPut(`/solicitudes/${id}/`, payload);
      } else {
        await apiPost('/solicitudes/', payload);
      }
      navigate('/solicitudes');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la solicitud.');
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted">Cargando formulario de solicitud...</p>
      </div>
    );
  }

  const isClosed = isEdit && ['RESUELTA', 'CANCELADA'].includes(originalEstado);
  const allowedStates = isEdit ? STATE_TRANSITIONS[originalEstado] || [originalEstado] : ['PENDIENTE'];
  const visibleClientes = isEdit ? clientes : clientes.filter((c) => c.activo);
  const visibleServicios = isEdit ? servicios : servicios.filter((s) => s.activo);

  return (
    <div style={{ maxWidth: '760px' }} className="mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0" style={{ color: '#0b1f3a' }}>
          <i className="bi bi-clipboard2-pulse me-2 text-primary" />
          {isEdit ? `Gestionar Solicitud #${id}` : 'Registrar Nueva Solicitud'}
        </h3>
        <Link to="/solicitudes" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1" />
          Volver
        </Link>
      </div>

      {isClosed && (
        <AlertMessage
          type="info"
          message={`Esta solicitud se encuentra en estado ${originalEstado}. Por regla de negocio, las solicitudes cerradas no pueden modificarse ni reabrirse.`}
        />
      )}

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
              <label htmlFor="cliente" className="form-label fw-semibold small">
                Cliente *
              </label>
              <select
                id="cliente"
                name="cliente"
                className={`form-select ${fieldErrors.cliente ? 'is-invalid' : ''}`}
                value={formData.cliente}
                onChange={handleChange}
                disabled={isClosed}
                required
              >
                <option value="">Seleccione un cliente...</option>
                {visibleClientes.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.nombre} ({cli.documento}) {!cli.activo ? '[Inactivo]' : ''}
                  </option>
                ))}
              </select>
              {fieldErrors.cliente && <div className="invalid-feedback">{fieldErrors.cliente}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="servicio" className="form-label fw-semibold small">
                Servicio solicitado *
              </label>
              <select
                id="servicio"
                name="servicio"
                className={`form-select ${fieldErrors.servicio ? 'is-invalid' : ''}`}
                value={formData.servicio}
                onChange={handleChange}
                disabled={isClosed}
                required
              >
                <option value="">Seleccione un servicio...</option>
                {visibleServicios.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.codigo} - {srv.nombre} {!srv.activo ? '[Inactivo]' : ''}
                  </option>
                ))}
              </select>
              {fieldErrors.servicio && <div className="invalid-feedback">{fieldErrors.servicio}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="asunto" className="form-label fw-semibold small">
                Asunto *
              </label>
              <input
                id="asunto"
                name="asunto"
                type="text"
                maxLength={100}
                className={`form-control ${fieldErrors.asunto ? 'is-invalid' : ''}`}
                placeholder="Resumen breve del problema o requerimiento"
                value={formData.asunto}
                onChange={handleChange}
                disabled={isClosed}
                required
              />
              {fieldErrors.asunto && <div className="invalid-feedback">{fieldErrors.asunto}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="descripcion" className="form-label fw-semibold small">
                Descripción detallada *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                className={`form-control ${fieldErrors.descripcion ? 'is-invalid' : ''}`}
                placeholder="Describa los síntomas, equipo afectado o detalles de atención..."
                value={formData.descripcion}
                onChange={handleChange}
                disabled={isClosed}
                required
              />
              {fieldErrors.descripcion && <div className="invalid-feedback">{fieldErrors.descripcion}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="prioridad" className="form-label fw-semibold small">
                Prioridad
              </label>
              <select
                id="prioridad"
                name="prioridad"
                className={`form-select ${fieldErrors.prioridad ? 'is-invalid' : ''}`}
                value={formData.prioridad}
                onChange={handleChange}
                disabled={isClosed}
              >
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
              </select>
              {fieldErrors.prioridad && <div className="invalid-feedback">{fieldErrors.prioridad}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="estado" className="form-label fw-semibold small">
                Estado de la solicitud
              </label>
              <select
                id="estado"
                name="estado"
                className={`form-select ${fieldErrors.estado ? 'is-invalid' : ''}`}
                value={formData.estado}
                onChange={handleChange}
                disabled={!isEdit || isClosed}
              >
                {allowedStates.map((st) => (
                  <option key={st} value={st}>
                    {STATE_LABELS[st] || st}
                  </option>
                ))}
              </select>
              {!isEdit && (
                <small className="text-muted">Toda solicitud nueva inicia en estado Pendiente.</small>
              )}
              {fieldErrors.estado && <div className="invalid-feedback">{fieldErrors.estado}</div>}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Link to="/solicitudes" className="btn btn-outline-secondary">
              {isClosed ? 'Volver al listado' : 'Cancelar'}
            </Link>
            {!isClosed && (
              <button type="submit" className="btn btn-navy" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1" />
                    {isEdit ? 'Guardar cambios' : 'Crear solicitud'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}