import React, { useState, useEffect } from 'react';
import { BusinessVertical, CatalogService } from '../../../types';
import { adminService } from '../../../services/adminService';
import { Card, CardBody, CardHeader } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { IconPlus, IconEdit, IconTrash, IconLock, IconCheck, IconStar, IconX } from '../../common/Icons';

export function VerticalsSubTab() {
  const [verticals, setVerticals] = useState<BusinessVertical[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<BusinessVertical | null>(null);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modales
  const [showVerticalModal, setShowVerticalModal] = useState(false);
  const [editingVertical, setEditingVertical] = useState<BusinessVertical | null>(null);
  const [verticalForm, setVerticalForm] = useState({ name: '', slug: '', description: '', is_active: true });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    default_priority: true,
    display_order: 1,
    is_active: true,
  });

  const [deletingItem, setDeletingItem] = useState<{ type: 'vertical' | 'service'; item: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVerticals = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const list = await adminService.getVerticalsAsync();
      setVerticals(list);
      if (list.length > 0 && !selectedVertical) {
        setSelectedVertical(list[0]);
      } else if (selectedVertical) {
        const found = list.find((v) => v.id === selectedVertical.id);
        setSelectedVertical(found || list[0] || null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar verticales.');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogServices = async (verticalId: string) => {
    try {
      setErrorMsg(null);
      const services = await adminService.getCatalogServicesAsync(verticalId);
      setCatalogServices(services);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar catálogo de servicios.');
    }
  };

  useEffect(() => {
    loadVerticals();
  }, []);

  useEffect(() => {
    if (selectedVertical) {
      loadCatalogServices(selectedVertical.id);
    } else {
      setCatalogServices([]);
    }
  }, [selectedVertical?.id]);

  // Manejadores Vertical
  const handleOpenNewVertical = () => {
    setEditingVertical(null);
    setVerticalForm({ name: '', slug: '', description: '', is_active: true });
    setShowVerticalModal(true);
  };

  const handleOpenEditVertical = (v: BusinessVertical) => {
    setEditingVertical(v);
    setVerticalForm({
      name: v.name,
      slug: v.slug,
      description: v.description || '',
      is_active: Boolean(Number(v.is_active)),
    });
    setShowVerticalModal(true);
  };

  const handleSaveVertical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verticalForm.name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingVertical) {
        await adminService.updateVerticalAsync(editingVertical.id, verticalForm);
        setSuccessMsg('Vertical actualizada correctamente.');
      } else {
        await adminService.createVerticalAsync(verticalForm);
        setSuccessMsg('Vertical creada exitosamente.');
      }
      setShowVerticalModal(false);
      await loadVerticals();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar vertical.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejadores Servicio Catálogo
  const handleOpenNewService = () => {
    if (!selectedVertical) return;
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      default_priority: true,
      display_order: catalogServices.length + 1,
      is_active: true,
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (s: CatalogService) => {
    setEditingService(s);
    setServiceForm({
      name: s.name,
      description: s.description || '',
      default_priority: Boolean(Number(s.default_priority)),
      display_order: s.display_order,
      is_active: Boolean(Number(s.is_active)),
    });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVertical || !serviceForm.name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingService) {
        await adminService.updateCatalogServiceAsync(editingService.id, {
          vertical_id: selectedVertical.id,
          ...serviceForm,
        });
        setSuccessMsg('Servicio actualizado correctamente.');
      } else {
        await adminService.createCatalogServiceAsync({
          vertical_id: selectedVertical.id,
          ...serviceForm,
        });
        setSuccessMsg('Servicio añadido al catálogo de la vertical.');
      }
      setShowServiceModal(false);
      await loadCatalogServices(selectedVertical.id);
      await loadVerticals();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar eliminación / soft delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (deletingItem.type === 'vertical') {
        await adminService.archiveVerticalAsync(deletingItem.item.id);
        setSuccessMsg('Vertical archivada.');
        setSelectedVertical(null);
        await loadVerticals();
      } else {
        await adminService.archiveCatalogServiceAsync(deletingItem.item.id);
        setSuccessMsg('Servicio eliminado del catálogo.');
        if (selectedVertical) {
          await loadCatalogServices(selectedVertical.id);
          await loadVerticals();
        }
      }
      setDeletingItem(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo completar la eliminación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Verticales de Negocio y Pools de Servicios
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Gestiona los nichos profesionales y el catálogo de servicios que heredan los nuevos cuestionarios.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenNewVertical}>
          <IconPlus size={14} />
          <span>Nueva Vertical</span>
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

      {/* Grid: Lista de Verticales a la izquierda, Catálogo a la derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 2fr)', gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* Columna Izquierda: Verticales */}
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              Verticales Activas ({verticals.length})
            </h3>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {verticals.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                {loading ? 'Cargando...' : 'No hay verticales configuradas.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {verticals.map((v) => {
                  const isSelected = selectedVertical?.id === v.id;
                  const isProt = Boolean(Number(v.is_protected));
                  const isAct = Boolean(Number(v.is_active));

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVertical(v)}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--color-brand-light)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--color-brand)' : '3px solid transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                            {v.name}
                          </span>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '2px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                              {v.services_count || 0} servicios • {v.clients_count || 0} clientes
                            </span>
                            {isProt && (
                              <Badge variant="neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                <IconLock size={9} style={{ marginRight: '2px' }} /> Protegida
                              </Badge>
                            )}
                            {!isAct && (
                              <Badge variant="warning" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                Inactiva
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '4px 6px', minHeight: 'auto' }}
                            title="Editar vertical"
                            onClick={() => handleOpenEditVertical(v)}
                          >
                            <IconEdit size={13} />
                          </button>
                          {!isProt && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '4px 6px', minHeight: 'auto', color: 'var(--color-danger)' }}
                              title="Archivar vertical"
                              onClick={() => setDeletingItem({ type: 'vertical', item: v })}
                            >
                              <IconTrash size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Columna Derecha: Catálogo de Servicios de la Vertical Seleccionada */}
        <Card>
          <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                Pool de Servicios: {selectedVertical ? selectedVertical.name : 'Seleccione una vertical'}
              </h3>
              {selectedVertical?.description && (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {selectedVertical.description}
                </p>
              )}
            </div>

            {selectedVertical && (
              <Button variant="secondary" size="sm" onClick={handleOpenNewService}>
                <IconPlus size={14} />
                <span>Añadir Servicio</span>
              </Button>
            )}
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {!selectedVertical ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                Seleccione una vertical para gestionar su pool de servicios.
              </div>
            ) : catalogServices.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                No hay servicios en el catálogo para esta vertical. Pulse &quot;Añadir Servicio&quot; para crear el primero.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {catalogServices.map((srv, idx) => {
                  const isPri = Boolean(Number(srv.default_priority));
                  const isAct = Boolean(Number(srv.is_active));

                  return (
                    <div
                      key={srv.id || idx}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', width: '18px', textAlign: 'center' }}>
                          #{srv.display_order}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                              {srv.name}
                            </span>
                            {isPri && (
                              <Badge variant="priority" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                <IconStar size={9} filled style={{ marginRight: '2px' }} /> Prioritario por defecto
                              </Badge>
                            )}
                            {!isAct && (
                              <Badge variant="warning" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                Inactivo
                              </Badge>
                            )}
                          </div>
                          {srv.description && (
                            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              {srv.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto' }}
                          title="Editar servicio"
                          onClick={() => handleOpenEditService(srv)}
                        >
                          <IconEdit size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto', color: 'var(--color-danger)' }}
                          title="Eliminar servicio"
                          onClick={() => setDeletingItem({ type: 'service', item: srv })}
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal Crear/Editar Vertical */}
      {showVerticalModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingVertical ? 'Editar Vertical' : 'Nueva Vertical de Negocio'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowVerticalModal(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveVertical}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="form-label" htmlFor="v-name">Nombre de la vertical *</label>
                  <input
                    id="v-name"
                    type="text"
                    className="form-input"
                    required
                    value={verticalForm.name}
                    onChange={(e) => setVerticalForm({ ...verticalForm, name: e.target.value })}
                    placeholder="Ej. Servicios Jurídicos y Extranjería"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="v-slug">Slug identificador</label>
                  <input
                    id="v-slug"
                    type="text"
                    className="form-input"
                    value={verticalForm.slug}
                    onChange={(e) => setVerticalForm({ ...verticalForm, slug: e.target.value })}
                    placeholder="ej. extranjeria-legal (opcional)"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="v-desc">Descripción</label>
                  <textarea
                    id="v-desc"
                    className="form-input"
                    rows={2}
                    value={verticalForm.description}
                    onChange={(e) => setVerticalForm({ ...verticalForm, description: e.target.value })}
                    placeholder="Sector profesional objetivo..."
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <input
                    id="v-active"
                    type="checkbox"
                    checked={verticalForm.is_active}
                    onChange={(e) => setVerticalForm({ ...verticalForm, is_active: e.target.checked })}
                  />
                  <label htmlFor="v-active" style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                    Vertical activa (disponible para asignación a clientes)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowVerticalModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Vertical'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Servicio en Catálogo */}
      {showServiceModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingService ? 'Editar Servicio del Catálogo' : 'Añadir Servicio a la Vertical'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowServiceModal(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveService}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="form-label" htmlFor="s-name">Nombre del servicio *</label>
                  <input
                    id="s-name"
                    type="text"
                    className="form-input"
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="Ej. Visados y Autorizaciones de Residencia"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="s-desc">Descripción breve</label>
                  <textarea
                    id="s-desc"
                    className="form-input"
                    rows={2}
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Alcance del servicio..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label" htmlFor="s-order">Orden de visualización</label>
                    <input
                      id="s-order"
                      type="number"
                      min={1}
                      className="form-input"
                      value={serviceForm.display_order}
                      onChange={(e) => setServiceForm({ ...serviceForm, display_order: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      id="s-priority"
                      type="checkbox"
                      checked={serviceForm.default_priority}
                      onChange={(e) => setServiceForm({ ...serviceForm, default_priority: e.target.checked })}
                    />
                    <label htmlFor="s-priority" style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                      Prioritario por defecto al inicializar nuevo cuestionario
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      id="s-active"
                      type="checkbox"
                      checked={serviceForm.is_active}
                      onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                    />
                    <label htmlFor="s-active" style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                      Servicio activo en el pool
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowServiceModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Servicio'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deletingItem && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirmar Eliminación</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeletingItem(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                ¿Está seguro de archivar {deletingItem.type === 'vertical' ? 'la vertical' : 'el servicio'} <strong>{deletingItem.item.name}</strong>?
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>
                Esta acción no afectará a los cuestionarios ya creados que contengan este servicio.
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setDeletingItem(null)}>
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
