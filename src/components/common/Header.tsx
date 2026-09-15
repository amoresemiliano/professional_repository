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
          {/* Identidad Oficial Vegen Digital directa sobre el header */}
          <div className="brand-mark-wrapper">
            <img
              src="/assets/logo_vegen_negativo.png"
              alt="Vegen Digital"
              className="brand-logo-img"
            />
            <span className="brand-app-label">
              {mode === 'admin' ? 'Panel de Administración' : 'DIAGNÓSTICO'}
            </span>
          </div>

          {/* Área de Acciones y Estado */}
          <div className="header-actions">
            {mode === 'client' && (
              <>
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

                {onToggleMode && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-tertiary)',
                      minHeight: '28px',
                      padding: '0.2rem 0.6rem',
                    }}
                    onClick={() => onToggleMode('admin')}
                    title="Acceso de gestión interna"
                  >
                    Admin
                  </button>
                )}
              </>
            )}

            {mode === 'admin' && onToggleMode && (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  minHeight: '30px',
                  padding: '0.25rem 0.75rem',
                }}
                onClick={() => onToggleMode('client')}
              >
                Ver vista cliente
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
