import { ClientItem } from '../../../types';
import { Card, CardBody } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { IconUsers, IconFileText, IconStar, IconPlus, IconExternalLink } from '../../common/Icons';

interface OverviewTabProps {
  clients: ClientItem[];
  clientName: string;
  onNavigateToTab: (tab: 'overview' | 'clients' | 'questionnaires' | 'comparison' | 'matrix' | 'scoring-config' | 'security', filter?: string) => void;
  onOpenNewClientModal: () => void;
  onViewClient?: () => void;
}

export function OverviewTab({
  clients,
  clientName,
  onNavigateToTab,
  onOpenNewClientModal,
  onViewClient,
}: OverviewTabProps) {
  const completedCount = clients.filter((c) => c.status === 'COMPLETED').length;
  const inProgressCount = clients.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'SENT').length;

  return (
    <div>
      {/* Tarjetas de Métricas Clave Clicables */}
      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* KPI 1: Clientes */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToTab('clients')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateToTab('clients')}
          style={{ cursor: 'pointer', outline: 'none' }}
          aria-label="Ver listado de clientes"
        >
          <Card className="kpi-card-interactive">
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Clientes
                </span>
                <IconUsers size={18} style={{ color: 'var(--color-brand)' }} />
              </div>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-2)' }}>
                {clients.length}
              </p>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-brand)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-1)' }}>
                Gestionar clientes &rarr;
              </span>
            </CardBody>
          </Card>
        </div>

        {/* KPI 2: Total Diagnósticos */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToTab('questionnaires', 'ALL')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateToTab('questionnaires', 'ALL')}
          style={{ cursor: 'pointer', outline: 'none' }}
          aria-label="Ver todos los diagnósticos"
        >
          <Card className="kpi-card-interactive">
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Diagnósticos
                </span>
                <IconFileText size={18} style={{ color: 'var(--color-brand)' }} />
              </div>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-2)' }}>
                {clients.length}
              </p>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-brand)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-1)' }}>
                Ver formularios &rarr;
              </span>
            </CardBody>
          </Card>
        </div>

        {/* KPI 3: Completados */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToTab('questionnaires', 'COMPLETED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateToTab('questionnaires', 'COMPLETED')}
          style={{ cursor: 'pointer', outline: 'none' }}
          aria-label="Filtrar diagnósticos completados"
        >
          <Card className="kpi-card-interactive">
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Completados
                </span>
                <Badge variant="success">Finalizados</Badge>
              </div>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-brand)', marginTop: 'var(--space-2)' }}>
                {completedCount}
              </p>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-brand)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-1)' }}>
                Ver completados &rarr;
              </span>
            </CardBody>
          </Card>
        </div>

        {/* KPI 4: Pendientes / En Progreso */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToTab('questionnaires', 'PENDING')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateToTab('questionnaires', 'PENDING')}
          style={{ cursor: 'pointer', outline: 'none' }}
          aria-label="Filtrar diagnósticos activos o pendientes"
        >
          <Card className="kpi-card-interactive">
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Pendientes
                </span>
                <Badge variant="warning">Activos</Badge>
              </div>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-warning)', marginTop: 'var(--space-2)' }}>
                {inProgressCount}
              </p>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-1)' }}>
                Ver pendientes &rarr;
              </span>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Diagnóstico Destacado y Acciones */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Diagnóstico Reciente: {clientName || 'Dr. Berlioz'}
                </h2>
                <Badge variant="neutral">Activo</Badge>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Servicios jurídicos • Diagnóstico estratégico integral
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {onViewClient && (
                <Button variant="secondary" size="sm" onClick={onViewClient}>
                  <IconFileText size={14} />
                  <span>Respuestas</span>
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => onNavigateToTab('matrix')}>
                <IconStar size={14} filled />
                <span>Matriz de Oportunidad</span>
              </Button>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              ¿Deseas enviar el diagnóstico a un nuevo cliente o despacho colaborador?
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="secondary" size="sm" onClick={() => onNavigateToTab('clients')}>
                <IconUsers size={14} />
                <span>Clientes</span>
              </Button>
              <Button variant="primary" size="sm" onClick={onOpenNewClientModal}>
                <IconPlus size={14} />
                <span>+ Crear Cliente</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
