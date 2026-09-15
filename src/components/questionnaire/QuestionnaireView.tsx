import React, { useState } from 'react';
import {
  ServiceItem,
  ServiceAnswerItem,
  TargetAudienceItem,
  PricingModel,
  MarketPosition,
  RemoteCapability,
} from '../../types';
import {
  DEFAULT_SERVICES,
  OPERATIONAL_ISSUES_OPTIONS,
  REMOTE_CHANNELS_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  DIFFERENTIAL_OPTIONS,
} from '../../config/defaults';
import { Button } from '../common/Button';
import { Card, CardBody, CardHeader } from '../common/Card';
import { ChoiceCard } from '../common/ChoiceCard';
import { ScaleSelector } from '../common/ScaleSelector';
import { FormGroup, FormLabel, Input, Textarea, Select } from '../common/FormControls';
import { Badge } from '../common/Badge';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconStar,
  IconInfo,
} from '../common/Icons';

interface QuestionnaireViewProps {
  clientName?: string;
}

export function QuestionnaireView({ clientName: _clientName }: QuestionnaireViewProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  // Estado de servicios (Paso 1)
  const [services, setServices] = useState<ServiceItem[]>([
    { id: '1', name: 'Extranjería', isPriority: true },
    { id: '2', name: 'Visados / residencia', isPriority: true },
    { id: '3', name: 'Nacionalidad', isPriority: true },
    { id: '4', name: 'Constitución de empresas', isPriority: false },
    { id: '5', name: 'Contratos', isPriority: false },
  ]);
  const [customServiceName, setCustomServiceName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Respuestas por servicio (Pasos 3 a 8) — Inicialmente vacías para permitir el funcionamiento natural de los placeholders
  const [answers, setAnswers] = useState<Record<string, ServiceAnswerItem>>({});

  // Paso 9: Públicos objetivo
  const [audiences, setAudiences] = useState<TargetAudienceItem[]>([]);

  // Paso 10: Diferenciales y Pitch (sin texto precargado en values)
  const [differentials, setDifferentials] = useState<string[]>([]);
  const [customDifferentialText, setCustomDifferentialText] = useState('');
  const [finalPitch, setFinalPitch] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Helper para respuestas de servicio
  const updateServiceAnswer = (serviceId: string, updates: Partial<ServiceAnswerItem>) => {
    setAnswers((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { serviceId }),
        ...updates,
      },
    }));
  };

  const priorityServices = services.filter((s) => s.isPriority);

  // Manejador de navegación
  const handleNext = () => {
    if (currentStep < totalSteps + 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddCustomService = () => {
    if (!customServiceName.trim()) return;
    const newService: ServiceItem = {
      id: `custom-${Date.now()}`,
      name: customServiceName.trim(),
      isCustom: true,
      isPriority: false,
    };
    setServices([...services, newService]);
    setCustomServiceName('');
    setShowAddCustom(false);
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const toggleServiceSelection = (name: string) => {
    const existing = services.find((s) => s.name === name);
    if (existing) {
      setServices(services.filter((s) => s.name !== name));
    } else {
      setServices([...services, { id: `service-${Date.now()}`, name, isPriority: false }]);
    }
  };

  const togglePriority = (id: string) => {
    setServices(
      services.map((s) => {
        if (s.id === id) {
          return { ...s, isPriority: !s.isPriority };
        }
        return s;
      })
    );
  };

  // Renderizado condicional de pasos
  return (
    <main className="questionnaire-main">
      <div className="container container-form">
        {/* Barra de Progreso */}
        <section className="progress-section" aria-label="Progreso del diagnóstico">
          <div className="progress-header">
            <span className="progress-step-count">
              {currentStep <= totalSteps ? `Paso ${currentStep} de ${totalSteps}` : 'Revisión final'}
            </span>
            <span className="progress-step-title">
              {currentStep === 1 && 'Oferta'}
              {currentStep === 2 && 'Prioritarios'}
              {currentStep === 3 && 'Descripción'}
              {currentStep === 4 && 'Precios y modalidad'}
              {currentStep === 5 && 'Posición frente al mercado'}
              {currentStep === 6 && 'Rentabilidad percibida'}
              {currentStep === 7 && 'Facilidad operativa'}
              {currentStep === 8 && 'Capacidad de prestación remota'}
              {currentStep === 9 && 'Público objetivo'}
              {currentStep === 10 && 'Diferenciales y propuesta'}
              {currentStep === 11 && 'Resumen antes del envío'}
            </span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps + 1}>
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (currentStep / (totalSteps + 1)) * 100)}%` }}
            />
          </div>
        </section>

        {/* =========================================================================
            PASO 1: SERVICIOS (OFERTA)
            ========================================================================= */}
        {currentStep === 1 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">¿Cuáles son tus principales servicios?</h1>
              <p className="step-description">
                Selecciona todos los servicios que ofreces actualmente. Puedes añadir personalizados con el botón inferior.
              </p>
            </header>

            <div className="grid-1" style={{ marginBottom: 'var(--space-4)' }}>
              {DEFAULT_SERVICES.map((serviceName) => {
                const isSelected = services.some((s) => s.name === serviceName);
                return (
                  <ChoiceCard
                    key={serviceName}
                    title={serviceName}
                    selected={isSelected}
                    type="checkbox"
                    onToggle={() => toggleServiceSelection(serviceName)}
                  />
                );
              })}

              {/* Servicios Personalizados */}
              {services
                .filter((s) => s.isCustom)
                .map((custom) => (
                  <ChoiceCard
                    key={custom.id}
                    title={custom.name}
                    selected={true}
                    badge={<Badge variant="neutral">Personalizado</Badge>}
                    type="checkbox"
                    onToggle={() => {}}
                    actionButton={
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-ghost"
                        onClick={() => handleRemoveService(custom.id)}
                        title="Eliminar servicio personalizado"
                        aria-label={`Eliminar ${custom.name}`}
                      >
                        <IconTrash size={14} />
                      </button>
                    }
                  />
                ))}
            </div>

            {/* Añadir Servicio Personalizado */}
            {!showAddCustom ? (
              <Button
                variant="secondary"
                onClick={() => setShowAddCustom(true)}
              >
                + Añadir
              </Button>
            ) : (
              <Card>
                <CardBody>
                  <FormLabel htmlFor="custom-service-input">Nombre del nuevo servicio</FormLabel>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Input
                      id="custom-service-input"
                      placeholder="Ej: Consultoría, Asesoría integral..."
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomService();
                        }
                      }}
                    />
                    <Button variant="primary" onClick={handleAddCustomService}>
                      Guardar
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddCustom(false)}>
                      Cancelar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {/* =========================================================================
            PASO 2: PRIORIDADES (PRIORITARIOS)
            ========================================================================= */}
        {currentStep === 2 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">¿Cuáles consideras tus servicios principales?</h1>
              <p className="step-description">
                Indica entre 3 y 5 servicios que te interesan especialmente desarrollar o para los cuales quieres captar más clientes.
              </p>
            </header>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  Prioritarios seleccionados:{' '}
                  <strong>{priorityServices.length}</strong> de {services.length}
                </span>
                {priorityServices.length >= 3 && priorityServices.length <= 5 && (
                  <Badge variant="success" icon={<IconCheck size={12} />}>
                    Selección óptima (3 a 5)
                  </Badge>
                )}
              </div>

              <div className="grid-1">
                {services.map((service) => (
                  <ChoiceCard
                    key={service.id}
                    title={service.name}
                    selected={!!service.isPriority}
                    type="checkbox"
                    badge={
                      service.isPriority ? (
                        <Badge variant="priority" icon={<IconStar size={12} filled />}>
                          Prioritario
                        </Badge>
                      ) : null
                    }
                    onToggle={() => togglePriority(service.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 3: DESCRIPCIÓN DE SERVICIOS PRIORITARIOS (DESCRIPCIÓN)
            ========================================================================= */}
        {currentStep === 3 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Descripción de tus servicios prioritarios</h1>
              <p className="step-description">
                Comprender el problema y la solución de cada servicio permite estructurar una
                propuesta clara y orientada a resultados.
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {priorityServices.map((service) => {
                const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
                return (
                  <Card key={service.id}>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <IconStar size={16} filled style={{ color: 'var(--color-warning)' }} />
                        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                          {service.name}
                        </h2>
                      </div>
                      <Badge variant="priority">Prioritario</Badge>
                    </CardHeader>
                    <CardBody>
                      <FormGroup>
                        <FormLabel htmlFor={`prob-${service.id}`}>
                          1. ¿Cuál es el problema frecuente del cliente cuando te contacta?
                        </FormLabel>
                        <Textarea
                          id={`prob-${service.id}`}
                          placeholder="Describe la situación, urgencia o conflicto inicial del cliente..."
                          value={ans.clientProblem || ''}
                          onChange={(e) => updateServiceAnswer(service.id, { clientProblem: e.target.value })}
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormLabel htmlFor={`sol-${service.id}`}>
                          2. ¿Cómo lo resuelves?
                        </FormLabel>
                        <Textarea
                          id={`sol-${service.id}`}
                          placeholder="Estrategia, gestiones o metodología que llevas a cabo..."
                          value={ans.solutionActions || ''}
                          onChange={(e) => updateServiceAnswer(service.id, { solutionActions: e.target.value })}
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormLabel htmlFor={`res-${service.id}`}>
                          3. ¿Qué resultado concreto esperas obtener?
                        </FormLabel>
                        <Input
                          id={`res-${service.id}`}
                          placeholder="Ej: Concesión de trámite, resolución favorable, objetivo alcanzado..."
                          value={ans.expectedResult || ''}
                          onChange={(e) => updateServiceAnswer(service.id, { expectedResult: e.target.value })}
                        />
                      </FormGroup>

                      <FormGroup style={{ marginBottom: 0 }}>
                        <FormLabel htmlFor={`dur-${service.id}`}>
                          4. ¿Cuánto suele durar el proceso?
                        </FormLabel>
                        <Input
                          id={`dur-${service.id}`}
                          placeholder="Ej: 2 a 4 semanas, 3 a 6 meses..."
                          value={ans.typicalDuration || ''}
                          onChange={(e) => updateServiceAnswer(service.id, { typicalDuration: e.target.value })}
                        />
                      </FormGroup>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 4: PRECIO
            ========================================================================= */}
        {currentStep === 4 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Precios y modalidad de cobro</h1>
              <p className="step-description">
                Indicá cómo cobrás tus servicios prioritarios. Si el importe varía según el caso,
                podés indicar un rango o seleccionar la modalidad correspondiente.
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {priorityServices.map((service) => {
                const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
                return (
                  <Card key={service.id}>
                    <CardHeader>
                      <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {service.name}
                      </h2>
                    </CardHeader>
                    <CardBody>
                      <div className="grid-2">
                        <FormGroup>
                          <FormLabel htmlFor={`pricing-model-${service.id}`}>Modalidad de cobro</FormLabel>
                          <Select
                            id={`pricing-model-${service.id}`}
                            value={ans.pricingModel || 'fixed'}
                            onChange={(e) =>
                              updateServiceAnswer(service.id, {
                                pricingModel: e.target.value as PricingModel,
                              })
                            }
                            options={[
                              { value: 'fixed', label: 'Precio cerrado (tarifa plana)' },
                              { value: 'hourly', label: 'Por hora' },
                              { value: 'range', label: 'Rango de precios' },
                              { value: 'complexity', label: 'Según complejidad del caso' },
                              { value: 'other', label: 'Otro modelo' },
                            ]}
                          />
                        </FormGroup>

                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                          <FormGroup style={{ flex: 1 }}>
                            <FormLabel htmlFor={`price-min-${service.id}`} optional>
                              Precio mín. (€)
                            </FormLabel>
                            <Input
                              id={`price-min-${service.id}`}
                              type="number"
                              placeholder="Ej: 750"
                              value={ans.priceMin || ''}
                              onChange={(e) => updateServiceAnswer(service.id, { priceMin: e.target.value })}
                            />
                          </FormGroup>

                          <FormGroup style={{ flex: 1 }}>
                            <FormLabel htmlFor={`price-max-${service.id}`} optional>
                              Precio máx. (€)
                            </FormLabel>
                            <Input
                              id={`price-max-${service.id}`}
                              type="number"
                              placeholder="Ej: 1200"
                              value={ans.priceMax || ''}
                              onChange={(e) => updateServiceAnswer(service.id, { priceMax: e.target.value })}
                            />
                          </FormGroup>
                        </div>
                      </div>

                      <FormGroup style={{ marginBottom: 0 }}>
                        <FormLabel htmlFor={`price-notes-${service.id}`} optional>
                          Observaciones sobre el precio o condiciones de pago
                        </FormLabel>
                        <Input
                          id={`price-notes-${service.id}`}
                          placeholder="Ej: Pago fraccionado 50% al inicio y 50% al resolver, tasas no incluidas..."
                          value={ans.priceNotes || ''}
                          onChange={(e) => updateServiceAnswer(service.id, { priceNotes: e.target.value })}
                        />
                      </FormGroup>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 5: MERCADO
            ========================================================================= */}
        {currentStep === 5 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Posicionamiento frente al mercado</h1>
              <p className="step-description">
                ¿Cómo considerás que se encuentra tu precio respecto del promedio de mercado?
                Esta información ayuda a definir el mensaje de posicionamiento.
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {priorityServices.map((service) => {
                const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
                const currentPos = ans.marketPosition || 'unknown';

                return (
                  <Card key={service.id}>
                    <CardHeader>
                      <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {service.name}
                      </h2>
                    </CardHeader>
                    <CardBody>
                      <FormLabel>Posición percibida</FormLabel>
                      <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                        {[
                          { id: 'below', title: 'Por debajo del mercado', subtitle: 'Precio más competitivo o accesible' },
                          { id: 'similar', title: 'Similar al mercado', subtitle: 'En línea con los honorarios habituales' },
                          { id: 'above', title: 'Por encima del mercado', subtitle: 'Posicionamiento premium o especializado' },
                          { id: 'unknown', title: 'No lo sé con certeza', subtitle: 'Sin estimación de mercado definida' },
                        ].map((pos) => (
                          <ChoiceCard
                            key={pos.id}
                            title={pos.title}
                            subtitle={pos.subtitle}
                            selected={currentPos === pos.id}
                            type="radio"
                            onToggle={() =>
                              updateServiceAnswer(service.id, {
                                marketPosition: pos.id as MarketPosition,
                              })
                            }
                          />
                        ))}
                      </div>

                      <FormGroup style={{ marginBottom: 0 }}>
                        <FormLabel htmlFor={`mkt-notes-${service.id}`} optional>
                          Comentario sobre la competencia o precio de mercado
                        </FormLabel>
                        <Input
                          id={`mkt-notes-${service.id}`}
                          placeholder="Ej: Muchos despachos cobran menos pero derivan el trámite a terceros..."
                          value={ans.marketNotes || ''}
                          onChange={(e) => updateServiceAnswer(service.id, { marketNotes: e.target.value })}
                        />
                      </FormGroup>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 6: RENTABILIDAD
            ========================================================================= */}
        {currentStep === 6 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Rentabilidad por servicio</h1>
              <p className="step-description">
                ¿Cómo considerás la relación entre los honorarios que genera cada servicio y las
                horas/esfuerzo que requiere? Evaluamos todos los servicios que ofrecés.
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {services.map((service) => {
                const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
                return (
                  <Card key={service.id}>
                    <CardBody>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 'var(--space-3)',
                        }}
                      >
                        <h2 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                          {service.name}
                        </h2>
                        {service.isPriority && <Badge variant="priority">Prioritario</Badge>}
                      </div>

                      <ScaleSelector
                        id={`profitability-${service.id}`}
                        value={ans.profitabilityScore ?? 3}
                        isUncertain={ans.profitabilityIsUncertain ?? false}
                        onChange={(score, isUncertain) =>
                          updateServiceAnswer(service.id, {
                            profitabilityScore: score,
                            profitabilityIsUncertain: isUncertain,
                          })
                        }
                        options={[
                          { value: 1, label: 'Muy baja' },
                          { value: 2, label: 'Baja' },
                          { value: 3, label: 'Media' },
                          { value: 4, label: 'Alta' },
                          { value: 5, label: 'Muy alta' },
                        ]}
                      />
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 7: FACILIDAD OPERATIVA
            ========================================================================= */}
        {currentStep === 7 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Facilidad operativa y fricciones</h1>
              <p className="step-description">
                Indicá qué tan fluido o complejo resulta gestionar cada servicio y qué problemas
                administrativos o de clientes suelen aparecer con frecuencia.
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {priorityServices.map((service) => {
                const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
                const issues = ans.operationalIssues || [];

                return (
                  <Card key={service.id}>
                    <CardHeader>
                      <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {service.name}
                      </h2>
                    </CardHeader>
                    <CardBody>
                      <FormGroup>
                        <FormLabel>Facilidad de gestión operativa (1 = Muy difícil, 5 = Muy fácil)</FormLabel>
                        <ScaleSelector
                          id={`ease-${service.id}`}
                          value={ans.operationalEaseScore ?? 3}
                          isUncertain={false}
                          onChange={(score) =>
                            updateServiceAnswer(service.id, { operationalEaseScore: score })
                          }
                          options={[
                            { value: 1, label: 'Muy difícil' },
                            { value: 2, label: 'Difícil' },
                            { value: 3, label: 'Media' },
                            { value: 4, label: 'Fácil' },
                            { value: 5, label: 'Muy fácil' },
                          ]}
                          uncertainLabel="Variable según caso"
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormLabel optional>Problemas o cuellos de botella habituales</FormLabel>
                        <div className="grid-2">
                          {OPERATIONAL_ISSUES_OPTIONS.map((item) => {
                            const isSelected = issues.includes(item.id);
                            return (
                              <ChoiceCard
                                key={item.id}
                                title={item.label}
                                selected={isSelected}
                                type="checkbox"
                                onToggle={() => {
                                  const updated = isSelected
                                    ? issues.filter((i) => i !== item.id)
                                    : [...issues, item.id];
                                  updateServiceAnswer(service.id, { operationalIssues: updated });
                                }}
                              />
                            );
                          })}
                        </div>
                      </FormGroup>

                      <FormGroup style={{ marginBottom: 0 }}>
                        <FormLabel htmlFor={`ease-notes-${service.id}`} optional>
                          Comentarios sobre la operativa
                        </FormLabel>
                        <Input
                          id={`ease-notes-${service.id}`}
                          placeholder="Ej: Las citas consulares son el principal retraso del proceso..."
                          value={ans.operationalNotes || ''}
                          onChange={(e) => updateServiceAnswer(service.id, { operationalNotes: e.target.value })}
                        />
                      </FormGroup>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 8: CAPACIDAD REMOTA
            ========================================================================= */}
        {currentStep === 8 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Capacidad de prestación remota</h1>
              <p className="step-description">
                ¿Qué porcentaje de la gestión puede realizarse a distancia y por qué canales?
                Los servicios altamente remotos permiten ampliar el radio geográfico de captación.
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {priorityServices.map((service) => {
                const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
                const channels = ans.remoteChannels || [];

                return (
                  <Card key={service.id}>
                    <CardHeader>
                      <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {service.name}
                      </h2>
                    </CardHeader>
                    <CardBody>
                      <FormLabel>Modalidad habitual de prestación</FormLabel>
                      <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                        {[
                          { id: 'online_100', title: '100 % online', subtitle: 'Sin necesidad de encuentros presenciales' },
                          { id: 'online_mostly', title: 'Casi todo online', subtitle: 'Solo trámites finales o juras puntuales' },
                          { id: 'hybrid', title: 'Híbrido', subtitle: 'Requiere firma presencial o acudir al despacho' },
                          { id: 'mainly_in_person', title: 'Principalmente presencial', subtitle: 'Vistas judiciales o presencia indispensable' },
                        ].map((rem) => (
                          <ChoiceCard
                            key={rem.id}
                            title={rem.title}
                            subtitle={rem.subtitle}
                            selected={ans.remoteCapability === rem.id}
                            type="radio"
                            onToggle={() =>
                              updateServiceAnswer(service.id, {
                                remoteCapability: rem.id as RemoteCapability,
                              })
                            }
                          />
                        ))}
                      </div>

                      <FormLabel optional>Canales digitales y herramientas que utilizás</FormLabel>
                      <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                        {REMOTE_CHANNELS_OPTIONS.map((ch) => {
                          const isSelected = channels.includes(ch.id);
                          return (
                            <ChoiceCard
                              key={ch.id}
                              title={ch.label}
                              selected={isSelected}
                              type="checkbox"
                              onToggle={() => {
                                const updated = isSelected
                                  ? channels.filter((c) => c !== ch.id)
                                  : [...channels, ch.id];
                                updateServiceAnswer(service.id, { remoteChannels: updated });
                              }}
                            />
                          );
                        })}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 9: PÚBLICO OBJETIVO
            ========================================================================= */}
        {currentStep === 9 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">¿Qué tipo de cliente te interesa captar?</h1>
              <p className="step-description">
                Seleccioná los perfiles a los que diriges tu práctica e indicá el nivel de prioridad
                comercial que tiene cada uno para tu despacho.
              </p>
            </header>

            <div className="grid-1" style={{ marginBottom: 'var(--space-4)' }}>
              {TARGET_AUDIENCE_OPTIONS.map((aud) => {
                const existing = audiences.find((a) => a.key === aud.id);
                const isSelected = !!existing;

                return (
                  <Card key={aud.id}>
                    <CardBody style={{ padding: 'var(--space-4)' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setAudiences(audiences.filter((a) => a.key !== aud.id));
                              } else {
                                setAudiences([...audiences, { key: aud.id, label: aud.label, priority: 'high' }]);
                              }
                            }}
                            style={{ accentColor: 'var(--color-brand)', width: '18px', height: '18px' }}
                          />
                          <span>{aud.label}</span>
                        </label>

                        {isSelected && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                              Prioridad:
                            </span>
                            {(['high', 'medium', 'low'] as const).map((p) => (
                              <button
                                key={p}
                                type="button"
                                className={`btn btn-sm ${existing?.priority === p ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.15rem 0.5rem', minHeight: '26px' }}
                                onClick={() => {
                                  setAudiences(
                                    audiences.map((a) => (a.key === aud.id ? { ...a, priority: p } : a))
                                  );
                                }}
                              >
                                {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 10: DIFERENCIALES Y PROPUESTA DE VALOR
            ========================================================================= */}
        {currentStep === 10 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Diferenciales y propuesta de valor</h1>
              <p className="step-description">
                ¿Qué te diferencia de otros profesionales o firmas de tu especialidad?
                Esta base estructurada fundamentará los argumentos de venta en tu web y campañas.
              </p>
            </header>

            <FormGroup>
              <FormLabel>Factores diferenciales clave (elige los más representativos)</FormLabel>
              <div className="grid-2">
                {DIFFERENTIAL_OPTIONS.map((diff) => {
                  const isSelected = differentials.includes(diff.id);
                  return (
                    <ChoiceCard
                      key={diff.id}
                      title={diff.label}
                      selected={isSelected}
                      type="checkbox"
                      onToggle={() => {
                        setDifferentials(
                          isSelected ? differentials.filter((d) => d !== diff.id) : [...differentials, diff.id]
                        );
                      }}
                    />
                  );
                })}
              </div>
            </FormGroup>

            {/* Campo dinámico cuando se selecciona 'Otros' */}
            {differentials.includes('others') && (
              <FormGroup style={{ marginTop: 'var(--space-4)' }}>
                <FormLabel htmlFor="custom-diff-text">
                  Desarrolla tu factor diferencial
                </FormLabel>
                <Input
                  id="custom-diff-text"
                  placeholder="Describe qué otro factor diferencial o metodología propia ofreces..."
                  value={customDifferentialText}
                  onChange={(e) => setCustomDifferentialText(e.target.value)}
                />
              </FormGroup>
            )}

            <FormGroup style={{ marginTop: 'var(--space-6)' }}>
              <FormLabel htmlFor="final-pitch">
                Si tuvieras que explicarle en pocas palabras a un potencial cliente por qué debería
                trabajar contigo y no con otro profesional, ¿qué le dirías?
              </FormLabel>
              <Textarea
                id="final-pitch"
                rows={4}
                placeholder="Escribe aquí tu argumento principal con tus propias palabras..."
                value={finalPitch}
                onChange={(e) => setFinalPitch(e.target.value)}
              />
              <p className="form-hint">
                No te preocupes por la redacción publicitaria: buscamos capturar tu tono natural y
                compromiso profesional.
              </p>
            </FormGroup>
          </div>
        )}

        {/* =========================================================================
            PASO 11: REVISIÓN Y ENVÍO (REVIEW & SUBMIT)
            ========================================================================= */}
        {currentStep === 11 && (
          <div>
            <header className="step-header">
              <h1 className="step-title">Resumen de tu diagnóstico</h1>
              <p className="step-description">
                Revisá las respuestas organizadas antes de enviar. Podés volver a cualquier sección
                haciendo clic en el botón &quot;Editar&quot;.
              </p>
            </header>

            {isSubmitted ? (
              <Card style={{ borderColor: 'var(--color-brand-border)', backgroundColor: 'var(--color-brand-light)' }}>
                <CardBody style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-6)' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-brand)',
                      color: 'var(--color-brand-contrast)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <IconCheck size={28} />
                  </div>
                  <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
                    ¡Diagnóstico enviado correctamente!
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', maxWidth: '50ch', margin: '0 auto var(--space-6) auto' }}>
                    El equipo de Vegen Digital ha recibido tu información. Analizaremos tus servicios,
                    capacidades operativas y oportunidades de captación para tu propuesta estratégica.
                  </p>
                  <Button variant="secondary" onClick={() => setIsSubmitted(false)}>
                    Volver a visualizar respuestas
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Resumen de Servicios */}
                <Card>
                  <CardHeader>
                    <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                      Servicios y Prioridades ({services.length} en total)
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Editar servicios
                    </Button>
                  </CardHeader>
                  <CardBody>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {services.map((s) => (
                        <Badge
                          key={s.id}
                          variant={s.isPriority ? 'priority' : 'neutral'}
                          icon={s.isPriority ? <IconStar size={12} filled /> : undefined}
                        >
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                {/* Resumen de Públicos */}
                <Card>
                  <CardHeader>
                    <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                      Públicos Objetivo Prioritarios
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(9)}>
                      Editar públicos
                    </Button>
                  </CardHeader>
                  <CardBody>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {audiences.map((aud) => (
                        <div
                          key={aud.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 'var(--font-size-sm)',
                          }}
                        >
                          <span>{aud.label}</span>
                          <Badge variant={aud.priority === 'high' ? 'brand' : 'neutral'}>
                            Prioridad {aud.priority === 'high' ? 'Alta' : 'Media'}
                          </Badge>
                        </div>
                      ))}
                      {audiences.length === 0 && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                          No se han seleccionado públicos objetivos todavía.
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Resumen de Diferenciales y Propuesta */}
                <Card>
                  <CardHeader>
                    <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                      Propuesta de Valor y Diferenciales
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(10)}>
                      Editar propuesta
                    </Button>
                  </CardHeader>
                  <CardBody>
                    {finalPitch ? (
                      <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                        &quot;{finalPitch}&quot;
                      </p>
                    ) : (
                      <p style={{ fontStyle: 'italic', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                        No se ha introducido argumento diferenciador.
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {differentials.map((d) => {
                        if (d === 'others') {
                          return (
                            <Badge key={d} variant="brand">
                              {customDifferentialText.trim() ? `Otros: ${customDifferentialText.trim()}` : 'Otros'}
                            </Badge>
                          );
                        }
                        const opt = DIFFERENTIAL_OPTIONS.find((o) => o.id === d);
                        return <Badge key={d} variant="brand">{opt ? opt.label : d}</Badge>;
                      })}
                      {differentials.length === 0 && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                          No se han seleccionado diferenciales.
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <div
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                  }}
                >
                  <IconInfo size={20} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
                    Al enviar este diagnóstico, Vegen Digital procesará tus respuestas con el modelo de
                    Opportunity Scoring para preparar tu sesión de estrategia comercial. Tus datos se
                    tratan con estricta confidencialidad profesional.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            BARRA DE NAVEGACIÓN INFERIOR (ANTERIOR / CONTINUAR / ENVIAR)
            ========================================================================= */}
        <footer className="form-navigation">
          <div>
            {currentStep > 1 && !isSubmitted && (
              <Button
                variant="secondary"
                iconLeft={<IconChevronLeft size={16} />}
                onClick={handlePrev}
              >
                Anterior
              </Button>
            )}
          </div>

          <div>
            {currentStep <= totalSteps && (
              <Button
                variant="primary"
                iconRight={<IconChevronRight size={16} />}
                onClick={handleNext}
              >
                Guardar y continuar
              </Button>
            )}

            {currentStep === 11 && !isSubmitted && (
              <Button
                variant="primary"
                size="lg"
                loading={isSubmitting}
                onClick={() => {
                  setIsSubmitting(true);
                  setTimeout(() => {
                    setIsSubmitting(false);
                    setIsSubmitted(true);
                  }, 800);
                }}
              >
                Enviar diagnóstico definitivo
              </Button>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
