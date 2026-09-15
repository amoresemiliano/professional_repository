import { ServiceItem, ServiceAnswerItem, MarketPosition } from '../../../types';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { ChoiceCard } from '../../common/ChoiceCard';
import { FormGroup, FormLabel, Input } from '../../common/FormControls';

interface Step5MercadoProps {
  priorityServices: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  onUpdateAnswer: (serviceId: string, updates: Partial<ServiceAnswerItem>) => void;
}

export function Step5Mercado({
  priorityServices,
  answers,
  onUpdateAnswer,
}: Step5MercadoProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Posicionamiento frente al mercado</h1>
        <p className="step-description">
          ¿Cómo considerás que se encuentra tu precio respecto del promedio de mercado?
          Esta información ayuda a definir el mensaje de posicionamiento.
        </p>
      </header>

      <div className="service-card-stack">
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
                        onUpdateAnswer(service.id, {
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
                    onChange={(e) => onUpdateAnswer(service.id, { marketNotes: e.target.value })}
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
