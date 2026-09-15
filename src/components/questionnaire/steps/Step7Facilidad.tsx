import { ServiceItem, ServiceAnswerItem } from '../../../types';
import { OPERATIONAL_ISSUES_OPTIONS } from '../../../config/defaults';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { ChoiceCard } from '../../common/ChoiceCard';
import { FormGroup, FormLabel, Input } from '../../common/FormControls';
import { ScaleSelector } from '../../common/ScaleSelector';

interface Step7FacilidadProps {
  priorityServices: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  onUpdateAnswer: (serviceId: string, updates: Partial<ServiceAnswerItem>) => void;
}

export function Step7Facilidad({
  priorityServices,
  answers,
  onUpdateAnswer,
}: Step7FacilidadProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Facilidad operativa y fricciones</h1>
        <p className="step-description">
          Indicá qué tan fluido o complejo resulta gestionar cada servicio y qué problemas
          administrativos o de clientes suelen aparecer con frecuencia.
        </p>
      </header>

      <div className="service-card-stack">
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
                    value={ans.operationalEaseScore ?? null}
                    isUncertain={false}
                    onChange={(score) =>
                      onUpdateAnswer(service.id, { operationalEaseScore: score })
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
                            onUpdateAnswer(service.id, { operationalIssues: updated });
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
                    onChange={(e) => onUpdateAnswer(service.id, { operationalNotes: e.target.value })}
                  />
                </FormGroup>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
