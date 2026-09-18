import { useState, useEffect } from 'react';
import { ClientItem } from '../../types';
import { adminService, ComparisonServiceRow } from '../../services/adminService';
import { authService } from '../../services/authService';
import { Button } from '../common/Button';
import { OverviewTab } from './tabs/OverviewTab';
import { ClientsTab } from './tabs/ClientsTab';
import { ComparisonTab } from './tabs/ComparisonTab';
import { MatrixTab } from './tabs/MatrixTab';
import { ScoringConfigTab } from './tabs/ScoringConfigTab';
import { QuestionnairesTab } from './tabs/QuestionnairesTab';
import { SecurityTab } from './tabs/SecurityTab';
import { NewClientModal } from './NewClientModal';
import { IconExternalLink, IconLogOut } from '../common/Icons';

interface AdminViewProps {
  clientName?: string;
  onViewClient?: () => void;
  onLogout?: () => void;
}

export function AdminView({
  clientName = '',
  onViewClient,
  onLogout,
}: AdminViewProps = {}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'questionnaires' | 'comparison' | 'matrix' | 'scoring-config' | 'security'>('overview');
  const [questionnairesFilter, setQuestionnairesFilter] = useState<string>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    await authService.logout();
    onLogout?.();
  };

  const handleNavigateFromOverview = (tab: typeof activeTab, filter?: string) => {
    if (filter) {
      setQuestionnairesFilter(filter);
    } else {
      setQuestionnairesFilter('ALL');
    }
    setActiveTab(tab);
  };

  const navItems = [
    { id: 'overview', label: 'Resumen' },
    { id: 'clients', label: 'Clientes' },
    { id: 'questionnaires', label: 'Diagnósticos' },
    { id: 'matrix', label: 'Matriz' },
    { id: 'scoring-config', label: 'Scoring' },
    { id: 'security', label: 'Seguridad' },
  ];

  return (
    <div className="container container-wide" style={{ padding: 'var(--space-5) var(--space-4)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Barra de Navegación del Panel de Administración */}
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
        {/* Lado Izquierdo: Pestañas Principales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {/* Brand Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginRight: 'var(--space-2)' }}>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-brand)', fontSize: 'var(--font-size-base)', letterSpacing: '-0.02em' }}>
              Vegen
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '1px solid var(--color-border)', paddingLeft: '8px' }}>
              Admin
            </span>
          </div>

          {/* Navegación Desktop */}
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
                  setActiveTab(tab.id as typeof activeTab);
                  if (tab.id === 'questionnaires') {
                    setQuestionnairesFilter('ALL');
                  }
                }}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}

            {/* Espacio conceptual para futuras fases (Planes, Presupuestos) */}
            <span
              title="Próximamente en Fase 4"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.35rem 0.5rem',
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                cursor: 'default',
                opacity: 0.6,
              }}
            >
              Planes (F4)
            </span>
          </nav>
        </div>

        {/* Lado Derecho: Acciones Secundarias */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {onViewClient && (
            <Button variant="secondary" size="sm" onClick={onViewClient} title="Abrir vista de cuestionario público">
              <IconExternalLink size={14} />
              <span>Vista Formulario</span>
            </Button>
          )}
          {onLogout && (
            <Button variant="ghost" size="sm" onClick={handleLogout} title="Cerrar sesión de administrador">
              <IconLogOut size={14} />
              <span>Cerrar sesión</span>
            </Button>
          )}
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
            onNavigateToTab={handleNavigateFromOverview}
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

        {activeTab === 'security' && (
          <SecurityTab />
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
