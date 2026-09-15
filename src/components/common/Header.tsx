import React from 'react';

interface HeaderProps {
  mode: 'client' | 'admin';
  onToggleMode?: (mode: 'client' | 'admin') => void;
  autosaveStatus?: 'saved' | 'saving' | 'idle';
  clientName?: string;
}

export function Header({
  mode,
  onToggleMode,
  autosaveStatus = 'saved',
  clientName,
}: HeaderProps) {
  return (
    <header className="vegen-header">
      <div className="container container-wide">
        <div className="vegen-header-inner">
          {/* Identidad Oficial Vegen Digital con contenedor de contraste seguro */}
          <div className="brand-mark-wrapper">
            <div className="brand-logo-container" title="Vegen Digital">
              <img
                src="/assets/logo_vegen_negativo.png"
                alt="Vegen Digital"
                className="brand-logo-img"
              />
            </div>
            <span className="brand-app-label">
              {mode === 'admin' ? 'Panel de Administración' : 'Diagnóstico Inicial'}
            </span>
          </div>

          {/* Área de Acciones y Estado */}
          <div className="header-actions">
            {mode === 'client' && (
              <div className="autosave-status" aria-live="polite">
                <span
                  className={`autosave-dot ${autosaveStatus === 'saving' ? 'saving' : ''}`}
                />
                <span>
                  {autosaveStatus === 'saving'
                    ? 'Guardando...'
                    : clientName
                    ? `${clientName} • Guardado`
                    : 'Guardado'}
                </span>
              </div>
            )}

            {/* Selector de Vista para evaluación F1 */}
            {onToggleMode && (
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '3px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  type="button"
                  className={`btn btn-sm ${mode === 'client' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ minHeight: '28px', padding: '0.2rem 0.6rem' }}
                  onClick={() => onToggleMode('client')}
                >
                  Vista Cliente
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${mode === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ minHeight: '28px', padding: '0.2rem 0.6rem' }}
                  onClick={() => onToggleMode('admin')}
                >
                  Vista Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
