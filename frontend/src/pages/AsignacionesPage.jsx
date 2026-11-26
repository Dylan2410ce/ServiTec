import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDelete, apiGet, fetchAllPages, formatDateTime } from '../api.jsx';
import { useAuth } from '../AuthContext.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

const ESTADO_BADGES = {
  PENDIENTE: 'bg-warning text-dark',
  EN_PROCESO: 'bg-info text-dark',
  RESUELTA: 'bg-success',
  CANCELADA: 'bg-secondary',
};

/**
 * Muestra el listado paginado de asignaciones con filtros combinables por
 * estado de solicitud, técnico, solicitud y servicio, además de ordenamiento.
 */
export default function AsignacionesPage() {
  const { canAction } = useAuth();

  const [asignaciones, setAsignaciones] = useState([]);
  const [solicitudesCatalog, setSolicitudesCatalog] = useState([]);
  const [tecnicosCatalog, setTecnicosCatalog] = useState([]);
  const [serviciosCatalog, setServiciosCatalog] = useState([]);

  const [solicitudesMap, setSolicitudesMap] = useState({});
  const [tecnicosMap, setTecnicosMap] = useState({});
  const [serviciosMap, setServiciosMap] = useState({});
  const [clientesMap, setClientesMap] = useState({});

  const [pagination, setPagination] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_registros: 0,
  });

  const [estado, setEstado] = useState('');
  const [tecnicoFilter, setTecnicoFilter] = useState('');
  const [solicitudFilter, setSolicitudFilter] = useState('');
  const [servicioFilter, setServicioFilter] = useState('');
  const [ordering, setOrdering] = useState('fecha_inicio');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Descarga los catálogos relacionados para poblar los selectores de filtro
   * y mostrar información contextual de cada asignación en lugar de IDs numéricos.
   */
  useEffect(() => {
    const loadRelations = async () => {
      try {
        const [solList, tecList, srvList, cliList] = await Promise.all([
          fetchAllPages('/solicitudes/'),
          fetchAllPages('/tecnicos/'),
          fetchAllPages('/servicios/'),
          fetchAllPages('/clientes/'),
        ]);

        setSolicitudesCatalog(solList);
        setTecnicosCatalog(tecList);
        setServiciosCatalog(srvList);

        const sMap = {};
        solList.forEach((s) => {
          sMap[s.id] = s;
        });

        const tMap = {};
        tecList.forEach((t) => {
          tMap[t.id] = t.nombre;
        });

        const srvMap = {};
        srvList.forEach((srv) => {
          srvMap[srv.id] = srv.nombre;
        });

        const cMap = {};
        cliList.forEach((c) => {
          cMap[c.id] = c.nombre;
        });

        setSolicitudesMap(sMap);
        setTecnicosMap(tMap);
        setServiciosMap(srvMap);
        setClientesMap(cMap);
      } catch {
        // Respaldo con IDs si falla algún catálogo auxiliar
      }
    };
    loadRelations();
  }, []);

  /**
   * Consulta las asignaciones aplicando los filtros combinables y el ordenamiento en servidor.
   */
  const fetchAsignaciones = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('/asignaciones/', {
        page,
        estado,
        tecnico: tecnicoFilter,
        solicitud: solicitudFilter,
        servicio: servicioFilter,
        ordering,
      });
      setAsignaciones(data.resultados || []);
      setPagination({
        pagina_actual: data.pagina_actual,
        total_paginas: data.total_paginas,
        total_registros: data.total_registros,
      });
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las asignaciones.');
    } finally {
      setLoading(false);
    }
  }, [page, estado, tecnicoFilter, solicitudFilter, servicioFilter, ordering]);

  useEffect(() => {
    fetchAsignaciones();
  }, [fetchAsignaciones]);

  /**
   * Reinicia todos los filtros combinables y devuelve la paginación a la página 1.
   */
  const handleClearFilters = () => {
    setEstado('');
    setTecnicoFilter('');
    setSolicitudFilter('');
    setServicioFilter('');
    setOrdering('fecha_inicio');
    setPage(1);
  };

  /**
   * Elimina la asignación confirmada y captura error 409 si la solicitud está en proceso o resuelta.
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await apiDelete(`/asignaciones/${deleteTarget.id}/`);
      setSuccess(`Asignación #${deleteTarget.id} eliminada correctamente.`);
      setDeleteTarget(null);
      if (asignaciones.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchAsignaciones();
      }
    } catch (err) {
      setDeleteTarget(null);
      setError(err.message || 'No se pudo eliminar la asignación.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#0b1f3a' }}>
            <i className="bi bi-calendar2-check me-2 text-primary" />
            Módulo de Asignaciones
          </h3>
          <p className="text-muted small mb-0">
            Programación de técnicos por solicitud y control de disponibilidad horaria sin traslapes.
          </p>
        </div>

        {canAction('asignaciones.add_asignacion') && (
          <Link to="/asignaciones/nueva" className="btn btn-navy">
            <i className="bi bi-plus-circle me-1" />
            Nueva Asignación
          </Link>
        )}
      </div>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* 4 Filtros combinables + ordenamiento */}
      <div className="servitec-card p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-lg-2">
            <label className="form-label small fw-semibold mb-1">Estado solicitud</label>
            <select
              className="form-select form-select-sm"
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="RESUELTA">Resuelta</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div className="col-6 col-lg-3">
            <label className="form-label small fw-semibold mb-1">Técnico</label>
            <select
              className="form-select form-select-sm"
              value={tecnicoFilter}
              onChange={(e) => {
                setTecnicoFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los técnicos</option>
              {tecnicosCatalog.map((tec) => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-lg-3">
            <label className="form-label small fw-semibold mb-1">Solicitud</label>
            <select
              className="form-select form-select-sm"
              value={solicitudFilter}
              onChange={(e) => {
                setSolicitudFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las solicitudes</option>
              {solicitudesCatalog.map((sol) => (
                <option key={sol.id} value={sol.id}>
                  #{sol.id} - {sol.asunto}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-lg-2">
            <label className="form-label small fw-semibold mb-1">Servicio</label>
            <select
              className="form-select form-select-sm"
              value={servicioFilter}
              onChange={(e) => {
                setServicioFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {serviciosCatalog.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-8 col-lg-1">
            <label className="form-label small fw-semibold mb-1">Orden</label>
            <select
              className="form-select form-select-sm"
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
            >
              <option value="fecha_inicio">Asc</option>
              <option value="-fecha_inicio">Desc</option>
            </select>
          </div>

          <div className="col-4 col-lg-1">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={handleClearFilters}
              title="Limpiar filtros"
            >
              <i className="bi bi-eraser" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de asignaciones */}
      <div className="servitec-card p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary mb-2" role="status" />
            <p className="text-muted small mb-0">Cargando asignaciones...</p>
          </div>
        ) : asignaciones.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-inbox fs-1 text-muted d-block mb-2" />
            <p className="text-muted mb-0">No se encontraron asignaciones con los criterios seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle table-navy mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Solicitud y detalle</th>
                    <th>Técnico asignado</th>
                    <th>Fecha inicio</th>
                    <th>Fecha fin</th>
                    <th>Notas</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignaciones.map((asig) => {
                    const sol = solicitudesMap[asig.solicitud];
                    return (
                      <tr key={asig.id}>
                        <td className="fw-semibold">#{asig.id}</td>
                        <td>
                          <div className="fw-medium">
                            #{asig.solicitud} - {sol ? sol.asunto : 'Solicitud'}
                          </div>
                          {sol && (
                            <div className="small text-muted">
                              <span className={`badge me-1 ${ESTADO_BADGES[sol.estado] || 'bg-secondary'}`}>
                                {sol.estado}
                              </span>
                              {clientesMap[sol.cliente] || `Cliente #${sol.cliente}`} ·{' '}
                              {serviciosMap[sol.servicio] || `Servicio #${sol.servicio}`}
                            </div>
                          )}
                        </td>
                        <td className="fw-medium">
                          <i className="bi bi-person-check text-primary me-1" />
                          {tecnicosMap[asig.tecnico] || `Técnico #${asig.tecnico}`}
                        </td>
                        <td className="small">{formatDateTime(asig.fecha_inicio)}</td>
                        <td className="small">{formatDateTime(asig.fecha_fin)}</td>
                        <td className="small text-muted">
                          {asig.notas || <span className="fst-italic">Sin notas</span>}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            {canAction('asignaciones.change_asignacion') && (
                              <Link
                                to={`/asignaciones/editar/${asig.id}`}
                                className="btn btn-outline-navy"
                                title="Editar asignación"
                              >
                                <i className="bi bi-pencil-square" />
                              </Link>
                            )}
                            {canAction('asignaciones.delete_asignacion') && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                title="Eliminar asignación"
                                onClick={() => setDeleteTarget(asig)}
                              >
                                <i className="bi bi-trash" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              paginaActual={pagination.pagina_actual}
              totalPaginas={pagination.total_paginas}
              totalRegistros={pagination.total_registros}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </div>

      <ConfirmModal
        show={Boolean(deleteTarget)}
        title="Eliminar asignación"
        message={`¿Confirma que desea eliminar la asignación #${deleteTarget?.id}? Solo se permite si la solicitud está Pendiente o Cancelada.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}