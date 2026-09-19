import React, { useState, useEffect } from 'react';
import { Quote, ClientItem, VegenService, QuoteItem } from '../../../types';
import { adminService } from '../../../services/adminService';
import { Card, CardBody, CardHeader } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { IconPlus, IconEdit, IconTrash, IconFileText, IconArrowLeft, IconCheck, IconX, IconStar } from '../../common/Icons';

export function QuotesTab() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [vegenServices, setVegenServices] = useState<VegenService[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<Quote | null>(null);

  // Modales
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showVegenCatalogModal, setShowVegenCatalogModal] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del Formulario de Presupuesto
  const [formClientId, setFormClientId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'PRESENTED' | 'ACCEPTED' | 'REJECTED'>('DRAFT');
  const [formDiscountType, setFormDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(0);
  const [formShowDiscount, setFormShowDiscount] = useState<boolean>(true);
  const [formShowItemPrices, setFormShowItemPrices] = useState<boolean>(false);
  const [formNotes, setFormNotes] = useState('');

  // Ítems seleccionables
  const [formItems, setFormItems] = useState<Array<{
    service_id?: string;
    service_name: string;
    description: string;
    base_price: number;
    final_price: number;
    is_selected: boolean;
  }>>([]);

  // Estado para gestión de catálogo Vegen
  const [editingVegenSrv, setEditingVegenSrv] = useState<VegenService | null>(null);
  const [vegenSrvForm, setVegenSrvForm] = useState({ name: '', description: '', base_price: 0, is_active: true });

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [quotesList, clientsList, vServices] = await Promise.all([
        adminService.getQuotesAsync(),
        adminService.fetchClients(),
        adminService.getVegenServicesAsync(),
      ]);
      setQuotes(quotesList);
      setClients(clientsList);
      setVegenServices(vServices);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar presupuestos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abrir Nuevo Presupuesto
  const handleOpenNew = () => {
    setEditingQuote(null);
    setFormClientId(clients.length > 0 ? clients[0].id : '');
    setFormTitle('Propuesta Comercial y Presupuesto Vegen');
    setFormStatus('DRAFT');
    setFormDiscountType('PERCENTAGE');
    setFormDiscountValue(0);
    setFormShowDiscount(true);
    setFormShowItemPrices(false);
    setFormNotes('');

    // Pre-cargar items del catálogo de Vegen
    setFormItems(
      vegenServices.map((vs) => ({
        service_id: vs.id,
        service_name: vs.name,
        description: vs.description || '',
        base_price: Number(vs.base_price),
        final_price: Number(vs.base_price),
        is_selected: true,
      }))
    );
    setShowQuoteModal(true);
  };

  // Abrir Edición Presupuesto
  const handleOpenEdit = async (quote: Quote) => {
    try {
      setLoading(true);
      const detail = await adminService.getQuoteDetailAsync(quote.id);
      setEditingQuote(detail);
      setFormClientId(detail.client_id);
      setFormTitle(detail.title);
      setFormStatus(detail.status);
      setFormDiscountType(detail.discount_type);
      setFormDiscountValue(Number(detail.discount_value));
      setFormShowDiscount(Boolean(Number(detail.show_discount)));
      setFormShowItemPrices(Boolean(Number(detail.show_item_prices)));
      setFormNotes(detail.notes || '');

      if (detail.items && detail.items.length > 0) {
        setFormItems(
          detail.items.map((it: QuoteItem) => ({
            service_id: it.service_id || undefined,
            service_name: it.service_name,
            description: it.description || '',
            base_price: Number(it.base_price),
            final_price: Number(it.final_price),
            is_selected: Boolean(Number(it.is_selected)),
          }))
        );
      } else {
        setFormItems([]);
      }

      setShowQuoteModal(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar detalle del presupuesto.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (quote: Quote) => {
    try {
      setLoading(true);
      const detail = await adminService.getQuoteDetailAsync(quote.id);
      setSelectedQuoteDetail(detail);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar detalle.');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos reactivos en formulario
  const computedSubtotal = formItems.reduce((acc, it) => {
    return it.is_selected ? acc + Number(it.final_price || 0) : acc;
  }, 0);

  const computedDiscountAmount =
    formDiscountType === 'PERCENTAGE'
      ? Math.round(computedSubtotal * (Number(formDiscountValue || 0) / 100) * 100) / 100
      : Math.min(computedSubtotal, Number(formDiscountValue || 0));

  const computedTotal = Math.max(0, computedSubtotal - computedDiscountAmount);

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const itemsPayload = formItems.map((it, idx) => ({
        service_id: it.service_id,
        service_name: it.service_name,
        description: it.description,
        base_price: Number(it.base_price),
        final_price: Number(it.final_price),
        is_selected: it.is_selected ? 1 : 0,
        display_order: idx + 1,
      }));

      const payload = {
        client_id: formClientId,
        title: formTitle.trim(),
        status: formStatus,
        discount_type: formDiscountType,
        discount_value: Number(formDiscountValue),
        show_discount: formShowDiscount ? 1 : 0,
        show_item_prices: formShowItemPrices ? 1 : 0,
        notes: formNotes.trim(),
        items: itemsPayload,
      };

      if (editingQuote) {
        await adminService.updateQuoteAsync(editingQuote.id, payload);
        setSuccessMsg('Presupuesto actualizado correctamente.');
      } else {
        await adminService.createQuoteAsync(payload);
        setSuccessMsg('Presupuesto creado exitosamente.');
      }

      setShowQuoteModal(false);
      await loadData();
      if (selectedQuoteDetail && editingQuote && selectedQuoteDetail.id === editingQuote.id) {
        const refreshed = await adminService.getQuoteDetailAsync(editingQuote.id);
        setSelectedQuoteDetail(refreshed);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuote) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await adminService.archiveQuoteAsync(deletingQuote.id);
      setSuccessMsg('Presupuesto archivado.');
      setDeletingQuote(null);
      if (selectedQuoteDetail && selectedQuoteDetail.id === deletingQuote.id) {
        setSelectedQuoteDetail(null);
      }
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo archivar el presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestión de catálogo Vegen
  const handleSaveVegenService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vegenSrvForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingVegenSrv) {
        await adminService.updateVegenServiceAsync(editingVegenSrv.id, vegenSrvForm);
        setSuccessMsg('Servicio Vegen actualizado.');
      } else {
        await adminService.createVegenServiceAsync(vegenSrvForm);
        setSuccessMsg('Servicio Vegen añadido al catálogo.');
      }
      setEditingVegenSrv(null);
      setVegenSrvForm({ name: '', description: '', base_price: 0, is_active: true });
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="success">Aceptado</Badge>;
      case 'PRESENTED':
        return <Badge variant="brand">Presentado</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rechazado</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="neutral">Borrador</Badge>;
    }
  };

  // VISTA DETALLE DEL PRESUPUESTO
  if (selectedQuoteDetail) {
    const q = selectedQuoteDetail;
    const selectedItems = (q.items || []).filter((it) => Boolean(Number(it.is_selected)));

    return (
      <div>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button variant="secondary" size="sm" onClick={() => setSelectedQuoteDetail(null)}>
              <IconArrowLeft size={16} />
              <span>Volver a Presupuestos</span>
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {q.title}
                </h2>
                {getStatusBadge(q.status)}
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Cliente: <strong>{q.client_name}</strong> • Fecha: {q.created_at ? q.created_at.split(' ')[0] : ''}
              </p>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={() => handleOpenEdit(q)}>
            <IconEdit size={14} />
            <span>Editar Presupuesto</span>
          </Button>
        </div>

        {/* Desglose de Servicios y Liquidación Comercial */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(260px, 1fr)', gap: 'var(--space-5)', alignItems: 'start' }}>
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                Servicios Incluidos en la Propuesta ({selectedItems.length})
              </h3>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                        {item.service_name}
                      </span>
                      {item.description && (
                        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {Boolean(Number(q.show_item_prices)) && (
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {Number(item.final_price).toFixed(2)} €
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Resumen Económico */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                Liquidación Económica
              </h3>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                  <span>Subtotal bruto:</span>
                  <span>{Number(q.subtotal).toFixed(2)} €</span>
                </div>

                {Boolean(Number(q.show_discount)) && Number(q.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-brand)' }}>
                    <span>
                      Bonificación ({q.discount_type === 'PERCENTAGE' ? `${q.discount_value}%` : 'Fija'}):
                    </span>
                    <span>- {Number(q.discount_amount).toFixed(2)} €</span>
                  </div>
                )}

                <div
                  style={{
                    borderTop: '2px solid var(--color-border)',
                    paddingTop: 'var(--space-3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                    TOTAL PROPUESTA:
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-brand)' }}>
                    {Number(q.total).toFixed(2)} €
                  </span>
                </div>

                {q.notes && (
                  <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                      Condiciones comerciales:
                    </span>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {q.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // VISTA LISTADO DE PRESUPUESTOS
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Presupuestos y Propuestas Comerciales
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Generación y liquidación económica de servicios de consultoría y acompañamiento estratégico de Vegen.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" size="sm" onClick={() => setShowVegenCatalogModal(true)}>
            <IconStar size={14} />
            <span>Catálogo Vegen ({vegenServices.length})</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenNew}>
            <IconPlus size={14} />
            <span>Nuevo Presupuesto</span>
          </Button>
        </div>
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
          {quotes.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
              {loading ? 'Cargando presupuestos...' : 'No hay presupuestos registrados. Pulse "Nuevo Presupuesto" para confeccionar una propuesta.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-subtle)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Propuesta</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Servicios</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                      <span
                        onClick={() => handleOpenDetail(q)}
                        style={{ color: 'var(--color-brand)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {q.title}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {q.client_name || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {getStatusBadge(q.status)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {q.items_count || 0} incluidos
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {Number(q.total).toFixed(2)} €
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-tertiary)' }}>
                      {q.created_at ? q.created_at.split(' ')[0] : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto' }}
                          title="Ver detalle"
                          onClick={() => handleOpenDetail(q)}
                        >
                          <IconFileText size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto' }}
                          title="Editar presupuesto"
                          onClick={() => handleOpenEdit(q)}
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto', color: 'var(--color-danger)' }}
                          title="Archivar presupuesto"
                          onClick={() => setDeletingQuote(q)}
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

      {/* Modal Crear / Editar Presupuesto */}
      {showQuoteModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingQuote ? 'Editar Presupuesto' : 'Nuevo Presupuesto Comercial'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowQuoteModal(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveQuote}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label" htmlFor="q-client">Cliente destinatario *</label>
                    <select
                      id="q-client"
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
                    <label className="form-label" htmlFor="q-status">Estado</label>
                    <select
                      id="q-status"
                      className="form-input"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                    >
                      <option value="DRAFT">Borrador</option>
                      <option value="PRESENTED">Presentado</option>
                      <option value="ACCEPTED">Aceptado</option>
                      <option value="REJECTED">Rechazado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="q-title">Título de la propuesta *</label>
                  <input
                    id="q-title"
                    type="text"
                    className="form-input"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. Propuesta Comercial de Acompañamiento Estratégico"
                  />
                </div>

                {/* Selección de Servicios con Checkbox y Override de Precio */}
                <div>
                  <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>
                    Servicios Ofertables (Selección y Override de Tarifa)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {formItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-2) var(--space-3)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: item.is_selected ? 'rgba(39, 176, 98, 0.04)' : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1 }}>
                          <input
                            type="checkbox"
                            id={`qi-${idx}`}
                            checked={item.is_selected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormItems(formItems.map((it, i) => (i === idx ? { ...it, is_selected: checked } : it)));
                            }}
                          />
                          <label htmlFor={`qi-${idx}`} style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer', fontWeight: 500 }}>
                            {item.service_name}
                          </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                            Base: {item.base_price} € &rarr;
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              className="form-input"
                              style={{ width: '100px', padding: '0.2rem 0.4rem', fontSize: 'var(--font-size-xs)', textAlign: 'right' }}
                              value={item.final_price}
                              disabled={!item.is_selected}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setFormItems(formItems.map((it, i) => (i === idx ? { ...it, final_price: val } : it)));
                              }}
                            />
                            <span style={{ fontSize: 'var(--font-size-xs)' }}>€</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonificación y Descuentos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label" htmlFor="q-disctype">Tipo de Bonificación</label>
                    <select
                      id="q-disctype"
                      className="form-input"
                      value={formDiscountType}
                      onChange={(e) => setFormDiscountType(e.target.value as any)}
                    >
                      <option value="PERCENTAGE">Porcentaje (%)</option>
                      <option value="FIXED">Importe Fijo (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="q-discval">
                      Valor del Descuento ({formDiscountType === 'PERCENTAGE' ? '%' : '€'})
                    </label>
                    <input
                      id="q-discval"
                      type="number"
                      step="0.01"
                      min={0}
                      className="form-input"
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Visualización Interna del Cálculo */}
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal servicios seleccionados:</span>
                    <strong>{computedSubtotal.toFixed(2)} €</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-brand)' }}>
                    <span>Bonificación calculada:</span>
                    <strong>- {computedDiscountAmount.toFixed(2)} €</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '4px', marginTop: '2px' }}>
                    <span style={{ fontWeight: 600 }}>Total neto:</span>
                    <strong style={{ color: 'var(--color-brand)', fontSize: 'var(--font-size-base)' }}>{computedTotal.toFixed(2)} €</strong>
                  </div>
                </div>

                {/* Toggles de Visibilidad en PDF/Propuesta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      id="q-showdisc"
                      checked={formShowDiscount}
                      onChange={(e) => setFormShowDiscount(e.target.checked)}
                    />
                    <label htmlFor="q-showdisc" style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                      Mostrar bonificación al cliente en la propuesta comercial
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      id="q-showitemp"
                      checked={formShowItemPrices}
                      onChange={(e) => setFormShowItemPrices(e.target.checked)}
                    />
                    <label htmlFor="q-showitemp" style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                      Mostrar precios desglosados individualmente por servicio (por defecto sólo total final)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="q-notes">Notas y Condiciones de Pago</label>
                  <textarea
                    id="q-notes"
                    className="form-input"
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Forma de pago: 50% al inicio, 50% a la entrega..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowQuoteModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Presupuesto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Catálogo de Servicios Propios Vegen */}
      {showVegenCatalogModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Catálogo de Servicios Vegen Digital</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowVegenCatalogModal(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Formulario rápido para añadir/editar servicio */}
              <form onSubmit={handleSaveVegenService} style={{ backgroundColor: 'var(--color-surface-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  {editingVegenSrv ? 'Editar Servicio Vegen' : 'Añadir Nuevo Servicio a Catálogo'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre del servicio..."
                    required
                    value={vegenSrvForm.name}
                    onChange={(e) => setVegenSrvForm({ ...vegenSrvForm, name: e.target.value })}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="form-input"
                    placeholder="Precio base (€)"
                    required
                    value={vegenSrvForm.base_price}
                    onChange={(e) => setVegenSrvForm({ ...vegenSrvForm, base_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Descripción del alcance..."
                  style={{ marginBottom: 'var(--space-2)' }}
                  value={vegenSrvForm.description}
                  onChange={(e) => setVegenSrvForm({ ...vegenSrvForm, description: e.target.value })}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  {editingVegenSrv && (
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setEditingVegenSrv(null);
                        setVegenSrvForm({ name: '', description: '', base_price: 0, is_active: true });
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                    {editingVegenSrv ? 'Actualizar' : 'Añadir Servicio'}
                  </Button>
                </div>
              </form>

              {/* Lista actual */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {vegenServices.map((vs) => (
                  <div
                    key={vs.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-2) var(--space-3)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{vs.name}</span>
                        <Badge variant="brand">{Number(vs.base_price).toFixed(2)} €</Badge>
                      </div>
                      {vs.description && (
                        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {vs.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '2px 4px', minHeight: 'auto' }}
                        onClick={() => {
                          setEditingVegenSrv(vs);
                          setVegenSrvForm({
                            name: vs.name,
                            description: vs.description || '',
                            base_price: Number(vs.base_price),
                            is_active: Boolean(Number(vs.is_active)),
                          });
                        }}
                      >
                        <IconEdit size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowVegenCatalogModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Borrado */}
      {deletingQuote && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirmar Eliminación</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeletingQuote(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                ¿Está seguro de archivar el presupuesto <strong>{deletingQuote.title}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setDeletingQuote(null)}>
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
