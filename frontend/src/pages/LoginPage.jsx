import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import AlertMessage from '../components/AlertMessage.jsx';

/**
 * Gestiona el formulario de autenticación contra el backend Django REST Framework
 * y redirige al Dashboard tras obtener un token válido.
 */
export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  /**
   * Valida los campos locales y envía las credenciales al endpoint de tokens.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Debe ingresar su usuario y contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciales inválidas. Verifique sus datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper d-flex align-items-center justify-content-center p-3">
      <div className="card border-0 shadow-lg" style={{ maxWidth: '420px', width: '100%', borderRadius: '1rem' }}>
        <div
          className="card-header text-white text-center py-4 border-0"
          style={{
            background: 'linear-gradient(135deg, #0b1f3a 0%, #1b437a 100%)',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
          }}
        >
          <div className="mb-2">
            <i className="bi bi-cpu-fill fs-1 text-info" />
          </div>
          <h4 className="fw-bold mb-0">ServiTec</h4>
          <small className="text-light opacity-75">Sistema de Gestión de Servicios Técnicos</small>
        </div>

        <div className="card-body p-4">
          <h5 className="fw-semibold mb-3 text-center" style={{ color: '#0b1f3a' }}>
            Iniciar sesión
          </h5>

          <AlertMessage type="danger" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="username" className="form-label fw-semibold small">
                Usuario
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-person" />
                </span>
                <input
                  id="username"
                  type="text"
                  className="form-control"
                  placeholder="Ej. root, operador o consulta"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold small">
                Contraseña
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-lock" />
                </span>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-navy w-100 py-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Autenticando...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Ingresar al sistema
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card-footer bg-light text-center py-2 border-0" style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
            Autenticación por Token DRF · Al salir se limpia la sesión local
          </small>
        </div>
      </div>
    </div>
  );
}