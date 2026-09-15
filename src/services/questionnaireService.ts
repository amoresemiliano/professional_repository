/**
 * Vegen Digital — Questionnaire Service (Frontera de Servicio / Dependency Inversion)
 * Define el contrato para persistencia y recuperación del cuestionario.
 * En F1.2 trabaja sobre estado local/memoria.
 * En F2 se conectará con los endpoints del backend.
 */

import { ServiceItem, ServiceAnswerItem, TargetAudienceItem } from '../types';
import { INITIAL_SERVICES, INITIAL_TARGET_AUDIENCES, DEFAULT_DIFFERENTIAL_OPTIONS } from '../config/defaults';

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

class QuestionnaireService {
  /**
   * Obtiene la configuración y datos iniciales para un nuevo cuestionario
   */
  public async getInitialData(): Promise<QuestionnaireData> {
    return {
      services: [...INITIAL_SERVICES],
      answers: {},
      targetAudiences: [...INITIAL_TARGET_AUDIENCES],
      customAudiences: [],
      differentials: [...DEFAULT_DIFFERENTIAL_OPTIONS],
      customDifferentialText: '',
      valueProposition: '',
      isCompleted: false,
    };
  }

  /**
   * Guarda las respuestas provisionales (autosave)
   */
  public async autoSaveAnswers(_answers: Record<string, ServiceAnswerItem>): Promise<boolean> {
    // Simula guardado exitoso
    return true;
  }

  /**
   * Envía y finaliza el cuestionario
   */
  public async submitQuestionnaire(_data: QuestionnaireData): Promise<{ success: boolean; completedAt: string }> {
    return {
      success: true,
      completedAt: new Date().toISOString(),
    };
  }
}

export const questionnaireService = new QuestionnaireService();
