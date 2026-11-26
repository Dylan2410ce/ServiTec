import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, getStoredToken, setStoredToken } from './api.jsx';

const AuthContext = createContext(null);

/**
 * Proveedor global de autenticación, perfil de usuario y verificación de permisos.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(Boolean(getStoredToken()));
  const [auditPermissionsMode, setAuditPermissionsMode] = useState(false);

  /**
   * Limpia el token local y reinicia el estado de sesión del usuario.
   */
  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setAuditPermissionsMode(false);
  }, []);

  /**
   * Consulta el perfil y permisos del usuario autenticado contra /api/usuario/.
   */
  const loadCurrentUser = useCallback(async () => {
    if (!getStoredToken()) {
      setLoadingAuth(false);
      return;
    }
    try {
      const userData = await apiGet('/usuario/');
      setUser(userData);
    } catch {
      logout();
    } finally {
      setLoadingAuth(false);
    }
  }, [logout]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('servitec:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('servitec:unauthorized', handleUnauthorized);
  }, [logout]);

  /**
   * Autentica con usuario y contraseña en /api/token/ y carga el perfil activo.
   */
  const login = async (username, password) => {
    const response = await apiPost('/token/', { username, password }, false);
    if (response?.token) {
      setStoredToken(response.token);
      setToken(response.token);
      const userData = await apiGet('/usuario/');
      setUser(userData);
    }
  };

  /**
   * Evalúa si el usuario posee el permiso real de Django o si está activo el modo
   * de auditoría para demostrar respuestas 403 desde la interfaz.
   */
  const canAction = (permissionCode) => {
    if (!user) return false;
    if (auditPermissionsMode) return true;
    if (user.is_staff || user.rol === 'Administrador') return true;
    return Array.isArray(user.permisos) && user.permisos.includes(permissionCode);
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    loadingAuth,
    login,
    logout,
    canAction,
    auditPermissionsMode,
    setAuditPermissionsMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personalizado para consumir el contexto de autenticación en cualquier componente.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }
  return context;
}