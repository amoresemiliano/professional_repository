import { useState, useEffect, useTransition } from 'react';
import {
  ServiceItem,
  ServiceAnswerItem,
  TargetAudienceItem,
} from '../../types';
import { QUESTIONNAIRE_STEPS, TOTAL_STEPS } from '../../config/stepsConfig';
import { questionnaireService, getInitialQuestionnaireState } from '../../services/questionnaireService';
import { ProgressBar } from './ProgressBar';
import { NavigationControls } from './NavigationControls';

// Modular Step Components (SOLID: Single Responsibility)
import { Step1Oferta } from './steps/Step1Oferta';
import { Step2Prioritarios } from './steps/Step2Prioritarios';
import { Step3Descripcion } from './steps/Step3Descripcion';
import { Step4Precios } from './steps/Step4Precios';
import { Step5Mercado } from './steps/Step5Mercado';
import { Step6Rentabilidad } from './steps/Step6Rentabilidad';
import { Step7Facilidad } from './steps/Step7Facilidad';
import { Step8Remoto } from './steps/Step8Remoto';
import { Step9Publicos } from './steps/Step9Publicos';
import { Step10Diferenciales } from './steps/Step10Diferenciales';
import { Step11Resumen } from './steps/Step11Resumen';

interface QuestionnaireViewProps {
  onAutoSaveStatusChange?: (status: 'saved' | 'saving' | 'idle') => void;
  onNavigateToAdmin?: () => void;
  clientName?: string;
}

