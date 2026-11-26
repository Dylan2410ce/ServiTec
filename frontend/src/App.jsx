import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ClientesPage from './pages/ClientesPage.jsx';
import ClienteFormPage from './pages/ClienteFormPage.jsx';
import ServiciosPage from './pages/ServiciosPage.jsx';
import ServicioFormPage from './pages/ServicioFormPage.jsx';
import TecnicosPage from './pages/TecnicosPage.jsx';
import TecnicoFormPage from './pages/TecnicoFormPage.jsx';
import SolicitudesPage from './pages/SolicitudesPage.jsx';
import SolicitudFormPage from './pages/SolicitudFormPage.jsx';
import AsignacionesPage from './pages/AsignacionesPage.jsx';
import AsignacionFormPage from './pages/AsignacionFormPage.jsx';

/**
 * Define la navegación completa de la aplicación SPA mediante React Router,
 * separando el acceso público de las vistas protegidas por sesión.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            <Route path="clientes" element={<ClientesPage />} />
            <Route path="clientes/nuevo" element={<ClienteFormPage />} />
            <Route path="clientes/editar/:id" element={<ClienteFormPage />} />

            <Route path="servicios" element={<ServiciosPage />} />
            <Route path="servicios/nuevo" element={<ServicioFormPage />} />
            <Route path="servicios/editar/:id" element={<ServicioFormPage />} />

            <Route path="tecnicos" element={<TecnicosPage />} />
            <Route path="tecnicos/nuevo" element={<TecnicoFormPage />} />
            <Route path="tecnicos/editar/:id" element={<TecnicoFormPage />} />

            <Route path="solicitudes" element={<SolicitudesPage />} />
            <Route path="solicitudes/nueva" element={<SolicitudFormPage />} />
            <Route path="solicitudes/editar/:id" element={<SolicitudFormPage />} />

            <Route path="asignaciones" element={<AsignacionesPage />} />
            <Route path="asignaciones/nueva" element={<AsignacionFormPage />} />
            <Route path="asignaciones/editar/:id" element={<AsignacionFormPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}