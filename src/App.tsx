import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { QuestionnaireView } from './components/questionnaire/QuestionnaireView';
import { AdminView } from './components/admin/AdminView';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { authService } from './services/authService';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'client' | 'admin'>('client');
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

  // Verificar sesión persistente al montar
  useEffect(() => {
    authService.checkSession().then((session) => {
      if (session.isAuthenticated) {
        setIsAdminAuthenticated(true);
      }
    });
  }, []);

  const handleToggleMode = (mode: 'client' | 'admin') => {
    setCurrentMode(mode);
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
          mode={currentMode}
          onToggleMode={handleToggleMode}
          onLogout={handleAdminLogout}
          isAdminAuthenticated={isAdminAuthenticated}
          clientName={client.name}
          autosaveStatus={autosaveStatus}
        />

        {/* Experiencia según el rol seleccionado */}
        <div style={{ flex: '1 0 auto' }}>
          {currentMode === 'client' ? (
            <QuestionnaireView
              clientName={client.name}
              onClientNameLoaded={handleClientNameLoaded}
              onAutoSaveStatusChange={setAutosaveStatus}
              onNavigateToAdmin={() => setCurrentMode('admin')}
            />
          ) : !isAdminAuthenticated ? (
            <AdminLoginView
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToDiagnosis={() => setCurrentMode('client')}
            />
          ) : (
            <AdminView
              clientName={client.name}
              onViewClient={() => setCurrentMode('client')}
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
