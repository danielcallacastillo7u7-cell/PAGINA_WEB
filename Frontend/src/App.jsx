import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Componentes globales
import Navbar from './components/Navbar';  // ← faltaba este

// Páginas públicas
import Inicio from './pages/public/Inicio';
import Register from './pages/public/Register';
import NotFound from './pages/public/NotFound';

// Páginas de usuario
import Login from './pages/user/Login';
import RecuperarContrasena from './pages/user/RecuperarContrasena';
import Dashboard from './pages/user/Dashboard';

// Páginas de admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="loading">Cargando sesión...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (adminOnly && usuario.rol !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { usuario } = useAuth();
  if (usuario) {
    return usuario.rol === 'admin'
      ? <Navigate to="/panel-admin" replace />
      : <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppContent() {
  const location = useLocation();

  const ocultarNavbar = [
    '/login',
    '/dashboard',
    '/recuperar',
    '/admin-login',
    '/panel-admin'
  ].includes(location.pathname);

  return (
    <>
      {!ocultarNavbar && <Navbar />}
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/register" element={<Register />} />  {/* ← ruta que faltaba */}

        {/* Usuario */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/recuperar" element={<PublicRoute><RecuperarContrasena /></PublicRoute>} />

        {/* Admin */}
        <Route path="/panel-admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />

        {/* Socio */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />  {/* ← mejor usar NotFound que redirigir */}
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;