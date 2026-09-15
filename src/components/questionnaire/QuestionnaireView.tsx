import { useState, useEffect, useTransition } from 'react';
import {
  ServiceItem,
  ServiceAnswerItem,
  TargetAudienceItem,
} from '../../types';
import {
  INITIAL_SERVICES,
  INITIAL_TARGET_AUDIENCES,
  DEFAULT_DIFFERENTIAL_OPTIONS,
} from '../../config/defaults';
import { QUESTIONNAIRE_STEPS, TOTAL_STEPS } from '../../config/stepsConfig';
import { questionnaireService } from '../../services/questionnaireService';
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

  // Estados del cuestionario
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [answers, setAnswers] = useState<Record<string, ServiceAnswerItem>>({
    s1: {
      serviceId: 's1',
      clientProblem: 'Extranjeros que desean regularizar su residencia en España o invertir en el país y requieren asesoramiento legal integral.',
      solutionActions: 'Elaboración del expediente, solicitud de NIE, gestión de visados ante la UGE o consulados y seguimiento continuo.',
      expectedResult: 'Concesión de la autorización de residencia o visado de nómada digital / inversor.',
      typicalDuration: '3 a 6 semanas',
      pricingModel: 'range',
      priceMin: '1200',
      priceMax: '1800',
      priceNotes: '50% a la firma del encargo y 50% tras la resolución favorable',
      marketPosition: 'above',
      profitabilityScore: 5,
      operationalEaseScore: 4,
      operationalIssues: ['citas_consulares', 'demoras_administracion'],
      remoteCapability: 'online_100',
      remoteChannels: ['videollamada', 'whatsapp', 'email', 'firma_electronica'],
    },
    s2: {
      serviceId: 's2',
      clientProblem: 'Residentes legales en España que cumplen el plazo para solicitar la nacionalidad por residencia.',
      solutionActions: 'Preparación de documentación, exámenes DELE y CCSE, presentación telemática por plataforma colegial y recursos.',
      expectedResult: 'Resolución favorable de concesión de nacionalidad española.',
      typicalDuration: '4 a 12 meses',
      pricingModel: 'fixed',
      priceMin: '750',
      priceMax: '950',
      marketPosition: 'similar',
      profitabilityScore: 4,
      operationalEaseScore: 4,
      remoteCapability: 'online_mostly',
      remoteChannels: ['email', 'firma_electronica', 'plataforma_archivos'],
    },
    s3: {
      serviceId: 's3',
      clientProblem: 'Personas extranjeras en situación administrativa irregular que cumplen requisitos de permanencia y arraigo.',
      solutionActions: 'Revisión exhaustiva de documentación laboral, social o formativa, informes de inserción y presentación ante Extranjería.',
      expectedResult: 'Autorización inicial de residencia por circunstancias excepcionales.',
      typicalDuration: '2 a 5 meses',
      pricingModel: 'range',
      priceMin: '850',
      priceMax: '1100',
      marketPosition: 'similar',
      profitabilityScore: 3,
      operationalEaseScore: 3,
      operationalIssues: ['documentacion_incompleta', 'demoras_administracion'],
      remoteCapability: 'online_mostly',
      remoteChannels: ['whatsapp', 'email'],
    },
  });

  const [audiences, setAudiences] = useState<TargetAudienceItem[]>(INITIAL_TARGET_AUDIENCES);
  const [differentials, setDifferentials] = useState<string[]>(DEFAULT_DIFFERENTIAL_OPTIONS);
  const [customDifferentialText, setCustomDifferentialText] = useState('');
  const [finalPitch, setFinalPitch] = useState(
    'Acompañamos personalmente cada expediente con comunicación transparente y gestión 100% telemática en toda España.'
  );

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
