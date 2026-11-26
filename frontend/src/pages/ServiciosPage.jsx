import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDelete, apiGet, formatCurrency } from '../api.jsx';
import { useAuth } from '../AuthContext.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

/**
 * Muestra el catálogo paginado de servicios técnicos mediante tarjetas Bootstrap,
 * con búsqueda por código o nombre, filtro por disponibilidad y ordenamiento por precio.
 */
export default function ServiciosPage() {
  const { canAction } = useAuth();

  const [servicios, setServicios] = useState([]);
  const [pagination, setPagination] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_registros: 0,
  });

  const [searchInput, setSearchInput] = useState('');
  const [buscar, setBuscar] = useState('');
  const [activo, setActivo] = useState('');
  const [ordering, setOrdering] = useState('nombre');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Consulta los servicios filtrados y ordenados desde /api/servicios/.
   */
  const fetchServicios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('/servicios/', {
        page,
        buscar,
        activo,
        ordering,
      });
      setServicios(data.resultados || []);
      setPagination({
        pagina_actual: data.pagina_actual,
        total_paginas: data.total_paginas,
        total_registros: data.total_registros,
      });
    } catch (err) {
      setError(err.message || 'No se pudo cargar el catálogo de servicios.');
    } finally {
      setLoading(false);
    }
  }, [page, buscar, activo, ordering]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  /**
   * Aplica el término de búsqueda reiniciando la paginación a la primera página.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setBuscar(searchInput.trim());
  };

  /**
   * Restablece los controles de filtro, búsqueda y ordenamiento a sus valores por defecto.
   */
  const handleClearFilters = () => {
    setSearchInput('');
    setBuscar('');
    setActivo('');
    setOrdering('nombre');
    setPage(1);
  };

  /**
   * Ejecuta la eliminación del servicio seleccionado y captura errores 409 si está en uso.
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await apiDelete(`/servicios/${deleteTarget.id}/`);
      setSuccess(`Servicio "${deleteTarget.nombre}" eliminado correctamente.`);
      setDeleteTarget(null);
      if (servicios.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchServicios();
      }
    } catch (err) {
      setDeleteTarget(null);
      setError(err.message || 'No se pudo eliminar el servicio.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#0b1f3a' }}>
            <i className="bi bi-tools me-2 text-primary" />
            Catálogo de Servicios
          </h3>
          <p className="text-muted small mb-0">
            Servicios técnicos ofrecidos, tarifas vigentes y disponibilidad operativa.
          </p>
        </div>

        {canAction('servicios.add_servicio') && (
          <Link to="/servicios/nuevo" className="btn btn-navy">
            <i className="bi bi-plus-circle me-1" />
            Nuevo Servicio
          </Link>
        )}
      </div>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* Filtros y ordenamiento */}
      <div className="servitec-card p-3 mb-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold mb-1">Buscar servicio</label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Código o nombre..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-navy">
                <i className="bi bi-search me-1" />
                Buscar
              </button>
            </div>
          </div>

          <div className="col-6 col-md-3">
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

          <div className="col-6 col-md-3">
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
              <option value="precio">Precio (Menor a mayor)</option>
              <option value="-precio">Precio (Mayor a menor)</option>
            </select>
          </div>

          <div className="col-12 col-md-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={handleClearFilters}
            >
              <i className="bi bi-eraser me-1" />
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Tarjetas de servicios */}
      {loading ? (
        <div className="servitec-card text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status" />
          <p className="text-muted small mb-0">Cargando servicios...</p>
        </div>
      ) : servicios.length === 0 ? (
        <div className="servitec-card text-center py-5">
          <i className="bi bi-inbox fs-1 text-muted d-block mb-2" />
          <p className="text-muted mb-0">No se encontraron servicios con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          <div className="row g-3">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="col-12 col-md-6 col-xl-4">
                <div className="servitec-card h-100 d-flex flex-column">
                  <div className="servitec-card-header px-3 py-2 d-flex justify-content-between align-items-center">
                    <span className="badge" style={{ backgroundColor: '#0b1f3a' }}>
                      {servicio.codigo}
                    </span>
                    <span className={`badge ${servicio.activo ? 'bg-success' : 'bg-secondary'}`}>
                      {servicio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="p-3 flex-grow-1">
                    <h5 className="fw-bold mb-1" style={{ color: '#0b1f3a' }}>
                      {servicio.nombre}
                    </h5>
                    <div className="fs-5 fw-bold text-primary mb-2">
                      {formatCurrency(servicio.precio)}
                    </div>
                    <p className="text-muted small mb-0">
                      {servicio.descripcion || 'Sin descripción adicional registrada.'}
                    </p>
                  </div>

                  {(canAction('servicios.change_servicio') || canAction('servicios.delete_servicio')) && (
                    <div className="px-3 py-2 bg-light border-top d-flex justify-content-end gap-2">
                      {canAction('servicios.change_servicio') && (
                        <Link
                          to={`/servicios/editar/${servicio.id}`}
                          className="btn btn-outline-navy btn-sm"
                        >
                          <i className="bi bi-pencil-square me-1" />
                          Editar
                        </Link>
                      )}
                      {canAction('servicios.delete_servicio') && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setDeleteTarget(servicio)}
                        >
                          <i className="bi bi-trash me-1" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="servitec-card p-3 mt-3">
            <Pagination
              paginaActual={pagination.pagina_actual}
              totalPaginas={pagination.total_paginas}
              totalRegistros={pagination.total_registros}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </>
      )}

      <ConfirmModal
        show={Boolean(deleteTarget)}
        title="Eliminar servicio"
        message={`¿Confirma que desea eliminar el servicio "${deleteTarget?.nombre}"? No podrá eliminarse si está asignado a técnicos o solicitudes.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}