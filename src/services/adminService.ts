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
  client_id: string;
  client_name: string;
  client_sector: string;
  created_at: string;
  submitted_at: string | null;
  total_services_count: number;
  priority_services_count: number;
}

class AdminService {
  private clients: ClientItem[] = [
    {
      id: 'c1',
      name: 'Dr. Berlioz',
      sector: 'Extranjería y Movilidad Internacional',
      contactName: 'Dr. Berlioz',
      contactEmail: 'contacto@drberlioz.com',
      status: 'SENT',
      token: 'f8d3b2e1a9c40567',
      createdAt: '2026-09-15',
      priorityServicesCount: 0,
      totalServicesCount: 0,
    },
  ];

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
      const mapped: ClientItem[] = res.data.map((c) => ({
        id: c.id,
        name: c.name,
        sector: c.professional_sector,
        contactName: c.contact_name,
        contactEmail: c.contact_email,
        status: (c.latest_status as ClientItem['status']) || 'SENT',
        token: c.token_id || c.id,
        createdAt: c.created_at ? c.created_at.split(' ')[0] : '',
        priorityServicesCount: 0,
        totalServicesCount: parseInt(c.questionnaires_count || '0', 10),
      }));
      this.clients = mapped;
      return mapped;
    }
    return this.getClients();
  }

  /**
   * Crea un nuevo cliente en el backend
   */
  public async createClientAsync(data: {
    name: string;
    sector: string;
    contactName: string;
    contactEmail: string;
  }): Promise<ClientItem> {
    const res = await apiRequest<any>('/admin/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        professional_sector: data.sector,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
      }),
    });

    if (res.success && res.data) {
      // También creamos un cuestionario con token automáticamente para este cliente
      let token = '';
      try {
        const qRes = await this.createQuestionnaire(res.data.id, `Diagnóstico - ${data.name}`);
        if (qRes && qRes.token) {
          token = qRes.token;
        }
      } catch {
        // En caso de fallo en creación de cuestionario, continúa con cliente
      }

      const newClient: ClientItem = {
        id: res.data.id,
        name: res.data.name,
        sector: res.data.professional_sector,
        contactName: res.data.contact_name,
        contactEmail: res.data.contact_email,
        status: 'SENT',
        token: token || res.data.id,
        createdAt: new Date().toISOString().split('T')[0],
        priorityServicesCount: 0,
        totalServicesCount: 1,
      };

      this.clients = [newClient, ...this.clients];
      return newClient;
    }

    // Fallback local
    return this.createClient(data);
  }

  public createClient(data: {
    name: string;
    sector: string;
    contactName: string;
    contactEmail: string;
  }): ClientItem {
    const generatedToken =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10);

    const newClient: ClientItem = {
      id: `c${Date.now()}`,
      name: data.name,
      sector: data.sector,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      status: 'SENT',
      token: generatedToken,
      createdAt: new Date().toISOString().split('T')[0],
      priorityServicesCount: 0,
      totalServicesCount: 0,
    };

    this.clients = [newClient, ...this.clients];
    return newClient;
  }

  /**
   * Lista todos los cuestionarios desde el backend
   */
  public async getQuestionnaires(): Promise<QuestionnaireSummary[]> {
    const res = await apiRequest<QuestionnaireSummary[]>('/admin/questionnaires', {
      method: 'GET',
    });

    if (res.success && Array.isArray(res.data)) {
      return res.data;
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
      return res.data;
    }
    throw new Error(res.error?.message || 'Error al cargar detalle del cuestionario');
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
