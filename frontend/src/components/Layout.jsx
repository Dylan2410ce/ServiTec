import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/clientes', label: 'Clientes', icon: 'bi-people' },
  { to: '/servicios', label: 'Servicios', icon: 'bi-tools' },
  { to: '/tecnicos', label: 'Técnicos', icon: 'bi-person-badge' },
  { to: '/solicitudes', label: 'Solicitudes', icon: 'bi-clipboard2-pulse' },
  { to: '/asignaciones', label: 'Asignaciones', icon: 'bi-calendar2-check' },
];

/**
 * Proporciona el marco estructural de la aplicación SPA con barra superior,
 * menú de navegación adaptable y área principal dinámica.
 */
export default function Layout() {
  const { user, logout, auditPermissionsMode, setAuditPermissionsMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.is_staff || user?.rol === 'Administrador';

  /**
   * Cierra la sesión actual, limpia el almacenamiento local y redirige al login.
   */
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Barra superior */}
      <header className="navbar navbar-dark servitec-navbar px-3 py-2 sticky-top shadow-sm">
        <div className="container-fluid px-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-light btn-sm d-lg-none"
              aria-label="Alternar menú"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <i className="bi bi-list fs-5" />
            </button>
            <span className="navbar-brand fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-cpu-fill text-info" />
              <span>ServiTec</span>
              <span className="badge bg-info text-dark fw-normal small d-none d-sm-inline">
                Gestión Técnica
              </span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 gap-md-3">
            {!isAdmin && (
              <div className="form-check form-switch text-white mb-0 d-none d-md-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="auditModeSwitch"
                  checked={auditPermissionsMode}
                  onChange={(e) => setAuditPermissionsMode(e.target.checked)}
                />
                <label className="form-check-label small text-light" htmlFor="auditModeSwitch">
                  Simular botones (probar 403)
                </label>
              </div>
            )}

            <div className="text-end text-white lh-sm">
              <div className="small fw-semibold">
                <i className="bi bi-person-circle me-1" />
                {user?.username}
              </div>
              <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                {user?.rol}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <i className="bi bi-box-arrow-right me-1" />
              <span className="d-none d-sm-inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Cuerpo principal: Sidebar + Contenido */}
      <div className="container-fluid flex-grow-1">
        <div className="row">
          {/* Menú lateral escritorio y desplegable móvil */}
          <aside
            className={`col-lg-2 col-md-3 servitec-sidebar p-3 ${
              mobileMenuOpen ? 'd-block' : 'd-none d-lg-block'
            }`}
          >
            <div className="text-uppercase text-info small fw-semibold mb-2 px-2">
              Módulos del sistema
            </div>
            <nav className="nav flex-column">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {!isAdmin && (
              <div className="mt-4 pt-3 border-top border-secondary d-md-none">
                <div className="form-check form-switch text-white">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="auditModeMobile"
                    checked={auditPermissionsMode}
                    onChange={(e) => setAuditPermissionsMode(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="auditModeMobile">
                    Mostrar botones para probar 403
                  </label>
                </div>
              </div>
            )}
          </aside>

          {/* Área dinámica de cada pantalla */}
          <main className="col-lg-10 col-12 p-3 p-md-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}