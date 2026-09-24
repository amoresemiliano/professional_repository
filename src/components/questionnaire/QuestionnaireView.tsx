import { useState, useEffect, useRef, useTransition } from 'react';
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
  onClientNameLoaded?: (name: string) => void;
  initialToken?: string | null;
}

export function QuestionnaireView({
  onAutoSaveStatusChange,
  onClientNameLoaded,
  initialToken,
}: QuestionnaireViewProps) {
  // Extraer token desde prop o URL (/q/{token} o ?token={token})
  const [token] = useState<string | null>(() => {
    if (initialToken) return initialToken;
    const searchParams = new URLSearchParams(window.location.search);
    const fromQuery = searchParams.get('token');
    if (fromQuery) return fromQuery;
    const pathMatch = window.location.pathname.match(/\/q\/([a-zA-Z0-9_-]+)/);
    return pathMatch ? pathMatch[1] : null;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [, startTransition] = useTransition();

  // Estados del cuestionario inicializados limpios mediante factory
  const [initialState] = useState(() => getInitialQuestionnaireState());
  const [services, setServices] = useState<ServiceItem[]>(initialState.services);
  const [answers, setAnswers] = useState<Record<string, ServiceAnswerItem>>(initialState.answers);
  const [audiences, setAudiences] = useState<TargetAudienceItem[]>(initialState.audiences);
  const [differentials, setDifferentials] = useState<string[]>(initialState.differentials);
  const [customDifferentialText, setCustomDifferentialText] = useState(initialState.customDifferentialText);
  const [finalPitch, setFinalPitch] = useState(initialState.finalPitch);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadedFromBackend, setIsLoadedFromBackend] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs de control estricto para evitar loops de renderizado y re-peticiones innecesarias
  const lastSavedPayloadRef = useRef<string>('');
  const isHydratingRef = useRef<boolean>(true);
  const isSavingRef = useRef<boolean>(false);
  const onAutoSaveStatusChangeRef = useRef(onAutoSaveStatusChange);

  useEffect(() => {
    onAutoSaveStatusChangeRef.current = onAutoSaveStatusChange;
  }, [onAutoSaveStatusChange]);

  // Helper centralizado para construir el objeto de carga útil hacia el backend
  const buildPayloadObj = (
    currentServices: ServiceItem[],
    currentAnswers: Record<string, ServiceAnswerItem>,
    currentAudiences: TargetAudienceItem[],
    currentDifferentials: string[],
    customDiffText: string,
    pitch: string,
    step: number
  ) => {
    const mappedServices = currentServices.map((s, idx) => {
      const ans = currentAnswers[s.id] || {};
      return {
        id: s.id,
        name: s.name,
        is_custom: s.isCustom ? 1 : 0,
        is_priority: s.isPriority ? 1 : 0,
        display_order: idx + 1,
        client_problem: ans.clientProblem || null,
        solution_actions: ans.solutionActions || null,
        expected_result: ans.expectedResult || null,
        typical_duration: ans.typicalDuration || null,
        pricing_model: ans.pricingModel || null,
        price_min: ans.priceMin || null,
        price_max: ans.priceMax || null,
        currency: ans.currency || 'EUR',
        price_notes: ans.priceNotes || null,
        market_position: ans.marketPosition || null,
        estimated_market_price: ans.estimatedMarketPrice || null,
        market_notes: ans.marketNotes || null,
        profitability_score: ans.profitabilityScore || null,
        profitability_is_uncertain: ans.profitabilityIsUncertain ? 1 : 0,
        operational_ease_score: ans.operationalEaseScore || null,
        operational_issues: ans.operationalIssues || null,
        operational_issues_other: ans.operationalIssuesOther || null,
        operational_notes: ans.operationalNotes || null,
        remote_capability: ans.remoteCapability || null,
        remote_channels: ans.remoteChannels || null,
        remote_channels_other: ans.remoteChannelsOther || null,
        remote_notes: ans.remoteNotes || null,
      };
    });

    const mappedAudiences = currentAudiences.map((a) => ({
      audience_key: a.key,
      custom_label: a.label,
      priority: a.priority || 'medium',
    }));

    const mappedDifferentials = currentDifferentials.map((d) => ({
      differential_key: d,
      custom_label: d === 'others' ? (customDiffText || null) : null,
    }));

    return {
      current_step: step,
      final_pitch: pitch,
      services: mappedServices,
      target_audiences: mappedAudiences,
      differentials: mappedDifferentials,
    };
  };

  // Servicios prioritarios activos
  const priorityServices = services.filter((s) => s.isPriority);

  const onClientNameLoadedRef = useRef(onClientNameLoaded);
  useEffect(() => {
    onClientNameLoadedRef.current = onClientNameLoaded;
  }, [onClientNameLoaded]);

  // 1. Cargar datos del cuestionario desde el backend si existe token
  useEffect(() => {
    if (!token) {
      setSubmitError('Acceso no válido: No se detectó un token de cuestionario en la URL. Por favor use el enlace único facilidado por su consultor (ej: /q/TOKEN).');
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const loaded = await questionnaireService.load(token);
        if (!isMounted) return;

        if (!loaded) {
          setSubmitError('No fue posible cargar el cuestionario desde el servidor. El enlace puede ser inválido o haber expirado.');
          return;
        }

        setSubmitError(null);

        if (loaded.client_name) {
          onClientNameLoadedRef.current?.(loaded.client_name);
        }

        let loadedServices: ServiceItem[] = [];
        let loadedAnswers: Record<string, ServiceAnswerItem> = {};
        let loadedAudiences: TargetAudienceItem[] = [];
        let loadedDiffs: string[] = [];
        let loadedCustomDiffText = '';
        let loadedPitch = loaded.final_pitch || '';
        let loadedStep = loaded.current_step && loaded.current_step >= 1 && loaded.current_step <= 11 ? loaded.current_step : 1;

        if (Array.isArray(loaded.services) && loaded.services.length > 0) {
          loaded.services.forEach((s: any) => {
            loadedServices.push({
              id: s.id,
              name: s.name,
              isCustom: Boolean(Number(s.is_custom)),
              isPriority: Boolean(Number(s.is_priority)),
              displayOrder: Number(s.display_order),
            });

            loadedAnswers[s.id] = {
              serviceId: s.id,
              clientProblem: s.client_problem || '',
              solutionActions: s.solution_actions || '',
              expectedResult: s.expected_result || '',
              typicalDuration: s.typical_duration || '',
              pricingModel: s.pricing_model || '',
              priceMin: s.price_min ? Number(s.price_min) : undefined,
              priceMax: s.price_max ? Number(s.price_max) : undefined,
              currency: s.currency || 'EUR',
              priceNotes: s.price_notes || '',
              marketPosition: s.market_position || '',
              estimatedMarketPrice: s.estimated_market_price ? Number(s.estimated_market_price) : undefined,
              marketNotes: s.market_notes || '',
              profitabilityScore: s.profitability_score ? Number(s.profitability_score) : undefined,
              profitabilityIsUncertain: Boolean(Number(s.profitability_is_uncertain)),
              operationalEaseScore: s.operational_ease_score ? Number(s.operational_ease_score) : undefined,
              operationalIssues: s.operational_issues ? (typeof s.operational_issues === 'string' ? JSON.parse(s.operational_issues) : s.operational_issues) : [],
              operationalIssuesOther: s.operational_issues_other || '',
              operationalNotes: s.operational_notes || '',
              remoteCapability: s.remote_capability || '',
              remoteChannels: s.remote_channels ? (typeof s.remote_channels === 'string' ? JSON.parse(s.remote_channels) : s.remote_channels) : [],
              remoteChannelsOther: s.remote_channels_other || '',
              remoteNotes: s.remote_notes || '',
            };
          });

          setServices(loadedServices);
          setAnswers(loadedAnswers);
        } else {
          loadedServices = services;
        }

        if (Array.isArray(loaded.target_audiences) && loaded.target_audiences.length > 0) {
          loadedAudiences = loaded.target_audiences.map((a: any) => ({
            key: a.audience_key,
            label: a.custom_label || a.audience_key,
            priority: a.priority || 'medium',
          }));
          setAudiences(loadedAudiences);
        }

        if (Array.isArray(loaded.differentials) && loaded.differentials.length > 0) {
          loadedDiffs = loaded.differentials.map((d: any) => d.differential_key);
          setDifferentials(loadedDiffs);
          const otherDiff = loaded.differentials.find((d: any) => d.differential_key === 'others');
          if (otherDiff && otherDiff.custom_label) {
            loadedCustomDiffText = otherDiff.custom_label;
            setCustomDifferentialText(loadedCustomDiffText);
          }
        }

        if (loaded.final_pitch) {
          setFinalPitch(loadedPitch);
        }

        if (loadedStep) {
          setCurrentStep(loadedStep);
        }

        if (loaded.status === 'COMPLETED') {
          setIsSubmitted(true);
        }

        // Registrar la carga útil inicial para evitar PUT inmediato de hidratación
        const initialPayload = buildPayloadObj(
          loadedServices,
          loadedAnswers,
          loadedAudiences,
          loadedDiffs,
          loadedCustomDiffText,
          loadedPitch,
          loadedStep
        );
        lastSavedPayloadRef.current = JSON.stringify(initialPayload);
        isHydratingRef.current = false;
        setIsLoadedFromBackend(true);
      } catch (err) {
        if (isMounted) {
          setSubmitError('Error de red al cargar el cuestionario desde el servidor.');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Autosave incremental real contra backend (con Debounce + Hydration & Change Guard + Concurrency Lock)
  useEffect(() => {
    if (!token || isHydratingRef.current || !isLoadedFromBackend || isSubmitted) {
      return;
    }

    const currentPayloadObj = buildPayloadObj(
      services,
      answers,
      audiences,
      differentials,
      customDifferentialText,
      finalPitch,
      currentStep
    );
    const currentPayloadStr = JSON.stringify(currentPayloadObj);

    // HYDRATION & CHANGE GUARD: No disparar PUT si el payload no ha sufrido modificaciones reales
    if (currentPayloadStr === lastSavedPayloadRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      onAutoSaveStatusChangeRef.current?.('saving');

      try {
        const saved = await questionnaireService.save(token, currentPayloadObj);

        if (saved) {
          lastSavedPayloadRef.current = currentPayloadStr;
          setSubmitError(null);
          onAutoSaveStatusChangeRef.current?.('saved');
        } else {
          setSubmitError('Fallo al guardar cambios en el servidor. Verifique su conexión.');
          onAutoSaveStatusChangeRef.current?.('idle');
        }
      } catch {
        setSubmitError('Error de red durante el guardado automático.');
        onAutoSaveStatusChangeRef.current?.('idle');
      } finally {
        isSavingRef.current = false;
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [services, answers, audiences, differentials, customDifferentialText, finalPitch, currentStep, token, isLoadedFromBackend, isSubmitted]);

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
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!token || !isLoadedFromBackend) {
        setSubmitError('Imposible enviar: El cuestionario no está vinculado con el servidor. Acceda mediante su enlace personal.');
        return;
      }

      const mappedServices = services.map((s, idx) => {
        const ans = answers[s.id] || {};
        return {
          id: s.id,
          name: s.name,
          is_custom: s.isCustom ? 1 : 0,
          is_priority: s.isPriority ? 1 : 0,
          display_order: idx + 1,
          client_problem: ans.clientProblem || null,
          solution_actions: ans.solutionActions || null,
          expected_result: ans.expectedResult || null,
          typical_duration: ans.typicalDuration || null,
          pricing_model: ans.pricingModel || null,
          price_min: ans.priceMin || null,
          price_max: ans.priceMax || null,
          currency: ans.currency || 'EUR',
          price_notes: ans.priceNotes || null,
          market_position: ans.marketPosition || null,
          estimated_market_price: ans.estimatedMarketPrice || null,
          market_notes: ans.marketNotes || null,
          profitability_score: ans.profitabilityScore || null,
          profitability_is_uncertain: ans.profitabilityIsUncertain ? 1 : 0,
          operational_ease_score: ans.operationalEaseScore || null,
          operational_issues: ans.operationalIssues || null,
          operational_issues_other: ans.operationalIssuesOther || null,
          operational_notes: ans.operationalNotes || null,
          remote_capability: ans.remoteCapability || null,
          remote_channels: ans.remoteChannels || null,
          remote_channels_other: ans.remoteChannelsOther || null,
          remote_notes: ans.remoteNotes || null,
        };
      });

      const mappedAudiences = audiences.map(a => ({
        audience_key: a.key,
        custom_label: a.label,
        priority: a.priority || 'medium',
      }));

      const mappedDifferentials = differentials.map(d => ({
        differential_key: d,
        custom_label: d === 'others' ? (customDifferentialText || null) : null,
      }));

      const res = await questionnaireService.submit(token, {
        final_pitch: finalPitch,
        services: mappedServices,
        target_audiences: mappedAudiences,
        differentials: mappedDifferentials,
      });

      if (res.success) {
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitError(res.error || 'No se pudo completar el envío del diagnóstico.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error inesperado al enviar el diagnóstico.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepMeta = QUESTIONNAIRE_STEPS.find((s) => s.id === currentStep);

  return (
    <div className="container-form" style={{ padding: 'var(--space-6) var(--space-4)' }}>
      <main id="main-content" tabIndex={-1}>
        {/* Mensaje de Error en Envío/Persistencia */}
        {submitError && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-light)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-danger)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <strong>Error al procesar el cuestionario:</strong> {submitError}
          </div>
        )}

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
            priorityServices={priorityServices}
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
            priorityServices={priorityServices}
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
