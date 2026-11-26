import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, fetchAllPages, formatDateTime } from '../api.jsx';
import { useAuth } from '../AuthContext.jsx';
import KpiCard from '../components/KpiCard.jsx';
import AlertMessage from '../components/AlertMessage.jsx';

const QUICK_MODULES = [
  { to: '/clientes', title: 'Clientes', desc: 'Directorio y estado de clientes', icon: 'bi-people' },
  { to: '/servicios', title: 'Servicios', desc: 'Catálogo técnico y tarifas', icon: 'bi-tools' },
  { to: '/tecnicos', title: 'Técnicos', desc: 'Especialidades y disponibilidad', icon: 'bi-person-badge' },
  { to: '/solicitudes', title: 'Solicitudes', desc: 'Órdenes de atención y estados', icon: 'bi-clipboard2-pulse' },
  { to: '/asignaciones', title: 'Asignaciones', desc: 'Agenda y horarios de técnicos', icon: 'bi-calendar2-check' },
];

/**
 * Pantalla inicial posterior al login que consulta /api/reportes/resumen/
 * para mostrar indicadores reales del negocio y accesos directos a los 5 módulos.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [clientesMap, setClientesMap] = useState({});
  const [serviciosMap, setServiciosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Carga los indicadores consolidados y los catálogos necesarios para mostrar
   * nombres legibles en la tabla de solicitudes urgentes.
   */
  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [resumenData, clientesList, serviciosList] = await Promise.all([
        apiGet('/reportes/resumen/'),
        fetchAllPages('/clientes/'),
        fetchAllPages('/servicios/'),
      ]);

      const cMap = {};
      clientesList.forEach((c) => {
        cMap[c.id] = c.nombre;
      });

      const sMap = {};
      serviciosList.forEach((s) => {
        sMap[s.id] = s.nombre;
      });

      setResumen(resumenData);
      setClientesMap(cMap);
      setServiciosMap(sMap);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el resumen del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted">Cargando indicadores de ServiTec...</p>
      </div>
    );
  }

  const totales = resumen?.totales || { total: 0, abiertas: 0, resueltas: 0, canceladas: 0 };

  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: '#0b1f3a' }}>
            Panel General de Control
          </h3>
          <p className="text-muted mb-0">
            Bienvenido, <strong>{user?.username}</strong> ({user?.rol}). Resumen operativo en tiempo real.
          </p>
        </div>
        <button type="button" className="btn btn-outline-navy btn-sm align-self-start" onClick={loadDashboard}>
          <i className="bi bi-arrow-clockwise me-1" />
          Actualizar indicadores
        </button>
      </div>

      <AlertMessage type="danger" message={error} onClose={() => setError('')} />

      {/* 4 Indicadores KPI reales desde la API */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Total Solicitudes"
            value={totales.total}
            subtitle="Histórico registrado en BD"
            icon="bi-clipboard-data"
            accentColor="#0b1f3a"
            to="/solicitudes"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Solicitudes Abiertas"
            value={totales.abiertas}
            subtitle="Pendientes o en proceso"
            icon="bi-hourglass-split"
            accentColor="#0d6efd"
            to="/solicitudes"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Resueltas"
            value={totales.resueltas}
            subtitle="Atenciones finalizadas"
            icon="bi-check2-circle"
            accentColor="#198754"
            to="/solicitudes"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Canceladas"
            value={totales.canceladas}
            subtitle="Solicitudes cerradas sin ejecución"
            icon="bi-x-circle"
            accentColor="#6c757d"
            to="/solicitudes"
          />
        </div>
      </div>

      {/* Accesos directos a los 5 módulos */}
      <div className="servitec-card p-3 mb-4">
        <h6 className="fw-bold text-uppercase mb-3" style={{ color: '#13315c' }}>
          <i className="bi bi-grid-fill me-2" />
          Acceso directo a los cinco módulos
        </h6>
        <div className="row g-2">
          {QUICK_MODULES.map((mod) => (
            <div key={mod.to} className="col-12 col-sm-6 col-lg">
              <Link
                to={mod.to}
                className="d-block p-3 rounded-3 border text-decoration-none h-100 bg-light"
              >
                <div className="d-flex align-items-center gap-2 mb-1" style={{ color: '#0b1f3a' }}>
                  <i className={`bi ${mod.icon} fs-5 text-primary`} />
                  <strong className="small">{mod.title}</strong>
                </div>
                <small className="text-muted d-block">{mod.desc}</small>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Tablas analíticas del resumen */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="servitec-card h-100 overflow-hidden">
            <div className="servitec-card-header px-3 py-2">
              <i className="bi bi-person-workspace me-2" />
              Carga actual por técnico activo
            </div>
            <div className="p-3">
              {resumen?.carga_tecnicos?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Técnico</th>
                        <th className="text-end">Asignaciones abiertas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.carga_tecnicos.map((tec) => (
                        <tr key={tec.id}>
                          <td className="fw-medium">{tec.nombre}</td>
                          <td className="text-end">
                            <span className="badge rounded-pill" style={{ backgroundColor: '#13315c' }}>
                              {tec.solicitudes_abiertas}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted small mb-0">No hay técnicos activos registrados.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="servitec-card h-100 overflow-hidden">
            <div className="servitec-card-header px-3 py-2">
              <i className="bi bi-bar-chart-line me-2" />
              Top 5 servicios más solicitados
            </div>
            <div className="p-3">
              {resumen?.servicios_mas_solicitados?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th className="text-end">Total solicitudes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.servicios_mas_solicitados.map((srv) => (
                        <tr key={srv.id}>
                          <td className="fw-medium">{srv.nombre}</td>
                          <td className="text-end">
                            <span className="badge bg-primary rounded-pill">{srv.total_solicitudes}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted small mb-0">Aún no existen solicitudes vinculadas a servicios.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Solicitudes urgentes abiertas */}
      <div className="servitec-card overflow-hidden">
        <div className="servitec-card-header px-3 py-2 d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-exclamation-diamond-fill text-danger me-2" />
            Solicitudes urgentes abiertas (Prioridad Alta)
          </span>
          <Link to="/solicitudes" className="btn btn-navy btn-sm">
            Ver todas
          </Link>
        </div>
        <div className="p-3">
          {resumen?.solicitudes_urgentes?.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Asunto</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Creación</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.solicitudes_urgentes.map((sol) => (
                    <tr key={sol.id}>
                      <td className="fw-semibold">#{sol.id}</td>
                      <td>{sol.asunto}</td>
                      <td>{clientesMap[sol.cliente] || `Cliente #${sol.cliente}`}</td>
                      <td>{serviciosMap[sol.servicio] || `Servicio #${sol.servicio}`}</td>
                      <td>
                        <span className={`badge ${sol.estado === 'EN_PROCESO' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                          {sol.estado}
                        </span>
                      </td>
                      <td className="small text-muted">{formatDateTime(sol.fecha_creacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted small mb-0">No hay solicitudes urgentes pendientes o en proceso.</p>
          )}
        </div>
      </div>
    </div>
  );
}