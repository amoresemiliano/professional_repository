import { ServiceItem, ServiceAnswerItem, PricingModel } from '../../../types';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { FormGroup, FormLabel, Input, Select } from '../../common/FormControls';

interface Step4PreciosProps {
  priorityServices: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  onUpdateAnswer: (serviceId: string, updates: Partial<ServiceAnswerItem>) => void;
}

export function Step4Precios({
  priorityServices,
  answers,
  onUpdateAnswer,
}: Step4PreciosProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Precios y modalidad de cobro</h1>
        <p className="step-description">
          Indicá cómo cobrás tus servicios prioritarios. Si el importe varía según el caso,
          podés indicar un rango o seleccionar la modalidad correspondiente.
        </p>
      </header>

      <div className="service-card-stack">
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
                        onUpdateAnswer(service.id, {
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

                  <div className="price-range-group">
                    <FormGroup style={{ flex: 1 }}>
                      <FormLabel htmlFor={`price-min-${service.id}`} optional>
                        Precio mín. (€)
                      </FormLabel>
                      <Input
                        id={`price-min-${service.id}`}
                        type="number"
                        placeholder="Ej: 750"
                        value={ans.priceMin || ''}
                        onChange={(e) => onUpdateAnswer(service.id, { priceMin: e.target.value })}
                      />
                    </FormGroup>

                    <FormGroup style={{ flex: 1 }}>
                      <FormLabel htmlFor={`price-max-${service.id}`} optional>
                        Precio máx. (€)
                      </FormLabel>
                      <Input
                        id={`price-max-${service.id}`}
                        type="number"
                        placeholder="Ej: 1500"
                        value={ans.priceMax || ''}
                        onChange={(e) => onUpdateAnswer(service.id, { priceMax: e.target.value })}
                      />
                    </FormGroup>
                  </div>
                </div>

                <FormGroup style={{ marginBottom: 0 }}>
                  <FormLabel htmlFor={`price-notes-${service.id}`} optional>
                    Observaciones sobre tarifas o condiciones de pago
                  </FormLabel>
                  <Input
                    id={`price-notes-${service.id}`}
                    placeholder="Ej: 50% al inicio y 50% con la resolución, tasas oficiales no incluidas..."
                    value={ans.priceNotes || ''}
                    onChange={(e) => onUpdateAnswer(service.id, { priceNotes: e.target.value })}
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
