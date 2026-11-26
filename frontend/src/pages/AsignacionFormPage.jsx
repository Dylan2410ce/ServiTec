import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, fetchAllPages, toDateTimeLocalValue } from '../api.jsx';
import AlertMessage from '../components/AlertMessage.jsx';

/**
 * Convierte el valor de un input datetime-local (YYYY-MM-DDTHH:mm) al formato
 * ISO con zona horaria de Costa Rica (-06:00) esperado por Django.
 */
function formatLocalToIso(localDateTime) {
  if (!localDateTime) return '';
  return localDateTime.length === 16 ? `${localDateTime}:00-06:00` : localDateTime;
}

/**
 * Formulario controlado para programar o reprogramar asignaciones técnicas,
 * filtrando técnicos compatibles con el servicio de la solicitud y validando horarios.
 */
export default function AsignacionFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [serviciosMap, setServiciosMap] = useState({});
  const [clientesMap, setClientesMap] = useState({});
  const [assignedSolicitudIds, setAssignedSolicitudIds] = useState([]);
  const [showAllTecnicos, setShowAllTecnicos] = useState(false);

  const [formData, setFormData] = useState({
    solicitud: '',
    tecnico: '',
    fecha_inicio: '',
    fecha_fin: '',
    notas: '',
  });

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Carga las solicitudes, técnicos, servicios, clientes y asignaciones existentes
   * para construir los selectores relacionales y precargar datos si es edición.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        const [solList, tecList, srvList, cliList, asigList] = await Promise.all([
          fetchAllPages('/solicitudes/'),
          fetchAllPages('/tecnicos/'),
          fetchAllPages('/servicios/'),
          fetchAllPages('/clientes/'),
          fetchAllPages('/asignaciones/'),
        ]);

        setSolicitudes(solList);
        setTecnicos(tecList);
        setAssignedSolicitudIds(asigList.map((a) => a.solicitud));

        const srvMap = {};
        srvList.forEach((s) => {
          srvMap[s.id] = s.nombre;
        });

        const cliMap = {};
        cliList.forEach((c) => {
          cliMap[c.id] = c.nombre;
        });

        setServiciosMap(srvMap);
        setClientesMap(cliMap);

        if (isEdit) {
          const asig = await apiGet(`/asignaciones/${id}/`);
          setFormData({
            solicitud: String(asig.solicitud),
            tecnico: String(asig.tecnico),
            fecha_inicio: toDateTimeLocalValue(asig.fecha_inicio),
            fecha_fin: toDateTimeLocalValue(asig.fecha_fin),
            notas: asig.notas || '',
          });
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos de la asignación.');
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [id, isEdit]);

  /**
   * Actualiza los valores del formulario y reinicia el técnico si cambia la solicitud.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'solicitud' ? { tecnico: '' } : {}),
    }));
  };

  /**
   * Valida horarios y campos requeridos antes de enviar la asignación al servidor.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.solicitud || !formData.tecnico || !formData.fecha_inicio || !formData.fecha_fin) {
      setError('Complete todos los campos obligatorios marcados con *.');
      return;
    }

    if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
      setFieldErrors({ fecha_fin: 'Debe ser posterior a la fecha de inicio.' });
      setError('La fecha y hora de fin debe ser posterior a la de inicio.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        solicitud: Number(formData.solicitud),
        tecnico: Number(formData.tecnico),
        fecha_inicio: formatLocalToIso(formData.fecha_inicio),
        fecha_fin: formatLocalToIso(formData.fecha_fin),
        notas: formData.notas.trim(),
      };

      if (isEdit) {
        await apiPut(`/asignaciones/${id}/`, payload);
      } else {
        await apiPost('/asignaciones/', payload);
      }
      navigate('/asignaciones');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la asignación.');
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted">Cargando formulario de asignación...</p>
      </div>
    );
  }

  const selectedSolicitud = solicitudes.find((s) => String(s.id) === String(formData.solicitud));

  const availableSolicitudes = isEdit
    ? solicitudes
    : solicitudes.filter(
        (s) => ['PENDIENTE', 'EN_PROCESO'].includes(s.estado) && !assignedSolicitudIds.includes(s.id)
      );

  const compatibleTecnicos =
    showAllTecnicos || !selectedSolicitud
      ? tecnicos
      : tecnicos.filter(
          (t) => t.activo && Array.isArray(t.servicios) && t.servicios.includes(selectedSolicitud.servicio)
        );

  return (
    <div style={{ maxWidth: '760px' }} className="mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0" style={{ color: '#0b1f3a' }}>
          <i className="bi bi-calendar2-check me-2 text-primary" />
          {isEdit ? `Editar Asignación #${id}` : 'Registrar Nueva Asignación'}
        </h3>
        <Link to="/asignaciones" className="btn btn-outline-secondary btn-sm">
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
            <div className="col-12">
              <label htmlFor="solicitud" className="form-label fw-semibold small">
                Solicitud abierta *
              </label>
              <select
                id="solicitud"
                name="solicitud"
                className={`form-select ${fieldErrors.solicitud ? 'is-invalid' : ''}`}
                value={formData.solicitud}
                onChange={handleChange}
                disabled={isEdit}
                required
              >
                <option value="">Seleccione una solicitud...</option>
                {availableSolicitudes.map((sol) => (
                  <option key={sol.id} value={sol.id}>
                    #{sol.id} - {sol.asunto} | Cliente: {clientesMap[sol.cliente] || `#${sol.cliente}`} | Servicio:{' '}
                    {serviciosMap[sol.servicio] || `#${sol.servicio}`}
                  </option>
                ))}
              </select>
              {isEdit && (
                <small className="text-muted">
                  Por regla de negocio, no se puede cambiar la solicitud de una asignación existente.
                </small>
              )}
              {fieldErrors.solicitud && <div className="invalid-feedback">{fieldErrors.solicitud}</div>}
            </div>

            {selectedSolicitud && (
              <div className="col-12">
                <div className="p-2 px-3 rounded-3 small" style={{ backgroundColor: '#e6eef8', color: '#0b1f3a' }}>
                  <strong>Servicio requerido:</strong>{' '}
                  {serviciosMap[selectedSolicitud.servicio] || `Servicio #${selectedSolicitud.servicio}`} ·{' '}
                  <strong>Estado actual:</strong> {selectedSolicitud.estado}
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="tecnico" className="form-label fw-semibold small mb-0">
                  Técnico asignado *
                </label>
                <div className="form-check form-switch mb-0">
                  <input
                    id="showAllTec"
                    type="checkbox"
                    className="form-check-input"
                    checked={showAllTecnicos}
                    onChange={(e) => setShowAllTecnicos(e.target.checked)}
                  />
                  <label htmlFor="showAllTec" className="form-check-label small text-muted">
                    Mostrar todos (probar validación 400)
                  </label>
                </div>
              </div>

              <select
                id="tecnico"
                name="tecnico"
                className={`form-select ${fieldErrors.tecnico ? 'is-invalid' : ''}`}
                value={formData.tecnico}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un técnico...</option>
                {compatibleTecnicos.map((tec) => (
                  <option key={tec.id} value={tec.id}>
                    {tec.nombre} ({tec.identificacion}) {!tec.activo ? '[Inactivo]' : ''}
                  </option>
                ))}
              </select>
              {fieldErrors.tecnico && <div className="invalid-feedback">{fieldErrors.tecnico}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="fecha_inicio" className="form-label fw-semibold small">
                Fecha y hora de inicio *
              </label>
              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="datetime-local"
                className={`form-control ${fieldErrors.fecha_inicio ? 'is-invalid' : ''}`}
                value={formData.fecha_inicio}
                onChange={handleChange}
                required
              />
              {fieldErrors.fecha_inicio && (
                <div className="invalid-feedback">{fieldErrors.fecha_inicio}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="fecha_fin" className="form-label fw-semibold small">
                Fecha y hora de finalización *
              </label>
              <input
                id="fecha_fin"
                name="fecha_fin"
                type="datetime-local"
                className={`form-control ${fieldErrors.fecha_fin ? 'is-invalid' : ''}`}
                value={formData.fecha_fin}
                onChange={handleChange}
                required
              />
              {fieldErrors.fecha_fin && <div className="invalid-feedback">{fieldErrors.fecha_fin}</div>}
            </div>

            <div className="col-12">
              <label htmlFor="notas" className="form-label fw-semibold small">
                Notas de atención
              </label>
              <textarea
                id="notas"
                name="notas"
                rows={3}
                className={`form-control ${fieldErrors.notas ? 'is-invalid' : ''}`}
                placeholder="Instrucciones de visita, repuestos o indicaciones para el técnico..."
                value={formData.notas}
                onChange={handleChange}
              />
              {fieldErrors.notas && <div className="invalid-feedback">{fieldErrors.notas}</div>}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Link to="/asignaciones" className="btn btn-outline-secondary">
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
                  {isEdit ? 'Guardar cambios' : 'Crear asignación'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}