import { useState, useEffect } from 'react';
import { ClientItem } from '../../../types';
import { adminService } from '../../../services/adminService';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Card, CardBody } from '../../common/Card';
import { IconCopy, IconCheck, IconPlus, IconEye, IconEdit, IconTrash, IconLock, IconX } from '../../common/Icons';

interface ClientsTabProps {
  clients: ClientItem[];
  copiedToken: string | null;
  onCopyLink: (token: string) => void;
  onOpenNewClientModal: () => void;
  onRefreshClients: () => Promise<void>;
}

export function ClientsTab({
  clients,
  copiedToken,
  onCopyLink,
  onOpenNewClientModal,
  onRefreshClients,
}: ClientsTabProps) {
  // Estado para modales de cliente
  const [selectedClientDetail, setSelectedClientDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulario de edición
  const [verticals, setVerticals] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    name: '',
    sector: '',
    country: 'España',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    verticalId: '',
  });

  useEffect(() => {
    adminService.getVerticalsAsync().then((list) => setVerticals(list)).catch(() => {});
  }, []);

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

  // Abrir detalle
  const handleOpenDetail = async (client: ClientItem) => {
    setLoadingDetail(true);
    setErrorMsg(null);
    try {
      const detail = await adminService.getClientDetailAsync(client.id);
      setSelectedClientDetail(detail);
    } catch (err) {
      setSelectedClientDetail(client);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (client: ClientItem) => {
    setEditingClient(client);
    setEditForm({
      name: client.name || '',
      sector: client.sector || '',
      country: client.country || 'España',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      notes: client.notes || '',
      verticalId: (client as any).vertical_id || client.verticalId || '',
    });
    setErrorMsg(null);
  };

  // Guardar edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await adminService.updateClientAsync(editingClient.id, editForm);
      await onRefreshClients();
      setEditingClient(null);
      if (selectedClientDetail && selectedClientDetail.id === editingClient.id) {
        const refreshed = await adminService.getClientDetailAsync(editingClient.id);
        setSelectedClientDetail(refreshed);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir confirmación de eliminación
  const handleOpenDelete = (client: ClientItem) => {
    setDeletingClient(client);
    setErrorMsg(null);
  };

  // Confirmar eliminación / soft delete
  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    if (deletingClient.isProtected) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await adminService.archiveClientAsync(deletingClient.id);
      await onRefreshClients();
      setDeletingClient(null);
      if (selectedClientDetail && selectedClientDetail.id === deletingClient.id) {
        setSelectedClientDetail(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo eliminar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Cabecera de Pestaña */}
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
            Directorio de despachos, enlaces asignados y trazabilidad de diagnósticos
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenNewClientModal}>
          <IconPlus size={14} />
          <span>+ Crear Cliente</span>
        </Button>
      </div>

      {errorMsg && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
          {errorMsg}
        </div>
      )}

      {/* Vista Mobile (<768px) */}
      <div className="admin-card-list mobile-only">
        {clients.map((c) => (
          <div key={c.id} className="admin-service-card" style={{ position: 'relative' }}>
            <div className="admin-service-card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    {c.name}
                  </h3>
                  {c.isProtected && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                      <IconLock size={10} /> Protegido
                    </span>
                  )}
                </div>
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
                <span className="admin-card-metric-label">Diagnósticos</span>
                <span className="admin-card-metric-val">{c.totalServicesCount || 1}</span>
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

            {/* Acciones Mobile */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)' }}>
              <Button variant="secondary" size="sm" onClick={() => handleOpenDetail(c)} style={{ flex: 1 }}>
                <IconEye size={13} />
                <span>Ver</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(c)} style={{ flex: 1 }}>
                <IconEdit size={13} />
                <span>Editar</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCopyLink(c.token)}
                style={{ flex: 1 }}
              >
                {copiedToken === c.token ? (
                  <>
                    <IconCheck size={13} style={{ color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-success)' }}>Copiado</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={13} />
                    <span>Enlace</span>
                  </>
                )}
              </Button>
              {!c.isProtected ? (
                <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(c)} style={{ color: 'var(--color-danger)' }}>
                  <IconTrash size={13} />
                  <span>Eliminar</span>
                </Button>
              ) : null}
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
                <th>Fecha</th>
                <th style={{ textAlign: 'right', minWidth: '280px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
                    No hay clientes registrados en la plataforma.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{c.name}</span>
                        {c.isProtected && (
                          <span
                            title="Registro real protegido contra eliminación"
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
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {c.createdAt}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                        {/* Botón Ver */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(c)}
                          title="Ver detalle del cliente"
                        >
                          <IconEye size={14} />
                          <span>Ver</span>
                        </Button>

                        {/* Botón Editar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          title="Editar información del cliente"
                        >
                          <IconEdit size={14} />
                          <span>Editar</span>
                        </Button>

                        {/* Botón Enlace */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onCopyLink(c.token)}
                          title="Copiar enlace de acceso"
                        >
                          {copiedToken === c.token ? (
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

                        {/* Botón Eliminar (Soft-Delete) */}
                        {!c.isProtected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(c)}
                            title="Archivar / Eliminar cliente"
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
      </div>

      {/* MODAL 1: DETALLE DE CLIENTE */}
      {selectedClientDetail && (
        <div className="modal-overlay" onClick={() => setSelectedClientDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    Detalle de Cliente
                  </h3>
                  {selectedClientDetail.is_protected || selectedClientDetail.isProtected ? (
                    <Badge variant="neutral">
                      <IconLock size={10} style={{ marginRight: '3px' }} /> Protegido
                    </Badge>
                  ) : null}
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                  ID: {selectedClientDetail.id}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedClientDetail(null)}
                aria-label="Cerrar modal"
              >
                <IconX size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
              <div>
                <strong>Nombre / Razón Social:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.name}</p>
              </div>
              <div>
                <strong>Sector / Vertical:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.professional_sector || selectedClientDetail.sector}</p>
              </div>
              <div>
                <strong>Persona de Contacto:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.contact_name || selectedClientDetail.contactName}</p>
              </div>
              <div>
                <strong>Correo Electrónico:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.contact_email || selectedClientDetail.contactEmail}</p>
              </div>
              <div>
                <strong>Teléfono:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.contact_phone || selectedClientDetail.contactPhone || '—'}</p>
              </div>
              <div>
                <strong>País:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.country || 'España'}</p>
              </div>
              <div>
                <strong>Fecha de Registro:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.created_at || selectedClientDetail.createdAt}</p>
              </div>
              <div>
                <strong>Última Actividad:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.updated_at || selectedClientDetail.updatedAt || '—'}</p>
              </div>
            </div>

            {selectedClientDetail.notes && (
              <div style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                <strong>Notas / Observaciones:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{selectedClientDetail.notes}</p>
              </div>
            )}

            {/* Cuestionarios Asociados */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }}>
                Cuestionarios Asociados ({selectedClientDetail.questionnaires?.length || 0})
              </h4>
              {selectedClientDetail.questionnaires && selectedClientDetail.questionnaires.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selectedClientDetail.questionnaires.map((q: any) => (
                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)' }}>
                      <div>
                        <strong>{q.title}</strong>
                        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>Creado: {q.created_at?.split(' ')[0]}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {getStatusBadge(q.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>No hay diagnósticos adicionales registrados.</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)' }}>
              <Button variant="secondary" size="sm" onClick={() => setSelectedClientDetail(null)}>
                Cerrar
              </Button>
              <Button variant="primary" size="sm" onClick={() => {
                const c = selectedClientDetail;
                setSelectedClientDetail(null);
                handleOpenEdit({
                  id: c.id,
                  name: c.name,
                  sector: c.professional_sector || c.sector,
                  country: c.country,
                  contactName: c.contact_name || c.contactName,
                  contactEmail: c.contact_email || c.contactEmail,
                  contactPhone: c.contact_phone || c.contactPhone,
                  notes: c.notes,
                  status: c.status || 'SENT',
                  token: c.token_id || c.token || '',
                  isProtected: Boolean(Number(c.is_protected || c.isProtected)),
                  createdAt: c.created_at || c.createdAt || '',
                });
              }}>
                <IconEdit size={14} />
                <span>Editar cliente</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CLIENTE */}
      {editingClient && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setEditingClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Editar Cliente
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingClient(null)}
                disabled={isSubmitting}
                aria-label="Cerrar modal"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="form-label" htmlFor="edit-name">Nombre / Razón Social *</label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="edit-vertical">Vertical de Negocio / Pool de Servicios</label>
                  <select
                    id="edit-vertical"
                    className="form-input"
                    value={editForm.verticalId}
                    onChange={(e) => setEditForm({ ...editForm, verticalId: e.target.value })}
                  >
                    <option value="">Sin vertical asignada</option>
                    {verticals.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label" htmlFor="edit-sector">Sector Profesional *</label>
                    <input
                      id="edit-sector"
                      type="text"
                      required
                      className="form-input"
                      value={editForm.sector}
                      onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="edit-country">País</label>
                    <input
                      id="edit-country"
                      type="text"
                      className="form-input"
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label" htmlFor="edit-contact">Persona de Contacto *</label>
                    <input
                      id="edit-contact"
                      type="text"
                      required
                      className="form-input"
                      value={editForm.contactName}
                      onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="edit-email">Correo Electrónico *</label>
                    <input
                      id="edit-email"
                      type="email"
                      required
                      className="form-input"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="edit-phone">Teléfono de Contacto</label>
                  <input
                    id="edit-phone"
                    type="text"
                    className="form-input"
                    value={editForm.contactPhone}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="edit-notes">Notas / Contexto Operativo</label>
                  <textarea
                    id="edit-notes"
                    rows={3}
                    className="form-input"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setEditingClient(null)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN / SOFT DELETE */}
      {deletingClient && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setDeletingClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-danger)' }}>
                ¿Eliminar este cliente?
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDeletingClient(null)}
                disabled={isSubmitting}
                aria-label="Cerrar modal"
              >
                <IconX size={16} />
              </button>
            </div>

            {deletingClient.isProtected ? (
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-4)' }}>
                <strong>Registro Protegido:</strong> Este cliente es un registro real activo del sistema y no puede ser eliminado ni archivado administrativamente.
              </div>
            ) : (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                <p>
                  Estás a punto de archivar al cliente <strong>"{deletingClient.name}"</strong>.
                </p>
                <p style={{ marginTop: 'var(--space-2)' }}>
                  Esta acción quitará al cliente de las vistas activas de la plataforma. Sus cuestionarios asociados permanecerán guardados como histórico pero no se podrán emitir nuevos diagnósticos.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button variant="secondary" size="sm" onClick={() => setDeletingClient(null)} disabled={isSubmitting}>
                Cancelar
              </Button>
              {!deletingClient.isProtected && (
                <Button variant="primary" size="sm" onClick={handleConfirmDelete} loading={isSubmitting} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                  Eliminar cliente
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
