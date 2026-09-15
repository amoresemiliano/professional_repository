import { ServiceItem, ServiceAnswerItem } from '../../../types';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { FormGroup, FormLabel, Input, Textarea } from '../../common/FormControls';
import { IconStar } from '../../common/Icons';

interface Step3DescripcionProps {
  priorityServices: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  onUpdateAnswer: (serviceId: string, updates: Partial<ServiceAnswerItem>) => void;
}

export function Step3Descripcion({
  priorityServices,
  answers,
  onUpdateAnswer,
}: Step3DescripcionProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Descripción de tus servicios prioritarios</h1>
        <p className="step-description">
          Comprender el problema y la solución de cada servicio permite estructurar una
          propuesta clara y orientada a resultados.
        </p>
      </header>

      <div className="service-card-stack">
        {priorityServices.map((service) => {
          const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
          return (
            <Card key={service.id}>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                  <IconStar size={16} filled style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                  <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', wordBreak: 'break-word' }}>
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
                    onChange={(e) => onUpdateAnswer(service.id, { clientProblem: e.target.value })}
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
                    onChange={(e) => onUpdateAnswer(service.id, { solutionActions: e.target.value })}
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
                    onChange={(e) => onUpdateAnswer(service.id, { expectedResult: e.target.value })}
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
                    onChange={(e) => onUpdateAnswer(service.id, { typicalDuration: e.target.value })}
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
