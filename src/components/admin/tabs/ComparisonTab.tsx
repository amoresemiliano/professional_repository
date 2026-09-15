import { ComparisonServiceRow } from '../../../services/adminService';
import { Badge } from '../../common/Badge';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { IconStar } from '../../common/Icons';

interface ComparisonTabProps {
  services: ComparisonServiceRow[];
  clientName: string;
}

export function ComparisonTab({ services, clientName }: ComparisonTabProps) {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
          Comparativa de Servicios — {clientName}
        </h2>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Análisis multidimensional de rentabilidad, predictibilidad operativa, escalabilidad remota y scoring ponderado
        </p>
      </div>

      {/* Vista para Pantallas Pequeñas (Mobile Cards < 768px) */}
      <div className="admin-card-list mobile-only">
        {services.map((svc) => (
          <div key={svc.name} className="admin-service-card">
            <div className="admin-service-card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {svc.isPriority && (
                    <IconStar size={14} filled style={{ color: 'var(--color-warning)' }} />
                  )}
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    {svc.name}
                  </h3>
                </div>
                {svc.isPriority && (
                  <Badge variant="priority" style={{ marginTop: 'var(--space-1)' }}>
                    Prioritario
                  </Badge>
                )}
              </div>
              <Badge
                variant={svc.score >= 85 ? 'success' : svc.score >= 70 ? 'brand' : 'neutral'}
                style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}
              >
                {svc.score} pts
              </Badge>
            </div>

            <div className="admin-card-metric-grid">
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Honorarios</span>
                <span className="admin-card-metric-val">{svc.price}</span>
              </div>
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Posición Mercado</span>
                <span className="admin-card-metric-val">{svc.market}</span>
              </div>
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Rentabilidad</span>
                <span className="admin-card-metric-val">{svc.profitability}</span>
              </div>
              <div className="admin-card-metric-item">
                <span className="admin-card-metric-label">Facilidad Operativa</span>
                <span className="admin-card-metric-val">{svc.ease}</span>
              </div>
              <div className="admin-card-metric-item" style={{ gridColumn: 'span 2' }}>
                <span className="admin-card-metric-label">Capacidad Remota</span>
                <span className="admin-card-metric-val">{svc.remote}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vista para Tablet & Desktop (Tabla Semántica >= 768px) */}
      <div className="desktop-only">
        <div className="data-table-container">
          <table className="data-table" aria-label="Tabla comparativa de servicios">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Honorarios</th>
                <th>Posición Mercado</th>
                <th>Rentabilidad</th>
                <th>Facilidad</th>
                <th>Modalidad</th>
                <th style={{ textAlign: 'right' }}>Opportunity Score</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {svc.isPriority && (
                        <IconStar size={14} filled style={{ color: 'var(--color-warning)' }} />
                      )}
                      <span style={{ fontWeight: svc.isPriority ? 'var(--font-weight-semibold)' : 'normal' }}>
                        {svc.name}
                      </span>
                    </div>
                  </td>
                  <td>{svc.price}</td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {svc.market}
                    </span>
                  </td>
                  <td>{svc.profitability}</td>
                  <td>{svc.ease}</td>
                  <td>
                    <Badge variant={svc.remote.includes('100%') ? 'brand' : 'neutral'}>
                      {svc.remote}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Badge
                      variant={svc.score >= 85 ? 'success' : svc.score >= 70 ? 'brand' : 'neutral'}
                      style={{ fontWeight: 'bold' }}
                    >
                      {svc.score} / 100
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota Explicativa */}
      <Card style={{ marginTop: 'var(--space-6)' }}>
        <CardHeader>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
            Interpretación del Opportunity Score
          </h3>
        </CardHeader>
        <CardBody>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
            El Opportunity Score sintetiza en una escala de 0 a 100 el atractivo comercial de cada servicio. Servicios con más de 80 puntos son ideales para estructurar ofertas de entrada (lead magnets y landing pages enfocadas), mientras que aquellos con puntuaciones intermedias se benefician de optimización de procesos antes de escalar campañas de captación masiva.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
