import React, { useState, useEffect } from 'react';
import { StrategicPlan, ClientItem, StrategicPlanItem } from '../../../types';
import { adminService } from '../../../services/adminService';
import { Card, CardBody, CardHeader } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { IconPlus, IconEdit, IconTrash, IconFileText, IconArrowLeft, IconCheck, IconX } from '../../common/Icons';

export function PlansTab() {
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<StrategicPlan | null>(null);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StrategicPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<StrategicPlan | null>(null);

  // Form State
  const [formClientId, setFormClientId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'FINAL'>('DRAFT');
  const [formGeneralDiag, setFormGeneralDiag] = useState('');
  const [formGeneralActions, setFormGeneralActions] = useState('');
  const [formItems, setFormItems] = useState<Array<{
    service_name: string;
    diagnosis: string;
    actions: string;
  }>>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [plansList, clientsList] = await Promise.all([
        adminService.getStrategicPlansAsync(),
        adminService.fetchClients(),
      ]);
      setPlans(plansList);
      setClients(clientsList);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar planes estratégicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setEditingPlan(null);
    setFormClientId(clients.length > 0 ? clients[0].id : '');
    setFormTitle('Plan Estratégico de Crecimiento');
    setFormStatus('DRAFT');
    setFormGeneralDiag('');
    setFormGeneralActions('');
    setFormItems([
      { service_name: 'Servicio Prioritario 1', diagnosis: '', actions: '' },
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = async (plan: StrategicPlan) => {
    try {
      setLoading(true);
      const detail = await adminService.getStrategicPlanDetailAsync(plan.id);
      setEditingPlan(detail);
      setFormClientId(detail.client_id);
      setFormTitle(detail.title);
      setFormStatus(detail.status);
      setFormGeneralDiag(detail.general_diagnosis || '');

      let genActStr = '';
      if (typeof detail.general_actions === 'string') {
        try {
          const parsed = JSON.parse(detail.general_actions);
          genActStr = Array.isArray(parsed) ? parsed.join('\n') : detail.general_actions;
        } catch {
          genActStr = detail.general_actions;
        }
      } else if (Array.isArray(detail.general_actions)) {
        genActStr = detail.general_actions.join('\n');
      }
      setFormGeneralActions(genActStr);

      if (detail.items && detail.items.length > 0) {
        setFormItems(
          detail.items.map((it: StrategicPlanItem) => {
            let actStr = '';
            if (typeof it.actions === 'string') {
              try {
                const p = JSON.parse(it.actions);
                actStr = Array.isArray(p) ? p.join('\n') : it.actions;
              } catch {
                actStr = it.actions;
              }
            } else if (Array.isArray(it.actions)) {
              actStr = it.actions.join('\n');
            }
            return {
              service_name: it.service_name,
              diagnosis: it.diagnosis || '',
              actions: actStr,
            };
          })
        );
      } else {
        setFormItems([]);
      }

      setShowModal(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar detalle del plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (plan: StrategicPlan) => {
    try {
      setLoading(true);
      const detail = await adminService.getStrategicPlanDetailAsync(plan.id);
      setSelectedPlanDetail(detail);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar detalle.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormItems([...formItems, { service_name: '', diagnosis: '', actions: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, val: string) => {
    setFormItems(
      formItems.map((it, i) => (i === index ? { ...it, [field]: val } : it))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const actionsArray = formGeneralActions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const itemsPayload = formItems
        .filter((it) => it.service_name.trim())
        .map((it, idx) => ({
          service_name: it.service_name.trim(),
          diagnosis: it.diagnosis.trim(),
          actions: it.actions.split('\n').map((s) => s.trim()).filter(Boolean),
          display_order: idx + 1,
        }));

      const payload = {
        client_id: formClientId,
        title: formTitle.trim(),
        status: formStatus,
        general_diagnosis: formGeneralDiag.trim(),
        general_actions: actionsArray,
        items: itemsPayload,
      };

      if (editingPlan) {
        await adminService.updateStrategicPlanAsync(editingPlan.id, payload);
        setSuccessMsg('Plan estratégico actualizado correctamente.');
      } else {
        await adminService.createStrategicPlanAsync(payload);
        setSuccessMsg('Plan estratégico creado exitosamente.');
      }

      setShowModal(false);
      await loadData();
      if (selectedPlanDetail && editingPlan && selectedPlanDetail.id === editingPlan.id) {
        const refreshed = await adminService.getStrategicPlanDetailAsync(editingPlan.id);
        setSelectedPlanDetail(refreshed);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar el plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await adminService.archiveStrategicPlanAsync(deletingPlan.id);
      setSuccessMsg('Plan estratégico archivado.');
      setDeletingPlan(null);
      if (selectedPlanDetail && selectedPlanDetail.id === deletingPlan.id) {
        setSelectedPlanDetail(null);
      }
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo archivar el plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // VISTA DETALLE DEL PLAN
  if (selectedPlanDetail) {
    const p = selectedPlanDetail;
    const items = p.items || [];

    let genActions: string[] = [];
    if (typeof p.general_actions === 'string') {
      try {
        genActions = JSON.parse(p.general_actions);
      } catch {
        genActions = [p.general_actions];
      }
    } else if (Array.isArray(p.general_actions)) {
      genActions = p.general_actions;
    }

    return (
      <div>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button variant="secondary" size="sm" onClick={() => setSelectedPlanDetail(null)}>
              <IconArrowLeft size={16} />
              <span>Volver a Planes</span>
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {p.title}
                </h2>
                <Badge variant={p.status === 'FINAL' ? 'success' : 'neutral'}>
                  {p.status === 'FINAL' ? 'Plan Final' : 'Borrador'}
                </Badge>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Cliente: <strong>{p.client_name}</strong> {p.client_sector ? `(${p.client_sector})` : ''} • Fecha: {p.created_at ? p.created_at.split(' ')[0] : ''}
              </p>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={() => handleOpenEdit(p)}>
            <IconEdit size={14} />
            <span>Editar Plan</span>
          </Button>
        </div>

        {/* Sección General */}
        <Card style={{ marginBottom: 'var(--space-5)' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              1. Diagnóstico General del Proyecto
            </h3>
          </CardHeader>
          <CardBody>
            {p.general_diagnosis ? (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {p.general_diagnosis}
              </p>
            ) : (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                Sin diagnóstico general especificado.
              </p>
            )}

            {genActions.length > 0 && (
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-3)' }}>
                <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 'var(--space-2)' }}>
                  Acciones Estratégicas Globales:
                </h4>
                <ul style={{ paddingLeft: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {genActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Secciones por Servicio Prioritario */}
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              2. Estrategia por Servicio Prioritario ({items.length})
            </h3>
          </CardHeader>
          <CardBody>
            {items.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                No se han definido secciones específicas por servicio prioritario.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {items.map((item, idx) => {
                  let srvActions: string[] = [];
                  if (typeof item.actions === 'string') {
                    try {
                      srvActions = JSON.parse(item.actions);
                    } catch {
                      srvActions = [item.actions];
                    }
                  } else if (Array.isArray(item.actions)) {
                    srvActions = item.actions;
                  }

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-surface-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                          #{idx + 1} — {item.service_name}
                        </h4>
                      </div>

                      {item.diagnosis && (
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                            Diagnóstico del servicio:
                          </span>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {item.diagnosis}
                          </p>
                        </div>
                      )}

                      {srvActions.length > 0 && (
                        <div style={{ marginTop: 'var(--space-2)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-brand)', textTransform: 'uppercase' }}>
                            Acciones concretas:
                          </span>
                          <ul style={{ paddingLeft: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {srvActions.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  // VISTA LISTADO DE PLANES
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Planes Estratégicos Comerciales
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Estructuración táctica de diagnóstico y líneas de acción por cliente y servicios prioritarios.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenNew}>
          <IconPlus size={14} />
          <span>Nuevo Plan Estratégico</span>
        </Button>
      </div>

      {errorMsg && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
          {successMsg}
        </div>
      )}

      <Card>
        <CardBody style={{ padding: 0 }}>
          {plans.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
              {loading ? 'Cargando planes...' : 'No hay planes estratégicos registrados. Pulse "Nuevo Plan Estratégico" para comenzar.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Título del Plan</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Servicios</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                      <span
                        onClick={() => handleOpenDetail(p)}
                        style={{ color: 'var(--color-brand)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {p.title}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {p.client_name || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge variant={p.status === 'FINAL' ? 'success' : 'neutral'}>
                        {p.status === 'FINAL' ? 'Final' : 'Borrador'}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {p.items_count || 0} secciones
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-tertiary)' }}>
                      {p.created_at ? p.created_at.split(' ')[0] : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto' }}
                          title="Ver detalle"
                          onClick={() => handleOpenDetail(p)}
                        >
                          <IconFileText size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto' }}
                          title="Editar plan"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto', color: 'var(--color-danger)' }}
                          title="Archivar plan"
                          onClick={() => setDeletingPlan(p)}
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Modal Crear / Editar Plan */}
      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPlan ? 'Editar Plan Estratégico' : 'Nuevo Plan Estratégico'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label" htmlFor="p-client">Cliente *</label>
                    <select
                      id="p-client"
                      className="form-input"
                      required
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.sector})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="p-status">Estado del Plan</label>
                    <select
                      id="p-status"
                      className="form-input"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'DRAFT' | 'FINAL')}
                    >
                      <option value="DRAFT">Borrador (DRAFT)</option>
                      <option value="FINAL">Plan Final (FINAL)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="p-title">Título del Plan *</label>
                  <input
                    id="p-title"
                    type="text"
                    className="form-input"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. Plan Estratégico de Captación Legal 2026"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="p-diag">Diagnóstico General del Proyecto</label>
                  <textarea
                    id="p-diag"
                    className="form-input"
                    rows={3}
                    value={formGeneralDiag}
                    onChange={(e) => setFormGeneralDiag(e.target.value)}
                    placeholder="Situación actual, oportunidades de mercado y cuello de botella operativo..."
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="p-act">Acciones Estratégicas Globales (una por línea)</label>
                  <textarea
                    id="p-act"
                    className="form-input"
                    rows={2}
                    value={formGeneralActions}
                    onChange={(e) => setFormGeneralActions(e.target.value)}
                    placeholder="Acción 1: Reestructurar tarifas...&#10;Acción 2: Digitalizar captación..."
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                      Estrategia por Servicio Prioritario ({formItems.length})
                    </h4>
                    <Button variant="secondary" size="sm" type="button" onClick={handleAddItem}>
                      <IconPlus size={12} />
                      <span>Añadir Servicio</span>
                    </Button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {formItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-3)',
                          backgroundColor: 'var(--color-surface-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600 }}>Servicio #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '2px 4px', minHeight: 'auto', color: 'var(--color-danger)' }}
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ marginBottom: 'var(--space-2)' }}
                          placeholder="Nombre del servicio (ej. Visados y Residencia)"
                          value={item.service_name}
                          onChange={(e) => handleUpdateItem(idx, 'service_name', e.target.value)}
                          required
                        />
                        <textarea
                          className="form-input"
                          rows={2}
                          style={{ marginBottom: 'var(--space-2)' }}
                          placeholder="Diagnóstico específico del servicio..."
                          value={item.diagnosis}
                          onChange={(e) => handleUpdateItem(idx, 'diagnosis', e.target.value)}
                        />
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Acciones específicas (una por línea)..."
                          value={item.actions}
                          onChange={(e) => handleUpdateItem(idx, 'actions', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Borrado */}
      {deletingPlan && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirmar Eliminación</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeletingPlan(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                ¿Está seguro de archivar el plan estratégico <strong>{deletingPlan.title}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setDeletingPlan(null)}>
                Cancelar
              </Button>
              <Button variant="danger-ghost" size="sm" onClick={handleConfirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Archivando...' : 'Archivar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
