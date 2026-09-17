/**
 * Vegen Digital — Questionnaire Service (Frontera de Servicio / Dependency Inversion)
 * Conectado con el backend real PHP 8.3 / MySQL 5.7.
 */

import { ServiceItem, ServiceAnswerItem, TargetAudienceItem } from '../types';
import { INITIAL_SERVICES } from '../config/defaults';
import { apiRequest } from './api';

export interface QuestionnaireState {
  services: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  audiences: TargetAudienceItem[];
  differentials: string[];
  customDifferentialText: string;
  finalPitch: string;
}

export function getInitialQuestionnaireState(): QuestionnaireState {
  return {
    services: INITIAL_SERVICES.map((s) => ({ ...s })),
    answers: {},
    audiences: [],
    differentials: [],
    customDifferentialText: '',
    finalPitch: '',
  };
}

export interface QuestionnaireData {
  services: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  targetAudiences: TargetAudienceItem[];
  customAudiences: TargetAudienceItem[];
  differentials: string[];
  customDifferentialText: string;
  valueProposition: string;
  isCompleted: boolean;
}

export interface LoadedQuestionnaire {
  id: string;
  title: string;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  current_step: number;
  final_pitch: string | null;
  submitted_at: string | null;
  client_name: string;
  client_sector: string;
  services: any[];
  target_audiences: any[];
  differentials: any[];
}

class QuestionnaireService {
  /**
   * Carga el cuestionario desde el backend a partir de su token público
   */
  public async load(token: string): Promise<LoadedQuestionnaire | null> {
    const res = await apiRequest<LoadedQuestionnaire>(`/q/${token}`, {
      method: 'GET',
    });

    if (res.success && res.data) {
      return res.data;
    }

    return null;
  }

  /**
   * Guarda las respuestas y progreso de forma incremental
   */
  public async save(token: string, payload: {
    current_step?: number;
    final_pitch?: string;
    services?: any[];
    target_audiences?: any[];
    differentials?: any[];
  }): Promise<boolean> {
    const res = await apiRequest(`/q/${token}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return Boolean(res.success);
  }

  /**
   * Envía y finaliza el cuestionario
   */
  public async submit(token: string, payload?: {
    final_pitch?: string;
    services?: any[];
    target_audiences?: any[];
    differentials?: any[];
  }): Promise<{ success: boolean; completedAt: string; error?: string }> {
    const res = await apiRequest<{ submitted: boolean; status: string; submitted_at: string }>(
      `/q/${token}/submit`,
      {
        method: 'POST',
        body: payload ? JSON.stringify(payload) : undefined,
      }
    );

    if (res.success && res.data) {
      return {
        success: true,
        completedAt: res.data.submitted_at || new Date().toISOString(),
      };
    }

    return {
      success: false,
      completedAt: '',
      error: res.error?.message || 'Error al enviar el cuestionario.',
    };
  }

  public async getInitialData(): Promise<QuestionnaireData> {
    const initial = getInitialQuestionnaireState();
    return {
      services: initial.services,
      answers: {},
      targetAudiences: [],
      customAudiences: [],
      differentials: [],
      customDifferentialText: '',
      valueProposition: '',
      isCompleted: false,
    };
  }

  public async autoSaveAnswers(): Promise<boolean> {
    throw new Error('Imposible autoguardar: Se requiere un token de cuestionario válido.');
  }

  public async submitQuestionnaire(): Promise<{ success: boolean; completedAt: string }> {
    throw new Error('Imposible enviar: Se requiere un token de cuestionario válido.');
  }
}

export const questionnaireService = new QuestionnaireService();
