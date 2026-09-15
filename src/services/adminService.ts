/**
 * Vegen Digital — Admin Service (Frontera de Servicio / Dependency Inversion)
 * Define el contrato para clientes, métricas y configuración de scoring.
 * En F1.2 suministra datos tipados para maquetación e interacción.
 * En F2 se conectará con los endpoints del backend.
 */

import { ClientItem } from '../types';

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

class AdminService {
  private clients: ClientItem[] = [
    {
      id: 'c1',
      name: 'Dr. Berlioz',
      sector: 'Extranjería y Movilidad Internacional',
      contactName: 'Dr. Berlioz',
      contactEmail: 'contacto@drberlioz.com',
      status: 'COMPLETED',
      token: 'f8d3b2e1a9c40567',
      createdAt: '2026-09-10',
      completedAt: '2026-09-14',
      priorityServicesCount: 3,
      totalServicesCount: 5,
    },
    {
      id: 'c2',
      name: 'Gómez & Partners Abogados',
      sector: 'Derecho Mercantil y Startups',
      contactName: 'Lucía Gómez',
      contactEmail: 'lucia@gomezabogados.es',
      status: 'IN_PROGRESS',
      token: 'e2a4c9f0b1837465',
      createdAt: '2026-09-12',
      priorityServicesCount: 4,
      totalServicesCount: 7,
    },
    {
      id: 'c3',
      name: 'Navarro Asesoría Jurídica',
      sector: 'Derecho Laboral y Civil',
      contactName: 'Carlos Navarro',
      contactEmail: 'carlos@navarrojuristas.es',
      status: 'SENT',
      token: 'a9b8c7d6e5f40392',
      createdAt: '2026-09-15',
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
      {
        name: 'Homologación de títulos extranjeros',
        isPriority: false,
        price: '450 € – 650 €',
        market: 'Por debajo (-15%)',
        profitability: '2 / 5 (Baja)',
        ease: '3 / 5 (Media)',
        remote: '100% Online',
        score: 58,
        x: 65,
        y: 40,
      },
      {
        name: 'Recursos contencioso-administrativos',
        isPriority: false,
        price: '1.500 € – 2.500 €',
        market: 'Por encima (+10%)',
        profitability: '3 / 5 (Media)',
        ease: '2 / 5 (Difícil)',
        remote: 'Híbrido (50%)',
        score: 48,
        x: 40,
        y: 50,
      },
    ];
  }
}

export const adminService = new AdminService();
