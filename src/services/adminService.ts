/**
 * Vegen Digital — Admin Service (Frontera de Servicio / Dependency Inversion)
 * Define el contrato para clientes, cuestionarios, métricas y configuración.
 * Conectado con el backend real PHP / MySQL.
 */

import { ClientItem } from '../types';
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
      return res.data.map((q) => ({
        ...q,
        is_protected: Boolean(Number(q.is_protected)),
        client_is_protected: Boolean(Number(q.client_is_protected)),
      }));
    }
    return [];
  }

  /**
   * Crea un cuestionario y genera token único
   */
  public async createQuestionnaire(clientId: string, title: string = 'Cuestionario de Diagnóstico'): Promise<any> {
    const res = await apiRequest<any>('/admin/questionnaires', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, title }),
    });

    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al crear cuestionario');
  }

  /**
   * Obtiene el detalle completo de un cuestionario
   */
  public async getQuestionnaireDetail(id: string): Promise<any> {
    const res = await apiRequest<any>(`/admin/questionnaires/${id}`, {
      method: 'GET',
    });

    if (res.success && res.data) {
      if (res.data.questionnaire) {
        res.data.questionnaire.is_protected = Boolean(Number(res.data.questionnaire.is_protected));
      }
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al cargar detalle del cuestionario');
  }

  /**
   * Actualiza metadata segura de un cuestionario (Título)
   */
  public async updateQuestionnaireMetadataAsync(id: string, data: { title: string }): Promise<any> {
    const res = await apiRequest<any>(`/admin/questionnaires/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!res.success) {
      throw new Error(res.error?.message || 'Error al actualizar metadata del cuestionario');
    }

    return res.data;
  }

  /**
   * Archiva (soft delete) un cuestionario y revoca sus tokens
   */
  public async archiveQuestionnaireAsync(id: string): Promise<void> {
    const res = await apiRequest<any>(`/admin/questionnaires/${id}`, {
      method: 'DELETE',
    });

    if (!res.success) {
      throw new Error(res.error?.message || 'No se pudo archivar el cuestionario.');
    }
  }

  public getComparisonServices(): ComparisonServiceRow[] {
    return [
      {
        name: 'Visados de nómadas digitales & inversores',
        isPriority: true,
        price: '1.200 € – 1.800 €',
        market: 'Similar (+5%)',
        profitability: '5 / 5 (Muy alta)',
        ease: '4 / 5 (Fácil)',
        remote: '100% Online',
        score: 94,
        x: 88,
        y: 92,
      },
      {
        name: 'Nacionalidad española por residencia',
        isPriority: true,
        price: '750 € – 950 €',
        market: 'Similar al mercado',
        profitability: '4 / 5 (Alta)',
        ease: '4 / 5 (Fácil)',
        remote: 'Casi todo online',
        score: 86,
        x: 75,
        y: 80,
      },
      {
        name: 'Arraigo social, laboral y para la formación',
        isPriority: true,
        price: '850 € – 1.100 €',
        market: 'Similar al mercado',
        profitability: '3 / 5 (Media)',
        ease: '3 / 5 (Media)',
        remote: 'Casi todo online',
        score: 72,
        x: 60,
        y: 65,
      },
    ];
  }
}

export const adminService = new AdminService();
