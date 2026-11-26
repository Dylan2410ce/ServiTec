import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

/**
 * Protege las rutas privadas de la aplicación redirigiendo al login
 * cuando el usuario no está autenticado.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-2" role="status" />
          <p className="text-muted mb-0">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}