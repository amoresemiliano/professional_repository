import { IconExternalLink, IconLogOut } from './Icons';

interface HeaderProps {
  mode: 'client' | 'admin';
  onToggleMode?: (mode: 'client' | 'admin') => void;
  onLogout?: () => void;
  isAdminAuthenticated?: boolean;
  autosaveStatus?: 'saved' | 'saving' | 'idle';
  clientName?: string;
}

export function Header({
  mode,
  onToggleMode,
  onLogout,
  isAdminAuthenticated,
  autosaveStatus = 'saved',
  clientName,
}: HeaderProps) {
  return (
    <header className="vegen-header">
      <div className="container container-wide" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 var(--space-4)' }}>
        <div className="vegen-header-inner">
          {/* Identidad Oficial Vegen Digital */}
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
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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

            {mode === 'admin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {onToggleMode && (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      minHeight: '30px',
                      padding: '0.25rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => onToggleMode('client')}
                    title="Abrir vista de cuestionario público"
                  >
                    <IconExternalLink size={13} />
                    <span>Vista Formulario</span>
                  </button>
                )}
                {isAdminAuthenticated && onLogout && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      minHeight: '30px',
                      padding: '0.25rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={onLogout}
                    title="Cerrar sesión de administrador"
                  >
                    <IconLogOut size={13} />
                    <span>Cerrar sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
