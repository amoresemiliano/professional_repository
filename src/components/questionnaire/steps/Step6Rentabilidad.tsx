import { ServiceItem, ServiceAnswerItem } from '../../../types';
import { Card, CardBody } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { ScaleSelector } from '../../common/ScaleSelector';

interface Step6RentabilidadProps {
  priorityServices: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  onUpdateAnswer: (serviceId: string, updates: Partial<ServiceAnswerItem>) => void;
}

export function Step6Rentabilidad({
  priorityServices,
  answers,
  onUpdateAnswer,
}: Step6RentabilidadProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Rentabilidad por servicio prioritario</h1>
        <p className="step-description">
          ¿Cómo considerás la relación entre los honorarios que genera cada servicio y las
          horas/esfuerzo que requiere? Evaluamos exclusivamente los servicios prioritarios seleccionados.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {priorityServices.map((service) => {
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
                  <Badge variant="priority">Prioritario</Badge>
                </div>

                <ScaleSelector
                  id={`profitability-${service.id}`}
                  value={ans.profitabilityScore ?? null}
                  isUncertain={ans.profitabilityIsUncertain ?? false}
                  onChange={(score, isUncertain) =>
                    onUpdateAnswer(service.id, {
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

        {priorityServices.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            No se han seleccionado servicios prioritarios en el Paso 2.
          </div>
        )}
      </div>
    </div>
  );
}
