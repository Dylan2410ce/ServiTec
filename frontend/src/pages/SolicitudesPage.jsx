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

const PRIORIDAD_BADGES = {
  BAJA: 'bg-light text-dark border',
  NORMAL: 'bg-primary',
  ALTA: 'bg-danger',
};

/**
 * Muestra el listado paginado de solicitudes con los 5 filtros combinables
 * del backend (estado, prioridad, cliente, servicio y técnico), búsqueda y ordenamiento.
 */
export default function SolicitudesPage() {
  const { canAction } = useAuth();

  const [solicitudes, setSolicitudes] = useState([]);
  const [clientesCatalog, setClientesCatalog] = useState([]);
  const [serviciosCatalog, setServiciosCatalog] = useState([]);
  const [tecnicosCatalog, setTecnicosCatalog] = useState([]);
  const [clientesMap, setClientesMap] = useState({});
  const [serviciosMap, setServiciosMap] = useState({});

  const [pagination, setPagination] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_registros: 0,
  });

  const [searchInput, setSearchInput] = useState('');
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [servicioFilter, setServicioFilter] = useState('');
  const [tecnicoFilter, setTecnicoFilter] = useState('');
  const [ordering, setOrdering] = useState('-fecha_creacion');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Descarga los catálogos de clientes, servicios y técnicos para poblar
   * los selectores de filtro y mostrar nombres legibles en cada fila.
   */
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [clientesList, serviciosList, tecnicosList] = await Promise.all([
          fetchAllPages('/clientes/'),
          fetchAllPages('/servicios/'),
          fetchAllPages('/tecnicos/'),
        ]);

        setClientesCatalog(clientesList);
        setServiciosCatalog(serviciosList);
        setTecnicosCatalog(tecnicosList);

        const cMap = {};
        clientesList.forEach((c) => {
          cMap[c.id] = c.nombre;
        });

        const sMap = {};
        serviciosList.forEach((s) => {
          sMap[s.id] = s.nombre;
        });

        setClientesMap(cMap);
        setServiciosMap(sMap);
      } catch {
        // Respaldo con IDs si algún catálogo auxiliar falla
      }
    };
    loadCatalogs();
  }, []);

  /**
   * Consulta las solicitudes aplicando todos los filtros combinables en el backend.
   */
  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('/solicitudes/', {
        page,
        buscar,
        estado,
        prioridad,
        cliente: clienteFilter,
        servicio: servicioFilter,
        tecnico: tecnicoFilter,
        ordering,
      });
      setSolicitudes(data.resultados || []);
      setPagination({
        pagina_actual: data.pagina_actual,
        total_paginas: data.total_paginas,
        total_registros: data.total_registros,
      });
    } catch (err) {
      setError(err.message || 'No se pudieron obtener las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, [page, buscar, estado, prioridad, clienteFilter, servicioFilter, tecnicoFilter, ordering]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  /**
   * Ejecuta la búsqueda por asunto o descripción desde la primera página.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setBuscar(searchInput.trim());
  };

  /**
   * Restablece los 5 filtros combinables, la búsqueda y el ordenamiento.
   */
  const handleClearFilters = () => {
    setSearchInput('');
    setBuscar('');
    setEstado('');
    setPrioridad('');
    setClienteFilter('');
    setServicioFilter('');
    setTecnicoFilter('');
    setOrdering('-fecha_creacion');
    setPage(1);
  };

  /**
   * Elimina la solicitud confirmada y captura errores 409 si ya tiene asignación.
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await apiDelete(`/solicitudes/${deleteTarget.id}/`);
      setSuccess(`Solicitud #${deleteTarget.id} eliminada correctamente.`);
      setDeleteTarget(null);
      if (solicitudes.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchSolicitudes();
      }
    } catch (err) {
      setDeleteTarget(null);
      setError(err.message || 'No se pudo eliminar la solicitud.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#0b1f3a' }}>
            <i className="bi bi-clipboard2-pulse me-2 text-primary" />
            Módulo de Solicitudes
          </h3>
          <p className="text-muted small mb-0">
            Gestión del ciclo de vida de órdenes: Pendiente → En proceso → Resuelta o Cancelada.
          </p>
        </div>

        {canAction('solicitudes.add_solicitud') && (
          <Link to="/solicitudes/nueva" className="btn btn-navy">
            <i className="bi bi-plus-circle me-1" />
            Nueva Solicitud
          </Link>
        )}
      </div>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* Panel de 5 filtros combinables + búsqueda + orden */}
      <div className="servitec-card p-3 mb-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold mb-1">Buscar asunto o descripción</label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Palabras clave..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-navy">
                <i className="bi bi-search me-1" />
                Buscar
              </button>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1">Estado</label>
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

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1">Prioridad</label>
            <select
              className="form-select form-select-sm"
              value={prioridad}
              onChange={(e) => {
                setPrioridad(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas</option>
              <option value="BAJA">Baja</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1">Cliente</label>
            <select
              className="form-select form-select-sm"
              value={clienteFilter}
              onChange={(e) => {
                setClienteFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {clientesCatalog.map((cli) => (
                <option key={cli.id} value={cli.id}>
                  {cli.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
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

          <div className="col-6 col-md-4">
            <label className="form-label small fw-semibold mb-1">Técnico asignado</label>
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

          <div className="col-6 col-md-4">
            <label className="form-label small fw-semibold mb-1">Ordenar por fecha</label>
            <select
              className="form-select form-select-sm"
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
            >
              <option value="-fecha_creacion">Más recientes primero</option>
              <option value="fecha_creacion">Más antiguas primero</option>
            </select>
          </div>

          <div className="col-12 col-md-4">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={handleClearFilters}
            >
              <i className="bi bi-eraser me-1" />
              Limpiar filtros
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de solicitudes */}
      <div className="servitec-card p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary mb-2" role="status" />
            <p className="text-muted small mb-0">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-inbox fs-1 text-muted d-block mb-2" />
            <p className="text-muted mb-0">No hay solicitudes que coincidan con los filtros aplicados.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle table-navy mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Asunto</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha creación</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((sol) => (
                    <tr key={sol.id}>
                      <td className="fw-semibold">#{sol.id}</td>
                      <td>
                        <div className="fw-medium">{sol.asunto}</div>
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '220px' }}>
                          {sol.descripcion}
                        </small>
                      </td>
                      <td>{clientesMap[sol.cliente] || `Cliente #${sol.cliente}`}</td>
                      <td>{serviciosMap[sol.servicio] || `Servicio #${sol.servicio}`}</td>
                      <td>
                        <span className={`badge ${PRIORIDAD_BADGES[sol.prioridad] || 'bg-secondary'}`}>
                          {sol.prioridad}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${ESTADO_BADGES[sol.estado] || 'bg-secondary'}`}>
                          {sol.estado}
                        </span>
                      </td>
                      <td className="small text-muted">{formatDateTime(sol.fecha_creacion)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {canAction('solicitudes.change_solicitud') && (
                            <Link
                              to={`/solicitudes/editar/${sol.id}`}
                              className="btn btn-outline-navy"
                              title="Gestionar / editar solicitud"
                            >
                              <i className="bi bi-pencil-square" />
                            </Link>
                          )}
                          {canAction('solicitudes.delete_solicitud') && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              title="Eliminar solicitud"
                              onClick={() => setDeleteTarget(sol)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
        title="Eliminar solicitud"
        message={`¿Confirma que desea eliminar la solicitud #${deleteTarget?.id} ("${deleteTarget?.asunto}")? Si ya tiene una asignación registrada, el servidor bloqueará la operación.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}