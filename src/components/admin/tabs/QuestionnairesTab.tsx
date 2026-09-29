import { useState, useEffect } from 'react';
import { adminService, QuestionnaireSummary } from '../../../services/adminService';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Card, CardBody } from '../../common/Card';
import { IconArrowLeft, IconCheck, IconCopy, IconEdit, IconTrash, IconLock, IconFileText, IconStar, IconX } from '../../common/Icons';

interface QuestionnairesTabProps {
  initialFilter?: string;
  onNavigateToMatrix?: () => void;
}

export function QuestionnairesTab({
  initialFilter = 'ALL',
  onNavigateToMatrix,
}: QuestionnairesTabProps) {
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modales
  const [editingQ, setEditingQ] = useState<QuestionnaireSummary | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingQ, setDeletingQ] = useState<QuestionnaireSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  const loadList = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await adminService.getQuestionnaires();
      setQuestionnaires(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar cuestionarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setLoadingDetail(true);
    setErrorMsg(null);
    try {
      const detail = await adminService.getQuestionnaireDetail(id);
      setSelectedDetail(detail);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar detalle del cuestionario.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/q/${token}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleOpenEdit = (q: QuestionnaireSummary) => {
    setEditingQ(q);
    setEditTitle(q.title || '');
    setErrorMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQ) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await adminService.updateQuestionnaireMetadataAsync(editingQ.id, { title: editTitle });
      await loadList();
      setEditingQ(null);
      if (selectedDetail && selectedDetail.questionnaire?.id === editingQ.id) {
        setSelectedDetail({
          ...selectedDetail,
          questionnaire: { ...selectedDetail.questionnaire, title: editTitle },
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar cuestionario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (q: QuestionnaireSummary) => {
    setDeletingQ(q);
    setErrorMsg(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingQ) return;
    if (deletingQ.is_protected) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await adminService.archiveQuestionnaireAsync(deletingQ.id);
      await loadList();
      setDeletingQ(null);
      if (selectedDetail && selectedDetail.questionnaire?.id === deletingQ.id) {
        setSelectedDetail(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo archivar el cuestionario.');
    } finally {
      setIsSubmitting(false);
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

  // Filtrado de cuestionarios
  const filteredQuestionnaires = questionnaires.filter((q) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'COMPLETED') return q.status === 'COMPLETED';
    if (activeFilter === 'PENDING') return q.status === 'SENT' || q.status === 'IN_PROGRESS' || q.status === 'DRAFT';
    if (activeFilter === 'IN_PROGRESS') return q.status === 'IN_PROGRESS';
    if (activeFilter === 'SENT') return q.status === 'SENT';
    return true;
  });

  // Si hay un detalle seleccionado, mostrar la vista de detalle
  if (selectedDetail) {
    const q = selectedDetail.questionnaire;
    const services = selectedDetail.services || [];
    const audiences = selectedDetail.target_audiences || [];
    const differentials = selectedDetail.differentials || [];

    return (
      <div>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button variant="secondary" size="sm" onClick={() => setSelectedDetail(null)}>
              <IconArrowLeft size={16} />
              <span>Volver a Diagnósticos</span>
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Detalle: {q.client_name} — {q.title}
                </h2>
                {q.is_protected && (
                  <Badge variant="neutral">
                    <IconLock size={10} style={{ marginRight: '3px' }} /> Protegido
                  </Badge>
                )}
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Sector: {q.client_sector} | Estado: {getStatusBadge(q.status)} | Fecha envío: {q.submitted_at || 'Pendiente'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {onNavigateToMatrix && (
              <Button variant="primary" size="sm" onClick={onNavigateToMatrix}>
                <IconStar size={14} filled />
                <span>Matriz de Oportunidad</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenEdit({
                id: q.id,
                title: q.title,
                status: q.status,
                current_step: q.current_step,
                client_id: q.client_id,
                client_name: q.client_name,
                client_sector: q.client_sector,
                created_at: q.created_at,
                submitted_at: q.submitted_at,
                total_services_count: services.length,
                priority_services_count: services.filter((s: any) => Boolean(Number(s.is_priority))).length,
                is_protected: q.is_protected,
              })}
            >
              <IconEdit size={14} />
              <span>Editar</span>
            </Button>
          </div>
        </div>

        {/* 1. Servicios y Respuestas Relevantes / Prioritarios */}
        {(() => {
          const relevantServices = services.filter(
            (s: any) => Boolean(Number(s.is_priority)) || s.client_problem || s.solution_actions || s.pricing_model || s.profitability_score !== null
          );

          if (relevantServices.length === 0) return null;

          return (
            <Card style={{ marginBottom: 'var(--space-5)' }}>
              <CardBody>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
                  1. Servicios Prioritarios y Respuestas ({relevantServices.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {relevantServices.map((s: any, idx: number) => (
                    <div
                      key={s.id || idx}
                      style={{
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                        background: Boolean(Number(s.is_priority)) ? 'rgba(39, 176, 98, 0.04)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
                          {s.name}
                        </h4>
                        {Boolean(Number(s.is_priority)) ? (
                          <Badge variant="success">Servicio Prioritario</Badge>
                        ) : (
                          <Badge variant="neutral">Secundario</Badge>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
                        {s.client_problem && (
                          <div>
                            <strong>Problema del cliente:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.client_problem}</p>
                          </div>
                        )}
                        {s.solution_actions && (
                          <div>
                            <strong>Solución / Acciones:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.solution_actions}</p>
                          </div>
                        )}
                        {s.expected_result && (
                          <div>
                            <strong>Resultado esperado:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.expected_result}</p>
                          </div>
                        )}
                        {s.typical_duration && (
                          <div>
                            <strong>Duración habitual:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.typical_duration}</p>
                          </div>
                        )}
                        {(s.price_min || s.pricing_model) && (
                          <div>
                            <strong>Precios:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              {s.price_min && s.price_max ? `${s.price_min} - ${s.price_max} ${s.currency || 'EUR'}` : (s.pricing_model || '—')}
                              {s.price_notes ? ` (${s.price_notes})` : ''}
                            </p>
                          </div>
                        )}
                        {(s.market_position || s.estimated_market_price) && (
                          <div>
                            <strong>Mercado:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              Posición: {s.market_position || '—'} {s.estimated_market_price ? `| Est: ${s.estimated_market_price}` : ''}
                            </p>
                          </div>
                        )}
                        {s.profitability_score !== null && (
                          <div>
                            <strong>Rentabilidad:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              Score: {s.profitability_score} / 5
                              {Boolean(Number(s.profitability_is_uncertain)) ? ' (Incierto)' : ''}
                            </p>
                          </div>
                        )}
                        {s.operational_ease_score !== null && (
                          <div>
                            <strong>Facilidad operativa:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              Score: {s.operational_ease_score} / 5
                              {s.operational_notes ? ` | Notas: ${s.operational_notes}` : ''}
                            </p>
                          </div>
                        )}
                        {s.remote_capability && (
                          <div>
                            <strong>Capacidad remota:</strong>
                            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              {s.remote_capability} {s.remote_notes ? `(${s.remote_notes})` : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })()}

        {/* 2. Públicos Objetivo (Sólo si existen) */}
        {audiences.length > 0 && (
          <Card style={{ marginBottom: 'var(--space-5)' }}>
            <CardBody>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
                2. Públicos Objetivo ({audiences.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {audiences.map((aud: any, idx: number) => (
                  <Badge key={aud.id || idx} variant={aud.priority === 'high' ? 'success' : 'neutral'}>
                    {aud.custom_label || aud.audience_key} (Prioridad: {aud.priority})
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* 3. Diferenciales (Sólo si existen) */}
        {differentials.length > 0 && (
          <Card style={{ marginBottom: 'var(--space-5)' }}>
            <CardBody>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
                3. Diferenciales Competitivos ({differentials.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {differentials.map((diff: any, idx: number) => (
                  <Badge key={diff.id || idx} variant="success">
                    {diff.custom_label || diff.differential_key}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* 4. Pitch Final (Sólo si existe) */}
        {q.final_pitch && q.final_pitch.trim() !== '' && (
          <Card>
            <CardBody>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
                4. Pitch Final / Propuesta de Valor
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                {q.final_pitch}
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera y Filtros */}
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
            Diagnósticos ({filteredQuestionnaires.length})
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Listado de cuestionarios estratégicos enviados, respuestas y matrices
          </p>
        </div>

        {/* Filtros por Estado */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', backgroundColor: 'var(--color-surface-subtle)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'COMPLETED', label: 'Completados' },
            { id: 'PENDING', label: 'Pendientes' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`btn btn-xs ${activeFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 'var(--font-size-xs)', minHeight: '30px', padding: '0.25rem 0.65rem' }}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={loadList} loading={loading} title="Actualizar lista">
            <span>&#x21bb;</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
          {errorMsg}
        </div>
      )}

      {/* Tabla Desktop */}
      <div className="data-table-container">
        <table className="data-table" aria-label="Listado de cuestionarios">
          <thead>
            <tr>
              <th>Cliente / Despacho</th>
              <th>Diagnóstico</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Servicios</th>
              <th style={{ textAlign: 'right', minWidth: '320px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestionnaires.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
                  {loading ? 'Cargando diagnósticos...' : 'No hay diagnósticos que coincidan con el filtro seleccionado.'}
                </td>
              </tr>
            ) : (
              filteredQuestionnaires.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{q.client_name}</span>
                      {q.is_protected && (
                        <span
                          title="Registro protegido contra eliminación"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11px',
                            color: 'var(--color-text-tertiary)',
                            backgroundColor: 'var(--color-surface-subtle)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border-subtle)',
                          }}
                        >
                          <IconLock size={11} /> Protegido
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                      {q.client_sector}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 'var(--font-weight-normal)' }}>{q.title}</span>
                  </td>
                  <td>{getStatusBadge(q.status)}</td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {q.created_at ? q.created_at.split(' ')[0] : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>
                      {q.total_services_count || 0} ({q.priority_services_count || 0} prio)
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      {/* Botón Respuestas */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(q.id)}
                        loading={loadingDetail}
                        title="Ver respuestas del diagnóstico"
                      >
                        <IconFileText size={14} />
                        <span>Respuestas</span>
                      </Button>

                      {/* Botón Matriz de Oportunidad */}
                      {onNavigateToMatrix && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onNavigateToMatrix}
                          title="Ver matriz de oportunidad"
                        >
                          <IconStar size={14} filled />
                          <span>Matriz de Oportunidad</span>
                        </Button>
                      )}

                      {/* Botón Enlace */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopyLink(q.token_id || q.id)}
                        title="Copiar enlace de acceso"
                      >
                        {copiedToken === (q.token_id || q.id) ? (
                          <>
                            <IconCheck size={14} style={{ color: 'var(--color-success)' }} />
                            <span style={{ color: 'var(--color-success)' }}>Copiado</span>
                          </>
                        ) : (
                          <>
                            <IconCopy size={14} />
                            <span>Enlace</span>
                          </>
                        )}
                      </Button>

                      {/* Botón Editar Metadata */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(q)}
                        title="Editar título / metadata"
                      >
                        <IconEdit size={14} />
                        <span>Editar</span>
                      </Button>

                      {/* Botón Eliminar / Archivar */}
                      {!q.is_protected ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(q)}
                          title="Archivar formulario y revocar enlace"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <IconTrash size={14} />
                          <span>Eliminar</span>
                        </Button>
                      ) : (
                        <span
                          title="Registro protegido contra eliminación"
                          style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '0 4px' }}
                        >
                          —
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: EDITAR METADATA */}
      {editingQ && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setEditingQ(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Editar Diagnóstico
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingQ(null)}
                disabled={isSubmitting}
                aria-label="Cerrar modal"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="edit-q-title">Título del Diagnóstico *</label>
                <input
                  id="edit-q-title"
                  type="text"
                  required
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px', display: 'block' }}>
                  Solo se actualizará la información descriptiva del diagnóstico. Las respuestas no se alteran.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setEditingQ(null)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR ELIMINACIÓN / SOFT-DELETE */}
      {deletingQ && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setDeletingQ(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-danger)' }}>
                ¿Eliminar este formulario?
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDeletingQ(null)}
                disabled={isSubmitting}
                aria-label="Cerrar modal"
              >
                <IconX size={16} />
              </button>
            </div>

            {deletingQ.is_protected ? (
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
                <strong>Registro Protegido:</strong> Este formulario corresponde a un registro real activo y no puede ser eliminado ni archivado administrativamente.
              </div>
            ) : (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                <p>
                  Estás a punto de archivar el formulario <strong>"{deletingQ.title}"</strong> de <strong>{deletingQ.client_name}</strong>.
                </p>
                <p style={{ marginTop: 'var(--space-2)' }}>
                  Esta acción quitará el formulario de las vistas activas y <strong>revocará de forma inmediata su enlace de acceso público</strong> para impedir nuevos envíos.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button variant="secondary" size="sm" onClick={() => setDeletingQ(null)} disabled={isSubmitting}>
                Cancelar
              </Button>
              {!deletingQ.is_protected && (
                <Button variant="primary" size="sm" onClick={handleConfirmDelete} loading={isSubmitting} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                  Eliminar formulario
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
