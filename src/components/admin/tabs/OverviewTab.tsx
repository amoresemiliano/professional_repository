import { ClientItem } from '../../../types';
import { Card, CardBody } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { IconUsers, IconFileText, IconStar, IconPlus } from '../../common/Icons';

interface OverviewTabProps {
  clients: ClientItem[];
  clientName: string;
  onNavigateToClients: () => void;
  onNavigateToComparison: () => void;
  onOpenNewClientModal: () => void;
  onViewClient?: () => void;
}

export function OverviewTab({
  clients,
  clientName,
  onNavigateToClients,
  onNavigateToComparison,
  onOpenNewClientModal,
  onViewClient,
}: OverviewTabProps) {
  const completedClients = clients.filter((c) => c.status === 'COMPLETED').length;
  const inProgressClients = clients.filter((c) => c.status === 'IN_PROGRESS').length;

  return (
    <div>
      {/* Tarjetas de Métricas Clave */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Clientes
              </span>
              <IconUsers size={18} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-2)' }}>
              {clients.length}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Diagnósticos Completados
              </span>
              <Badge variant="success">Finalizados</Badge>
            </div>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-brand)', marginTop: 'var(--space-2)' }}>
              {completedClients}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                En Progreso
              </span>
              <Badge variant="warning">Activos</Badge>
            </div>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-warning)', marginTop: 'var(--space-2)' }}>
              {inProgressClients}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Oportunidades Top
              </span>
              <IconStar size={18} filled style={{ color: 'var(--color-brand)' }} />
            </div>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-2)' }}>
              3
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Acciones Rápidas y Cliente Destacado */}
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
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Diagnóstico Reciente: {clientName}
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Extranjería y Movilidad Internacional • Completado con 3 servicios prioritarios
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {onViewClient && (
                <Button variant="secondary" size="sm" onClick={onViewClient}>
                  Ver Respuestas
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={onNavigateToComparison}>
                Ver Matriz de Oportunidad
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
              <Button variant="secondary" size="sm" onClick={onNavigateToClients}>
                <IconFileText size={14} />
                <span>Ver todos los clientes</span>
              </Button>
              <Button variant="primary" size="sm" onClick={onOpenNewClientModal}>
                <IconPlus size={14} />
                <span>Nuevo cliente</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
