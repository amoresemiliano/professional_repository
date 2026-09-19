import { useState } from 'react';
import { VerticalsSubTab } from './VerticalsSubTab';
import { ScoringConfigTab } from './ScoringConfigTab';
import { SecurityTab } from './SecurityTab';

export function SettingsTab() {
  const [subTab, setSubTab] = useState<'verticals' | 'scoring' | 'security'>('verticals');

  return (
    <div>
      {/* Sub-navegación de Configuración */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${subTab === 'verticals' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSubTab('verticals')}
          style={{ minHeight: '34px', fontSize: 'var(--font-size-xs)' }}
        >
          Verticales y Servicios
        </button>
        <button
          type="button"
          className={`btn btn-sm ${subTab === 'scoring' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSubTab('scoring')}
          style={{ minHeight: '34px', fontSize: 'var(--font-size-xs)' }}
        >
          Scoring
        </button>
        <button
          type="button"
          className={`btn btn-sm ${subTab === 'security' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSubTab('security')}
          style={{ minHeight: '34px', fontSize: 'var(--font-size-xs)' }}
        >
          Mi cuenta / Seguridad
        </button>
      </div>

      {subTab === 'verticals' && <VerticalsSubTab />}
      {subTab === 'scoring' && <ScoringConfigTab />}
      {subTab === 'security' && <SecurityTab />}
    </div>
  );
}
