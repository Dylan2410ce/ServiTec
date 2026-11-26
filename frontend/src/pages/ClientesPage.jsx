import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDelete, apiGet } from '../api.jsx';
import { useAuth } from '../AuthContext.jsx';
import AlertMessage from '../components/AlertMessage.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

/**
 * Muestra el listado paginado de clientes con búsqueda, filtro por estado
 * y ordenamiento ejecutados directamente en el backend.
 */
export default function ClientesPage() {
  const { canAction } = useAuth();

  const [clientes, setClientes] = useState([]);
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
   * Consulta los clientes aplicando los parámetros activos de filtro, búsqueda y página.
   */
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('/clientes/', {
        page,
        buscar,
        activo,
        ordering,
      });
      setClientes(data.resultados || []);
      setPagination({
        pagina_actual: data.pagina_actual,
        total_paginas: data.total_paginas,
        total_registros: data.total_registros,
      });
    } catch (err) {
      setError(err.message || 'Error al obtener la lista de clientes.');
    } finally {
      setLoading(false);
    }
  }, [page, buscar, activo, ordering]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  /**
   * Ejecuta la búsqueda por nombre, documento o correo reiniciando a la página 1.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setBuscar(searchInput.trim());
  };

  /**
   * Limpia todos los filtros aplicados y restablece el listado inicial.
   */
  const handleClearFilters = () => {
    setSearchInput('');
    setBuscar('');
    setActivo('');
    setOrdering('nombre');
    setPage(1);
  };

  /**
   * Elimina el cliente confirmado en el modal y captura conflictos 409 o permisos 403.
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await apiDelete(`/clientes/${deleteTarget.id}/`);
      setSuccess(`Cliente "${deleteTarget.nombre}" eliminado correctamente.`);
      setDeleteTarget(null);
      if (clientes.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchClientes();
      }
    } catch (err) {
      setDeleteTarget(null);
      setError(err.message || 'No se pudo eliminar el cliente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#0b1f3a' }}>
            <i className="bi bi-people me-2 text-primary" />
            Módulo de Clientes
          </h3>
          <p className="text-muted small mb-0">
            Administración de clientes registrados y control de disponibilidad para solicitudes.
          </p>
        </div>

        {canAction('clientes.add_cliente') && (
          <Link to="/clientes/nuevo" className="btn btn-navy">
            <i className="bi bi-plus-circle me-1" />
            Nuevo Cliente
          </Link>
        )}
      </div>

      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* Barra de búsqueda, filtro y ordenamiento */}
      <div className="servitec-card p-3 mb-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <label className="form-label small fw-semibold mb-1">Buscar cliente</label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Nombre, documento o correo..."
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

          <div className="col-6 col-md-2">
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

      {/* Tabla de resultados */}
      <div className="servitec-card p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary mb-2" role="status" />
            <p className="text-muted small mb-0">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-inbox fs-1 text-muted d-block mb-2" />
            <p className="text-muted mb-0">No se encontraron clientes con los criterios seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle table-navy mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="fw-semibold">#{cliente.id}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{cliente.documento}</span>
                      </td>
                      <td className="fw-medium">{cliente.nombre}</td>
                      <td>{cliente.correo}</td>
                      <td>{cliente.telefono}</td>
                      <td>
                        <span className={`badge ${cliente.activo ? 'bg-success' : 'bg-secondary'}`}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {canAction('clientes.change_cliente') && (
                            <Link
                              to={`/clientes/editar/${cliente.id}`}
                              className="btn btn-outline-navy"
                              title="Editar cliente"
                            >
                              <i className="bi bi-pencil-square" />
                            </Link>
                          )}
                          {canAction('clientes.delete_cliente') && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              title="Eliminar cliente"
                              onClick={() => setDeleteTarget(cliente)}
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
        title="Eliminar cliente"
        message={`¿Confirma que desea eliminar al cliente "${deleteTarget?.nombre}"? Si posee solicitudes registradas, el sistema impedirá el borrado.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}