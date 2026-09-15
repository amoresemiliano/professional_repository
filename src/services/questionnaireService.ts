/**
 * Vegen Digital — Questionnaire Service (Frontera de Servicio / Dependency Inversion)
 * Define el contrato para persistencia y recuperación del cuestionario.
 * En F1.2 trabaja sobre estado local/memoria.
 * En F2 se conectará con los endpoints del backend.
 */

import { ServiceItem, ServiceAnswerItem, TargetAudienceItem } from '../types';
import { INITIAL_SERVICES } from '../config/defaults';

export interface QuestionnaireState {
  services: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  audiences: TargetAudienceItem[];
  differentials: string[];
  customDifferentialText: string;
  finalPitch: string;
}

/**
 * Factory que genera el estado verdaderamente limpio para un nuevo cuestionario.
 * Sin respuestas mock hardcodeadas, sin descripciones prefabricadas, sin notas prellenadas.
 */
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

class QuestionnaireService {
  /**
   * Obtiene la configuración y datos iniciales para un nuevo cuestionario limpio
   */
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
