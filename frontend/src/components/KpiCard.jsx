import { Link } from 'react-router-dom';

/**
 * Renderiza una tarjeta de indicador KPI para el Dashboard con icono,
 * valor numérico, descripción y enlace opcional al módulo relacionado.
 */
export default function KpiCard({ title, value, subtitle, icon, accentColor = '#13315c', to }) {
  const cardContent = (
    <div
      className="servitec-card h-100 p-3 position-relative overflow-hidden"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <span className="text-uppercase text-muted small fw-semibold">{title}</span>
          <h3 className="fw-bold mb-1 mt-1" style={{ color: '#0b1f3a' }}>
            {value}
          </h3>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center"
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: '#e6eef8',
            color: accentColor,
          }}
        >
          <i className={`bi ${icon} fs-4`} />
        </div>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="text-decoration-none d-block h-100">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}