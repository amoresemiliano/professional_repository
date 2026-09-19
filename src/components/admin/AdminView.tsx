import { useState, useEffect } from 'react';
import { ClientItem } from '../../types';
import { adminService, ComparisonServiceRow } from '../../services/adminService';
import { OverviewTab } from './tabs/OverviewTab';
import { ClientsTab } from './tabs/ClientsTab';
import { QuestionnairesTab } from './tabs/QuestionnairesTab';
import { MatrixTab } from './tabs/MatrixTab';
import { PlansTab } from './tabs/PlansTab';
import { QuotesTab } from './tabs/QuotesTab';
import { SettingsTab } from './tabs/SettingsTab';
import { NewClientModal } from './NewClientModal';

interface AdminViewProps {
  clientName?: string;
  onViewClient?: () => void;
  onLogout?: () => void;
}

export type AdminTabType = 'overview' | 'clients' | 'questionnaires' | 'matrix' | 'plans' | 'quotes' | 'settings';

export function AdminView({
  clientName = '',
  onViewClient,
}: AdminViewProps = {}) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [questionnairesFilter, setQuestionnairesFilter] = useState<string>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clientes cargados desde adminService
  const [clients, setClients] = useState<ClientItem[]>(adminService.getClients());
  const [comparisonServices] = useState<ComparisonServiceRow[]>(adminService.getComparisonServices());
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const loadClients = async () => {
    try {
      setErrorMsg(null);
      const list = await adminService.fetchClients();
      setClients(list);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar la lista de clientes.');
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/q/${token}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCreateClient = async (data: {
    name: string;
    sector: string;
    contactName: string;
    contactEmail: string;
    verticalId?: string | null;
  }) => {
    try {
      setErrorMsg(null);
      await adminService.createClientAsync(data);
      await loadClients();
      setShowNewClientModal(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear el cliente.');
      throw err;
    }
  };

  const handleNavigateFromOverview = (tab: AdminTabType, filter?: string) => {
    if (filter) {
      setQuestionnairesFilter(filter);
    } else {
      setQuestionnairesFilter('ALL');
    }
    setActiveTab(tab);
  };

  const navItems: Array<{ id: AdminTabType; label: string }> = [
    { id: 'overview', label: 'Resumen' },
    { id: 'clients', label: 'Clientes' },
    { id: 'questionnaires', label: 'Diagnósticos' },
    { id: 'matrix', label: 'Matriz de Oportunidad' },
    { id: 'plans', label: 'Plan Estratégico' },
    { id: 'quotes', label: 'Presupuestos' },
    { id: 'settings', label: 'Configuración' },
  ];

  return (
    <div className="container container-wide" style={{ padding: 'var(--space-5) var(--space-4)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Barra de Navegación Principal del Panel */}
      <header
        className="admin-header-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-3)',
        }}
      >
        {/* Pestañas Principales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginRight: 'var(--space-2)' }}>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-brand)', fontSize: 'var(--font-size-base)', letterSpacing: '-0.02em' }}>
              Vegen
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '1px solid var(--color-border)', paddingLeft: '8px' }}>
              Admin
            </span>
          </div>

          <nav
            className="admin-desktop-tabs"
            style={{
              display: 'flex',
              gap: 'var(--space-1)',
              flexWrap: 'wrap',
            }}
            aria-label="Navegación del panel de administración"
          >
            {navItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  minHeight: '36px',
                  padding: '0.35rem 0.75rem',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: activeTab === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                }}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'questionnaires') {
                    setQuestionnairesFilter('ALL');
                  }
                }}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {errorMsg && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
          {errorMsg}
        </div>
      )}

      {/* Contenido de la Pestaña Activa */}
      <main id="admin-main-content">
        {activeTab === 'overview' && (
          <OverviewTab
            clients={clients}
            clientName={clientName}
            onNavigateToTab={(tab, filter) => handleNavigateFromOverview(tab as AdminTabType, filter)}
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
            onRefreshClients={loadClients}
          />
        )}

        {activeTab === 'questionnaires' && (
          <QuestionnairesTab
            initialFilter={questionnairesFilter}
            onNavigateToMatrix={() => setActiveTab('matrix')}
          />
        )}

        {activeTab === 'matrix' && (
          <MatrixTab services={comparisonServices} />
        )}

        {activeTab === 'plans' && (
          <PlansTab />
        )}

        {activeTab === 'quotes' && (
          <QuotesTab />
        )}

        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </main>

      {/* Modal para Crear Nuevo Cliente */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onCreateClient={handleCreateClient}
      />
    </div>
  );
}
