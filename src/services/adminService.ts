/**
 * Vegen Digital — Admin Service (Frontera de Servicio / Dependency Inversion)
 * Define el contrato para clientes, cuestionarios, verticales, planes, presupuestos y configuración.
 * Conectado con el backend real PHP / MySQL.
 */

import { ClientItem, BusinessVertical, CatalogService, StrategicPlan, VegenService, Quote } from '../types';
import { apiRequest } from './api';

export interface ScoringWeights {
  priority: number;
  profitability: number;
  operationalEase: number;
  remoteScalability: number;
  marketPosition: number;
}

export interface ComparisonServiceRow {
  name: string;
  isPriority: boolean;
  price: string;
  market: string;
  profitability: string;
  ease: string;
  remote: string;
  score: number;
  x: number;
  y: number;
}

export interface QuestionnaireSummary {
  id: string;
  title: string;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  current_step: number;
  is_protected?: boolean;
  client_id: string;
  client_name: string;
  client_sector: string;
  client_contact_name?: string;
  client_contact_email?: string;
  client_is_protected?: boolean;
  vertical_name?: string;
  token_id?: string;
  created_at: string;
  submitted_at: string | null;
  total_services_count: number;
  priority_services_count: number;
}

// Helper de almacenamiento local seguro para mapeo de tokens públicos por cliente
const getStoredToken = (clientId: string): string => {
  try {
    const map = JSON.parse(localStorage.getItem('vegen_q_tokens') || '{}');
    return map[clientId] || '';
  } catch {
    return '';
  }
};

const storeToken = (clientId: string, token: string): void => {
  try {
    const map = JSON.parse(localStorage.getItem('vegen_q_tokens') || '{}');
    map[clientId] = token;
    localStorage.setItem('vegen_q_tokens', JSON.stringify(map));
  } catch {
    // Ignore storage quota error
  }
};

class AdminService {
  private clients: ClientItem[] = [];

  public getInitialWeights(): ScoringWeights {
    return {
      priority: 20,
      profitability: 30,
      operationalEase: 20,
      remoteScalability: 20,
      marketPosition: 10,
    };
  }

  public getClients(): ClientItem[] {
    return [...this.clients];
  }

