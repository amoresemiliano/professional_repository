import { ServiceItem, ServiceAnswerItem } from '../../../types';
import { Card, CardBody } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { ScaleSelector } from '../../common/ScaleSelector';

interface Step6RentabilidadProps {
  services: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  onUpdateAnswer: (serviceId: string, updates: Partial<ServiceAnswerItem>) => void;
}

export function Step6Rentabilidad({
  services,
  answers,
  onUpdateAnswer,
}: Step6RentabilidadProps) {
  return (
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
      </div>
    </div>
  );
}
