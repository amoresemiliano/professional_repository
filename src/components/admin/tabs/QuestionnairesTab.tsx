import { useState, useEffect } from 'react';
import { adminService, QuestionnaireSummary } from '../../../services/adminService';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Card, CardBody } from '../../common/Card';
import { IconArrowLeft } from '../../common/Icons';

export function QuestionnairesTab() {
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await adminService.getQuestionnaires();
      setQuestionnaires(data);
    } catch (err) {
      console.error('Error cargando cuestionarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await adminService.getQuestionnaireDetail(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Error cargando detalle de cuestionario:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completado</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">En progreso</Badge>;
      case 'SENT':
        return <Badge variant="neutral">Enviado</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">Borrador</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Si hay un detalle seleccionado, mostrar la vista de detalle
  if (selectedDetail) {
    const q = selectedDetail.questionnaire;
    const services = selectedDetail.services || [];
    const audiences = selectedDetail.target_audiences || [];
    const differentials = selectedDetail.differentials || [];

    return (
      <div>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button variant="secondary" size="sm" onClick={() => setSelectedDetail(null)}>
            <IconArrowLeft size={16} />
            <span>Volver al listado</span>
          </Button>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              Detalle: {q.client_name} — {q.title}
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Sector: {q.client_sector} | Estado: {getStatusBadge(q.status)} | Fecha envío: {q.submitted_at || 'Pendiente'}
            </p>
          </div>
        </div>

        {/* 1. Servicios y Respuestas */}
        <Card style={{ marginBottom: 'var(--space-5)' }}>
          <CardBody>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              1. Servicios Analizados ({services.length})
            </h3>
            {services.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>No se registraron servicios aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {services.map((s: any, idx: number) => (
                  <div
                    key={s.id || idx}
                    style={{
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      background: Boolean(Number(s.is_priority)) ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
                        {s.name}
                      </h4>
                      {Boolean(Number(s.is_priority)) ? (
                        <Badge variant="priority">Servicio Prioritario</Badge>
                      ) : (
                        <Badge variant="neutral">Secundario</Badge>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
                      <div>
                        <strong>Problema del cliente:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.client_problem || '—'}</p>
                      </div>
                      <div>
                        <strong>Solución / Acciones:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.solution_actions || '—'}</p>
                      </div>
                      <div>
                        <strong>Resultado esperado:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.expected_result || '—'}</p>
                      </div>
                      <div>
                        <strong>Duración habitual:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.typical_duration || '—'}</p>
                      </div>
                      <div>
                        <strong>Precios:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {s.price_min && s.price_max ? `${s.price_min} - ${s.price_max} ${s.currency || 'EUR'}` : (s.pricing_model || '—')}
                          {s.price_notes ? ` (${s.price_notes})` : ''}
                        </p>
                      </div>
                      <div>
                        <strong>Mercado:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Posición: {s.market_position || '—'} {s.estimated_market_price ? `| Est: ${s.estimated_market_price}` : ''}
                        </p>
                      </div>
                      <div>
                        <strong>Rentabilidad:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Score: {s.profitability_score !== null ? `${s.profitability_score} / 5` : '—'}
                          {Boolean(Number(s.profitability_is_uncertain)) ? ' (Incierto)' : ''}
                        </p>
                      </div>
                      <div>
                        <strong>Facilidad operativa:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Score: {s.operational_ease_score !== null ? `${s.operational_ease_score} / 5` : '—'}
                          {s.operational_notes ? ` | Notas: ${s.operational_notes}` : ''}
                        </p>
                      </div>
                      <div>
                        <strong>Capacidad remota:</strong>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {s.remote_capability || '—'} {s.remote_notes ? `(${s.remote_notes})` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 2. Públicos Objetivo */}
        <Card style={{ marginBottom: 'var(--space-5)' }}>
          <CardBody>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              2. Públicos Objetivo ({audiences.length})
            </h3>
            {audiences.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>No se registraron públicos objetivo.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {audiences.map((aud: any, idx: number) => (
                  <Badge key={aud.id || idx} variant={aud.priority === 'high' ? 'priority' : 'neutral'}>
                    {aud.custom_label || aud.audience_key} (Prioridad: {aud.priority})
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 3. Diferenciales */}
        <Card style={{ marginBottom: 'var(--space-5)' }}>
          <CardBody>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              3. Diferenciales Competitivos ({differentials.length})
            </h3>
            {differentials.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>No se registraron diferenciales.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {differentials.map((diff: any, idx: number) => (
                  <Badge key={diff.id || idx} variant="success">
                    {diff.custom_label || diff.differential_key}
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 4. Pitch Final */}
        <Card>
          <CardBody>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              4. Pitch Final / Propuesta de Valor
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
              {q.final_pitch || 'Sin pitch final registrado.'}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

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
            Cuestionarios y Respuestas ({questionnaires.length})
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Listado de cuestionarios enviados y respuestas recibidas por cliente
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadList} loading={loading}>
          <span>Actualizar</span>
        </Button>
      </div>

      <div className="data-table-container">
        <table className="data-table" aria-label="Listado de cuestionarios">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Cuestionario</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Servicios</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {questionnaires.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
                  {loading ? 'Cargando cuestionarios...' : 'No hay cuestionarios registrados.'}
                </td>
              </tr>
            ) : (
              questionnaires.map((q) => (
                <tr key={q.id}>
                  <td>
                    <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{q.client_name}</span>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {q.client_sector}
                    </div>
                  </td>
                  <td>{q.title}</td>
                  <td>{getStatusBadge(q.status)}</td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {q.created_at ? q.created_at.split(' ')[0] : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>
                      {q.total_services_count || 0} servicios ({q.priority_services_count || 0} prio)
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenDetail(q.id)}
                      loading={loadingDetail}
                    >
                      <span>Ver</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
