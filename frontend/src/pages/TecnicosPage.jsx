import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDelete, apiGet, fetchAllPages } from '../api.jsx';
import { useAuth } from '../AuthContext.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

/**
 * Muestra el listado paginado de técnicos con búsqueda, filtros combinables
 * (estado y especialidad) y ordenamiento ejecutados en el servidor.
 */
export default function TecnicosPage() {
  const { canAction } = useAuth();

  const [tecnicos, setTecnicos] = useState([]);
  const [serviciosCatalog, setServiciosCatalog] = useState([]);
  const [serviciosMap, setServiciosMap] = useState({});

  const [pagination, setPagination] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_registros: 0,
  });

  const [searchInput, setSearchInput] = useState('');
  const [buscar, setBuscar] = useState('');
  const [activo, setActivo] = useState('');
  const [servicioFilter, setServicioFilter] = useState('');
  const [ordering, setOrdering] = useState('nombre');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Carga el catálogo completo de servicios para poblar el filtro y traducir
   * los IDs de especialidades en la tabla de técnicos.
   */
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const list = await fetchAllPages('/servicios/');
        setServiciosCatalog(list);
        const map = {};
        list.forEach((srv) => {
          map[srv.id] = srv.nombre;
        });
        setServiciosMap(map);
      } catch {
        // Si falla el catálogo auxiliar, la tabla mostrará los IDs como respaldo
      }
    };
    loadCatalog();
  }, []);

  /**
   * Consulta los técnicos paginados aplicando los filtros combinables activos.
   */
  const fetchTecnicos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('/tecnicos/', {
        page,
        buscar,
        activo,
        servicio: servicioFilter,
        ordering,
      });
      setTecnicos(data.resultados || []);
      setPagination({
        pagina_actual: data.pagina_actual,
        total_paginas: data.total_paginas,
        total_registros: data.total_registros,
      });
    } catch (err) {
      setError(err.message || 'No se pudo cargar el listado de técnicos.');
    } finally {
      setLoading(false);
    }
  }, [page, buscar, activo, servicioFilter, ordering]);

  useEffect(() => {
    fetchTecnicos();
  }, [fetchTecnicos]);

  /**
   * Ejecuta la búsqueda por nombre, identificación o correo desde la página 1.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setBuscar(searchInput.trim());
  };

  /**
   * Limpia todos los filtros aplicados y restablece el orden por defecto.
   */
  const handleClearFilters = () => {
    setSearchInput('');
    setBuscar('');
    setActivo('');
    setServicioFilter('');
    setOrdering('nombre');
    setPage(1);
  };

  /**
   * Elimina el técnico confirmado y captura errores 409 si tiene asignaciones vinculadas.
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await apiDelete(`/tecnicos/${deleteTarget.id}/`);
      setSuccess(`Técnico "${deleteTarget.nombre}" eliminado correctamente.`);
      setDeleteTarget(null);
      if (tecnicos.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchTecnicos();
      }
    } catch (err) {
      setDeleteTarget(null);
      setError(err.message || 'No se pudo eliminar el técnico.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#0b1f3a' }}>
            <i className="bi bi-person-badge me-2 text-primary" />
            Módulo de Técnicos
          </h3>
          <p className="text-muted small mb-0">
            Personal técnico, especialidades autorizadas y disponibilidad operativa.
          </p>
        </div>

        {canAction('tecnicos.add_tecnico') && (
          <Link to="/tecnicos/nuevo" className="btn btn-navy">
            <i className="bi bi-plus-circle me-1" />
            Nuevo Técnico
          </Link>
        )}
      </div>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* Filtros combinables en servidor */}
      <div className="servitec-card p-3 mb-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end">
          <div className="col-12 col-lg-4">
            <label className="form-label small fw-semibold mb-1">Buscar técnico</label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Nombre, identificación o correo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-navy">
                <i className="bi bi-search me-1" />
                Buscar
              </button>
            </div>
          </div>

          <div className="col-6 col-lg-2">
            <label className="form-label small fw-semibold mb-1">Estado</label>
            <select
              className="form-select form-select-sm"
              value={activo}
              onChange={(e) => {
                setActivo(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <div className="col-6 col-lg-3">
            <label className="form-label small fw-semibold mb-1">Servicio que ofrece</label>
            <select
              className="form-select form-select-sm"
              value={servicioFilter}
              onChange={(e) => {
                setServicioFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los servicios</option>
              {serviciosCatalog.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-lg-2">
            <label className="form-label small fw-semibold mb-1">Ordenar por</label>
            <select
              className="form-select form-select-sm"
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
            >
              <option value="nombre">Nombre (A - Z)</option>
              <option value="-nombre">Nombre (Z - A)</option>
            </select>
          </div>

          <div className="col-6 col-lg-1">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={handleClearFilters}
              title="Limpiar filtros"
            >
              <i className="bi bi-eraser" />
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de técnicos */}
      <div className="servitec-card p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary mb-2" role="status" />
            <p className="text-muted small mb-0">Cargando técnicos...</p>
          </div>
        ) : tecnicos.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-inbox fs-1 text-muted d-block mb-2" />
            <p className="text-muted mb-0">No se encontraron técnicos con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle table-navy mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Identificación</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Servicios habilitados</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tecnicos.map((tec) => (
                    <tr key={tec.id}>
                      <td className="fw-semibold">#{tec.id}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{tec.identificacion}</span>
                      </td>
                      <td className="fw-medium">{tec.nombre}</td>
                      <td>{tec.correo}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {(tec.servicios || []).map((srvId) => (
                            <span
                              key={srvId}
                              className="badge"
                              style={{ backgroundColor: '#e6eef8', color: '#0b1f3a', border: '1px solid #bfd3ec' }}
                            >
                              {serviciosMap[srvId] || `Servicio #${srvId}`}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${tec.activo ? 'bg-success' : 'bg-secondary'}`}>
                          {tec.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {canAction('tecnicos.change_tecnico') && (
                            <Link
                              to={`/tecnicos/editar/${tec.id}`}
                              className="btn btn-outline-navy"
                              title="Editar técnico"
                            >
                              <i className="bi bi-pencil-square" />
                            </Link>
                          )}
                          {canAction('tecnicos.delete_tecnico') && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              title="Eliminar técnico"
                              onClick={() => setDeleteTarget(tec)}
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
        title="Eliminar técnico"
        message={`¿Confirma que desea eliminar al técnico "${deleteTarget?.nombre}"? Si posee asignaciones registradas, el sistema impedirá el borrado.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}