export function QuestionnaireView({
  onAutoSaveStatusChange,
}: QuestionnaireViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [, startTransition] = useTransition();

  // Estados del cuestionario inicializados limpios mediante factory (sin respuestas mock ni valores prefabricados)
  const [initialState] = useState(() => getInitialQuestionnaireState());
  const [services, setServices] = useState<ServiceItem[]>(initialState.services);
  const [answers, setAnswers] = useState<Record<string, ServiceAnswerItem>>(initialState.answers);
  const [audiences, setAudiences] = useState<TargetAudienceItem[]>(initialState.audiences);
  const [differentials, setDifferentials] = useState<string[]>(initialState.differentials);
  const [customDifferentialText, setCustomDifferentialText] = useState(initialState.customDifferentialText);
  const [finalPitch, setFinalPitch] = useState(initialState.finalPitch);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Servicios prioritarios activos
  const priorityServices = services.filter((s) => s.isPriority);

  // Autosave simulado
  useEffect(() => {
    onAutoSaveStatusChange?.('saving');
    const timer = setTimeout(() => {
      questionnaireService.autoSaveAnswers(answers);
      onAutoSaveStatusChange?.('saved');
    }, 600);
    return () => clearTimeout(timer);
  }, [services, answers, audiences, differentials, customDifferentialText, finalPitch, onAutoSaveStatusChange]);

  // Manejadores para Paso 1 (Oferta)
  const handleToggleServiceSelection = (serviceName: string) => {
    const exists = services.find((s) => s.name === serviceName);
    if (exists) {
      if (services.length <= 1) return;
      setServices(services.filter((s) => s.name !== serviceName));
    } else {
      const newService: ServiceItem = {
        id: `s-${Date.now()}`,
        name: serviceName,
        isPriority: false,
      };
      setServices([...services, newService]);
    }
  };

  const handleAddCustomService = (name: string) => {
    const newService: ServiceItem = {
      id: `custom-${Date.now()}`,
      name,
      isPriority: false,
      isCustom: true,
    };
    setServices([...services, newService]);
  };

  const handleRemoveCustomService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  // Manejador para Paso 2 (Prioritarios)
  const handleTogglePriority = (serviceId: string) => {
    setServices(
      services.map((s) => {
        if (s.id === serviceId) {
          return { ...s, isPriority: !s.isPriority };
        }
        return s;
      })
    );
  };

  // Manejador genérico para actualizar respuestas por servicio
  const handleUpdateAnswer = (serviceId: string, updates: Partial<ServiceAnswerItem>) => {
    setAnswers((prev) => {
      const existing = prev[serviceId] || { serviceId };
      return {
        ...prev,
        [serviceId]: {
          ...existing,
          ...updates,
          serviceId,
        },
      };
    });
  };

  // Navegación fluida entre pasos
  const handleGoToStep = (stepNumber: number) => {
    startTransition(() => {
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNext = () => {
    if (currentStep < 11) {
      handleGoToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      handleGoToStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await questionnaireService.submitQuestionnaire({
        services,
        answers,
        targetAudiences: audiences,
        customAudiences: [],
        differentials,
        customDifferentialText,
        valueProposition: finalPitch,
        isCompleted: true,
      });
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepMeta = QUESTIONNAIRE_STEPS.find((s) => s.id === currentStep);

  return (
    <div className="container-form" style={{ padding: 'var(--space-6) var(--space-4)' }}>
      <main id="main-content" tabIndex={-1}>
        {/* Barra de Progreso Accesible y Adaptativa */}
        <ProgressBar currentStep={currentStep} stepMeta={currentStepMeta} />

        {/* Renderizado Desacoplado de Pasos */}
        {currentStep === 1 && (
          <Step1Oferta
            services={services}
            onToggleService={handleToggleServiceSelection}
            onAddCustomService={handleAddCustomService}
            onRemoveCustomService={handleRemoveCustomService}
          />
        )}

        {currentStep === 2 && (
          <Step2Prioritarios
            services={services}
            priorityServices={priorityServices}
            onTogglePriority={handleTogglePriority}
          />
        )}

        {currentStep === 3 && (
          <Step3Descripcion
            priorityServices={priorityServices}
            answers={answers}
            onUpdateAnswer={handleUpdateAnswer}
          />
        )}

        {currentStep === 4 && (
          <Step4Precios
            priorityServices={priorityServices}
            answers={answers}
            onUpdateAnswer={handleUpdateAnswer}
          />
        )}

        {currentStep === 5 && (
          <Step5Mercado
            priorityServices={priorityServices}
            answers={answers}
            onUpdateAnswer={handleUpdateAnswer}
          />
        )}

        {currentStep === 6 && (
          <Step6Rentabilidad
            services={services}
            answers={answers}
            onUpdateAnswer={handleUpdateAnswer}
          />
        )}

        {currentStep === 7 && (
          <Step7Facilidad
            priorityServices={priorityServices}
            answers={answers}
            onUpdateAnswer={handleUpdateAnswer}
          />
        )}

        {currentStep === 8 && (
          <Step8Remoto
            priorityServices={priorityServices}
            answers={answers}
            onUpdateAnswer={handleUpdateAnswer}
          />
        )}

        {currentStep === 9 && (
          <Step9Publicos
            audiences={audiences}
            onSetAudiences={setAudiences}
          />
        )}

        {currentStep === 10 && (
          <Step10Diferenciales
            differentials={differentials}
            customDifferentialText={customDifferentialText}
            finalPitch={finalPitch}
            onSetDifferentials={setDifferentials}
            onSetCustomDifferentialText={setCustomDifferentialText}
            onSetFinalPitch={setFinalPitch}
          />
        )}

        {currentStep === 11 && (
          <Step11Resumen
            services={services}
            audiences={audiences}
            differentials={differentials}
            customDifferentialText={customDifferentialText}
            finalPitch={finalPitch}
            isSubmitted={isSubmitted}
            onGoToStep={handleGoToStep}
            onResetSubmission={() => setIsSubmitted(false)}
          />
        )}

        {/* Controles de Navegación del Cuestionario */}
        {!isSubmitted && (
          <NavigationControls
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS + 1}
            onPrev={handlePrev}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isNextDisabled={currentStep === 2 && priorityServices.length === 0}
            submitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
}
