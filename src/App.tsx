import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { QuestionnaireView } from './components/questionnaire/QuestionnaireView';
import { AdminView } from './components/admin/AdminView';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { authService } from './services/authService';

function getInitialRoute(): { mode: 'client' | 'admin'; token: string | null } {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const fromQuery = searchParams.get('token');

  // Solo rutas /q/:token, ?token=... o /q activan el modo cuestionario
  if (path.startsWith('/q') || fromQuery) {
    const qMatch = path.match(/^\/q(?:\/([a-zA-Z0-9_-]+))?/);
    const token = fromQuery || qMatch?.[1] || null;
    return { mode: 'client', token };
  }

  // Ruta raíz '/', '/admin', '/admin/login' van siempre a la plataforma de administración
  return { mode: 'admin', token: null };
}

export default function App() {
  const [route, setRoute] = useState(getInitialRoute);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(
    () => authService.getSession().isAuthenticated
  );
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');

  // Nombre de cliente obtenido dinámicamente desde el cuestionario / backend
  const [client, setClient] = useState({
    id: '',
    name: '',
  });

  const handleClientNameLoaded = useCallback((loadedName: string) => {
    setClient((prev) => (prev.name === loadedName ? prev : { ...prev, name: loadedName }));
  }, []);

  // Escuchar navegación del historial del navegador
  useEffect(() => {
    const handlePopState = () => {
      setRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Verificar sesión persistente al montar de forma silenciosa
  useEffect(() => {
    authService.checkSession().then((session) => {
      setIsAdminAuthenticated(session.isAuthenticated);
    }).catch(() => {
      setIsAdminAuthenticated(false);
    });
  }, []);

  const handleToggleMode = (mode: 'client' | 'admin') => {
    if (mode === 'client') {
      const targetUrl = route.token ? `/q/${route.token}` : '/q';
      window.history.pushState({}, '', targetUrl);
      setRoute({ mode: 'client', token: route.token });
    } else {
      window.history.pushState({}, '', '/');
      setRoute({ mode: 'admin', token: null });
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
  };

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header Institucional Vegen Digital */}
        <Header
          mode={route.mode}
          onToggleMode={handleToggleMode}
          onLogout={handleAdminLogout}
          isAdminAuthenticated={isAdminAuthenticated}
          clientName={client.name}
          autosaveStatus={autosaveStatus}
        />

        {/* Experiencia según el rol y ruta activa */}
        <div style={{ flex: '1 0 auto' }}>
          {route.mode === 'client' ? (
            <QuestionnaireView
              clientName={client.name}
              initialToken={route.token}
              onClientNameLoaded={handleClientNameLoaded}
              onAutoSaveStatusChange={setAutosaveStatus}
              onNavigateToAdmin={() => handleToggleMode('admin')}
            />
          ) : !isAdminAuthenticated ? (
            <AdminLoginView
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToDiagnosis={() => handleToggleMode('client')}
            />
          ) : (
            <AdminView
              clientName={client.name}
              onViewClient={() => handleToggleMode('client')}
              onLogout={handleAdminLogout}
            />
          )}
        </div>

        {/* Footer Editorial y Discreto */}
        <footer className="app-footer">
          <div className="container container-wide">
            <div className="app-footer-inner">
              <span>
                Vegen Digital © 2026 • Plataforma de Diagnóstico
              </span>
              <span>
                Privacidad y Confidencialidad Profesional según la LOPDGDD y RGPD
              </span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
