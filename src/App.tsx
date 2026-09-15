import { useState } from 'react';
import { Header } from './components/common/Header';
import { QuestionnaireView } from './components/questionnaire/QuestionnaireView';
import { AdminView } from './components/admin/AdminView';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'client' | 'admin'>('client');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header Institucional Vegen Digital */}
      <Header
        mode={currentMode}
        onToggleMode={setCurrentMode}
        clientName="Despacho Di Rosa"
        autosaveStatus="saved"
      />

      {/* Experiencia según el rol seleccionado */}
      <div style={{ flex: '1 0 auto' }}>
        {currentMode === 'client' ? (
          <QuestionnaireView />
        ) : (
          <AdminView />
        )}
      </div>

      {/* Footer Editorial y Discreto */}
      <footer className="app-footer">
        <div className="container container-wide">
          <div className="app-footer-inner">
            <span>
              Vegen Digital © {new Date().getFullYear()} • Plataforma de Diagnóstico Comercial y Marketing
            </span>
            <span>
              Privacidad y Confidencialidad Profesional Garantizadas
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
