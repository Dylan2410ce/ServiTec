/**
 * Renderiza los controles de navegación entre páginas utilizando la respuesta
 * paginada de Django (pagina_actual, total_paginas y total_registros).
 */
export default function Pagination({ paginaActual, totalPaginas, totalRegistros, onPageChange }) {
  if (!totalRegistros || totalPaginas <= 1) {
    return (
      <div className="text-muted small mt-2">
        Total de registros: <strong>{totalRegistros || 0}</strong>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 mt-3 pt-2 border-top">
      <div className="text-muted small">
        Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> ({totalRegistros} registros)
      </div>

      <nav aria-label="Paginación de resultados">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${paginaActual <= 1 ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onPageChange(paginaActual - 1)}
              disabled={paginaActual <= 1}
            >
              <i className="bi bi-chevron-left me-1" />
              Anterior
            </button>
          </li>

          <li className="page-item active">
            <span className="page-link" style={{ backgroundColor: '#13315c', borderColor: '#13315c' }}>
              {paginaActual}
            </span>
          </li>

          <li className={`page-item ${paginaActual >= totalPaginas ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onPageChange(paginaActual + 1)}
              disabled={paginaActual >= totalPaginas}
            >
              Siguiente
              <i className="bi bi-chevron-right ms-1" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}