import { ClientItem } from '../../../types';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { IconCopy, IconCheck, IconPlus } from '../../common/Icons';

interface ClientsTabProps {
  clients: ClientItem[];
  copiedToken: string | null;
  onCopyLink: (token: string) => void;
  onOpenNewClientModal: () => void;
}

export function ClientsTab({
  clients,
  copiedToken,
  onCopyLink,
  onOpenNewClientModal,
}: ClientsTabProps) {
  const getStatusBadge = (status: ClientItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completado</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">En progreso</Badge>;
      case 'SENT':
        return <Badge variant="neutral">Enviado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div>
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
            Gestión de Clientes ({clients.length})
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Enlaces únicos generados para cada despacho y estado de respuesta
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenNewClientModal}>
          <IconPlus size={14} />
          <span>Nuevo cliente</span>
        </Button>
      </div>

      {/* Vista Mobile (<768px) */}
      <div className="admin-card-list mobile-only">
        {clients.map((c) => (
          <div key={c.id} className="admin-service-card">
            <div className="admin-service-card-header">
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {c.name}
                </h3>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {c.sector}
                </span>
              </div>
              {getStatusBadge(c.status)}
            </div>

            <div className="admin-card-metric-grid" style={{ marginBottom: 'var(--space-3)' }}>
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Contacto</span>
                <span className="admin-card-metric-val">{c.contactName}</span>
              </div>
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Servicios</span>
                <span className="admin-card-metric-val">
                  {c.priorityServicesCount ? `${c.priorityServicesCount} prioritarios` : '—'}
                </span>
              </div>
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Fecha</span>
                <span className="admin-card-metric-val">{c.createdAt}</span>
              </div>
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Email</span>
                <span className="admin-card-metric-val" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.contactEmail}
                </span>
              </div>
            </div>

            <div style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCopyLink(c.token)}
                style={{ width: '100%' }}
              >
                {copiedToken === c.token ? (
                  <>
                    <IconCheck size={14} style={{ color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-success)' }}>¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={14} />
                    <span>Copiar enlace único</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Vista Desktop (>=768px) */}
      <div className="desktop-only">
        <div className="data-table-container">
          <table className="data-table" aria-label="Tabla de clientes">
            <thead>
              <tr>
                <th>Cliente / Despacho</th>
                <th>Sector</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Prioritarios</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Enlace de Acceso</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{c.name}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {c.sector}
                    </span>
                  </td>
                  <td>
                    <div>{c.contactName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {c.contactEmail}
                    </div>
                  </td>
                  <td>{getStatusBadge(c.status)}</td>
                  <td>
                    {c.priorityServicesCount ? (
                      <Badge variant="neutral">{c.priorityServicesCount} de {c.totalServicesCount}</Badge>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {c.createdAt}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCopyLink(c.token)}
                    >
                      {copiedToken === c.token ? (
                        <>
                          <IconCheck size={14} style={{ color: 'var(--color-success)' }} />
                          <span style={{ color: 'var(--color-success)' }}>Copiado</span>
                        </>
                      ) : (
                        <>
                          <IconCopy size={14} />
                          <span>Copiar enlace</span>
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