  /**
   * Carga clientes reales desde el backend
   */
  public async fetchClients(): Promise<ClientItem[]> {
    const res = await apiRequest<any[]>('/admin/clients', { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      const mapped: ClientItem[] = res.data.map((c) => {
        const cachedToken = getStoredToken(c.id);
        return {
          id: c.id,
          name: c.name,
          sector: c.professional_sector,
          country: c.country || 'España',
          contactName: c.contact_name,
          contactEmail: c.contact_email,
          contactPhone: c.contact_phone || '',
          notes: c.notes || '',
          verticalId: c.vertical_id || null,
          verticalName: c.vertical_name || null,
          status: (c.latest_status as ClientItem['status']) || 'SENT',
          token: cachedToken || c.token_id || c.id,
          isProtected: Boolean(Number(c.is_protected)),
          createdAt: c.created_at ? c.created_at.split(' ')[0] : '',
          updatedAt: c.updated_at || '',
          priorityServicesCount: 0,
          totalServicesCount: parseInt(c.questionnaires_count || '0', 10),
        };
      });
      this.clients = mapped;
      return mapped;
    }
    if (res.error) {
      throw new Error(res.error.message || 'No se pudieron cargar los clientes del servidor');
    }
    return this.getClients();
  }

  /**
   * Obtiene el detalle administrativo de un cliente
   */
  public async getClientDetailAsync(id: string): Promise<any> {
    const res = await apiRequest<any>(`/admin/clients/${id}`, { method: 'GET' });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener el detalle del cliente');
  }

  /**
   * Crea un nuevo cliente en el backend
   */
  public async createClientAsync(data: {
    name: string;
    sector: string;
    country?: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    notes?: string;
    verticalId?: string | null;
  }): Promise<ClientItem> {
    const res = await apiRequest<any>('/admin/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        professional_sector: data.sector,
        country: data.country || 'España',
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone || null,
        notes: data.notes || null,
        vertical_id: data.verticalId || null,
      }),
    });

    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'No se pudo crear el cliente en el servidor.');
    }

    // Crear automáticamente un cuestionario con token único para este cliente
    let token = '';
    try {
      const qRes = await this.createQuestionnaire(res.data.id, `Diagnóstico - ${data.name}`);
      if (qRes && qRes.token) {
        token = qRes.token;
        storeToken(res.data.id, token);
      }
    } catch (err) {
      console.warn('Cuestionario inicial no pudo ser creado:', err);
    }

    const newClient: ClientItem = {
      id: res.data.id,
      name: res.data.name,
      sector: res.data.professional_sector,
      country: res.data.country || 'España',
      contactName: res.data.contact_name,
      contactEmail: res.data.contact_email,
      contactPhone: res.data.contact_phone || '',
      notes: res.data.notes || '',
      verticalId: res.data.vertical_id || null,
      verticalName: null,
      status: 'SENT',
      token: token || res.data.id,
      isProtected: false,
      createdAt: new Date().toISOString().split('T')[0],
      priorityServicesCount: 0,
      totalServicesCount: 1,
    };

    this.clients = [newClient, ...this.clients];
    return newClient;
  }

  /**
   * Actualiza datos de un cliente existente
   */
  public async updateClientAsync(
    id: string,
    data: {
      name: string;
      sector: string;
      country?: string;
      contactName: string;
      contactEmail: string;
      contactPhone?: string;
      notes?: string;
      verticalId?: string | null;
    }
  ): Promise<any> {
    const res = await apiRequest<any>(`/admin/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        professional_sector: data.sector,
        country: data.country || 'España',
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone || null,
        notes: data.notes || null,
        vertical_id: data.verticalId !== undefined ? data.verticalId : undefined,
      }),
    });

    if (!res.success) {
      throw new Error(res.error?.message || 'Error al actualizar el cliente');
    }

    return res.data;
  }

  /**
   * Archiva (soft delete) un cliente
   */
  public async archiveClientAsync(id: string): Promise<void> {
    const res = await apiRequest<any>(`/admin/clients/${id}`, {
      method: 'DELETE',
    });

    if (!res.success) {
      throw new Error(res.error?.message || 'No se pudo archivar el cliente.');
    }
  }

  /**
   * Lista todos los cuestionarios desde el backend
   */
  public async getQuestionnaires(): Promise<QuestionnaireSummary[]> {
    const res = await apiRequest<any[]>('/admin/questionnaires', {
      method: 'GET',
    });

    if (res.success && Array.isArray(res.data)) {
      return res.data.map((q) => {
        const cachedToken = getStoredToken(q.client_id);
        return {
          id: q.id,
          title: q.title,
          status: q.status,
          current_step: Number(q.current_step),
          is_protected: Boolean(Number(q.is_protected)),
          client_id: q.client_id,
          client_name: q.client_name,
          client_sector: q.client_sector,
          client_contact_name: q.client_contact_name,
          client_contact_email: q.client_contact_email,
          client_is_protected: Boolean(Number(q.client_is_protected)),
          vertical_name: q.vertical_name || undefined,
          token_id: cachedToken || q.token_id || q.id,
          created_at: q.created_at,
          submitted_at: q.submitted_at,
          total_services_count: Number(q.total_services_count || 0),
          priority_services_count: Number(q.priority_services_count || 0),
        };
      });
    }

    if (res.error) {
      throw new Error(res.error.message || 'Error al obtener cuestionarios');
    }

    return [];
  }

  /**
   * Crea un nuevo cuestionario y obtiene su enlace/token único
   */
  public async createQuestionnaire(clientId: string, title?: string): Promise<{
    questionnaire_id: string;
    token: string;
    url: string;
  }> {
    const res = await apiRequest<{ questionnaire_id: string; token: string; url: string }>('/admin/questionnaires', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        title: title || 'Cuestionario de Diagnóstico',
      }),
    });

    if (res.success && res.data) {
      if (res.data.token) {
        storeToken(clientId, res.data.token);
      }
      return res.data;
    }

    throw new Error(res.error?.message || 'Error al crear el cuestionario');
  }

  /**
   * Obtiene el detalle completo de un cuestionario (servicios, respuestas, diferenciales)
   */
  public async getQuestionnaireDetail(id: string): Promise<any> {
    const res = await apiRequest<any>(`/admin/questionnaires/${id}`, {
      method: 'GET',
    });

    if (res.success && res.data) {
      return res.data;
    }

    throw new Error(res.error?.message || 'Error al obtener el detalle del cuestionario');
  }

  /**
   * Actualiza metadatos de un cuestionario (ej: título)
   */
  public async updateQuestionnaireMetadataAsync(id: string, data: { title: string }): Promise<any> {
    const res = await apiRequest<any>(`/admin/questionnaires/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (res.success && res.data) {
      return res.data;
    }

    throw new Error(res.error?.message || 'Error al actualizar cuestionario');
  }

  /**
   * Archiva (soft delete) un cuestionario y revoca sus tokens
   */
  public async archiveQuestionnaire(id: string): Promise<void> {
    const res = await apiRequest<any>(`/admin/questionnaires/${id}`, {
      method: 'DELETE',
    });

    if (!res.success) {
      throw new Error(res.error?.message || 'No se pudo archivar el cuestionario.');
    }
  }

  public async archiveQuestionnaireAsync(id: string): Promise<void> {
    return this.archiveQuestionnaire(id);
  }

  // ==========================================
  // VERTICALES Y CATÁLOGO
  // ==========================================

  public async getVerticalsAsync(): Promise<BusinessVertical[]> {
    const res = await apiRequest<BusinessVertical[]>('/admin/verticals', { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener verticales');
  }

  public async createVerticalAsync(data: { name: string; slug?: string; description?: string; is_active?: boolean }): Promise<BusinessVertical> {
    const res = await apiRequest<BusinessVertical>('/admin/verticals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al crear vertical');
  }

  public async updateVerticalAsync(id: string, data: Partial<BusinessVertical>): Promise<BusinessVertical> {
    const res = await apiRequest<BusinessVertical>(`/admin/verticals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al actualizar vertical');
  }

  public async archiveVerticalAsync(id: string): Promise<void> {
    const res = await apiRequest(`/admin/verticals/${id}`, { method: 'DELETE' });
    if (!res.success) {
      throw new Error(res.error?.message || 'Error al archivar vertical');
    }
  }

  public async getCatalogServicesAsync(verticalId?: string): Promise<CatalogService[]> {
    const url = verticalId ? `/admin/catalog-services?vertical_id=${verticalId}` : '/admin/catalog-services';
    const res = await apiRequest<CatalogService[]>(url, { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener catálogo de servicios');
  }

  public async createCatalogServiceAsync(data: {
    vertical_id: string;
    name: string;
    description?: string;
    default_priority?: boolean;
    display_order?: number;
    is_active?: boolean;
  }): Promise<CatalogService> {
    const res = await apiRequest<CatalogService>('/admin/catalog-services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al crear servicio en catálogo');
  }

  public async updateCatalogServiceAsync(id: string, data: Partial<CatalogService>): Promise<CatalogService> {
    const res = await apiRequest<CatalogService>(`/admin/catalog-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al actualizar servicio en catálogo');
  }

  public async archiveCatalogServiceAsync(id: string): Promise<void> {
    const res = await apiRequest(`/admin/catalog-services/${id}`, { method: 'DELETE' });
    if (!res.success) {
      throw new Error(res.error?.message || 'Error al archivar servicio');
    }
  }

  // ==========================================
  // PLANES ESTRATÉGICOS
  // ==========================================

  public async getStrategicPlansAsync(clientId?: string): Promise<StrategicPlan[]> {
    const url = clientId ? `/admin/strategic-plans?client_id=${clientId}` : '/admin/strategic-plans';
    const res = await apiRequest<StrategicPlan[]>(url, { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener planes estratégicos');
  }

  public async getStrategicPlanDetailAsync(id: string): Promise<StrategicPlan> {
    const res = await apiRequest<StrategicPlan>(`/admin/strategic-plans/${id}`, { method: 'GET' });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener detalle del plan estratégico');
  }

  public async createStrategicPlanAsync(data: Partial<StrategicPlan>): Promise<StrategicPlan> {
    const res = await apiRequest<StrategicPlan>('/admin/strategic-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al crear plan estratégico');
  }

  public async updateStrategicPlanAsync(id: string, data: Partial<StrategicPlan>): Promise<StrategicPlan> {
    const res = await apiRequest<StrategicPlan>(`/admin/strategic-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al actualizar plan estratégico');
  }

  public async archiveStrategicPlanAsync(id: string): Promise<void> {
    const res = await apiRequest(`/admin/strategic-plans/${id}`, { method: 'DELETE' });
    if (!res.success) {
      throw new Error(res.error?.message || 'Error al archivar plan');
    }
  }

  // ==========================================
  // PRESUPUESTOS Y SERVICIOS VEGEN
  // ==========================================

  public async getVegenServicesAsync(): Promise<VegenService[]> {
    const res = await apiRequest<VegenService[]>('/admin/vegen-services', { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener catálogo de servicios Vegen');
  }

  public async createVegenServiceAsync(data: { name: string; description?: string; base_price: number; currency?: string; is_active?: boolean }): Promise<VegenService> {
    const res = await apiRequest<VegenService>('/admin/vegen-services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al crear servicio Vegen');
  }

  public async updateVegenServiceAsync(id: string, data: Partial<VegenService>): Promise<VegenService> {
    const res = await apiRequest<VegenService>(`/admin/vegen-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al actualizar servicio Vegen');
  }

  public async archiveVegenServiceAsync(id: string): Promise<void> {
    const res = await apiRequest(`/admin/vegen-services/${id}`, { method: 'DELETE' });
    if (!res.success) {
      throw new Error(res.error?.message || 'Error al archivar servicio Vegen');
    }
  }

  public async getQuotesAsync(clientId?: string): Promise<Quote[]> {
    const url = clientId ? `/admin/quotes?client_id=${clientId}` : '/admin/quotes';
    const res = await apiRequest<Quote[]>(url, { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener presupuestos');
  }

  public async getQuoteDetailAsync(id: string): Promise<Quote> {
    const res = await apiRequest<Quote>(`/admin/quotes/${id}`, { method: 'GET' });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al obtener detalle del presupuesto');
  }

  public async createQuoteAsync(data: Partial<Quote>): Promise<Quote> {
    const res = await apiRequest<Quote>('/admin/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al crear presupuesto');
  }

  public async updateQuoteAsync(id: string, data: Partial<Quote>): Promise<Quote> {
    const res = await apiRequest<Quote>(`/admin/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al actualizar presupuesto');
  }

  public async archiveQuoteAsync(id: string): Promise<void> {
    const res = await apiRequest(`/admin/quotes/${id}`, { method: 'DELETE' });
    if (!res.success) {
      throw new Error(res.error?.message || 'Error al archivar presupuesto');
    }
  }

  public getComparisonServices(): ComparisonServiceRow[] {
    return [];
  }
}

export const adminService = new AdminService();
