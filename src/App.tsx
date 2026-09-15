import { useState } from 'react';
import { Header } from './components/common/Header';
import { QuestionnaireView } from './components/questionnaire/QuestionnaireView';
import { AdminView } from './components/admin/AdminView';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'client' | 'admin'>('client');

  // Configuración de cliente configurable (Dr. Berlioz para mock F1.1, desacoplado de la UI)
  const [client] = useState({
    id: 'c1',
    name: 'Dr. Berlioz',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header Institucional Vegen Digital */}
      <Header
        mode={currentMode}
        onToggleMode={setCurrentMode}
        clientName={client.name}
        autosaveStatus="saved"
      />

      {/* Experiencia según el rol seleccionado */}
      <div style={{ flex: '1 0 auto' }}>
        {currentMode === 'client' ? (
          <QuestionnaireView clientName={client.name} />
        ) : (
          <AdminView
            clientName={client.name}
            onViewClient={() => setCurrentMode('client')}
          />
        )}
      </div>

      {/* Footer Editorial y Discreto */}
      <footer className="app-footer">
        <div className="container container-wide">
          <div className="app-footer-inner">
            <span>
              Vegen Digital © {new Date().getFullYear()} • Plataforma de Diagnóstico
            </span>
            <span>
              Privacidad y Confidencialidad Profesional según la LOPDGDD y RGPD
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
