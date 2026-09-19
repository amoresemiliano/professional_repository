import React, { useState, useEffect } from 'react';
import { VegenService } from '../../../types';
import { adminService } from '../../../services/adminService';
import { Card, CardBody, CardHeader } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX } from '../../common/Icons';

export function VegenCatalogSubTab() {
  const [vegenServices, setVegenServices] = useState<VegenService[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<VegenService | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    is_active: true,
  });

  const [deletingService, setDeletingService] = useState<VegenService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const list = await adminService.getVegenServicesAsync();
      setVegenServices(list);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cargar catálogo Vegen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setEditingService(null);
    setForm({ name: '', description: '', base_price: 1000, is_active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (srv: VegenService) => {
    setEditingService(srv);
    setForm({
      name: srv.name,
      description: srv.description || '',
      base_price: Number(srv.base_price),
      is_active: Boolean(Number(srv.is_active)),
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingService) {
        await adminService.updateVegenServiceAsync(editingService.id, form);
        setSuccessMsg('Servicio de catálogo actualizado.');
      } else {
        await adminService.createVegenServiceAsync(form);
        setSuccessMsg('Servicio añadido al catálogo Vegen.');
      }
      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await adminService.archiveVegenServiceAsync(deletingService.id);
      setSuccessMsg('Servicio archivado del catálogo.');
      setDeletingService(null);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al archivar servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
          {successMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                Catálogo Comercial de Vegen Digital ({vegenServices.length})
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Servicios propios y tarifas base que se ofertan en los presupuestos de consultoría comercial.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenNew} iconLeft={<IconPlus size={14} />}>
              Nuevo Servicio
            </Button>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Cargando catálogo Vegen...
            </div>
          ) : vegenServices.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No hay servicios registrados en el catálogo comercial de Vegen.
            </div>
          ) : (
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Servicio</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Descripción</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Tarifa Base</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vegenServices.map((srv) => (
                  <tr key={srv.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                      {srv.name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', maxWidth: '300px' }}>
                      {srv.description || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--font-weight-semibold)' }}>
                      {Number(srv.base_price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} EUR
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                      {Boolean(Number(srv.is_active)) ? (
                        <Badge variant="success" icon={<IconCheck size={10} />}>Activo</Badge>
                      ) : (
                        <Badge variant="neutral">Inactivo</Badge>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto' }}
                          title="Editar servicio"
                          onClick={() => handleOpenEdit(srv)}
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '4px 6px', minHeight: 'auto', color: 'var(--color-danger)' }}
                          title="Archivar servicio"
                          onClick={() => setDeletingService(srv)}
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

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingService ? 'Editar Servicio Comercial' : 'Nuevo Servicio Comercial Vegen'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="form-label" htmlFor="vs-name">Nombre del Servicio *</label>
                  <input
                    id="vs-name"
                    type="text"
                    required
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Consultoría de IA"
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="vs-desc">Descripción comercial</label>
                  <textarea
                    id="vs-desc"
                    className="form-input"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detalle del alcance y beneficios..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label" htmlFor="vs-price">Tarifa Base (EUR) *</label>
                    <input
                      id="vs-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="form-input"
                      value={form.base_price}
                      onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="vs-active">Estado</label>
                    <select
                      id="vs-active"
                      className="form-input"
                      value={form.is_active ? '1' : '0'}
                      onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}
                    >
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deletingService && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirmar Eliminación</h3>
              <button type="button" className="modal-close-btn" onClick={() => setDeletingService(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                ¿Está seguro de archivar el servicio comercial <strong>{deletingService.name}</strong> del catálogo Vegen?
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setDeletingService(null)}>
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
