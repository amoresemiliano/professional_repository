import { useState } from 'react';
import { ClientItem } from '../../types';
import { adminService, ComparisonServiceRow } from '../../services/adminService';
import { authService } from '../../services/authService';
import { Button } from '../common/Button';
import { OverviewTab } from './tabs/OverviewTab';
import { ClientsTab } from './tabs/ClientsTab';
import { ComparisonTab } from './tabs/ComparisonTab';
import { MatrixTab } from './tabs/MatrixTab';
import { ScoringConfigTab } from './tabs/ScoringConfigTab';
import { NewClientModal } from './NewClientModal';

interface AdminViewProps {
  clientName?: string;
  onViewClient?: () => void;
  onLogout?: () => void;
}

export function AdminView({
  clientName = 'Dr. Berlioz',
  onViewClient,
  onLogout,
}: AdminViewProps = {}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'comparison' | 'matrix' | 'scoring-config'>('overview');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Clientes cargados desde adminService (F1.2 Dependency Inversion)
  const [clients, setClients] = useState<ClientItem[]>(adminService.getClients());
  const [comparisonServices] = useState<ComparisonServiceRow[]>(adminService.getComparisonServices());
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/q/${token}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCreateClient = (data: {
    name: string;
    sector: string;
    contactName: string;
    contactEmail: string;
  }) => {
    const created = adminService.createClient(data);
    setClients([created, ...clients]);
  };

  const handleLogout = async () => {
    await authService.logout();
    onLogout?.();
  };

  return (
    <div className="container container-wide" style={{ padding: 'var(--space-6) var(--space-4)' }}>
      {/* Barra de Navegación del Panel de Administración */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        {/* Pestañas de Navegación (Horizontalmente scrollables en móvil sin recortar) */}
        <nav
          className="admin-tab-nav"
          style={{
            display: 'flex',
            gap: 'var(--space-1)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%',
            paddingBottom: '2px',
          }}
          aria-label="Navegación del panel de administración"
        >
          {[
            { id: 'overview', label: 'Resumen General' },
            { id: 'clients', label: 'Clientes y Enlaces' },
            { id: 'comparison', label: 'Comparativa de Servicios' },
            { id: 'matrix', label: 'Opportunity Matrix' },
            { id: 'scoring-config', label: 'Configuración de Scoring' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                whiteSpace: 'nowrap',
                flexShrink: 0,
                minHeight: '38px',
                padding: '0.4rem 0.85rem',
              }}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Acciones de Sesión */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {onViewClient && (
            <Button variant="secondary" size="sm" onClick={onViewClient}>
              Ver cuestionario
            </Button>
          )}
          {onLogout && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          )}
        </div>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <main id="admin-main-content">
        {activeTab === 'overview' && (
          <OverviewTab
            clients={clients}
            clientName={clientName}
            onNavigateToClients={() => setActiveTab('clients')}
            onNavigateToComparison={() => setActiveTab('comparison')}
            onOpenNewClientModal={() => setShowNewClientModal(true)}
            onViewClient={onViewClient}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            clients={clients}
            copiedToken={copiedToken}
            onCopyLink={handleCopyLink}
            onOpenNewClientModal={() => setShowNewClientModal(true)}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonTab
            services={comparisonServices}
            clientName={clientName}
          />
        )}

        {activeTab === 'matrix' && (
          <MatrixTab services={comparisonServices} />
        )}

        {activeTab === 'scoring-config' && (
          <ScoringConfigTab />
        )}
      </main>

      {/* Modal Desacoplado para Crear Nuevo Cliente */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onCreateClient={handleCreateClient}
      />
    </div>
  );
}
